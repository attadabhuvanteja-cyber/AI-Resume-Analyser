const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../server');

async function runApiTests() {
  console.log('======================================================');
  console.log(' Express Server & API Integration Tests');
  console.log('======================================================\n');

  // Start test server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}\n`);

  try {
    // 1. Test GET /api/health
    console.log('[Test 1] Testing GET /api/health...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200, 'Health check should return 200');
    const healthData = await healthRes.json();
    console.log('Health response:', healthData);
    assert.strictEqual(healthData.status, 'ok');
    assert(typeof healthData.aiEnabled === 'boolean');
    console.log('✓ Test 1 Passed: /api/health endpoint functional.');

    // 2. Test POST /api/analyze with valid PDF
    console.log('\n[Test 2] Testing POST /api/analyze with sample PDF and job description...');
    const samplePdfPath = path.join(__dirname, 'sample-resume.pdf');
    const fileBytes = fs.readFileSync(samplePdfPath);
    
    // Create FormData natively in Node 18+
    const formData = new FormData();
    const blob = new Blob([fileBytes], { type: 'application/pdf' });
    formData.append('resume', blob, 'sample-resume.pdf');
    formData.append('jobDescription', 'Looking for a Senior Software Engineer skilled in React, Node.js, and AWS.');

    const analyzeRes = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      body: formData
    });

    assert.strictEqual(analyzeRes.status, 200, `Expected 200, got ${analyzeRes.status}`);
    const analyzeData = await analyzeRes.json();
    console.log('Analyze response summary:');
    console.log('- Meta:', analyzeData.meta);
    console.log('- ATS Score:', analyzeData.atsScore);
    console.log('- Breakdown length:', analyzeData.scoreBreakdown.length);
    console.log('- Matched skills:', analyzeData.skills.matched);
    console.log('- Missing skills:', analyzeData.skills.missing);

    assert(analyzeData.meta && typeof analyzeData.meta.wordCount === 'number', 'meta.wordCount missing');
    assert(typeof analyzeData.atsScore === 'number', 'atsScore missing');
    assert(Array.isArray(analyzeData.scoreBreakdown) && analyzeData.scoreBreakdown.length === 5, 'scoreBreakdown should have 5 items');
    assert(Array.isArray(analyzeData.skills.matched), 'skills.matched must be an array');
    assert(Array.isArray(analyzeData.strengths), 'strengths must be an array');
    assert(Array.isArray(analyzeData.suggestions), 'suggestions must be an array');
    assert(typeof analyzeData.tailoredSummary === 'string', 'tailoredSummary must be a string');
    console.log('✓ Test 2 Passed: /api/analyze parsed PDF and returned correct JSON schema.');

    // 3. Test POST /api/analyze without file
    console.log('\n[Test 3] Testing POST /api/analyze without file (should return 400)...');
    const emptyForm = new FormData();
    emptyForm.append('jobDescription', 'Some job');
    const noFileRes = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      body: emptyForm
    });
    assert.strictEqual(noFileRes.status, 400, 'Should return 400 for missing file');
    const noFileData = await noFileRes.json();
    console.log('Expected error response:', noFileData);
    assert(noFileData.error.includes('No resume file'), 'Error message should explain missing file');
    console.log('✓ Test 3 Passed: Missing file handled gracefully with 400.');

    // 4. Test POST /api/analyze with invalid file type (.txt)
    console.log('\n[Test 4] Testing POST /api/analyze with non-PDF file (should return 400)...');
    const invalidForm = new FormData();
    const txtBlob = new Blob(['Hello text resume'], { type: 'text/plain' });
    invalidForm.append('resume', txtBlob, 'resume.txt');
    const invalidRes = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      body: invalidForm
    });
    assert.strictEqual(invalidRes.status, 400, 'Should return 400 for non-PDF file');
    const invalidData = await invalidRes.json();
    console.log('Expected invalid file error response:', invalidData);
    assert(invalidData.error.includes('PDF'), 'Error message should mention PDF requirement');
    console.log('✓ Test 4 Passed: Non-PDF rejection handled correctly.');

    // 5. Test Static File Serving
    console.log('\n[Test 5] Testing static frontend serving...');
    const staticRes = await fetch(`${baseUrl}/`);
    assert.strictEqual(staticRes.status, 200, 'Root should serve frontend');
    const html = await staticRes.text();
    assert(html.includes('ATS Resume Evaluator'), 'Frontend HTML should be served');
    console.log('✓ Test 5 Passed: Frontend HTML served successfully at /.');

    console.log('\n======================================================');
    console.log(' ALL 5 API & INTEGRATION TESTS PASSED!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runApiTests().catch(err => {
  console.error('API Test Failed:', err);
  process.exit(1);
});
