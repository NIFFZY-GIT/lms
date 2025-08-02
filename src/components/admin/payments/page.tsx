'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios'; // <-- 1. Import AxiosError
import { Modal } from '@/components/ui/Modal';
import { format } from 'date-fns';

interface Payment {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  receiptUrl: string;
  createdAt: string;
  studentName: string;
  courseTitle: string;
}

const fetchPayments = async (): Promise<Payment[]> => (await axios.get('/api/payments')).data;

export default function AdminPaymentsPage() {
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [refNumber, setRefNumber] = useState('');
    const queryClient = useQueryClient();

    const { data: payments, isLoading } = useQuery<Payment[]>({
        queryKey: ['payments'],
        queryFn: fetchPayments
    });

    const approveMutation = useMutation({
        mutationFn: ({ paymentId, referenceNumber }: { paymentId: string, referenceNumber: string }) => 
            axios.patch(`/api/payments/${paymentId}/approve`, { referenceNumber }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            setSelectedPayment(null);
            setRefNumber('');
            alert('Payment approved!');
        },
        // --- THIS IS THE FIX ---
        onError: (error: AxiosError<{ error?: string }>) => { // <-- 2. Use the specific type
            const errorMessage = error.response?.data?.error || error.message;
            alert(`Error: ${errorMessage}`);
        }
    });

    const handleApprove = () => {
        if (!selectedPayment) return;
        approveMutation.mutate({ paymentId: selectedPayment.id, referenceNumber: refNumber });
    };

    // ... (rest of the component JSX remains the same) ...
    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Payment Management</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Pending Payments</h2>
                {isLoading && <p>Loading...</p>}
                <div className="space-y-3">
                    {payments?.filter(p => p.status === 'PENDING').map(payment => (
                        <div key={payment.id} className="p-4 border rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-bold">{payment.studentName} - <span className="font-normal">{payment.courseTitle}</span></p>
                                <p className="text-sm text-gray-500">Submitted: {format(new Date(payment.createdAt), 'PPpp')}</p>
                            </div>
                            <button onClick={() => setSelectedPayment(payment)} className="btn-secondary">Review</button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedPayment && (
                <Modal isOpen={!!selectedPayment} onClose={() => setSelectedPayment(null)} title="Review Payment">
                    <div className="space-y-4">
                        <p><strong>Student:</strong> {selectedPayment.studentName}</p>
                        <p><strong>Course:</strong> {selectedPayment.courseTitle}</p>
                        <a href={selectedPayment.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">View Uploaded Receipt</a>
                        <hr />
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bank Reference Number</label>
                            <input 
                                type="text"
                                value={refNumber}
                                onChange={(e) => setRefNumber(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                placeholder="Enter Ref# from receipt..."
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            {/* You can add a reject mutation here */}
                            <button className="btn-danger">Reject</button> 
                            <button onClick={handleApprove} disabled={!refNumber || approveMutation.isPending} className="btn-primary">
                                {approveMutation.isPending ? 'Approving...' : 'Approve Payment'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}