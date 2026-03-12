'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Modal } from '@/components/ui/Modal';
import { format, isPast } from 'date-fns';
import { Eye, CheckCircle, XCircle, Clock, Search, ShieldCheck, ShieldAlert, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { toast } from '@/components/ui/toast';

// --- Type Definitions ---
type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
interface Payment {
  id: string;
  status: PaymentStatus;
  receiptUrl: string;
  createdAt: string;
  studentName: string;
  studentId: string;
  courseTitle: string;
  courseId: string;
  courseType: 'ONE_TIME_PURCHASE' | 'SUBSCRIPTION';
  subscriptionExpiryDate: string | null;
}
interface VerificationResult {
    isDuplicate: boolean;
    payment?: {
        studentId: string;
        studentName: string;
        studentEmail: string;
        studentPhone: string | null;
        studentAddress: string | null;
        courseTitle: string;
        processedAt: string;
    }
}
interface ForceExtendConflict {
  requiresForce: true;
  error: string;
  conflictPaymentId: string;
  conflictExpiry: string;
}

// --- API Functions ---
const fetchPayments = async (): Promise<Payment[]> => (await axios.get('/api/payments')).data;
const approvePayment = ({ paymentId, referenceNumber }: { paymentId: string, referenceNumber: string }) => 
  axios.patch(`/api/payments/${paymentId}/approve`, { referenceNumber });
const rejectPayment = (paymentId: string) => 
  axios.patch(`/api/payments/${paymentId}/reject`);
const verifyRefNumber = async (refNumber: string): Promise<VerificationResult> => {
    if (!refNumber.trim()) return { isDuplicate: false };
    const { data } = await axios.get(`/api/payments/verify/${refNumber.trim()}`);
    return data;
};
const forceExtendSubscription = ({ paymentId, force }: { paymentId: string; force?: boolean }) =>
  axios.patch(`/api/payments/${paymentId}/force-extend`, { force: force ?? false });

// --- Helper Components ---
const StatusBadge = ({ status }: { status: PaymentStatus }) => {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };
  const icons = {
    PENDING: <Clock className="w-4 h-4 mr-1.5" />,
    APPROVED: <CheckCircle className="w-4 h-4 mr-1.5" />,
    REJECTED: <XCircle className="w-4 h-4 mr-1.5" />,
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {icons[status]}
      {status}
    </span>
  );
};

const PaymentRowSkeleton = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-8 bg-gray-200 rounded-md w-24"></div></td>
    </tr>
);

// --- Main Component ---
export default function AdminPaymentsPage() {
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [refNumber, setRefNumber] = useState('');
    const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('PENDING');
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [forceExtendConflict, setForceExtendConflict] = useState<ForceExtendConflict | null>(null);
    const [confirmForceExtendPaymentId, setConfirmForceExtendPaymentId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: payments, isLoading } = useQuery<Payment[]>({
        queryKey: ['payments'],
        queryFn: fetchPayments,
    });

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            closeModal();
        },
    onError: (error: AxiosError<{ error?: string }>) => { toast.error(error.response?.data?.error || error.message); }
    };

    const approveMutation = useMutation({ mutationFn: approvePayment, ...mutationOptions });
    const rejectMutation = useMutation({ mutationFn: rejectPayment, ...mutationOptions });
    const verifyMutation = useMutation({
      mutationFn: verifyRefNumber,
      onSuccess: (data) => setVerificationResult(data),
      onError: () => {
        setVerificationResult(null);
        toast.error('Could not verify the reference number. Please try again.');
      },
    });

    const forceExtendMutation = useMutation({
      mutationFn: forceExtendSubscription,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        setForceExtendConflict(null);
        setConfirmForceExtendPaymentId(null);
        toast.success('Subscription extended by 1 week.');
      },
      onError: (error: AxiosError<ForceExtendConflict & { error?: string }>) => {
        const data = error.response?.data;
        if (data?.requiresForce) {
          setForceExtendConflict(data);
        } else {
          toast.error(data?.error || error.message);
        }
      },
    });

    const handleApprove = () => { if (!selectedPayment || verificationResult?.isDuplicate) return; approveMutation.mutate({ paymentId: selectedPayment.id, referenceNumber: refNumber }); };
    const handleReject = () => { if (!selectedPayment) return; if (window.confirm('Are you sure you want to reject this payment?')) rejectMutation.mutate(selectedPayment.id); };
    const handleVerify = () => {
      if (!refNumber) return;
      setVerificationResult(null); // always clear stale result before a new check
      verifyMutation.mutate(refNumber);
    };
    const closeModal = () => { setSelectedPayment(null); setRefNumber(''); setVerificationResult(null); };

    const handleForceExtend = (paymentId: string) => {
      setForceExtendConflict(null);
      forceExtendMutation.mutate({ paymentId, force: false });
    };

    const handleForceExtendConfirmed = () => {
      if (!confirmForceExtendPaymentId) return;
      forceExtendMutation.mutate({ paymentId: confirmForceExtendPaymentId, force: true });
    };

    const filteredPayments = payments?.filter(p => filter === 'ALL' || p.status === filter);

    const isSubscriptionExpired = (payment: Payment) =>
      payment.courseType === 'SUBSCRIPTION' &&
      payment.status === 'APPROVED' &&
      payment.subscriptionExpiryDate != null &&
      isPast(new Date(payment.subscriptionExpiryDate));

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Payment Management</h1>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2 -mx-2 px-2">
                {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === status ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student & Course</th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-4 sm:px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => <PaymentRowSkeleton key={i} />)
                            ) : (
                                filteredPayments?.map(payment => (
                                    <tr key={payment.id} className={`hover:bg-gray-50 transition-colors ${isSubscriptionExpired(payment) ? 'bg-orange-50' : ''}`}>
                    <td className="px-4 sm:px-6 py-4 whitespace-normal break-words">
                                            <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                                            <div className="text-sm text-gray-500">{payment.courseTitle}</div>
                                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${payment.courseType === 'SUBSCRIPTION' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {payment.courseType === 'SUBSCRIPTION' ? '📅 Subscription' : '🔓 One-Time'}
                                              </span>
                                              {payment.courseType === 'SUBSCRIPTION' && payment.subscriptionExpiryDate && (
                                                <span className={`text-xs ${isSubscriptionExpired(payment) ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                                                  {isSubscriptionExpired(payment) ? '⚠ Expired' : 'Active until'}{' '}
                                                  {format(new Date(payment.subscriptionExpiryDate), 'MMM d, yyyy')}
                                                </span>
                                              )}
                                            </div>
                                        </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(payment.createdAt), 'PP')}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap"><StatusBadge status={payment.status} /></td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                                            {payment.status === 'PENDING' && (
                        <button type="button" onClick={() => setSelectedPayment(payment)} className="btn-secondary flex items-center"><Eye className="w-4 h-4 mr-2" /> Review</button>
                                            )}
                                            {payment.courseType === 'SUBSCRIPTION' && payment.status === 'APPROVED' && (
                                              <button
                                                type="button"
                                                onClick={() => { setConfirmForceExtendPaymentId(payment.id); handleForceExtend(payment.id); }}
                                                disabled={forceExtendMutation.isPending && confirmForceExtendPaymentId === payment.id}
                                                className="btn-secondary flex items-center text-purple-700 border-purple-300 hover:bg-purple-50"
                                                title="Force-extend subscription by 1 week"
                                              >
                                                {forceExtendMutation.isPending && confirmForceExtendPaymentId === payment.id
                                                  ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                  : <RefreshCw className="w-4 h-4 mr-1" />}
                                                Extend 1 Week
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                 {!isLoading && filteredPayments?.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>{`No payments found for the "${filter.toLowerCase()}" filter.`}</p>
                    </div>
                )}
            </div>

            {/* Review Payment Modal */}
            {selectedPayment && (
                <Modal isOpen={!!selectedPayment} onClose={closeModal} title="Review Payment" size="4xl" >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div className="space-y-2">
                           <h3 className="text-lg font-medium text-gray-900">Uploaded Receipt</h3>
                           {selectedPayment.receiptUrl.toLowerCase().includes('.pdf') ? (
                             <div className="border rounded-lg bg-gray-50 overflow-hidden">
                               {/* PDF header bar */}
                               <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-200">
                                 <div className="flex items-center gap-2">
                                   <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white tracking-wide">PDF</span>
                                   <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
                                     {selectedPayment.receiptUrl.split('/').pop()?.split('%').shift() ?? 'receipt.pdf'}
                                   </span>
                                 </div>
                                 <a
                                   href={selectedPayment.receiptUrl}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                                 >
                                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                   Open PDF
                                 </a>
                               </div>
                               <iframe
                                 src={selectedPayment.receiptUrl}
                                 title="Payment Receipt PDF"
                                 className="w-full rounded-b-lg"
                                 style={{ height: '420px' }}
                               />
                             </div>
                           ) : (
                             <>
                               <div className="relative border rounded-lg p-2 bg-gray-100 h-72 md:h-96 w-full overflow-hidden">
                                 <Image src={selectedPayment.receiptUrl} alt="Payment Receipt" fill style={{ objectFit: 'contain' }} className="rounded-md" />
                               </div>
                               <a href={selectedPayment.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Open image in new tab</a>
                             </>
                           )}
                        </div>
                        <div className="space-y-6 flex flex-col">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Submission Details</h3>
                                <dl className="mt-2 text-sm text-gray-600">
                                    <div className="flex justify-between py-1"><dt>Student:</dt><dd className="font-medium text-gray-900">{selectedPayment.studentName}</dd></div>
                                    <div className="flex justify-between py-1"><dt>Course:</dt><dd className="font-medium text-gray-900">{selectedPayment.courseTitle}</dd></div>
                                    <div className="flex justify-between py-1"><dt>Type:</dt><dd className="font-medium text-gray-900">{selectedPayment.courseType === 'SUBSCRIPTION' ? '📅 Monthly Subscription' : '🔓 One-Time Purchase'}</dd></div>
                                    <div className="flex justify-between py-1"><dt>Submitted At:</dt><dd className="font-medium text-gray-900">{format(new Date(selectedPayment.createdAt), 'PPpp')}</dd></div>
                                </dl>
                            </div>
                            <hr />
                            <div className="flex-grow">
                                <label htmlFor="refNumber" className="block text-sm font-medium text-gray-700">Bank Reference Number</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <input id="refNumber" type="text" value={refNumber} onChange={(e) => {setRefNumber(e.target.value); setVerificationResult(null);}} className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter Ref# from receipt" />
                                    <button onClick={handleVerify} disabled={!refNumber || verifyMutation.isPending} className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 disabled:cursor-not-allowed" type="button">
                                        {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    </button>
                                </div>
                                {verificationResult && (
                                    <div className={`mt-2 p-4 rounded-lg text-sm flex items-start ${verificationResult.isDuplicate ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-green-50 text-green-900 border border-green-200'}`}>
                                        {verificationResult.isDuplicate ? <ShieldAlert className="w-6 h-6 mr-3 flex-shrink-0" /> : <ShieldCheck className="w-6 h-6 mr-3 flex-shrink-0" />}
                                        <div>
                                            {verificationResult.isDuplicate && verificationResult.payment ? (
                                                <div>
                                                    <p className="font-bold text-base">Duplicate Reference Number!</p>
                                                    <p className="mt-1">This number was already used for the following approved payment:</p>
                                                    <div className="mt-2 text-xs bg-red-100 p-2 rounded space-y-1">
                                                        <p><strong>Student:</strong> {verificationResult.payment.studentName}</p>
                                                        <p><strong>Email:</strong> {verificationResult.payment.studentEmail}</p>
                                                        <p><strong>Phone:</strong> {verificationResult.payment.studentPhone || 'N/A'}</p>
                                                        <p><strong>Address:</strong> {verificationResult.payment.studentAddress || 'N/A'}</p>
                                                        <hr className="my-1 border-red-200"/>
                                                        <p><strong>Course:</strong> {verificationResult.payment.courseTitle}</p>
                                                        <p><strong>Processed On:</strong> {format(new Date(verificationResult.payment.processedAt), 'PPpp')}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="font-bold">This reference number is unique and available.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                                <button type="button" onClick={handleReject} disabled={rejectMutation.isPending} className="btn-danger w-full sm:w-auto">{rejectMutation.isPending ? 'Rejecting...' : 'Reject'}</button>
                                <button type="button" onClick={handleApprove} disabled={!refNumber || approveMutation.isPending || verifyMutation.isPending || !verificationResult || verificationResult.isDuplicate} className="btn-primary w-full sm:w-auto">{approveMutation.isPending ? 'Approving...' : 'Approve Payment'}</button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Force-Extend Conflict Confirmation Modal */}
            {forceExtendConflict && confirmForceExtendPaymentId && (
              <Modal isOpen={!!forceExtendConflict} onClose={() => { setForceExtendConflict(null); setConfirmForceExtendPaymentId(null); }} title="Subscription Conflict Detected">
                <div className="space-y-5">
                  <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-900">Active subscription already exists</p>
                      <p className="text-sm text-orange-800 mt-1">
                        This student already has an active approved subscription for this course that expires on{' '}
                        <strong>{format(new Date(forceExtendConflict.conflictExpiry), 'PPP')}</strong>.
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Do you want to force-extend <em>this</em> payment anyway? The existing active subscription will remain unchanged — both records will be active for the same period.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => { setForceExtendConflict(null); setConfirmForceExtendPaymentId(null); }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary bg-orange-600 hover:bg-orange-700 border-orange-600"
                      onClick={handleForceExtendConfirmed}
                      disabled={forceExtendMutation.isPending}
                    >
                      {forceExtendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
                      Force Extend Anyway
                    </button>
                  </div>
                </div>
              </Modal>
            )}
        </div>
    );
}
