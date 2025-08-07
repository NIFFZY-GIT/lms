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
  imageUrl?: string;
  whatsappGroupLink?: string;
  zoomLink?: string;
  recordings?: Recording[];
  quizzes?: Quiz[];
}

// Represents a single uploaded video recording for a course.
export interface Recording {
  id: string;
  title: string;
  videoUrl: string;
  courseId: string;
}

// Represents a single quiz container.
export interface Quiz {
  id: string;
  title: string;
  courseId: string;
  questions?: Question[];
}

// Represents a single question within a quiz.
export interface Question {
  id: string;
  questionText: string;
  answers: Answer[];
  quizId: string;
}

// Represents an answer for a question.
export interface Answer {
  id: string;
  answerText: string;
  isCorrect: boolean;
}

// Represents a public-facing announcement.
export interface Announcement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}

export interface StudentCourseInfo {
    courseId: string;
    courseTitle: string;
    enrollmentStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    highestScore: number | null;
}

// Represents a student object for the admin view
export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  courses: StudentCourseInfo[];
}