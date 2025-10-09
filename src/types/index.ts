// Defines the user roles for the entire application.
export enum Role {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
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
  imageUrl?: string | null;
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
  role: Role;
  courses: StudentCourseInfo[];
}

// Generic application user shape (can be promoted to its own file later)
export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// Basic permission helpers (expand as RBAC grows)
export const isAdmin = (user: AppUser | undefined | null): boolean => user?.role === Role.ADMIN;
export const isInstructor = (user: AppUser | undefined | null): boolean => user?.role === Role.INSTRUCTOR;
export const isStudent = (user: AppUser | undefined | null): boolean => user?.role === Role.STUDENT;
export const canManageCourse = (user: AppUser | undefined | null, courseOwnerId?: string, userId?: string): boolean => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isInstructor(user) && courseOwnerId && user.id === courseOwnerId) return true;
  // allow student self-only operations optionally by comparing provided userId
  if (isStudent(user) && userId && user.id === userId) return true;
  return false;
};