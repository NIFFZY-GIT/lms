'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Course, Quiz } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { QuizForm, QuizFormData } from './QuizForm';
import { Trash2, Edit, Plus } from 'lucide-react';

// --- Schemas ---
const materialSchema = z.object({
    recordingUrl: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
    zoomLink: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
});
type MaterialFormData = z.infer<typeof materialSchema>;

// --- API Functions ---
const updateMaterials = async ({ courseId, data }: { courseId: string, data: MaterialFormData }) => (await axios.post(`/api/materials/${courseId}`, data)).data;
const fetchQuizzes = async (courseId: string): Promise<Quiz[]> => (await axios.get(`/api/courses/${courseId}/quizzes`)).data;
const addQuiz = async ({ courseId, data }: { courseId: string; data: QuizFormData }) => (await axios.post(`/api/courses/${courseId}/quizzes`, data)).data;
const updateQuiz = async ({ quizId, data }: { quizId: string; data: QuizFormData }) => (await axios.patch(`/api/quizzes/${quizId}`, data)).data;
const deleteQuiz = async (quizId: string) => (await axios.delete(`/api/quizzes/${quizId}`)).data;

// --- Main Component ---
export function ManageContentModal({ isOpen, onClose, course }: { isOpen: boolean; onClose: () => void; course: Course }) {
  // --- THIS IS THE FIX ---
  const [activeTab, setActiveTab] = useState<'materials' | 'quizzes'>('materials');
  
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [showQuizForm, setShowQuizForm] = useState(false);
  
  const queryClient = useQueryClient();

  // --- Materials Management ---
  const { register: registerMaterial, handleSubmit: handleMaterialSubmit, formState: { errors: materialErrors } } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
        recordingUrl: course.materials?.recordingUrl || '',
        zoomLink: course.materials?.zoomLink || '',
    },
  });

  const materialMutation = useMutation({
    mutationFn: updateMaterials,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['courses', course.id] });
        alert("Materials Updated!");
    },
    onError: (error: AxiosError<{ error?: string }>) => alert(`Error: ${error.response?.data?.error || error.message}`)
  });

  const onMaterialSubmit = (data: MaterialFormData) => {
    materialMutation.mutate({ courseId: course.id, data });
  };

  // --- Quiz Management ---
  const { data: quizzes, isLoading: quizzesLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes', course.id],
    queryFn: () => fetchQuizzes(course.id),
    enabled: isOpen && activeTab === 'quizzes',
  });

  const quizMutationOptions = {
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['quizzes', course.id] });
        setShowQuizForm(false);
        setEditingQuiz(null);
    },
    onError: (error: AxiosError<{ error?: string }>) => alert(`Error: ${error.response?.data?.error || error.message}`)
  };

  const createQuizMutation = useMutation({ mutationFn: addQuiz, ...quizMutationOptions });
  const updateQuizMutation = useMutation({ mutationFn: updateQuiz, ...quizMutationOptions });
  const deleteQuizMutation = useMutation({ mutationFn: deleteQuiz, ...quizMutationOptions });

  const handleQuizSubmit = (data: QuizFormData) => {
    if (editingQuiz) {
        updateQuizMutation.mutate({ quizId: editingQuiz.id, data });
    } else {
        createQuizMutation.mutate({ courseId: course.id, data });
    }
  };

  const handleDeleteQuiz = (quizId: string) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      deleteQuizMutation.mutate(quizId);
    }
  };

  const handleAddNewQuiz = () => {
    setEditingQuiz(null);
    setShowQuizForm(true);
  };
  
  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setShowQuizForm(true);
  };

  const handleCancelQuizForm = () => {
    setEditingQuiz(null);
    setShowQuizForm(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Content for: ${course.title}`}>
        {/* Tabs */}
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
                <button
                    onClick={() => setActiveTab('materials')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'materials' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Materials
                </button>
                <button
                    onClick={() => setActiveTab('quizzes')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'quizzes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Quizzes
                </button>
            </nav>
        </div>
      
        <div className="pt-6">
            {activeTab === 'materials' && (
            <form onSubmit={handleMaterialSubmit(onMaterialSubmit)} className="space-y-4">
                <Input label="Recording URL" registration={registerMaterial('recordingUrl')} error={materialErrors.recordingUrl?.message} />
                <Input label="Zoom Link" registration={registerMaterial('zoomLink')} error={materialErrors.zoomLink?.message} />
                <div className="flex justify-end"><button type="submit" className="btn-primary" disabled={materialMutation.isPending}>{materialMutation.isPending ? 'Saving...' : 'Save Materials'}</button></div>
            </form>
            )}

            {activeTab === 'quizzes' && (
            <div>
                {showQuizForm ? (
                    <QuizForm 
                        onSubmit={handleQuizSubmit} 
                        initialData={editingQuiz || undefined}
                        isPending={createQuizMutation.isPending || updateQuizMutation.isPending}
                        onCancel={handleCancelQuizForm}
                    />
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Existing Quizzes</h3>
                            <button onClick={handleAddNewQuiz} className="btn-primary flex items-center"><Plus className="w-5 h-5 mr-2" /> Add Quiz</button>
                        </div>
                        {quizzesLoading && <p>Loading quizzes...</p>}
                        <div className="space-y-3">
                            {quizzes?.map(quiz => (
                                <div key={quiz.id} className="p-3 border rounded-md flex justify-between items-center">
                                    <p className="font-medium text-gray-800">{quiz.question}</p>
                                    <div className="space-x-2">
                                        <button onClick={() => handleEditQuiz(quiz)} className="p-2 text-gray-500 hover:text-indigo-600" title="Edit Quiz"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-2 text-gray-500 hover:text-red-600" title="Delete Quiz"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                             {quizzes?.length === 0 && !quizzesLoading && <p className="text-gray-500 text-sm">No quizzes have been added to this course yet.</p>}
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    </Modal>
  );
}