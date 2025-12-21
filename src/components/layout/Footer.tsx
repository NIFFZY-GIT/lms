"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Facebook, Youtube, Mail, MapPin, Phone, ChevronRight, Sparkles } from 'lucide-react';

export function Footer() {
  const socialLinks = [
    { name: 'E-mail', href: 'mailto:info@thakshilawa.lk', icon: Mail, color: 'hover:bg-red-500 hover:border-red-500' },
    { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61581116852674', icon: Facebook, color: 'hover:bg-blue-600 hover:border-blue-600' },
    { name: 'YouTube', href: 'https://www.youtube.com/@OnlineThakshilawa', icon: Youtube, color: 'hover:bg-red-600 hover:border-red-600' },
  ];

  const quickLinks = [
    { name: 'Home', href: '/en' },
    { name: 'Courses', href: '/en/courses' },
    { name: 'Announcements', href: '/en/announcements' },
    { name: 'Past Papers', href: '/en/pastpapers' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '/en/privacy-policy' },
    { name: 'Terms of Service', href: '/en/terms-of-service' },
    { name: 'Refund Policy', href: '/en/refund-policy' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white overflow-hidden">
      {/* Animated Background Effects */}
      <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-600/20 to-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-20 right-0 w-80 h-80 bg-gradient-to-bl from-purple-600/15 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-40 bg-gradient-to-t from-blue-500/10 to-transparent blur-2xl" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Floating Particles - Fixed positions to avoid hydration mismatch */}
        {[
          { left: 5, top: 10, delay: 0, duration: 8 },
          { left: 15, top: 30, delay: 1.2, duration: 9 },
          { left: 25, top: 60, delay: 2.5, duration: 10 },
          { left: 35, top: 20, delay: 0.8, duration: 11 },
          { left: 45, top: 80, delay: 3.1, duration: 9 },
          { left: 55, top: 45, delay: 1.5, duration: 10 },
          { left: 65, top: 15, delay: 2.8, duration: 8 },
          { left: 75, top: 70, delay: 0.5, duration: 11 },
          { left: 85, top: 35, delay: 3.5, duration: 9 },
          { left: 95, top: 55, delay: 1.8, duration: 10 },
          { left: 10, top: 85, delay: 2.2, duration: 8 },
          { left: 30, top: 5, delay: 4.0, duration: 11 },
          { left: 50, top: 95, delay: 0.3, duration: 9 },
          { left: 70, top: 40, delay: 2.0, duration: 10 },
          { left: 90, top: 75, delay: 3.8, duration: 8 },
          { left: 20, top: 50, delay: 1.0, duration: 11 },
          { left: 40, top: 25, delay: 4.5, duration: 9 },
          { left: 60, top: 90, delay: 0.7, duration: 10 },
          { left: 80, top: 8, delay: 2.3, duration: 8 },
          { left: 12, top: 65, delay: 3.2, duration: 11 },
        ].map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <div className="relative z-10">
        {/* Newsletter Section */}

        <Container>
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-10 py-16 md:grid-cols-2 lg:grid-cols-12 lg:py-20">
            {/* Brand & Mission Column */}
            <div className="lg:col-span-4">
              <Link href="/en" className="inline-block mb-6 group">
                <Image 
                  src="/logo.png" 
                  alt="Online Thakshilawa Logo" 
                  width={180} 
                  height={50}
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
              <p className="text-slate-400 text-base leading-relaxed mb-6 max-w-sm">
                Empowering the next generation of builders, creators, and innovators through accessible, world-class education.
              </p>
              
              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className={`group flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white ${social.color} transition-all duration-300 hover:scale-110 hover:shadow-lg`}
                    aria-label={social.name}
                    target={social.href.startsWith('http') ? '_blank' : undefined}
                    rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-white mb-5 text-lg">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="group flex items-center text-slate-400 hover:text-white transition-colors duration-300"
                    >
                      <ChevronRight className="w-4 h-4 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-blue-400" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Column */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-white mb-5 text-lg">Legal</h3>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="group flex items-center text-slate-400 hover:text-white transition-colors duration-300"
                    >
                      <ChevronRight className="w-4 h-4 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-blue-400" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Column */}
            <div className="lg:col-span-4">
              <h3 className="font-bold text-white mb-5 text-lg">Contact Us</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-all duration-300">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      123 Education Street,<br />
                      Colombo 00700, Sri Lanka
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 group-hover:border-green-500/30 transition-all duration-300">
                    <Phone className="w-5 h-5 text-green-400" />
                  </div>
                  <a href="tel:+94112345678" className="text-slate-400 hover:text-white transition-colors text-sm">
                    +94 11 234 5678
                  </a>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 group-hover:border-red-500/30 transition-all duration-300">
                    <Mail className="w-5 h-5 text-red-400" />
                  </div>
                  <a href="mailto:info@thakshilawa.lk" className="text-slate-400 hover:text-white transition-colors text-sm">
                    info@thakshilawa.lk
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="relative py-6 border-t border-white/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} Online Thakshilawa. All rights reserved.
              </p>
              <p className="text-sm text-slate-500">
                Designed & Developed by{' '}
                <a 
                  href="https://zevarone.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-cyan-300 transition-all duration-300"
                >
                  ZEVARONE
                </a>
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* Floating Animation Keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
            opacity: 0.3;
          }
          75% {
            transform: translateY(-30px) translateX(5px);
            opacity: 0.4;
          }
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
      `}</style>
    </footer>
  );
}