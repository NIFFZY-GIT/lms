import { Container } from '@/components/ui/Container';

export const metadata = {
  title: 'Terms of Service | Online Thakshilawa',
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-16 md:py-20">
        <article className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm md:p-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Terms of Service</h1>
          <p className="mt-4 text-slate-600">Last updated: March 12, 2026</p>

          <section className="mt-8 space-y-4 text-slate-700">
            <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>By accessing this platform, you agree to comply with these terms and applicable laws.</p>
            <h2 className="text-xl font-bold text-slate-900">2. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and activity.</p>
            <h2 className="text-xl font-bold text-slate-900">3. Course Access</h2>
            <p>Course access is granted for enrolled users and may be suspended in case of abuse or policy violations.</p>
            <h2 className="text-xl font-bold text-slate-900">4. Contact</h2>
            <p>Questions regarding terms can be sent to <a className="text-blue-600 hover:underline" href="mailto:info@thakshilawa.lk">info@thakshilawa.lk</a>.</p>
          </section>
        </article>
      </Container>
    </main>
  );
}
