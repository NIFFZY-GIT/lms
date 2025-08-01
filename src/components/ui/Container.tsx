// src/components/ui/Container.tsx

import React from 'react';
import { twMerge } from 'tailwind-merge'; // A utility to safely merge Tailwind classes

// Define the props interface
interface ContainerProps {
  children: React.ReactNode;
  className?: string; // Make className an optional prop
}

export function Container({ children, className }: ContainerProps) {
  // Use twMerge to combine the component's base classes with any passed-in classes
  const combinedClassName = twMerge(
    "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", // Base classes
    className // Additional classes passed from the parent
  );

  return (
    <div className={combinedClassName}>
      {children}
    </div>
  );
}