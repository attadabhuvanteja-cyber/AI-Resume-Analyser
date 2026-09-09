# ATS Resume Evaluator & AI Match Analyzer

A full-stack web application that parses a resume PDF, optionally compares it against a target job description, and provides an objective, deterministic ATS compatibility score (0–100), detailed rubric breakdown, matched vs. missing skills analysis, actionable recommendations, profile strengths, and a tailored executive summary line.

---

## Key Features

- **Document Intake**: Drag-and-drop or browse file picker for resume PDFs (up to 10MB).
- **PDF Extraction**: In-memory parsing extracting word count, page count, and clean normalized text.
- **Dual Analysis Engine**:
  - **Keyword-based Matching**: Fast, deterministic matching against a curated taxonomy across 7 categories (Programming Languages, Frameworks & Libraries, Cloud & DevOps, Databases, Data & AI, Tools, Methodologies & Soft Skills).
  - **AI-Powered Evaluation**: When `ANTHROPIC_API_KEY` is provided, leverages Claude (`@anthropic-ai/sdk`) for contextual skill extraction, personalized suggestions, candidate strengths, and a custom summary.
  - **Graceful Fallback**: If no API key is provided or if an API call fails, the app automatically falls back to keyword-based analysis and rule-based feedback—never failing the user's request.
- **Deterministic ATS Compatibility Score (0–100)**:
  - **Skill & Keyword Match** (40 pts)
  - **Standard Resume Sections** (20 pts)
  - **Contact Information** (15 pts)
  - **Resume Length & Conciseness** (15 pts)
  - **Quantified Achievements** (10 pts)
- **Editorial Report Aesthetic**: Warm paper background (`#F6F4EF`), ink navy text (`#1C2333`), brass accent (`#A8752C`), muted green (`#4F7942`) for matched skills, and muted rust (`#B54A3C`) for missing skills. Typography blends Source Serif 4 headings with Inter body.
- **Interactive Results**:
  - Animated SVG radial score dial
  - Criteria progress bars with specific line-item explanations
  - Visual matched and missing skill tags
  - One-click copy for tailored summary statement
  - Print / Export PDF stylesheet (`@media print`)

---

## Project Structure

```
AI resume analyser/
├── backend/
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   ├── server.js
│   ├── services/
│   │   ├── analyzer.js      # ATS scoring, keyword extraction, AI & fallback logic
│   │   ├── pdfExtract.js    # PDF text extraction and normalization
│   │   └── skillsData.js    # Curated skills taxonomy with boundary regexes
│   └── test/
│       ├── sample-resume.pdf  # Generated valid PDF for testing
│       ├── test-analyzer.js   # Unit tests for parser, taxonomy, and scoring
│       └── test-server-api.js # Integration tests for API endpoints
├── frontend/
│   ├── index.html           # Document-style report interface
│   ├── styles.css           # Warm paper aesthetic, responsive styles, print media
│   └── app.js               # Client controller, drag-drop, dial animation
└── README.md
```

---

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Available environment variables:
- `PORT`: Port to listen on (default: `3001`)
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude integration (optional)
- `ANTHROPIC_MODEL`: Model identifier (default: `claude-sonnet-5`)

> **Note**: If `ANTHROPIC_API_KEY` is not provided, the application runs fully in keyword and rule-based mode. The UI clearly indicates `AI: Off (Keyword Mode)`.

### 3. Start the Application
```bash
npm start
```
Then open your browser at:
```
http://localhost:3001
```

---

## Running Tests

Run both unit and API integration tests:
```bash
cd backend
npm test
```

---

## API Endpoints

### `GET /api/health`
Returns backend health and AI status.
```json
{
  "status": "ok",
  "aiEnabled": false
}
```

### `POST /api/analyze`
Multipart form upload:
- `resume` (PDF file, max 10MB, required)
- `jobDescription` (text string, optional)

Returns:
```json
{
  "meta": {
    "numPages": 1,
    "wordCount": 480,
    "aiEnabled": false,
    "aiUsed": false
  },
  "atsScore": 90,
  "scoreBreakdown": [
    {
      "label": "Skill & Keyword Match",
      "points": 35,
      "max": 40,
      "detail": "Matched 7 of 8 core skills from the job description."
    },
    {
      "label": "Standard Resume Sections",
      "points": 20,
      "max": 20,
      "detail": "Found all 4 core sections: Experience, Education, Skills, Summary."
    },
    {
      "label": "Contact Information",
      "points": 15,
      "max": 15,
      "detail": "Found valid email address and phone number."
    },
    {
      "label": "Resume Length & Conciseness",
      "points": 15,
      "max": 15,
      "detail": "Optimal resume length with 480 words (target: 350–1,100 words)."
    },
    {
      "label": "Quantified Achievements",
      "points": 10,
      "max": 10,
      "detail": "Detected 4 quantifiable metrics with concrete business impact."
    }
  ],
  "skills": {
    "resumeSkills": ["JavaScript", "TypeScript", "React", "Node.js", "AWS", "PostgreSQL"],
    "jobDescriptionSkills": ["React", "Node.js", "AWS", "Docker"],
    "matched": ["React", "Node.js", "AWS"],
    "missing": ["Docker"]
  },
  "strengths": [
    "Strong technical breadth across 6 identified core skills.",
    "Clean standard structure with all fundamental resume sections present."
  ],
  "suggestions": [
    "Incorporate target keywords: The job posting explicitly highlights Docker."
  ],
  "tailoredSummary": "Results-driven professional with demonstrated expertise in React, Node.js, and AWS..."
}
```
