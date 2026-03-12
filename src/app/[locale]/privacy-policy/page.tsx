import { Container } from '@/components/ui/Container';

export const metadata = {
  title: 'Privacy Policy | Online Thakshilawa',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-16 md:py-20">
        <article className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm md:p-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-slate-600">Last updated: March 12, 2026</p>

          <section className="mt-8 space-y-4 text-slate-700">
            <h2 className="text-xl font-bold text-slate-900">1. Information We Collect</h2>
            <p>We collect account information such as your name, email, and course activity to provide and improve learning services.</p>
            <h2 className="text-xl font-bold text-slate-900">2. How We Use Information</h2>
            <p>Information is used to manage your account, deliver courses, process enrollments, and send important updates.</p>
            <h2 className="text-xl font-bold text-slate-900">3. Data Sharing</h2>
            <p>We do not sell your personal data. We only share data with trusted providers required to operate the platform.</p>
            <h2 className="text-xl font-bold text-slate-900">4. Contact</h2>
            <p>For privacy requests, contact <a className="text-blue-600 hover:underline" href="mailto:info@thakshilawa.lk">info@thakshilawa.lk</a>.</p>
          </section>
        </article>
      </Container>
    </main>
  );
}
