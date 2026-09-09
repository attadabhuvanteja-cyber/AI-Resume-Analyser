/**
 * ATS Resume Evaluator - Frontend Client
 * Handles file intake, drag & drop, API interaction, SVG dial animation,
 * and dynamic rendering of the evaluation report.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Determine API base URL (supports both same-origin backend and direct file/localhost opening)
  const isLocalStatic = window.location.protocol === 'file:' || (window.location.port !== '3001' && window.location.port !== '');
  const API_BASE = (isLocalStatic && window.location.protocol === 'file:') ? 'http://localhost:3001' : '';

  // DOM Elements - Header & Engine Status
  const aiStatusBadge = document.getElementById('aiStatusBadge');
  const aiStatusText = document.getElementById('aiStatusText');

  // DOM Elements - Intake Form
  const resumeForm = document.getElementById('resumeForm');
  const dropZone = document.getElementById('dropZone');
  const resumeInput = document.getElementById('resumeInput');
  const dropZonePrompt = document.getElementById('dropZonePrompt');
  const filePreview = document.getElementById('filePreview');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const fileSizeDisplay = document.getElementById('fileSizeDisplay');
  const removeFileBtn = document.getElementById('removeFileBtn');
  const jobDescriptionInput = document.getElementById('jobDescription');
  const clearJobBtn = document.getElementById('clearJobBtn');
  const errorBanner = document.getElementById('errorBanner');
  const errorMessage = document.getElementById('errorMessage');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = document.getElementById('btnText');

  // DOM Elements - Report Section
  const resultsSection = document.getElementById('resultsSection');
  const metaFileName = document.getElementById('metaFileName');
  const metaLength = document.getElementById('metaLength');
  const metaEngine = document.getElementById('metaEngine');
  const metaDate = document.getElementById('metaDate');
  const dialProgress = document.getElementById('dialProgress');
  const scoreNumber = document.getElementById('scoreNumber');
  const scoreTierBadge = document.getElementById('scoreTierBadge');
  const scoreTierDescription = document.getElementById('scoreTierDescription');
  const tailoredSummaryText = document.getElementById('tailoredSummaryText');
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const scoreBreakdownList = document.getElementById('scoreBreakdownList');
  const matchedSkillsList = document.getElementById('matchedSkillsList');
  const matchedCountBadge = document.getElementById('matchedCountBadge');
  const missingSkillsList = document.getElementById('missingSkillsList');
  const missingCountBadge = document.getElementById('missingCountBadge');
  const allResumeSkillsList = document.getElementById('allResumeSkillsList');
  const resumeSkillsCountBadge = document.getElementById('resumeSkillsCountBadge');
  const strengthsList = document.getElementById('strengthsList');
  const suggestionsList = document.getElementById('suggestionsList');
  const resetReportBtn = document.getElementById('resetReportBtn');
  const printReportBtn = document.getElementById('printReportBtn');

  // State
  let selectedFile = null;

  // 1. Initial Health Check to display AI engine status
  checkEngineHealth();

  async function checkEngineHealth() {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) {
        const data = await res.json();
        if (data.aiEnabled) {
          aiStatusBadge.className = 'engine-badge engine-active';
          aiStatusText.textContent = 'AI Engine: Active';
          aiStatusBadge.title = 'Anthropic Claude model active for semantic extraction & coaching.';
        } else {
          aiStatusBadge.className = 'engine-badge engine-fallback';
          aiStatusText.textContent = 'AI: Off (Keyword Mode)';
          aiStatusBadge.title = 'Running in deterministic keyword & rule-based grading mode.';
        }
      } else {
        markEngineOffline();
      }
    } catch (err) {
      markEngineOffline();
    }
  }

  function markEngineOffline() {
    aiStatusBadge.className = 'engine-badge engine-fallback';
    aiStatusText.textContent = 'AI: Off (Keyword Mode)';
    aiStatusBadge.title = 'Backend running in keyword mode.';
  }

  // 2. Drag & Drop and File Selection Handling
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  });

  // Accessible click and keyboard trigger for file input
  dropZone.addEventListener('click', (e) => {
    if (e.target !== removeFileBtn && !filePreview.contains(e.target)) {
      resumeInput.click();
    }
  });

  dropZone.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !selectedFile) {
      e.preventDefault();
      resumeInput.click();
    }
  });

  resumeInput.addEventListener('change', () => {
    if (resumeInput.files && resumeInput.files.length > 0) {
      handleFile(resumeInput.files[0]);
    }
  });

  removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearSelectedFile();
  });

  function handleFile(file) {
    hideError();

    // Check file type
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      showError('Please select a valid PDF file. Other file formats are not supported.');
      return;
    }

    // Check file size (10MB limit)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showError('File exceeds the 10 MB limit. Please upload a smaller PDF resume.');
      return;
    }

    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    fileSizeDisplay.textContent = formatBytes(file.size);

    dropZonePrompt.classList.add('hidden');
    filePreview.classList.remove('hidden');
  }

  function clearSelectedFile() {
    selectedFile = null;
    resumeInput.value = '';
    dropZonePrompt.classList.remove('hidden');
    filePreview.classList.add('hidden');
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // 3. Job Description Textarea Helper
  jobDescriptionInput.addEventListener('input', () => {
    if (jobDescriptionInput.value.trim().length > 0) {
      clearJobBtn.classList.remove('hidden');
    } else {
      clearJobBtn.classList.add('hidden');
    }
  });

  clearJobBtn.addEventListener('click', () => {
    jobDescriptionInput.value = '';
    clearJobBtn.classList.add('hidden');
    jobDescriptionInput.focus();
  });

  // 4. Form Submission & API Request
  resumeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    if (!selectedFile) {
      showError('Please upload your resume PDF before evaluating.');
      dropZone.focus();
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('jobDescription', jobDescriptionInput.value.trim());

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server responded with status ${response.status}`);
      }

      // Render full report
      renderReport(result);
    } catch (err) {
      console.error('Evaluation failed:', err);
      showError(err.message || 'Failed to analyze resume. Please check your file and try again.');
    } finally {
      setSubmitting(false);
    }
  });

  function setSubmitting(isSubmitting) {
    if (isSubmitting) {
      analyzeBtn.disabled = true;
      btnSpinner.classList.remove('hidden');
      btnText.textContent = 'Evaluating Resume...';
    } else {
      analyzeBtn.disabled = false;
      btnSpinner.classList.add('hidden');
      btnText.textContent = 'Evaluate Resume';
    }
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
    errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideError() {
    errorBanner.classList.add('hidden');
    errorMessage.textContent = '';
  }

  // 5. Results Rendering
  function renderReport(data) {
    // 5.1 Metadata Bar
    metaFileName.textContent = selectedFile ? selectedFile.name : 'Resume Document';
    const pagesLabel = data.meta.numPages === 1 ? '1 page' : `${data.meta.numPages} pages`;
    metaLength.textContent = `${data.meta.wordCount.toLocaleString()} words · ${pagesLabel}`;
    
    if (data.meta.aiUsed) {
      metaEngine.textContent = 'AI-Enhanced (Claude & Taxonomy)';
    } else {
      metaEngine.textContent = 'Deterministic Keyword & Rule Analysis';
    }

    const today = new Date();
    metaDate.textContent = today.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // 5.2 Score Dial & Tier
    animateScoreDial(data.atsScore);

    // 5.3 Tailored Summary
    tailoredSummaryText.textContent = data.tailoredSummary || 'No summary generated.';

    // 5.4 Score Breakdown List
    renderScoreBreakdown(data.scoreBreakdown);

    // 5.5 Skills Grid
    renderSkills(data.skills);

    // 5.6 Strengths & Suggestions
    renderList(strengthsList, data.strengths, 'Demonstrated clear foundational competence.');
    renderList(suggestionsList, data.suggestions, 'Maintain current formatting and quantify bullet points.');

    // Reveal results and scroll
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Animate SVG Radial Progress Dial
  function animateScoreDial(score) {
    const circumference = 414.69; // 2 * pi * 66
    const clampedScore = Math.max(0, Math.min(100, score));
    const targetOffset = circumference - (clampedScore / 100) * circumference;

    // Reset stroke first
    dialProgress.style.strokeDashoffset = circumference;
    scoreNumber.textContent = '0';

    // Tier badge & styling
    if (clampedScore >= 80) {
      scoreTierBadge.className = 'score-tier tier-high';
      scoreTierBadge.textContent = 'Strong Match';
      scoreTierDescription.textContent = 'High ATS compatibility with optimal structure and keywords.';
      dialProgress.style.stroke = 'var(--accent-green)';
    } else if (clampedScore >= 60) {
      scoreTierBadge.className = 'score-tier tier-medium';
      scoreTierBadge.textContent = 'Competitive';
      scoreTierDescription.textContent = 'Solid baseline with key opportunities for keyword alignment.';
      dialProgress.style.stroke = 'var(--accent-brass)';
    } else {
      scoreTierBadge.className = 'score-tier tier-low';
      scoreTierBadge.textContent = 'Needs Optimization';
      scoreTierDescription.textContent = 'Significant keyword gaps or missing standard sections detected.';
      dialProgress.style.stroke = 'var(--accent-rust)';
    }

    // Trigger stroke transition after paint
    setTimeout(() => {
      dialProgress.style.strokeDashoffset = targetOffset;
    }, 50);

    // Counter animation
    let startVal = 0;
    const duration = 1000;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(eased * clampedScore);
      scoreNumber.textContent = currentScore;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        scoreNumber.textContent = clampedScore;
      }
    }
    requestAnimationFrame(updateCounter);
  }

  // Render Score Breakdown
  function renderScoreBreakdown(breakdown) {
    scoreBreakdownList.innerHTML = '';
    if (!breakdown || breakdown.length === 0) return;

    breakdown.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'breakdown-item';

      const pct = Math.round((item.points / item.max) * 100);

      itemEl.innerHTML = `
        <div class="breakdown-row-top">
          <span class="breakdown-label">${escapeHtml(item.label)}</span>
          <span class="breakdown-points">${item.points} / ${item.max} pts</span>
        </div>
        <div class="breakdown-bar-track" role="progressbar" aria-valuenow="${item.points}" aria-valuemin="0" aria-valuemax="${item.max}">
          <div class="breakdown-bar-fill" style="width: ${pct}%;"></div>
        </div>
        <p class="breakdown-detail">${escapeHtml(item.detail)}</p>
      `;

      scoreBreakdownList.appendChild(itemEl);
    });
  }

  // Render Skills Lists
  function renderSkills(skillsObj) {
    const matched = skillsObj?.matched || [];
    const missing = skillsObj?.missing || [];
    const allResume = skillsObj?.resumeSkills || [];

    // Matched skills
    matchedCountBadge.textContent = matched.length;
    if (matched.length > 0) {
      matchedSkillsList.innerHTML = matched.map(s => `
        <span class="skill-tag matched-tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          ${escapeHtml(s)}
        </span>
      `).join('');
    } else {
      matchedSkillsList.innerHTML = `<span class="empty-tag-note">${jobDescriptionInput.value.trim() ? 'No overlapping skills detected with job description.' : 'Provide a job description above to calculate exact skill matches.'}</span>`;
    }

    // Missing skills
    missingCountBadge.textContent = missing.length;
    if (missing.length > 0) {
      missingSkillsList.innerHTML = missing.map(s => `
        <span class="skill-tag missing-tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          ${escapeHtml(s)}
        </span>
      `).join('');
    } else {
      missingSkillsList.innerHTML = `<span class="empty-tag-note">${jobDescriptionInput.value.trim() ? 'All detected job description skills are present in your resume.' : 'Provide a target job description to reveal missing keywords.'}</span>`;
    }

    // All resume competencies
    resumeSkillsCountBadge.textContent = allResume.length;
    if (allResume.length > 0) {
      allResumeSkillsList.innerHTML = allResume.map(s => `
        <span class="skill-tag">
          ${escapeHtml(s)}
        </span>
      `).join('');
    } else {
      allResumeSkillsList.innerHTML = '<span class="empty-tag-note">No recognizable skills or technical keywords detected.</span>';
    }
  }

  // Render Generic Bullet Lists (Strengths & Suggestions)
  function renderList(containerEl, items, fallbackText) {
    containerEl.innerHTML = '';
    if (!items || items.length === 0) {
      const li = document.createElement('li');
      li.textContent = fallbackText;
      containerEl.appendChild(li);
      return;
    }

    items.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      containerEl.appendChild(li);
    });
  }

  // Copy Executive Summary to Clipboard
  copySummaryBtn.addEventListener('click', async () => {
    const text = tailoredSummaryText.textContent.trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      copyBtnText.textContent = 'Copied!';
      copySummaryBtn.style.color = 'var(--accent-green)';
      setTimeout(() => {
        copyBtnText.textContent = 'Copy';
        copySummaryBtn.style.color = '';
      }, 2000);
    } catch (err) {
      console.warn('Clipboard write failed, using execCommand fallback:', err);
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copyBtnText.textContent = 'Copied!';
      setTimeout(() => {
        copyBtnText.textContent = 'Copy';
      }, 2000);
    }
  });

  // Reset & Print Actions
  resetReportBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    clearSelectedFile();
    jobDescriptionInput.value = '';
    clearJobBtn.classList.add('hidden');
    hideError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  printReportBtn.addEventListener('click', () => {
    window.print();
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
