'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';

// API function to submit the payment
const submitPayment = async ({ courseId, file }: { courseId: string; file: File }) => {
    const formData = new FormData();
    formData.append('courseId', courseId);
    formData.append('receipt', file);

    // Axios will automatically set the correct 'multipart/form-data' header
    return (await axios.post('/api/payments/upload', formData)).data;
};

export function EnrollmentForm({ courseId }: { courseId: string }) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null); // State for file validation errors
    const queryClient = useQueryClient();
    const router = useRouter();

    const mutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("A receipt file must be selected.");
            return submitPayment({ courseId, file });
        },
        onSuccess: () => {
            toast.success('Receipt submitted. Awaiting admin approval.');
            // Force a hard reload to get the new 'PENDING' status
            router.refresh();
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: (err: AxiosError<{ error?: string }>) => {
            const errorMessage = err.response?.data?.error || err.message;
            toast.error(errorMessage || 'Submission failed');
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null); // Clear previous errors
        const selectedFile = e.target.files ? e.target.files[0] : null;
        if (selectedFile) {
            // Optional: Add file size validation
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                setError('File is too large. Please upload an image smaller than 10MB.');
                setFile(null);
                e.target.value = ''; // Reset the input
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError("Please select a receipt file to upload.");
            return;
        }
        mutation.mutate();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="receipt-upload" className="block text-sm font-medium text-gray-700">Upload Bank Receipt</label>
                <input 
                    id="receipt-upload"
                    type="file"
                    required
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    onChange={handleFileChange}
                    // --- THIS IS THE FIX ---
                    // This onClick handler resets the input's value, allowing the same file
                    // to be selected again and trigger onChange.
                    onClick={(event: React.MouseEvent<HTMLInputElement>) => {
                        (event.target as HTMLInputElement).value = '';
                    }}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {file && <p className="text-xs text-gray-500 mt-2">Selected file: {file.name}</p>}
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>
            <button type="submit" disabled={!file || mutation.isPending} className="btn-primary w-full">
                {mutation.isPending ? 'Submitting...' : 'Submit for Approval'}
            </button>
        </form>
    );
}