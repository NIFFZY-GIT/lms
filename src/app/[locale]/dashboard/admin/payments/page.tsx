'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Modal } from '@/components/ui/Modal';
import { format, isPast } from 'date-fns';
import { Eye, CheckCircle, XCircle, Clock, Search, ShieldCheck, ShieldAlert, Loader2, RefreshCw, AlertTriangle, Copy, ScanSearch } from 'lucide-react';
import Image from 'next/image';
import { toast } from '@/components/ui/toast';

// --- Type Definitions ---
type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type DuplicateMatchType = 'EXACT';
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
  coursePrice: string;
  // Receipt-reuse detection (null when no earlier receipt matched)
  duplicateMatchType: DuplicateMatchType | null;
  duplicateOfPaymentId: string | null;
  duplicateReceiptUrl: string | null;
  duplicateCreatedAt: string | null;
  duplicateStatus: PaymentStatus | null;
  duplicateStudentName: string | null;
  duplicateStudentEmail: string | null;
  duplicateCourseTitle: string | null;
  // Cached OCR read of the receipt (null until the receipt has been scanned)
  ocrReference: string | null;
  ocrAmount: string | null;
  ocrSource: 'PDF_TEXT' | 'IMAGE_OCR' | null;
  ocrConfidence: number | null;
  ocrScannedAt: string | null;
  rejectionReason: string | null;
}
interface ScanResult {
  cached: boolean;
  referenceNumber: string | null;
  amount: number | null;
  source: 'PDF_TEXT' | 'IMAGE_OCR' | null;
  confidence: number | null;
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
const approvePayment = ({ paymentId, referenceNumber, paidAmount }: { paymentId: string, referenceNumber: string, paidAmount?: number | null }) =>
  axios.patch(`/api/payments/${paymentId}/approve`, { referenceNumber, paidAmount });
const scanReceipt = async ({ paymentId, force }: { paymentId: string; force?: boolean }): Promise<ScanResult> =>
  (await axios.post(`/api/payments/${paymentId}/scan${force ? '?force=1' : ''}`)).data;
const rejectPayment = ({ paymentId, reason }: { paymentId: string; reason: string }) =>
  axios.patch(`/api/payments/${paymentId}/reject`, { reason });

// Offered as one-click choices so a reason is quick to give; each is written to
// be read by the student, who sees it verbatim on the course page.
const REJECTION_PRESETS = [
  'The receipt image is unclear — please upload a sharper photo showing the full slip.',
  'The amount paid does not match the course fee.',
  'This receipt has already been used for another enrolment.',
  'The receipt is for a different course or account.',
  'We could not verify this payment with the bank.',
  'The receipt is incomplete — the reference number is not visible.',
];
const verifyRefNumber = async (refNumber: string): Promise<VerificationResult> => {
    if (!refNumber.trim()) return { isDuplicate: false };
    const { data } = await axios.get(`/api/payments/verify/${refNumber.trim()}`);
    return data;
};
const forceExtendSubscription = ({ paymentId, force }: { paymentId: string; force?: boolean }) =>
  axios.patch(`/api/payments/${paymentId}/force-extend`, { force: force ?? false });
const rescanReceipts = async (): Promise<{ scanned: number; flagged: number; skipped: number; remaining: number }> =>
  (await axios.post('/api/admin/receipts/rescan')).data;

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

const DuplicateChip = ({ payment }: { payment: Payment }) => {
  if (!payment.duplicateMatchType) return null;
  return (
    <span
      className="inline-flex items-center text-xs px-1.5 py-0.5 rounded font-semibold bg-red-100 text-red-700"
      title="Byte-for-byte the same file as an earlier receipt"
    >
      <Copy className="w-3 h-3 mr-1" />
      Same receipt file
    </span>
  );
};

/** Renders a receipt inline, handling both the PDF and image cases. */
const ReceiptPreview = ({ url, label, heightClass }: { url: string; label: string; heightClass: string }) => {
  const isPdf = url.toLowerCase().includes('.pdf');

  if (isPdf) {
    return (
      <div className="border rounded-lg bg-gray-50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white tracking-wide">PDF</span>
            <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
              {url.split('/').pop()?.split('%').shift() ?? 'receipt.pdf'}
            </span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            Open PDF
          </a>
        </div>
        <iframe src={url} title={label} className={`w-full rounded-b-lg ${heightClass}`} />
      </div>
    );
  }

  return (
    <>
      <div className={`relative border rounded-lg p-2 bg-gray-100 w-full overflow-hidden ${heightClass}`}>
        <Image src={url} alt={label} fill style={{ objectFit: 'contain' }} className="rounded-md" />
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Open image in new tab</a>
    </>
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
    const [acknowledgedDuplicate, setAcknowledgedDuplicate] = useState(false);
    const [paidAmount, setPaidAmount] = useState('');
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const queryClient = useQueryClient();

    const { data: payments, isLoading, isError, error, refetch, isRefetching } = useQuery<Payment[]>({
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

    const rescanMutation = useMutation({
      mutationFn: rescanReceipts,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        const remaining = data.remaining > 0 ? ` ${data.remaining} still queued — run again.` : '';
        toast.success(`Checked ${data.scanned} receipts, flagged ${data.flagged}.${remaining}`);
      },
      onError: (error: AxiosError<{ error?: string }>) => { toast.error(error.response?.data?.error || error.message); },
    });

    const scanMutation = useMutation({
      mutationFn: scanReceipt,
      onSuccess: (data) => {
        setScanResult(data);
        setScanError(null);
        // The read is a suggestion: only fill blank fields so it never
        // overwrites something the admin already typed.
        if (data.referenceNumber) setRefNumber((current) => current || data.referenceNumber!);
        if (data.amount != null) setPaidAmount((current) => current || String(data.amount));
        queryClient.invalidateQueries({ queryKey: ['payments'] });
      },
      onError: (error: AxiosError<{ error?: string }>) => {
        setScanResult(null);
        setScanError(error.response?.data?.error || 'Could not read this receipt — enter the details manually.');
      },
    });

    // --- Approval gates -------------------------------------------------
    // Each check is a warning the admin must acknowledge, never a hard block:
    // legitimate cases exist for all three (a family paying together, a
    // resubmission, a student who overpaid).
    const expectedAmount = selectedPayment ? Number(selectedPayment.coursePrice) : 0;
    const enteredAmount = paidAmount.trim() === '' ? null : Number(paidAmount);
    const amountIsValid = enteredAmount !== null && Number.isFinite(enteredAmount) && enteredAmount > 0;
    // Tolerate rounding: bank slips and course prices differ by cents.
    const amountMismatch = amountIsValid && Math.abs(enteredAmount - expectedAmount) > 0.5;

    const duplicateFileFlag = selectedPayment?.duplicateMatchType === 'EXACT';
    const duplicateRefFlag = verificationResult?.isDuplicate === true;
    const needsAcknowledgement = duplicateFileFlag || duplicateRefFlag || amountMismatch;
    const blockedByFlags = needsAcknowledgement && !acknowledgedDuplicate;

    const handleApprove = () => {
      if (!selectedPayment || blockedByFlags) return;
      approveMutation.mutate({
        paymentId: selectedPayment.id,
        referenceNumber: refNumber,
        paidAmount: amountIsValid ? enteredAmount : null,
      });
    };

    const openReview = (payment: Payment) => {
      setSelectedPayment(payment);
      setVerificationResult(null);
      setAcknowledgedDuplicate(false);
      setScanError(null);
      // Reuse the cached read if this receipt was scanned before; otherwise
      // kick off a scan and let onSuccess fill the fields in.
      setRefNumber(payment.ocrReference ?? '');
      setPaidAmount(payment.ocrAmount != null ? String(Number(payment.ocrAmount)) : '');
      setScanResult(
        payment.ocrScannedAt
          ? {
              cached: true,
              referenceNumber: payment.ocrReference,
              amount: payment.ocrAmount != null ? Number(payment.ocrAmount) : null,
              source: payment.ocrSource,
              confidence: payment.ocrConfidence,
            }
          : null
      );
      if (!payment.ocrScannedAt) scanMutation.mutate({ paymentId: payment.id });
    };
    const handleReject = () => {
      if (!selectedPayment) return;
      setRejectReason('');
      setShowRejectDialog(true);
    };

    const handleRejectConfirmed = () => {
      if (!selectedPayment || !rejectReason.trim()) return;
      rejectMutation.mutate({ paymentId: selectedPayment.id, reason: rejectReason.trim() });
    };
    const handleVerify = () => {
      if (!refNumber) return;
      setVerificationResult(null); // always clear stale result before a new check
      verifyMutation.mutate(refNumber);
    };
    const closeModal = () => {
      setSelectedPayment(null);
      setRefNumber('');
      setVerificationResult(null);
      setAcknowledgedDuplicate(false);
      setPaidAmount('');
      setScanResult(null);
      setScanError(null);
      setShowRejectDialog(false);
      setRejectReason('');
    };

    const handleForceExtend = (paymentId: string) => {
      setForceExtendConflict(null);
      forceExtendMutation.mutate({ paymentId, force: false });
    };

    const handleForceExtendConfirmed = () => {
      if (!confirmForceExtendPaymentId) return;
      forceExtendMutation.mutate({ paymentId: confirmForceExtendPaymentId, force: true });
    };

    const filteredPayments = payments?.filter(p => filter === 'ALL' || p.status === filter);
    const duplicateCount = payments?.filter(p => p.status === 'PENDING' && p.duplicateMatchType).length ?? 0;

    const isSubscriptionExpired = (payment: Payment) =>
      payment.courseType === 'SUBSCRIPTION' &&
      payment.status === 'APPROVED' &&
      payment.subscriptionExpiryDate != null &&
      isPast(new Date(payment.subscriptionExpiryDate));

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Payment Management</h1>
                <button
                  type="button"
                  onClick={() => rescanMutation.mutate()}
                  disabled={rescanMutation.isPending}
                  className="btn-secondary flex items-center justify-center"
                  title="Fingerprint receipts uploaded before duplicate detection was enabled"
                >
                  {rescanMutation.isPending
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <ScanSearch className="w-4 h-4 mr-2" />}
                  Scan old receipts
                </button>
            </div>

            {duplicateCount > 0 && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900">
                  <strong>{duplicateCount}</strong>{' '}
                  {duplicateCount === 1 ? 'payment has a receipt that matches' : 'payments have receipts that match'}{' '}
                  an earlier submission. Open each one to compare the two receipts side by side.
                </p>
              </div>
            )}

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
                                    <tr key={payment.id} className={`hover:bg-gray-50 transition-colors ${payment.duplicateMatchType ? 'bg-red-50' : isSubscriptionExpired(payment) ? 'bg-orange-50' : ''}`}>
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
                                              <DuplicateChip payment={payment} />
                                            </div>
                                            {payment.status === 'REJECTED' && payment.rejectionReason && (
                                              <p className="mt-1 text-xs text-red-700 whitespace-pre-line">
                                                <span className="font-medium">Rejected:</span> {payment.rejectionReason}
                                              </p>
                                            )}
                                        </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(payment.createdAt), 'PP')}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap"><StatusBadge status={payment.status} /></td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                                            {payment.status === 'PENDING' && (
                        <button type="button" onClick={() => openReview(payment)} className="btn-secondary flex items-center"><Eye className="w-4 h-4 mr-2" /> Review</button>
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
                 {/* Without this the table just renders empty when the request
                     fails, which is indistinguishable from "no payments yet". */}
                 {isError && (
                    <div className="py-10 px-6 text-center">
                        <p className="text-sm font-medium text-red-700">Could not load payments.</p>
                        <p className="mt-1 text-sm text-gray-500">
                            The receipts are still safe in the database — only this list failed to load.
                        </p>
                        <p className="mt-2 text-xs text-gray-400 break-words">
                            {(error as AxiosError<{ error?: string }>)?.response?.data?.error
                                ?? (error as Error)?.message
                                ?? 'Unknown error'}
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={isRefetching}
                            className="btn-secondary mt-4 inline-flex items-center"
                        >
                            {isRefetching
                                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                : <RefreshCw className="w-4 h-4 mr-2" />}
                            Try again
                        </button>
                    </div>
                )}
                 {!isLoading && !isError && filteredPayments?.length === 0 && (
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
                           <ReceiptPreview
                             url={selectedPayment.receiptUrl}
                             label="Payment Receipt"
                             heightClass={selectedPayment.duplicateReceiptUrl ? 'h-64' : 'h-72 md:h-96'}
                           />

                           {selectedPayment.duplicateReceiptUrl && (
                             <div className="pt-4">
                               <h3 className="text-lg font-medium text-red-800 flex items-center gap-2">
                                 <Copy className="w-4 h-4" />
                                 Earlier matching receipt
                               </h3>
                               <p className="text-xs text-gray-500 mb-2">
                                 Submitted {format(new Date(selectedPayment.duplicateCreatedAt!), 'PP')} by{' '}
                                 {selectedPayment.duplicateStudentName ?? 'unknown student'}
                               </p>
                               <ReceiptPreview
                                 url={selectedPayment.duplicateReceiptUrl}
                                 label="Earlier matching receipt"
                                 heightClass="h-64"
                               />
                             </div>
                           )}
                        </div>
                        <div className="space-y-6 flex flex-col">
                            {selectedPayment.duplicateMatchType && (
                              <div className="p-4 rounded-lg border bg-red-50 border-red-200">
                                <div className="flex items-start gap-3">
                                  <ShieldAlert className="w-6 h-6 flex-shrink-0 text-red-600" />
                                  <div className="text-sm">
                                    <p className="font-bold text-base text-red-900">
                                      This is the exact same receipt file as an earlier upload
                                    </p>
                                    <div className="mt-2 text-xs p-2 rounded space-y-1 bg-red-100 text-red-900">
                                      <p><strong>Originally by:</strong> {selectedPayment.duplicateStudentName ?? 'Unknown'}</p>
                                      <p><strong>Email:</strong> {selectedPayment.duplicateStudentEmail ?? 'N/A'}</p>
                                      <p><strong>Course:</strong> {selectedPayment.duplicateCourseTitle ?? 'N/A'}</p>
                                      <p><strong>Submitted:</strong> {selectedPayment.duplicateCreatedAt ? format(new Date(selectedPayment.duplicateCreatedAt), 'PPpp') : 'N/A'}</p>
                                      <p><strong>That payment:</strong> {selectedPayment.duplicateStatus ?? 'N/A'}</p>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-600">
                                      Compare both receipts on the left before deciding.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
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
                            <div className="flex-grow space-y-4">
                                {/* Receipt read status — the values below are pre-filled from it */}
                                <div className="flex items-center gap-2 text-xs">
                                  {scanMutation.isPending ? (
                                    <span className="inline-flex items-center gap-1.5 text-blue-700">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Reading the receipt…
                                    </span>
                                  ) : scanError ? (
                                    <span className="text-amber-700">{scanError}</span>
                                  ) : scanResult ? (
                                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                                      <ScanSearch className="w-3.5 h-3.5" />
                                      {scanResult.source === 'PDF_TEXT'
                                        ? 'Read from PDF text (exact)'
                                        : `Read by OCR${scanResult.confidence != null ? ` · ${scanResult.confidence}% confidence` : ''}`}
                                      {' — always check against the receipt.'}
                                    </span>
                                  ) : null}
                                  {selectedPayment.receiptUrl && !scanMutation.isPending && (
                                    <button
                                      type="button"
                                      onClick={() => scanMutation.mutate({ paymentId: selectedPayment.id, force: true })}
                                      className="text-blue-600 hover:underline ml-auto"
                                    >
                                      Re-read
                                    </button>
                                  )}
                                </div>

                                <div>
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

                                <div>
                                  <label htmlFor="paidAmount" className="block text-sm font-medium text-gray-700">
                                    Amount Paid (LKR)
                                  </label>
                                  <input
                                    id="paidAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Amount shown on the receipt"
                                  />
                                  <p className="mt-1 text-xs text-gray-500">
                                    Course price: <strong>LKR {expectedAmount.toLocaleString()}</strong>
                                  </p>
                                  {amountMismatch && (
                                    <div className="mt-2 p-3 rounded-lg text-sm bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                                      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                                      <span>
                                        Receipt shows <strong>LKR {enteredAmount!.toLocaleString()}</strong> but the course
                                        costs <strong>LKR {expectedAmount.toLocaleString()}</strong> —
                                        a difference of <strong>LKR {Math.abs(enteredAmount! - expectedAmount).toLocaleString()}</strong>.
                                      </span>
                                    </div>
                                  )}
                                </div>
                            </div>

                            {needsAcknowledgement && (
                              <label className="flex items-start gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-sm font-medium text-red-900 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={acknowledgedDuplicate}
                                  onChange={(e) => setAcknowledgedDuplicate(e.target.checked)}
                                  className="mt-0.5 flex-shrink-0"
                                />
                                <span>
                                  I have checked{' '}
                                  {[
                                    duplicateFileFlag && 'the reused receipt file',
                                    duplicateRefFlag && 'the duplicate reference number',
                                    amountMismatch && 'the amount difference',
                                  ]
                                    .filter(Boolean)
                                    .join(', ')}{' '}
                                  and this payment is legitimate.
                                </span>
                              </label>
                            )}

                            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                                <button type="button" onClick={handleReject} disabled={rejectMutation.isPending} className="btn-danger w-full sm:w-auto">{rejectMutation.isPending ? 'Rejecting...' : 'Reject'}</button>
                                <button type="button" onClick={handleApprove} disabled={!refNumber || approveMutation.isPending || verifyMutation.isPending || !verificationResult || blockedByFlags} className="btn-primary w-full sm:w-auto">{approveMutation.isPending ? 'Approving...' : 'Approve Payment'}</button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Reject Payment Modal — a reason is required, the student sees it verbatim */}
            {selectedPayment && showRejectDialog && (
              <Modal isOpen={showRejectDialog} onClose={() => setShowRejectDialog(false)} title="Reject Payment" size="lg">
                <div className="space-y-5">
                  <p className="text-sm text-gray-600">
                    <strong>{selectedPayment.studentName}</strong> will see this reason on the course page
                    and in their rejection email, so write it for them.
                  </p>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Common reasons</p>
                    <div className="flex flex-col gap-2">
                      {REJECTION_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setRejectReason(preset)}
                          className={`text-left text-sm px-3 py-2 rounded-md border transition-colors ${
                            rejectReason === preset
                              ? 'border-red-400 bg-red-50 text-red-900'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700">
                      Reason <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      id="rejectReason"
                      rows={3}
                      maxLength={500}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm"
                      placeholder="Pick one above, or write your own explanation."
                    />
                    <p className="mt-1 text-xs text-gray-500">{rejectReason.length}/500 characters</p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button type="button" className="btn-secondary" onClick={() => setShowRejectDialog(false)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={handleRejectConfirmed}
                      disabled={!rejectReason.trim() || rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
                      Reject Payment
                    </button>
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
