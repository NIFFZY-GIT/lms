'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation'; // Import useRouter

const submitPayment = async ({ courseId, file }: { courseId: string; file: File }) => {
    const formData = new FormData();
    formData.append('courseId', courseId);
    formData.append('receipt', file);
    return (await axios.post('/api/payments/upload', formData)).data;
};

export function EnrollmentForm({ courseId }: { courseId: string }) {
    const [file, setFile] = useState<File | null>(null);
    const queryClient = useQueryClient();
    const router = useRouter(); // Initialize router

    const mutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("A receipt file must be selected.");
            return submitPayment({ courseId, file });
        },
        // --- THIS IS THE UPDATED LOGIC ---
        onSuccess: () => {
            alert('Receipt re-submitted successfully! An admin will review it shortly.');
            // Instead of just invalidating, we will force a hard reload of the page.
            // This ensures the StudentCoursePage re-evaluates its state from scratch.
            router.refresh();
            // We can also invalidate just in case, it doesn't hurt.
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: (error: AxiosError<{ error?: string }>) => {
            const errorMessage = error.response?.data?.error || error.message;
            alert(`Submission failed: ${errorMessage}`);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Upload Bank Receipt</label>
                <input 
                    type="file"
                    required
                    key={file ? 'file-selected' : 'no-file'} // A trick to reset the input field
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
            </div>
            <button type="submit" disabled={!file || mutation.isPending} className="btn-primary w-full">
                {mutation.isPending ? 'Submitting...' : 'Submit for Approval'}
            </button>
        </form>
    );
}