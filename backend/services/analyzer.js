const Anthropic = require('@anthropic-ai/sdk');
const { SKILLS_TAXONOMY } = require('./skillsData');

/**
 * Extracts skills from text using the curated taxonomy.
 * Returns an array of canonical skill names found.
 *
 * @param {string} text
 * @returns {string[]}
 */
function extractSkillsKeyword(text) {
  if (!text || typeof text !== 'string') return [];

  const found = new Set();
  for (const item of SKILLS_TAXONOMY) {
    if (item.regex.test(text)) {
      found.add(item.name);
    }
  }

  return Array.from(found);
}

/**
 * Normalizes and deduplicates skill lists case-insensitively.
 *
 * @param {string[]} skills
 * @returns {string[]}
 */
function deduplicateSkills(skills) {
  const map = new Map();
  for (const skill of skills) {
    if (!skill || typeof skill !== 'string') continue;
    const clean = skill.trim();
    if (!clean) continue;
    const lower = clean.toLowerCase();
    if (!map.has(lower)) {
      map.set(lower, clean);
    }
  }
  return Array.from(map.values());
}

/**
 * Calculates deterministic ATS score (0 - 100) and full breakdown.
 *
 * Rubric:
 * 1. Skill/keyword overlap with job description (40 pts)
 * 2. Standard resume sections present (20 pts)
 * 3. Contact info present: email + phone (15 pts)
 * 4. Resume length in healthy range 350-1100 words (15 pts)
 * 5. Quantified achievements detected (10 pts)
 */
function calculateAtsScore({ resumeText, wordCount, resumeSkills, jobDescriptionSkills, matchedSkills, hasJobDescription }) {
  const breakdown = [];

  // 1. Skill/keyword overlap (40 pts)
  let skillPoints = 0;
  let skillDetail = '';

  if (hasJobDescription && jobDescriptionSkills.length > 0) {
    const ratio = matchedSkills.length / jobDescriptionSkills.length;
    skillPoints = Math.round(Math.min(1, ratio) * 40);
    skillDetail = `Matched ${matchedSkills.length} of ${jobDescriptionSkills.length} key skills identified in the target job description.`;
  } else if (hasJobDescription && jobDescriptionSkills.length === 0) {
    skillPoints = Math.min(40, Math.round((resumeSkills.length / 10) * 40));
    skillDetail = `Job description had no specific taxonomy keywords; evaluated ${resumeSkills.length} detected resume skills.`;
  } else {
    // No job description provided: evaluate skill density & breadth
    if (resumeSkills.length >= 10) {
      skillPoints = 40;
    } else if (resumeSkills.length >= 6) {
      skillPoints = 32;
    } else if (resumeSkills.length >= 3) {
      skillPoints = 24;
    } else {
      skillPoints = Math.max(8, resumeSkills.length * 5);
    }
    skillDetail = `No job description provided; evaluated breadth of ${resumeSkills.length} recognized technical & professional skills.`;
  }

  breakdown.push({
    label: 'Skill & Keyword Match',
    points: Math.min(40, Math.max(0, skillPoints)),
    max: 40,
    detail: skillDetail
  });

  // 2. Standard resume sections present (20 pts)
  const sections = [
    { name: 'Experience', regex: /(?:^|\n)\s*(?:work\s+experience|professional\s+experience|experience|employment\s+history|work\s+history)\b/i },
    { name: 'Education', regex: /(?:^|\n)\s*(?:education|academic\s+background|degrees?|qualifications)\b/i },
    { name: 'Skills', regex: /(?:^|\n)\s*(?:technical\s+skills|skills\s*(?:&|and)\s*tools|core\s+competencies|technologies|skills)\b/i },
    { name: 'Summary', regex: /(?:^|\n)\s*(?:professional\s+summary|executive\s+summary|summary|profile|about\s+me|objective)\b/i }
  ];

  const foundSections = [];
  const missingSections = [];
  for (const sec of sections) {
    if (sec.regex.test(resumeText)) {
      foundSections.push(sec.name);
    } else {
      missingSections.push(sec.name);
    }
  }

  const sectionPoints = foundSections.length * 5;
  const sectionDetail = missingSections.length === 0
    ? `Found all 4 core sections: ${foundSections.join(', ')}.`
    : `Found ${foundSections.length} of 4 core sections (${foundSections.join(', ') || 'none'}). Missing: ${missingSections.join(', ')}.`;

  breakdown.push({
    label: 'Standard Resume Sections',
    points: sectionPoints,
    max: 20,
    detail: sectionDetail
  });

  // 3. Contact info present: email + phone (15 pts)
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?|\b\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/;

  const hasEmail = emailRegex.test(resumeText);
  const hasPhone = phoneRegex.test(resumeText);

  let contactPoints = 0;
  if (hasEmail) contactPoints += 8;
  if (hasPhone) contactPoints += 7;

  let contactDetail = '';
  if (hasEmail && hasPhone) {
    contactDetail = 'Found valid email address and phone number.';
  } else if (hasEmail) {
    contactDetail = 'Found email address; phone number was not detected.';
  } else if (hasPhone) {
    contactDetail = 'Found phone number; email address was not detected.';
  } else {
    contactDetail = 'Neither contact email nor phone number was detected.';
  }

  breakdown.push({
    label: 'Contact Information',
    points: contactPoints,
    max: 15,
    detail: contactDetail
  });

  // 4. Resume length in healthy range (15 pts)
  let lengthPoints = 0;
  let lengthDetail = '';

  if (wordCount >= 350 && wordCount <= 1100) {
    lengthPoints = 15;
    lengthDetail = `Optimal resume length with ${wordCount} words (ideal target: 350–1,100 words for 1–2 pages).`;
  } else if ((wordCount >= 250 && wordCount < 350) || (wordCount > 1100 && wordCount <= 1400)) {
    lengthPoints = 10;
    if (wordCount < 350) {
      lengthDetail = `Slightly brief at ${wordCount} words. Consider elaborating on key technical responsibilities and achievements.`;
    } else {
      lengthDetail = `Slightly verbose at ${wordCount} words. Consider tightening bullet points for recruiter conciseness.`;
    }
  } else if (wordCount < 250) {
    lengthPoints = 5;
    lengthDetail = `Too brief at ${wordCount} words (under 250). Lacks sufficient depth for comprehensive ATS parsing.`;
  } else {
    lengthPoints = 6;
    lengthDetail = `Lengthy at ${wordCount} words (over 1,400). Risk of parser truncation or recruiter fatigue; aim for 1–2 focused pages.`;
  }

  breakdown.push({
    label: 'Resume Length & Conciseness',
    points: lengthPoints,
    max: 15,
    detail: lengthDetail
  });

  // 5. Quantified achievements detected (10 pts)
  // Look for percentages, dollar figures, multipliers, and numbers near impact verbs
  const metricRegexes = [
    /\b\d+(?:\.\d+)?%\b/g,                                              // 25%, 99.9%
    /\$\s*\d+(?:[\d,]*)(?:\.\d+)?(?:\s*(?:k|m|b|million|billion))?\b/gi, // $50K, $1.2M
    /\b\d+x\b/gi,                                                        // 3x, 10x
    /\b(?:increased|decreased|reduced|improved|boosted|grew|saved|optimized|cut|generated|scaled)\s+[^.\n]{1,40}?\b\d+/gi,
    /\b\d+[\d,]*\+?\s*(?:users|customers|clients|requests|queries|tps|qps|endpoints|commits|projects|services|engineers)\b/gi
  ];

  let totalMetrics = 0;
  for (const rx of metricRegexes) {
    const matches = resumeText.match(rx);
    if (matches) totalMetrics += matches.length;
  }

  let quantPoints = 0;
  let quantDetail = '';

  if (totalMetrics >= 4) {
    quantPoints = 10;
    quantDetail = `Excellent quantifiable impact: detected ${totalMetrics} measurable metrics/results across achievements.`;
  } else if (totalMetrics >= 2) {
    quantPoints = 7;
    quantDetail = `Moderate quantifiable impact: detected ${totalMetrics} measurable metrics. Adding 2–3 more will improve impact.`;
  } else if (totalMetrics === 1) {
    quantPoints = 4;
    quantDetail = `Detected only 1 quantifiable metric. Highlight business results with specific percentages, savings, or scale.`;
  } else {
    quantPoints = 0;
    quantDetail = 'No quantifiable metrics detected (percentages, dollar amounts, scale). Use concrete data to demonstrate impact.';
  }

  breakdown.push({
    label: 'Quantified Achievements',
    points: quantPoints,
    max: 10,
    detail: quantDetail
  });

  const totalAtsScore = breakdown.reduce((sum, item) => sum + item.points, 0);

  return {
    atsScore: Math.min(100, Math.max(0, totalAtsScore)),
    scoreBreakdown: breakdown,
    metricsDetected: totalMetrics,
    missingSections,
    foundSections,
    hasEmail,
    hasPhone
  };
}

/**
 * Generates rule-based suggestions, strengths, and professional summary line.
 */
function generateRuleBasedFeedback({ resumeSkills, missingSkills, wordCount, missingSections, hasEmail, hasPhone, metricsDetected }) {
  const suggestions = [];
  const strengths = [];

  // Suggestions
  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 5).join(', ');
    suggestions.push(`Incorporate target keywords: The job posting explicitly highlights ${topMissing}. If you have experience with them, integrate them directly into your project descriptions and skills section.`);
  }

  if (missingSections.includes('Summary')) {
    suggestions.push('Add a 2–3 sentence Professional Summary at the top of your resume to immediately hook recruiters and align with target job roles.');
  }

  if (missingSections.includes('Experience') || missingSections.includes('Education')) {
    suggestions.push('Ensure standard section headings like "Professional Experience" and "Education" are prominently positioned on their own lines for ATS parser detection.');
  }

  if (!hasEmail || !hasPhone) {
    suggestions.push('Ensure your primary contact information (professional email address and direct phone number) is positioned at the top of the first page in plain text.');
  }

  if (metricsDetected < 3) {
    suggestions.push('Adopt the Google X-Y-Z formula for bullet points: "Accomplished [X] as measured by [Y], by doing [Z]". Replace vague descriptions with hard numbers, percentages, or cost/time savings.');
  }

  if (wordCount < 350) {
    suggestions.push(`Expand on depth: Your resume currently contains ${wordCount} words. Elaborate on project architecture, tools used, and measurable responsibilities.`);
  } else if (wordCount > 1100) {
    suggestions.push(`Streamline length: At ${wordCount} words, consider pruning older or redundant bullet points to maintain recruiter attention across a standard 1–2 page layout.`);
  }

  if (suggestions.length === 0) {
    suggestions.push('Tailor your bullet points with industry-specific terminology and action verbs to reinforce leadership and technical depth.');
    suggestions.push('Ensure file formatting avoids multi-column layouts or graphics that could confuse older ATS parsing software.');
  }

  // Strengths
  if (resumeSkills.length >= 6) {
    strengths.push(`Strong technical breadth with ${resumeSkills.length} identified competencies across core tools and technologies.`);
  }
  if (metricsDetected >= 2) {
    strengths.push(`Includes quantifiable outcomes and metrics that demonstrate concrete business value.`);
  }
  if (missingSections.length === 0) {
    strengths.push('Clean standard structure with all fundamental resume sections (Summary, Experience, Education, Skills) present.');
  }
  if (hasEmail && hasPhone) {
    strengths.push('Complete, parser-friendly contact header with detected email and phone number.');
  }
  if (strengths.length === 0) {
    strengths.push('Good foundation with clear career progression ready for targeted keyword enhancement.');
  }

  // Tailored Summary
  const topSkills = resumeSkills.slice(0, 4);
  let tailoredSummary = '';
  if (topSkills.length > 0) {
    tailoredSummary = `Results-driven professional with demonstrated expertise in ${topSkills.join(', ')}. Track record of delivering scalable solutions, driving technical efficiency, and contributing to cross-functional team objectives.`;
  } else {
    tailoredSummary = 'Accomplished professional with a versatile skill set and a track record of driving impactful results, solving complex technical challenges, and collaborating across high-performing teams.';
  }

  return {
    suggestions: suggestions.slice(0, 6),
    strengths: strengths.slice(0, 4),
    tailoredSummary
  };
}

/**
 * Calls Anthropic API for AI-based skill extraction and personalized feedback.
 *
 * @param {string} resumeText
 * @param {string} jobDescription
 * @returns {Promise<{ extractedSkills: string[], jobSkills: string[], strengths: string[], suggestions: string[], tailoredSummary: string }>}
 */
async function analyzeWithAnthropic(resumeText, jobDescription) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
  const anthropic = new Anthropic({ apiKey });

  // Limit text length to avoid token overflow
  const truncatedResume = resumeText.slice(0, 24000);
  const truncatedJob = (jobDescription || '').slice(0, 8000);

  const prompt = `You are an expert ATS (Applicant Tracking System) reviewer and senior executive talent evaluator.

Analyze the candidate's resume text and the optional target job description.

RESUME TEXT:
"""
${truncatedResume}
"""

TARGET JOB DESCRIPTION:
"""
${truncatedJob || '(None provided)'}
"""

Return a strictly valid JSON object matching this schema:
{
  "extractedSkills": ["list", "of", "all", "technical", "and", "professional", "skills", "found", "in", "resume"],
  "jobSkills": ["list", "of", "all", "required", "or", "desired", "skills", "in", "the", "job", "description", "if", "provided", "otherwise", "empty"],
  "strengths": ["2 to 4 concise, high-impact bullet points highlighting candidate's genuine strengths"],
  "suggestions": ["3 to 6 specific, actionable, high-priority suggestions to improve ATS ranking and recruiter appeal for this profile/role"],
  "tailoredSummary": "A polished 1-2 sentence executive resume summary tailored to position this candidate effectively."
}

CRITICAL: Return ONLY valid JSON. Do not include markdown codeblocks or conversational filler.`;

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1500,
    temperature: 0.2,
    system: 'You are an ATS analysis engine. You output strictly valid, unadorned JSON without markdown wrapping.',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const responseText = response.content?.[0]?.text || '';
  // Strip potential code fences
  const cleanedJson = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const parsed = JSON.parse(cleanedJson);

  return {
    extractedSkills: Array.isArray(parsed.extractedSkills) ? parsed.extractedSkills : [],
    jobSkills: Array.isArray(parsed.jobSkills) ? parsed.jobSkills : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    tailoredSummary: typeof parsed.tailoredSummary === 'string' ? parsed.tailoredSummary : ''
  };
}

/**
 * Main analysis pipeline.
 *
 * 1. Keyword extraction (always runs)
 * 2. Attempts Anthropic AI analysis (if key configured)
 * 3. Falls back silently to keyword/rule-based on failure or missing key
 * 4. Calculates deterministic ATS score and breakdown
 * 5. Returns final unified JSON
 */
async function analyzeResume({ resumeText, wordCount, numPages, jobDescription = '' }) {
  const hasJobDescription = Boolean(jobDescription && jobDescription.trim().length > 0);
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0);

  // 1. Keyword extraction
  const keywordResumeSkills = extractSkillsKeyword(resumeText);
  const keywordJobSkills = hasJobDescription ? extractSkillsKeyword(jobDescription) : [];

  let aiUsed = false;
  let allResumeSkills = [...keywordResumeSkills];
  let allJobSkills = [...keywordJobSkills];
  let aiStrengths = [];
  let aiSuggestions = [];
  let aiTailoredSummary = '';

  // 2. Try Anthropic AI if enabled
  if (aiEnabled) {
    try {
      const aiResult = await analyzeWithAnthropic(resumeText, jobDescription);
      aiUsed = true;
      if (aiResult.extractedSkills.length > 0) {
        allResumeSkills = deduplicateSkills([...allResumeSkills, ...aiResult.extractedSkills]);
      }
      if (hasJobDescription && aiResult.jobSkills.length > 0) {
        allJobSkills = deduplicateSkills([...allJobSkills, ...aiResult.jobSkills]);
      }
      if (aiResult.strengths.length > 0) {
        aiStrengths = aiResult.strengths;
      }
      if (aiResult.suggestions.length > 0) {
        aiSuggestions = aiResult.suggestions;
      }
      if (aiResult.tailoredSummary) {
        aiTailoredSummary = aiResult.tailoredSummary;
      }
    } catch (err) {
      console.warn('Anthropic API analysis encountered an issue, gracefully using keyword & rule-based engine:', err.message);
      aiUsed = false;
    }
  }

  // Ensure clean deduplication
  allResumeSkills = deduplicateSkills(allResumeSkills);
  allJobSkills = deduplicateSkills(allJobSkills);

  // 3. Compute matched and missing skills
  const resumeLowerSet = new Set(allResumeSkills.map(s => s.toLowerCase()));
  const matchedSkills = [];
  const missingSkills = [];

  if (hasJobDescription) {
    for (const jSkill of allJobSkills) {
      if (resumeLowerSet.has(jSkill.toLowerCase())) {
        matchedSkills.push(jSkill);
      } else {
        missingSkills.push(jSkill);
      }
    }
  }

  // 4. Calculate deterministic ATS score
  const scoreResult = calculateAtsScore({
    resumeText,
    wordCount,
    resumeSkills: allResumeSkills,
    jobDescriptionSkills: allJobSkills,
    matchedSkills,
    hasJobDescription
  });

  // 5. Build suggestions & strengths (AI preferred when available, else rule-based)
  const ruleFeedback = generateRuleBasedFeedback({
    resumeSkills: allResumeSkills,
    missingSkills,
    wordCount,
    missingSections: scoreResult.missingSections,
    hasEmail: scoreResult.hasEmail,
    hasPhone: scoreResult.hasPhone,
    metricsDetected: scoreResult.metricsDetected
  });

  const finalStrengths = (aiUsed && aiStrengths.length > 0) ? aiStrengths : ruleFeedback.strengths;
  const finalSuggestions = (aiUsed && aiSuggestions.length > 0) ? aiSuggestions : ruleFeedback.suggestions;
  const finalTailoredSummary = (aiUsed && aiTailoredSummary) ? aiTailoredSummary : ruleFeedback.tailoredSummary;

  return {
    meta: {
      numPages,
      wordCount,
      aiEnabled,
      aiUsed
    },
    atsScore: scoreResult.atsScore,
    scoreBreakdown: scoreResult.scoreBreakdown,
    skills: {
      resumeSkills: allResumeSkills,
      jobDescriptionSkills: allJobSkills,
      matched: matchedSkills,
      missing: missingSkills
    },
    strengths: finalStrengths,
    suggestions: finalSuggestions,
    tailoredSummary: finalTailoredSummary
  };
}

module.exports = {
  analyzeResume,
  calculateAtsScore,
  extractSkillsKeyword
};
