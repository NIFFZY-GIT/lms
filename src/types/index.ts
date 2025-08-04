// Defines the user roles for the entire application.
export enum Role {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
}

// Represents a single course. This is the central model.
export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  tutor?: string;
  whatsappGroupLink?: string;
  zoomLink?: string; // Moved from CourseMaterial
  recordings?: Recording[]; // New: A course can have many recordings
  quizzes?: Quiz[];
}

// Represents a single uploaded video recording for a course.
export interface Recording {
  id: string;
  title: string;
  videoUrl: string; // Renamed from recordingUrl for clarity
  courseId: string;
}

// Represents a single quiz question.
export interface Quiz {
  id: string;
  title: string; // <-- A Quiz now has a TITLE, not a question.
  courseId: string;
  questions?: Question[]; // A quiz can have many questions
}
export interface Question {
  id: string;
  questionText: string;
  answers: Answer[];
  quizId: string;
}
// Represents one of the possible answers for a quiz question.
export interface Answer {
  id: string;
  answerText: string;
  isCorrect: boolean;
}