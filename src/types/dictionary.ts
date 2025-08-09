// src/types/dictionary.ts

export type Dictionary = {
  // Add this new property
  language: {
    changeTo: string;
  };
  navbar: {
    getStarted: string;
  };
  // ... rest of the type remains the same
  hero: {
    title: string;
    description: string;
    cta: string;
  };
  features: {
    title: string;
    description: string;
    videoContent: string;
    videoDescription: string;
    quizzes: string;
    quizzesDescription: string;
    liveSessions: string;
    liveSessionsDescription: string;
  };
  about: {
    title: string;
    description: string;
    point1: string;
    point2: string;
    point3: string;
  };
};