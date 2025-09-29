"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Twitter, Linkedin, Facebook, Youtube, MailIcon } from 'lucide-react';

export function Footer() {
  const socialLinks = [
    { name: 'E-mail', href: 'mailto:info@thakshilawa.lk', icon: MailIcon },
    { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61581116852674', icon: Facebook },
    { name: 'YouTube', href: 'https://www.youtube.com/@OnlineThakshilawa', icon: Youtube },
  ];

  return (
      <footer className="relative bg-slate-900 text-white mt-24 overflow-hidden rounded-t-[3rem] md:rounded-t-[4rem]">
      {/* Subtle Aurora Glow Effect */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0"
      >
        <div className="absolute top-0 left-1/2 w-[150%] h-[400px] -translate-x-1/2 bg-gradient-radial from-blue-600/30 via-sky-500/10 to-transparent blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10">
        <Container>
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-12 lg:py-24">
            {/* Brand & Mission Column */}
            <div className="md:col-span-12 lg:col-span-5">
              <Link href="/en" className="inline-block mb-6">
                <Image src="/logo.png" alt="Online Thakshilawa Logo" width={160} height={45} />
              </Link>
              <p className="text-slate-300 text-base leading-relaxed max-w-md">
                Empowering the next generation of builders, creators, and innovators through accessible, world-class education.
              </p>
            </div>

            {/* Navigation Column */}
            <div className="md:col-span-4 lg:col-span-2">
              <h3 className="font-semibold text-slate-100 mb-4 tracking-wide">Navigate</h3>
              <ul className="space-y-3">
                <li><Link href="/en" className="text-slate-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/en/courses" className="text-slate-400 hover:text-white transition-colors">Courses</Link></li>
                <li><Link href="/en/announcements" className="text-slate-400 hover:text-white transition-colors">Announcements</Link></li>
                <li><Link href="/en/faq" className="text-slate-400 hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="md:col-span-4 lg:col-span-2">
              <h3 className="font-semibold text-slate-100 mb-4 tracking-wide">Legal</h3>
              <ul className="space-y-3">
                <li><Link href="/en/privacy-policy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/en/terms-of-service" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Social Column */}
            <div className="md:col-span-4 lg:col-span-3">
              <h3 className="font-semibold text-slate-100 mb-4 tracking-wide">Connect</h3>
              <div className="flex items-center space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="group flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60 border border-slate-700 text-slate-400 hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all duration-300"
                    aria-label={social.name}
                    target={social.href.startsWith('http') ? '_blank' : undefined}
                    rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <social.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-slate-800">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Online Thakshilawa. All rights reserved.
            </p>
            <p className="text-sm text-slate-500">
              Designed & Developed by{' '}
              <a href="https://zevarone.com" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-white font-medium underline underline-offset-4 transition-colors">
                zevarone.com
              </a>
            </p>
          </div>
        </Container>
      </div>
       {/* Keyframes for the aurora animation */}
       <style jsx>{`
        @keyframes aurora {
          0% {
            transform: translateX(-50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateX(-40%) scale(1.3);
            opacity: 0.2;
          }
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.3;
          }
        }
        .animate-aurora {
          animation: aurora 12s ease-in-out infinite;
        }
      `}</style>
    </footer>
  );
}