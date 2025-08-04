'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'; 
import axios, { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Course, Quiz, Recording, Question } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { QuestionForm, QuestionFormData } from './QuestionForm';
import { Trash2, Edit, Plus, Film, Link as LinkIcon, HelpCircle } from 'lucide-react';

// --- Schemas ---
const materialSchema = z.object({
    zoomLink: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
});
type MaterialFormData = z.infer<typeof materialSchema>;

// --- API Functions ---
const updateCourseDetails = async ({ courseId, data }: { courseId: string, data: { zoomLink?: string }}) => (await axios.patch(`/api/courses/${courseId}`, data)).data;
const fetchRecordings = async (courseId: string): Promise<Recording[]> => (await axios.get(`/api/courses/${courseId}/recordings`)).data;
const addRecording = async ({ courseId, data }: { courseId: string, data: FormData }) => (await axios.post(`/api/courses/${courseId}/recordings`, data)).data;
const deleteRecording = async (recordingId: string) => (await axios.delete(`/api/recordings/${recordingId}`)).data;
const fetchQuizzes = async (courseId: string): Promise<Quiz[]> => (await axios.get(`/api/courses/${courseId}/quizzes`)).data;
const createQuiz = async ({ courseId, title }: { courseId: string; title: string }) => (await axios.post(`/api/courses/${courseId}/quizzes`, { title })).data;
const deleteQuiz = async (quizId: string) => (await axios.delete(`/api/quizzes/${quizId}`)).data;
const fetchQuestions = async (quizId: string): Promise<Question[]> => (await axios.get(`/api/quizzes/${quizId}/questions`)).data;
const addQuestion = async ({ quizId, data }: { quizId: string; data: QuestionFormData }) => (await axios.post(`/api/quizzes/${quizId}/questions`, data)).data;
const updateQuestion = async ({ questionId, data }: { questionId: string; data: QuestionFormData }) => (await axios.patch(`/api/questions/${questionId}`, data)).data;
const deleteQuestion = async (questionId: string) => (await axios.delete(`/api/questions/${questionId}`)).data;


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
  const zoomLinkMutation = useMutation({ mutationFn: updateCourseDetails, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); alert("Zoom Link Updated!"); }, onError: (error: AxiosError<{ error?: string }>) => alert(`Error: ${error.response?.data?.error || error.message}`) });
  
  // --- Recordings Management Hooks ---
  const { data: recordings, isLoading: recordingsLoading } = useQuery<Recording[]>({ queryKey: ['recordings', course.id], queryFn: () => fetchRecordings(course.id), enabled: isOpen && activeTab === 'materials' });
  const addRecordingMutation = useMutation({ mutationFn: addRecording, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recordings', course.id] }); setShowRecordingForm(false); }, onError: (error: AxiosError<{ error?: string }>) => alert(`Error: ${error.response?.data?.error || error.message}`) });
  const deleteRecordingMutation = useMutation({ mutationFn: deleteRecording, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recordings', course.id] }), onError: (error: AxiosError<{ error?: string }>) => alert(`Error: ${error.response?.data?.error || error.message}`) });

  // --- Quiz & Question Management Hooks ---
  const { data: quizzes, isLoading: quizzesLoading } = useQuery<Quiz[]>({ queryKey: ['quizzes', course.id], queryFn: () => fetchQuizzes(course.id), enabled: isOpen && activeTab === 'quizzes' && !managingQuestionsOf });
  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({ queryKey: ['questions', managingQuestionsOf?.id], queryFn: () => fetchQuestions(managingQuestionsOf!.id), enabled: !!managingQuestionsOf });

  const questionMutationOptions = { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['questions', managingQuestionsOf?.id] }); setShowQuestionForm(false); setEditingQuestion(null); }, onError: (error: AxiosError<{ error?: string }>) => alert(`Error: ${error.response?.data?.error || error.message}`) };
  
  const createQuizMutation = useMutation({ mutationFn: createQuiz, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quizzes', course.id] }); setNewQuizTitle(''); }, onError: (error: AxiosError<{ error?: string }>) => alert(`Error: ${error.response?.data?.error || error.message}`) });
  const deleteQuizMutation = useMutation({ mutationFn: deleteQuiz, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quizzes', course.id] }); }, onError: (error: AxiosError<{ error?: string }>) => alert(`Error: ${error.response?.data?.error || error.message}`) });
  const createQuestionMutation = useMutation({ mutationFn: addQuestion, ...questionMutationOptions });
  const updateQuestionMutation = useMutation({ mutationFn: updateQuestion, ...questionMutationOptions });
  const deleteQuestionMutation = useMutation({ mutationFn: deleteQuestion, ...questionMutationOptions });
  
  // --- Handlers ---
  const onZoomLinkSubmit = (data: MaterialFormData) => zoomLinkMutation.mutate({ courseId: course.id, data: data });
  const handleCreateQuiz = () => { if (!newQuizTitle.trim()) return alert("Please enter a title for the quiz."); createQuizMutation.mutate({ courseId: course.id, title: newQuizTitle }); };
  const handleDeleteQuiz = (quizId: string) => { if (window.confirm("Delete this quiz?")) deleteQuizMutation.mutate(quizId); };
  const handleQuestionSubmit = (data: QuestionFormData) => { if (editingQuestion) { updateQuestionMutation.mutate({ questionId: editingQuestion.id, data }); } else { createQuestionMutation.mutate({ quizId: managingQuestionsOf!.id, data }); } };
  const handleDeleteQuestion = (questionId: string) => { if (window.confirm("Delete this question?")) deleteQuestionMutation.mutate(questionId); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Content for: ${course.title}`} size="4xl">
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
                <button onClick={() => setActiveTab('materials')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'materials' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Materials</button>
                <button onClick={() => setActiveTab('quizzes')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'quizzes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Quizzes</button>
            </nav>
        </div>
      
        <div className="pt-6 min-h-[400px]">
            {/* --- THIS IS THE RESTORED MATERIALS TAB --- */}
            {activeTab === 'materials' && (
                <div className="space-y-8">
                    {/* Zoom Link Section */}
                    <form onSubmit={handleMaterialSubmit(onZoomLinkSubmit)} className="space-y-2">
                         <h3 className="text-lg font-medium text-gray-900 flex items-center"><LinkIcon className="w-5 h-5 mr-2" /> Zoom Meeting Link</h3>
                        <div className="flex items-center space-x-2">
                           <Input label="" registration={registerMaterial('zoomLink')} placeholder="https://zoom.us/j/..."/>
                           <button type="submit" className="btn-primary mt-1" disabled={zoomLinkMutation.isPending}>
                               {zoomLinkMutation.isPending ? 'Saving...' : 'Save'}
                           </button>
                        </div>
                    </form>
                    <hr/>
                    {/* Recordings Section */}
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
                                    {recordingsLoading && <p>Loading recordings...</p>}
                                    {recordings?.map(rec => (
                                        <div key={rec.id} className="p-3 border rounded-md flex justify-between items-center bg-gray-50">
                                            <p className="font-medium text-gray-700">{rec.title}</p>
                                            <button onClick={() => deleteRecordingMutation.mutate(rec.id)} className="p-2 text-gray-500 hover:text-red-600" title="Delete Recording"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    {recordings?.length === 0 && !recordingsLoading && <p className="text-center text-sm text-gray-500 py-4">No recordings have been uploaded yet.</p>}
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
                        <button onClick={() => setManagingQuestionsOf(null)} className="text-sm text-gray-600 mb-4">← Back to all quizzes</button>
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
                                                <button onClick={() => { setEditingQuestion(q); setShowQuestionForm(true); }} className="p-2 text-gray-500 hover:text-indigo-600"><Edit className="w-4 h-4"/></button>
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
                                        <button onClick={() => setManagingQuestionsOf(quiz)} className="p-2 text-gray-500 hover:text-indigo-600" title="Manage Questions"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-2 text-gray-500 hover:text-red-600" title="Delete Quiz"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <hr className="my-6" />
                        <div>
                            <h4 className="text-lg font-medium">Add New Quiz</h4>
                            <div className="flex items-center space-x-2 mt-2">
                                <input type="text" value={newQuizTitle} onChange={(e) => setNewQuizTitle(e.target.value)} placeholder="e.g., Week 1 Final Exam" className="flex-grow w-full border-gray-300 rounded-md shadow-sm"/>
                                <button onClick={handleCreateQuiz} disabled={createQuizMutation.isPending} className="btn-primary flex items-center">
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

// --- RecordingForm Helper Component ---
function RecordingForm({ courseId, onCancel, mutation }: { courseId: string; onCancel: () => void; mutation: UseMutationResult<Recording, unknown, { courseId: string; data: FormData }, unknown>; }) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !file) {
            alert("Title and a video file are required.");
            return;
        }
        const formData = new FormData();
        formData.append('title', title);
        formData.append('video', file);
        await mutation.mutateAsync({ courseId, data: formData });
        // Reset form state after successful submission
        setTitle('');
        setFile(null);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <button type="button" onClick={onCancel} className="text-sm text-gray-600 mb-2">← Back to list</button>
            <h4 className="font-bold text-lg">Add New Recording</h4>
            <div>
                <label className="block text-sm font-medium text-gray-700">Recording Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 w-full border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Video File</label>
                <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} required accept="video/mp4,video/webm" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            </div>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={mutation.isPending} className="btn-primary">
                    {mutation.isPending ? 'Uploading...' : 'Upload & Save'}
                </button>
            </div>
        </form>
    )
}