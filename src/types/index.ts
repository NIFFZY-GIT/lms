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
  question: string;
  answers: Answer[];
}

// Represents one of the possible answers for a quiz question.
export interface Answer {
  id: string;
  answer: string;
  isCorrect: boolean;
}