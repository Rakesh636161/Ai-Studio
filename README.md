<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Course Studio – AI Course Generator

A modern, responsive web application for creating and managing professional educational courses using intelligent AI-powered technology.

## Key Features

- **Multi-PDF Syllabus & Module Extraction**: Upload chapter/module PDF documents (e.g., Module 1 DBMS) to generate courses focused strictly on your curriculum.
- **Sequential Lecture Locking**: Lecture 1 is unlocked by default; subsequent lectures remain locked until the student achieves **&ge; 75%** on the lecture assessment.
- **5-Question Lecture Assessments**:
  - **3 Multiple-Choice Questions (MCQs)** with immediate grading.
  - **2 Written / Problem-Solving Questions** solved in student notebooks, verified by handwritten page photo upload or text solution evaluated with Gemini AI.
- **Secure Email Authentication**: Strict email validation and 6-digit OTP password reset system.
- **Unlimited Course Creation**: Free unlimited course creation for all learners.
- **Interactive Video Player**: Integrated YouTube lecture videos for each chapter.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion, Canvas-Confetti
- **Backend**: Node.js, Express, tsx
- **AI Engine**: Google Gemini API (`@google/genai`)

## Run Locally

**Prerequisites:** Node.js (v18+)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and set your `GEMINI_API_KEY`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key to `.env`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

## License

Apache-2.0
