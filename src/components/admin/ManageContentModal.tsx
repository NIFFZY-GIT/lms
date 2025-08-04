'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Course, Quiz, Recording } from '@/types'; // Make sure Recording is defined in your types
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { QuizForm, QuizFormData } from './QuizForm';
import { Trash2, Edit, Plus, Film, Link as LinkIcon } from 'lucide-react';

// --- Schemas ---
const materialSchema = z.object({
    zoomLink: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
});
type MaterialFormData = z.infer<typeof materialSchema>;

// --- API Functions ---
const updateCourseDetails = async ({ courseId, data }: { courseId: string, data: { zoomLink: string }}) => {
    return (await axios.patch(`/api/courses/${courseId}`, data)).data;
}
const fetchRecordings = async (courseId: string): Promise<Recording[]> => (await axios.get(`/api/courses/${courseId}/recordings`)).data;
const addRecording = async ({ courseId, data }: { courseId: string, data: FormData }) => (await axios.post(`/api/courses/${courseId}/recordings`, data)).data;
const deleteRecording = async (recordingId: string) => (await axios.delete(`/api/recordings/${recordingId}`)).data;

const fetchQuizzes = async (courseId: string): Promise<Quiz[]> => (await axios.get(`/api/courses/${courseId}/quizzes`)).data;
const addQuiz = async ({ courseId, data }: { courseId: string; data: QuizFormData }) => (await axios.post(`/api/courses/${courseId}/quizzes`, data)).data;
const updateQuiz = async ({ quizId, data }: { quizId: string; data: QuizFormData }) => (await axios.patch(`/api/quizzes/${quizId}`, data)).data;
const deleteQuiz = async (quizId: string) => (await axios.delete(`/api/quizzes/${quizId}`)).data;


// --- Main Component ---
export function ManageContentModal({ isOpen, onClose, course }: { isOpen: boolean; onClose: () => void; course: Course }) {
  const [activeTab, setActiveTab] = useState<'materials' | 'quizzes'>('materials');
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showRecordingForm, setShowRecordingForm] = useState(false);
  
  const queryClient = useQueryClient();

  // --- Materials Management (Zoom Link) ---
  const { register: registerMaterial, handleSubmit: handleMaterialSubmit } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: { zoomLink: course.zoomLink || '' },
  });

  const zoomLinkMutation = useMutation({
    mutationFn: updateCourseDetails,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        alert("Zoom Link Updated!");
    },
    onError: (error: AxiosError<{ error?: string }>) => alert(`Error: ${error.response?.data?.error || error.message}`)
  });

  const onZoomLinkSubmit = (data: MaterialFormData) => {
    zoomLinkMutation.mutate({ courseId: course.id, data: { zoomLink: data.zoomLink ?? '' } });
  };

  // --- Recordings Management ---
  const { data: recordings, isLoading: recordingsLoading } = useQuery<Recording[]>({
    queryKey: ['recordings', course.id],
    queryFn: () => fetchRecordings(course.id),
    enabled: isOpen && activeTab === 'materials',
  });

  const addRecordingMutation = useMutation({
    mutationFn: addRecording,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['recordings', course.id] });
        setShowRecordingForm(false);
    },
    onError: (error: AxiosError<{ error?: string }>) => alert(`Error: ${error.response?.data?.error || error.message}`)
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: deleteRecording,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recordings', course.id] }),
    onError: (error: AxiosError<{ error?: string }>) => alert(`Error: ${error.response?.data?.error || error.message}`)
  });

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Content for: ${course.title}`} size="4xl">
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
                <button onClick={() => setActiveTab('materials')} className={`...`}>Materials</button>
                <button onClick={() => setActiveTab('quizzes')} className={`...`}>Quizzes</button>
            </nav>
        </div>
      
        <div className="pt-6 min-h-[400px]">
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
                {showQuizForm ? (
                    <QuizForm 
                        onSubmit={handleQuizSubmit} 
                        initialData={editingQuiz || undefined}
                        isPending={createQuizMutation.isPending || updateQuizMutation.isPending}
                        onCancel={() => { setEditingQuiz(null); setShowQuizForm(false); }}
                    />
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Existing Quizzes</h3>
                            <button onClick={() => { setEditingQuiz(null); setShowQuizForm(true); }} className="btn-primary flex items-center"><Plus className="w-5 h-5 mr-2" /> Add Quiz</button>
                        </div>
                        {quizzesLoading && <p>Loading quizzes...</p>}
                        <div className="space-y-3">
                            {quizzes?.map(quiz => (
                                <div key={quiz.id} className="p-3 border rounded-md flex justify-between items-center bg-gray-50">
                                    <p className="font-medium text-gray-800 truncate" title={quiz.question}>{quiz.question}</p>
                                    <div className="flex-shrink-0 flex items-center space-x-2">
                                        <button onClick={() => { setEditingQuiz(quiz); setShowQuizForm(true); }} className="p-2 text-gray-500 hover:text-indigo-600" title="Edit Quiz"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-2 text-gray-500 hover:text-red-600" title="Delete Quiz"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                            {quizzes?.length === 0 && !quizzesLoading && <p className="text-gray-500 text-sm text-center py-4">No quizzes have been added to this course yet.</p>}
                        </div>
                    </div>
                )}
              </div>
            )}
        </div>
    </Modal>
  );
}


// --- NEW HELPER COMPONENT (can be in the same file or a separate file) ---
import type { UseMutationResult } from '@tanstack/react-query';

function RecordingForm({
    courseId,
    onCancel,
    mutation,
}: {
    courseId: string;
    onCancel: () => void;
    mutation: UseMutationResult<Recording, unknown, { courseId: string; data: FormData }, unknown>;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !file) {
            alert("Title and a video file are required.");
            return;
        }
        const formData = new FormData();
        formData.append('title', title);
        formData.append('video', file);
        mutation.mutate({ courseId, data: formData });
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