'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 
import axios, { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Course, Quiz, Recording, Question } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { QuestionForm, QuestionFormData } from './QuestionForm';
import RecordingForm from './RecordingForm';
import { Trash2, Edit, Plus, Film, Link as LinkIcon } from 'lucide-react';
import { toast } from '@/components/ui/toast';

// --- Schemas ---
const materialSchema = z.object({
    zoomLink: z.string().url({ message: 'A valid URL is required' }).optional().or(z.literal('')),
});
type MaterialFormData = z.infer<typeof materialSchema>;

// --- API Functions ---
// We now have a single, unified update function that expects FormData
const updateCourse = async ({ id, data }: { id: string; data: FormData }): Promise<Course> => (await axios.patch(`/api/courses/${id}`, data)).data;

const fetchRecordings = async (courseId: string): Promise<Recording[]> => (await axios.get(`/api/courses/${courseId}/recordings`)).data;
const addRecording = async ({ courseId, data }: { courseId: string, data: FormData }) => (await axios.post(`/api/courses/${courseId}/recordings`, data)).data;
const deleteRecording = async (recordingId: string) => (await axios.delete(`/api/recordings/${recordingId}`)).data;

const fetchQuizzes = async (courseId: string): Promise<Quiz[]> => (await axios.get(`/api/courses/${courseId}/quizzes`)).data;
const createQuiz = async ({ courseId, title }: { courseId: string; title: string }) => (await axios.post(`/api/courses/${courseId}/quizzes`, { title })).data;
const deleteQuiz = async (quizId: string) => (await axios.delete(`/api/quizzes/${quizId}`)).data;

const fetchQuestions = async (quizId: string): Promise<Question[]> => (await axios.get(`/api/quizzes/${quizId}/questions`)).data;
const addQuestion = async ({ quizId, data }: { quizId: string; data: QuestionFormData | FormData }) => {
    if (data instanceof FormData) {
        return (await axios.post(`/api/quizzes/${quizId}/questions`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    }
    return (await axios.post(`/api/quizzes/${quizId}/questions`, data)).data;
};
const updateQuestion = async ({ quizId, questionId, data }: { quizId: string; questionId: string; data: QuestionFormData | FormData }) => {
    if (data instanceof FormData) {
        return (await axios.patch(`/api/quizzes/${quizId}/questions/${questionId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    }
    return (await axios.patch(`/api/quizzes/${quizId}/questions/${questionId}`, data)).data;
};
const deleteQuestion = async ({ quizId, questionId }: { quizId: string; questionId: string }) => (await axios.delete(`/api/quizzes/${quizId}/questions/${questionId}`)).data;

// --- Main Component ---
export function ManageContentModal({ isOpen, onClose, course }: { isOpen: boolean; onClose: () => void; course: Course }) {
  const [activeTab, setActiveTab] = useState<'materials' | 'quizzes'>('materials');
  const [managingQuestionsOf, setManagingQuestionsOf] = useState<Quiz | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showRecordingForm, setShowRecordingForm] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  
  const queryClient = useQueryClient();

  // --- Materials Management Hooks ---
  const { register: registerMaterial, handleSubmit: handleMaterialSubmit } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: { zoomLink: course.zoomLink || '' },
  });

  // Re-use the main course update mutation for all course detail changes
  const updateCourseMutation = useMutation({
      mutationFn: updateCourse,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['courses'] });
          toast.success('Course details updated successfully!');
      },
      onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message)
  });

  // --- THIS IS THE FIX ---
  // The submit handler now constructs FormData, matching the backend's expectation.
  const onZoomLinkSubmit = (data: MaterialFormData) => {
    const formData = new FormData();
    formData.append('zoomLink', data.zoomLink || '');
    updateCourseMutation.mutate({ id: course.id, data: formData });
  };
  
  // ... (Other hooks for recordings and quizzes remain the same) ...
  const { data: recordings } = useQuery<Recording[]>({ queryKey: ['recordings', course.id], queryFn: () => fetchRecordings(course.id), enabled: isOpen && activeTab === 'materials' });
    const addRecordingMutation = useMutation({ mutationFn: addRecording, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recordings', course.id] }); setShowRecordingForm(false); toast.success('Recording added'); }, onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message) });
    const deleteRecordingMutation = useMutation({ mutationFn: deleteRecording, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recordings', course.id] }); toast.info('Recording deleted'); }, onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message) });
  const { data: quizzes } = useQuery<Quiz[]>({ queryKey: ['quizzes', course.id], queryFn: () => fetchQuizzes(course.id), enabled: isOpen && activeTab === 'quizzes' && !managingQuestionsOf });
  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({ queryKey: ['questions', managingQuestionsOf?.id], queryFn: () => fetchQuestions(managingQuestionsOf!.id), enabled: !!managingQuestionsOf });
    const questionMutationOptions = { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['questions', managingQuestionsOf?.id] }); setShowQuestionForm(false); setEditingQuestion(null); toast.success('Saved'); }, onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message) };
    const createQuizMutation = useMutation({ mutationFn: createQuiz, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quizzes', course.id] }); setNewQuizTitle(''); toast.success('Quiz created'); }, onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message) });
    const deleteQuizMutation = useMutation({ mutationFn: deleteQuiz, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quizzes', course.id] }); toast.info('Quiz deleted'); }, onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message) });
    const createQuestionMutation = useMutation({ mutationFn: addQuestion, ...questionMutationOptions });
    const updateQuestionMutation = useMutation({ mutationFn: updateQuestion, ...questionMutationOptions });
    const deleteQuestionMutation = useMutation({ mutationFn: deleteQuestion, ...questionMutationOptions });
    const handleCreateQuiz = () => { if (!newQuizTitle.trim()) return toast.warning('Please enter a title for the quiz.'); createQuizMutation.mutate({ courseId: course.id, title: newQuizTitle }); };
  const handleDeleteQuiz = (quizId: string) => { if (window.confirm("Delete this quiz?")) deleteQuizMutation.mutate(quizId); };
    const handleQuestionSubmit = (data: QuestionFormData | FormData) => {
        const quizId = managingQuestionsOf!.id;
        if (editingQuestion) {
            updateQuestionMutation.mutate({ quizId, questionId: editingQuestion.id, data });
        } else {
            createQuestionMutation.mutate({ quizId, data });
        }
    };
  const handleDeleteQuestion = (questionId: string) => { if (window.confirm("Delete this question?")) deleteQuestionMutation.mutate({ quizId: managingQuestionsOf!.id, questionId }); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Content for: ${course.title}`} size="4xl">
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
                <button onClick={() => setActiveTab('materials')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'materials' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Materials</button>
                <button onClick={() => setActiveTab('quizzes')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'quizzes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Quizzes</button>
            </nav>
        </div>
      
        <div className="pt-6 min-h-[400px]">
            {activeTab === 'materials' && (
                <div className="space-y-8">
                    <form onSubmit={handleMaterialSubmit(onZoomLinkSubmit)} className="space-y-2">
                         <h3 className="text-lg font-medium text-gray-900 flex items-center"><LinkIcon className="w-5 h-5 mr-2" /> Zoom Meeting Link</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                           <div className="w-full sm:flex-1"><Input label="" registration={registerMaterial('zoomLink')} placeholder="https://zoom.us/j/..."/></div>
                           <button type="submit" className="btn-primary mt-1 w-full sm:w-auto" disabled={updateCourseMutation.isPending}>
                               {updateCourseMutation.isPending ? 'Saving...' : 'Save'}
                           </button>
                        </div>
                    </form>
                    <hr/>
                    <div>
                         {showRecordingForm ? (
                           <RecordingForm courseId={course.id} onCancel={() => setShowRecordingForm(false)} mutation={addRecordingMutation} />
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center"><Film className="w-5 h-5 mr-2" /> Course Recordings</h3>
                                    <button onClick={() => setShowRecordingForm(true)} className="btn-primary flex items-center"><Plus className="w-4 h-4 mr-2" /> Add Recording</button>
                                </div>
                                <div className="space-y-3">
                                    {recordings?.map(rec => (
                                        <div key={rec.id} className="p-3 border rounded-md flex justify-between items-center bg-gray-50">
                                            <p className="font-medium text-gray-700 break-words pr-2">{rec.title}</p>
                                            <button onClick={() => deleteRecordingMutation.mutate(rec.id)} className="p-2 text-gray-500 hover:text-red-600 flex-shrink-0" title="Delete Recording"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'quizzes' && (
                  <div>
                    {managingQuestionsOf ? (
                        <div>
                            <button onClick={() => setManagingQuestionsOf(null)} className="text-sm text-gray-600 mb-4">&larr; Back to all quizzes</button>
                            <h3 className="text-xl font-bold mb-4">Manage Questions for: {managingQuestionsOf.title}</h3>
                            {showQuestionForm ? (
                                <QuestionForm onSubmit={handleQuestionSubmit} initialData={editingQuestion || undefined} isPending={createQuestionMutation.isPending || updateQuestionMutation.isPending} onCancel={() => { setEditingQuestion(null); setShowQuestionForm(false); }} />
                            ) : (
                                <div>
                                    <div className="flex justify-end mb-4">
                                        <button onClick={() => { setEditingQuestion(null); setShowQuestionForm(true); }} className="btn-primary flex items-center"><Plus className="w-4 h-4 mr-2"/> Add Question</button>
                                    </div>
                                    {questionsLoading && <p>Loading questions...</p>}
                                    <div className="space-y-3">
                                        {questions?.map(q => (
                                            <div key={q.id} className="p-3 border rounded-md flex justify-between items-center">
                                                <p className="font-medium">{q.questionText}</p>
                                                <div className="space-x-2">
                                                    <button onClick={() => { setEditingQuestion(q); setShowQuestionForm(true); }} className="p-2 text-gray-500 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        ))}
                                        {questions?.length === 0 && !questionsLoading && <p className="text-center text-sm text-gray-500 py-4">No questions added yet.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-lg font-medium">Existing Quizzes</h3>
                            <div className="space-y-3 mt-4">
                                {quizzes?.map(quiz => (
                                    <div key={quiz.id} className="p-3 border rounded-md flex justify-between items-center bg-gray-50">
                                        <p className="font-medium text-gray-800">{quiz.title}</p>
                                        <div className="flex-shrink-0 flex items-center space-x-2">
                                            <button onClick={() => setManagingQuestionsOf(quiz)} className="p-2 text-gray-500 hover:text-blue-600" title="Manage Questions"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-2 text-gray-500 hover:text-red-600" title="Delete Quiz"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <hr className="my-6" />
                            <div>
                                <h4 className="text-lg font-medium">Add New Quiz</h4>
                                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                    <input type="text" value={newQuizTitle} onChange={(e) => setNewQuizTitle(e.target.value)} placeholder="e.g., Week 1 Final Exam" className="w-full sm:flex-1 border-gray-300 rounded-md shadow-sm" />
                                    <button onClick={handleCreateQuiz} disabled={createQuizMutation.isPending} className="btn-primary flex items-center w-full sm:w-auto justify-center">
                                        <Plus className="w-5 h-5 mr-2" />
                                        {createQuizMutation.isPending ? "Adding..." : "Add Quiz"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                  </div>
                )}
            </div>
        </Modal>
    );
}