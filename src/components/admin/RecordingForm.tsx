'use client';

import { useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { Recording } from '@/types';
import { toast } from '@/components/ui/toast';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    if (!title || !file) { toast.warning('Title and a video file are required.'); return; }
        const formData = new FormData();
        formData.append('title', title);
        formData.append('video', file);
        
        // Use mutateAsync to wait for the mutation to finish before resetting
        await mutation.mutateAsync({ courseId, data: formData });
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
                <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} required accept="video/mp4,video/webm" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
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

export default RecordingForm;