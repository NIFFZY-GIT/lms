import { Container } from '@/components/ui/Container';
import type { LucideIcon } from 'lucide-react';

/**
 * Dark header band shared by the public content pages (courses, past papers,
 * announcements). It reuses the landing hero's gradient, grid texture and
 * colour blooms so every page opens the same way.
 */
export function PageHero({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[url('/patterns/grid.svg')] bg-center opacity-25 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"
      />
      <div aria-hidden className="landing-orb left-1/2 top-[-60%] h-80 w-[45rem] -translate-x-1/2 bg-blue-500/30" />
      <div aria-hidden className="landing-orb bottom-[-60%] right-[-5%] h-72 w-72 bg-cyan-400/20" />

      <Container className="relative py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-sky-200 backdrop-blur-md">
            {EyebrowIcon && <EyebrowIcon className="h-3.5 w-3.5 text-amber-300" />}
            {eyebrow}
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white text-balance sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300 text-pretty sm:text-lg">{subtitle}</p>
        </div>
        {children}
      </Container>
    </section>
  );
}
