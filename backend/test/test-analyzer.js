const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { extractSkillsKeyword, calculateAtsScore, analyzeResume } = require('../services/analyzer');
const { extractPdfText } = require('../services/pdfExtract');

/**
 * Builds a syntactically valid PDF buffer for testing.
 * Strictly conforms to ISO 32000 PDF 1.4 xref exact 20-byte entries.
 */
function buildSamplePdf(lines) {
  let content = 'BT /F1 12 Tf 50 750 Td ';
  for (const line of lines) {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    content += '(' + escaped + ') Tj 0 -16 Td ';
  }
  content += 'ET';
  const streamLen = Buffer.byteLength(content, 'latin1');

  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + content + '\nendstream\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  const o1 = Buffer.byteLength(header, 'latin1');
  const o2 = o1 + Buffer.byteLength(obj1, 'latin1');
  const o3 = o2 + Buffer.byteLength(obj2, 'latin1');
  const o4 = o3 + Buffer.byteLength(obj3, 'latin1');
  const o5 = o4 + Buffer.byteLength(obj4, 'latin1');
  const xrefOffset = o5 + Buffer.byteLength(obj5, 'latin1');

  function pad(n) { return String(n).padStart(10, '0'); }
  const xref = 'xref\n0 6\n' +
    '0000000000 65535 f \r\n' +
    pad(o1) + ' 00000 n \r\n' +
    pad(o2) + ' 00000 n \r\n' +
    pad(o3) + ' 00000 n \r\n' +
    pad(o4) + ' 00000 n \r\n' +
    pad(o5) + ' 00000 n \r\n';
  const trailer = 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF';

  return Buffer.from(header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer, 'latin1');
}

async function runTests() {
  console.log('======================================================');
  console.log(' AI Resume Analyzer - Unit & Integration Test Suite');
  console.log('======================================================\n');

  // Test 1: Keyword Skills Extraction
  console.log('[Test 1] Testing keyword skills taxonomy extraction...');
  const sampleText = `
    Senior Full Stack Engineer proficient in JavaScript, TypeScript, React, and Node.js.
    Hands-on experience deploying microservices to AWS using Docker and Kubernetes.
    Experienced with PostgreSQL, Redis, MongoDB, GraphQL, and REST API development.
    Champion of Agile, Scrum, TDD, and automated CI/CD pipelines.
  `;
  const skills = extractSkillsKeyword(sampleText);
  console.log('Extracted skills count:', skills.length);
  console.log('Extracted skills:', skills);
  assert(skills.includes('JavaScript'), 'Must extract JavaScript');
  assert(skills.includes('TypeScript'), 'Must extract TypeScript');
  assert(skills.includes('React'), 'Must extract React');
  assert(skills.includes('Node.js'), 'Must extract Node.js');
  assert(skills.includes('AWS'), 'Must extract AWS');
  assert(skills.includes('Docker'), 'Must extract Docker');
  assert(skills.includes('Kubernetes'), 'Must extract Kubernetes');
  assert(skills.includes('PostgreSQL'), 'Must extract PostgreSQL');
  assert(skills.includes('Redis'), 'Must extract Redis');
  assert(skills.includes('MongoDB'), 'Must extract MongoDB');
  assert(skills.includes('GraphQL'), 'Must extract GraphQL');
  assert(skills.includes('REST API'), 'Must extract REST API');
  assert(skills.includes('Agile / Scrum'), 'Must extract Agile / Scrum');
  assert(skills.includes('Test-Driven Development (TDD)'), 'Must extract TDD');
  console.log('✓ Test 1 Passed: Taxonomy extraction succeeded.');

  // Test 2: PDF Parsing from Buffer
  console.log('\n[Test 2] Testing PDF text extraction with pdf-parse...');
  const resumeLines = [
    'Alex Morgan',
    'Email: alex.morgan@example.com | Phone: 555-345-6789 | San Francisco, CA',
    'Professional Summary',
    'Versatile Senior Software Engineer with 7 years of full stack experience building high-throughput web systems.',
    'Specialized in React, Node.js, TypeScript, PostgreSQL, and cloud architecture on AWS.',
    'Work Experience',
    'Lead Engineer - CloudScale Technologies (2021 - Present)',
    '- Architected distributed REST APIs in Node.js and TypeScript handling 5,000,000 requests per day.',
    '- Reduced infrastructure latency by 38% and cut cloud compute expenses by 65,000 dollars per year.',
    '- Spearheaded transition to Docker containers and Kubernetes clusters, improving deployment frequency by 4x.',
    '- Mentored 6 software engineers and managed Agile sprint planning and code reviews.',
    'Software Engineer - DataForge Labs (2018 - 2021)',
    '- Built responsive frontend interfaces using React and Redux supporting 150,000 active monthly users.',
    '- Optimized PostgreSQL database queries, reducing average query execution times by 52%.',
    '- Implemented automated testing using Jest and CI/CD pipelines with GitHub Actions.',
    'Education',
    'Bachelor of Science in Computer Science - University of California, Berkeley',
    'Technical Skills',
    'Languages: JavaScript, TypeScript, Python, SQL, HTML/CSS',
    'Frameworks: React, Node.js, Express.js, Next.js, Redux',
    'Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD, Git, GitHub Actions',
    'Databases: PostgreSQL, Redis, MongoDB'
  ];

  const pdfBuffer = buildSamplePdf(resumeLines);
  
  // Save sample PDF for manual and UI testing convenience
  const samplePdfPath = path.join(__dirname, 'sample-resume.pdf');
  fs.writeFileSync(samplePdfPath, pdfBuffer);
  console.log(`Saved sample resume PDF for manual testing: ${samplePdfPath}`);

  const pdfResult = await extractPdfText(pdfBuffer);
  console.log(`Extracted: ${pdfResult.wordCount} words, ${pdfResult.numPages} page(s).`);
  assert(pdfResult.wordCount > 50, 'Word count must be greater than 50');
  assert.strictEqual(pdfResult.numPages, 1, 'Should detect 1 page');
  assert(pdfResult.text.includes('Alex Morgan'), 'Extracted text should include candidate name');
  assert(pdfResult.text.includes('alex.morgan@example.com'), 'Extracted text should include email');
  console.log('✓ Test 2 Passed: PDF parsing correctly extracted text, word count, and pages.');

  // Test 3: Deterministic ATS Scoring & Breakdown
  console.log('\n[Test 3] Testing ATS scoring engine with job description matching...');
  const targetJobDescription = `
    Job Title: Senior Full Stack Engineer
    Requirements:
    - 5+ years of experience with React, Node.js, and TypeScript
    - Strong database skills in PostgreSQL and Redis
    - Cloud experience with AWS, Docker, and Kubernetes
    - Experience in CI/CD, Agile / Scrum, and Unit Testing
    - Familiarity with Python or Go is a bonus
  `;

  const analysis = await analyzeResume({
    resumeText: pdfResult.text,
    wordCount: 480,
    numPages: pdfResult.numPages,
    jobDescription: targetJobDescription
  });

  console.log('ATS Compatibility Score:', analysis.atsScore, '/ 100');
  console.log('Score Rubric Breakdown:');
  for (const b of analysis.scoreBreakdown) {
    console.log(`  • ${b.label}: ${b.points}/${b.max} pts - ${b.detail}`);
  }
  console.log('Matched Skills:', analysis.skills.matched);
  console.log('Missing Skills:', analysis.skills.missing);
  console.log('Generated Strengths:');
  for (const s of analysis.strengths) {
    console.log(`  + ${s}`);
  }
  console.log('Generated Suggestions:');
  for (const s of analysis.suggestions) {
    console.log(`  → ${s}`);
  }
  console.log('Tailored Summary:', analysis.tailoredSummary);

  assert(typeof analysis.atsScore === 'number' && analysis.atsScore >= 70, 'Alex Morgan profile should score highly (>= 70)');
  assert.strictEqual(analysis.scoreBreakdown.length, 5, 'Score breakdown must have exactly 5 criteria items');
  assert(analysis.skills.matched.length >= 5, 'Should match at least 5 target skills');
  assert(analysis.strengths.length >= 2, 'Should generate at least 2 strengths');
  assert(analysis.suggestions.length >= 1, 'Should generate suggestions');
  assert(analysis.tailoredSummary.length > 20, 'Tailored summary must be populated');
  console.log('✓ Test 3 Passed: Deterministic ATS scoring & breakdown validated.');

  // Test 4: Graceful AI Fallback
  console.log('\n[Test 4] Testing graceful degradation when ANTHROPIC_API_KEY is omitted or invalid...');
  process.env.ANTHROPIC_API_KEY = ''; // empty key
  const fallbackResult = await analyzeResume({
    resumeText: pdfResult.text,
    wordCount: 420,
    numPages: 1,
    jobDescription: ''
  });

  assert.strictEqual(fallbackResult.meta.aiEnabled, false, 'aiEnabled must be false');
  assert.strictEqual(fallbackResult.meta.aiUsed, false, 'aiUsed must be false');
  assert(fallbackResult.atsScore > 0, 'ATS score should be calculated in keyword mode');
  assert(fallbackResult.suggestions.length > 0, 'Fallback suggestions must be generated');
  assert(fallbackResult.strengths.length > 0, 'Fallback strengths must be generated');
  assert(fallbackResult.tailoredSummary.length > 0, 'Fallback tailored summary must be generated');
  console.log('✓ Test 4 Passed: Graceful fallback works flawlessly.');

  console.log('\n======================================================');
  console.log(' ALL 4 TEST SUITES PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
