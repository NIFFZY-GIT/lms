'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Course, Quiz } from '@/types';
import { Trash2, Plus } from 'lucide-react';

// --- Types & Schemas ---
const materialSchema = z.object({
  recordingUrl: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  zoomLink: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
});
type MaterialFormData = z.infer<typeof materialSchema>;

const quizSchema = z.object({
  question: z.string().min(10, { message: 'Question must be at least 10 characters' }),
  answers: z.array(z.object({
    answer: z.string().min(1, { message: 'Answer cannot be empty' }),
    isCorrect: z.boolean(),
  })).min(2, { message: 'At least 2 answers are required' }),
});
type QuizFormData = z.infer<typeof quizSchema>;

// API Function to update materials
const updateMaterials = async ({ courseId, data }: { courseId: string; data: MaterialFormData }) => {
  // This should hit your backend endpoint for creating/updating materials
  return (await axios.post(`/api/materials/${courseId}`, data)).data;
};

// API Functions for quiz management
const fetchQuizzes = async (courseId: string): Promise<Quiz[]> => {
  return (await axios.get(`/api/courses/${courseId}/quizzes`)).data;
};

const createQuiz = async ({ courseId, data }: { courseId: string; data: QuizFormData }) => {
  return (await axios.post(`/api/courses/${courseId}/quizzes`, data)).data;
};

const deleteQuiz = async (quizId: string) => {
  return (await axios.delete(`/api/quiz/${quizId}/delete`)).data;
};

// --- Main Component ---
export function ManageContentModal({ isOpen, onClose, course }: { isOpen: boolean; onClose: () => void; course: Course }) {
  const [activeTab, setActiveTab] = useState<'materials' | 'quizzes'>('materials');
  const [showQuizForm, setShowQuizForm] = useState(false);
  const queryClient = useQueryClient();

  // --- Materials Form ---
  const {
    register: registerMaterial,
    handleSubmit: handleMaterialSubmit,
    formState: { errors: materialErrors },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    // Pre-fill the form with existing data
    defaultValues: {
      recordingUrl: course.materials?.recordingUrl || '',
      zoomLink: course.materials?.zoomLink || '',
    },
  });

  // --- Quiz Form ---
  const {
    register: registerQuiz,
    handleSubmit: handleQuizSubmit,
    reset: resetQuiz,
    setValue: setQuizValue,
    watch: watchQuiz,
    formState: { errors: quizErrors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      question: '',
      answers: [
        { answer: '', isCorrect: false },
        { answer: '', isCorrect: false },
      ],
    },
  });

  const watchedAnswers = watchQuiz('answers');

  // --- Queries ---
  const { data: quizzes, isLoading: quizzesLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes', course.id],
    queryFn: () => fetchQuizzes(course.id),
    enabled: activeTab === 'quizzes' && isOpen,
  });

  const materialMutation = useMutation({
    mutationFn: updateMaterials,
    onSuccess: () => {
      alert("Materials updated successfully!");
      // Invalidate queries to refetch course data and show the updates
      queryClient.invalidateQueries({ queryKey: ['courses'] }); 
      onClose(); // Close the modal on success
    },
    onError: (error: AxiosError<{ error: string }>) => {
      alert(`Error updating materials: ${error.response?.data?.error || error.message}`);
    }
  });

  const createQuizMutation = useMutation({
    mutationFn: createQuiz,
    onSuccess: () => {
      alert("Quiz created successfully!");
      queryClient.invalidateQueries({ queryKey: ['quizzes', course.id] });
      resetQuiz();
      setShowQuizForm(false);
    },
    onError: (error: AxiosError<{ error: string }>) => {
      alert(`Error creating quiz: ${error.response?.data?.error || error.message}`);
    }
  });

  const deleteQuizMutation = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: () => {
      alert("Quiz deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['quizzes', course.id] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      alert(`Error deleting quiz: ${error.response?.data?.error || error.message}`);
    }
  });

  const onMaterialSubmit = (data: MaterialFormData) => {
    materialMutation.mutate({ courseId: course.id, data });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Content for: ${course.title}`}>
      <div>
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('materials')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'materials'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Materials (Links)
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'quizzes'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Quizzes
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="pt-6">
          {activeTab === 'materials' && (
            <form onSubmit={handleMaterialSubmit(onMaterialSubmit)} className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Manage Links</h3>
              <Input
                label="Zoom Meeting Link"
                registration={registerMaterial('zoomLink')}
                error={materialErrors.zoomLink?.message}
                placeholder="https://zoom.us/j/..."
              />
              <Input
                label="Course Recordings URL"
                registration={registerMaterial('recordingUrl')}
                error={materialErrors.recordingUrl?.message}
                placeholder="https://vimeo.com/..."
              />
              <div className="flex justify-end pt-4">
                <button type="submit" className="btn-primary" disabled={materialMutation.isPending}>
                  {materialMutation.isPending ? "Saving..." : "Save Materials"}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'quizzes' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900">Manage Quizzes</h3>
              <p className="mt-2 text-sm text-gray-500">Quiz management will be implemented here.</p>
              {/* Quiz CRUD UI would go here */}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}