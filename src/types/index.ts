export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface WritingQuestion {
  id: string;
  question: string;
  expectedKeyPoints: string[];
  rubric: string;
}

export interface Assessment {
  mcqs: MCQQuestion[]; // 3 MCQs based on lecture video
  writingQuestions: WritingQuestion[]; // 2 Writing questions to be solved in book/written
}

export interface WrittenAnswerSubmission {
  questionId: string;
  questionText?: string;
  textAnswer?: string;
  uploadedImageUrl?: string;
  score: number; // 0 to 20 points
  isCorrect?: boolean;
  feedback: string;
  modelAnswer?: string;
}

export interface MCQEvaluationResult {
  questionId: string;
  questionText: string;
  selectedOptionIndex?: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation: string;
}

export interface AssessmentSubmission {
  mcqAnswers: Record<string, number>;
  writtenAnswers: WrittenAnswerSubmission[];
  mcqResults?: MCQEvaluationResult[];
  totalScore: number; // 0 to 100%
  passed: boolean; // true if >= 75%
  evaluatedAt: string;
}

export interface AssessmentEvaluationResponse {
  passed: boolean;
  totalScore: number;
  mcqPoints: number;
  writingPoints: number;
  passingThreshold: number;
  nextChapterUnlocked: boolean;
  message: string;
  mcqResults: MCQEvaluationResult[];
  writtenResults: WrittenAnswerSubmission[];
  assessmentSubmission: AssessmentSubmission;
}

export interface ContentSection {
  title: string;
  content: string;
  codeSnippet?: string;
  codeLanguage?: string;
}

export interface ChapterContent {
  introduction: string;
  sections: ContentSection[];
  keyTakeaways: string[];
}

export interface EducationalVideo {
  id: string;
  title: string;
  channel: string;
  duration?: string;
  topic?: string;
  relevanceScore: number; // 0 to 100
  embedUrl: string;
  thumbnailUrl?: string;
  isEmbeddable?: boolean;
}

export interface CourseChapter {
  id?: string;
  chapterNumber: number;
  title: string;
  description: string;
  duration: string;
  videoId?: string;
  videoTitle?: string;
  videoChannel?: string;
  relevanceScore?: number;
  alternativeVideos?: EducationalVideo[];
  completed: boolean;
  isUnlocked: boolean; // Locked until previous lecture is passed with >= 75%
  assessmentScore?: number;
  assessment?: Assessment;
  assessmentSubmission?: AssessmentSubmission;
  content?: ChapterContent;
}

export interface PDFSource {
  fileName: string;
  fileSize: number;
  summary: string;
}

export interface Course {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advance' | 'Advanced';
  duration: string;
  noOfChapters: number;
  numberOfChapters?: number;
  includeVideo: boolean;
  thumbnailUrl: string;
  thumbnailPrompt?: string;
  pdfSources?: PDFSource[];
  chapters: CourseChapter[];
  progress: number;
  createdAt: string;
  updatedAt?: string;
  creatorName: string;
  userEmail?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  coursesCreated?: number;
  emailVerified?: boolean;
}

export interface PDFImportantConcept {
  concept: string;
  explanation: string;
  page?: number | string;
}

export interface PDFChapterStructure {
  chapterNumber: number;
  title: string;
  description: string;
  pageRange?: string;
  keyPoints: string[];
  recommendedVideo?: EducationalVideo;
}

export interface PDFDocument {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  storageUrl?: string;
  extractedText: string;
  pageCount?: number;
  isScanned?: boolean;
  summary: string;
  mainTopics: string[];
  subTopics: string[];
  importantConcepts: PDFImportantConcept[];
  learningObjectives: string[];
  difficultyLevel: string;
  recommendedVideos: EducationalVideo[];
  chapterStructure: PDFChapterStructure[];
  practiceQuestions?: MCQQuestion[];
  learningNotes?: string;
  processingStatus:
    | 'uploading'
    | 'extracting'
    | 'analyzing'
    | 'identifying_topics'
    | 'searching_videos'
    | 'completed'
    | 'failed';
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LearningProgress {
  id: string;
  userId: string;
  courseId?: string;
  documentId?: string;
  completedChapters: string[];
  completedTopics: string[];
  progressPercentage: number;
  updatedAt: string;
}

export interface OTPRecord {
  verificationId: string;
  email: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
  verifiedAt?: number;
  usedAt?: number;
  lastSentAt: number;
}

export interface Certificate {
  id: string;
  certificateId: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  category: string;
  score: number;
  issueDate: string;
  verificationUrl: string;
  instructorName?: string;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  explanationMode?: 'simple' | 'detailed' | 'practical';
  timestamp: string;
  codeSnippet?: string;
  conceptReferences?: string[];
}

export interface TutorConversation {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  chapterTitle?: string;
  messages: TutorMessage[];
  updatedAt: string;
}

export interface UserProgressSummary {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalChapters: number;
  completedChapters: number;
  totalLearningMinutes: number;
  overallScoreAverage: number;
  currentStreakDays: number;
  streakDays: number;
  weeklyActivity: Array<{ day: string; minutes: number; chapters: number }>;
}

export interface PlatformAdminStats {
  totalUsers: number;
  totalCourses: number;
  totalChapters: number;
  totalCertificates: number;
  totalPdfDocuments: number;
  activeLearners: number;
  recentActivity: Array<{
    id: string;
    type: 'course_created' | 'certificate_earned' | 'pdf_uploaded' | 'quiz_passed' | 'user_registered';
    title: string;
    detail: string;
    timestamp: string;
  }>;
}

