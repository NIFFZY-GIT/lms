export enum Role {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  tutor?: string;
  whatsappGroupLink?: string;
  materials?: CourseMaterial | null;
  quizzes?: Quiz[];
}

export interface CourseMaterial {
  recordingUrl?: string;
  zoomLink?: string;
}

export interface Quiz {
  id: string;
  question: string;
  answers: Answer[];
}

export interface Answer {
  id: string;
  answer: string;
  isCorrect: boolean;
}