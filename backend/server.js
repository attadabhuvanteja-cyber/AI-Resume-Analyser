const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const { extractPdfText } = require('./services/pdfExtract');
const { analyzeResume } = require('./services/analyzer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));

// Multer memory storage with 10MB limit and PDF-only filter
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
    if (isPdfMime || isPdfExt) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file type. Only PDF documents are supported.');
      err.code = 'INVALID_FILE_TYPE';
      cb(err, false);
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0);
  res.json({
    status: 'ok',
    aiEnabled
  });
});

// Resume analysis endpoint
app.post('/api/analyze', (req, res, next) => {
  upload.single('resume')(req, res, async (err) => {
    // Handle Multer upload errors
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File size exceeds the 10MB limit. Please upload a smaller PDF.'
        });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          error: err.message
        });
      }
      return res.status(400).json({
        error: `Upload error: ${err.message}`
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No resume file uploaded. Please select or drag-and-drop a PDF resume.'
        });
      }

      const jobDescription = req.body.jobDescription || '';

      // Extract text, pages, and word count from the PDF buffer
      let pdfData;
      try {
        pdfData = await extractPdfText(req.file.buffer);
      } catch (extractErr) {
        return res.status(422).json({
          error: extractErr.message || 'Unable to parse text from the uploaded PDF. Please verify it is not scanned or password-protected.'
        });
      }

      // Run ATS and skill analysis
      const analysisResult = await analyzeResume({
        resumeText: pdfData.text,
        wordCount: pdfData.wordCount,
        numPages: pdfData.numPages,
        jobDescription
      });

      return res.json(analysisResult);
    } catch (analysisErr) {
      console.error('Analysis error:', analysisErr);
      return res.status(500).json({
        error: 'An unexpected error occurred while analyzing the resume. Please try again.'
      });
    }
  });
});

// Catch-all route to serve the frontend single-page app
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Start server only when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    const aiState = process.env.ANTHROPIC_API_KEY ? 'Active' : 'Off (Keyword & rule-based mode)';
    console.log(`===========================================`);
    console.log(` ATS Resume Analyzer Backend running on:`);
    console.log(` http://localhost:${PORT}`);
    console.log(` AI Engine (Anthropic): ${aiState}`);
    console.log(`===========================================`);
  });
}

module.exports = app;
