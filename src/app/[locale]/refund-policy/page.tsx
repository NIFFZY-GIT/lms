import { Container } from '@/components/ui/Container';

export const metadata = {
  title: 'Refund Policy | Online Thakshilawa',
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-16 md:py-20">
        <article className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm md:p-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Refund Policy</h1>
          <p className="mt-4 text-slate-600">Last updated: March 12, 2026</p>

          <section className="mt-8 space-y-4 text-slate-700">
            <h2 className="text-xl font-bold text-slate-900">1. Eligibility</h2>
            <p>Refund requests are considered for accidental payments, duplicate payments, or technical access issues.</p>
            <h2 className="text-xl font-bold text-slate-900">2. Request Window</h2>
            <p>Requests should be submitted within 7 days of payment with proof of transaction.</p>
            <h2 className="text-xl font-bold text-slate-900">3. Processing Time</h2>
            <p>Approved refunds are processed within 7-14 business days depending on payment channel.</p>
            <h2 className="text-xl font-bold text-slate-900">4. Contact</h2>
            <p>Send refund inquiries to <a className="text-blue-600 hover:underline" href="mailto:info@thakshilawa.lk">info@thakshilawa.lk</a>.</p>
          </section>
        </article>
      </Container>
    </main>
  );
}
