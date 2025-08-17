import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Facebook, Instagram, Twitter } from "lucide-react";

const BRAND = {
  name: "Online Thakshilawa",
  href: "https://onlinethakshilawa.lk/",
};

const DEVELOPER = {
  name: "ZEVARONE (Pvt) Ltd.",
  href: "https://www.zevarone.com",
};

const SOCIAL = [
  { name: "Facebook", href: "#", Icon: Facebook },
  { name: "X (Twitter)", href: "#", Icon: Twitter },
  { name: "Instagram", href: "#", Icon: Instagram },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="relative mt-auto border-t border-white/10 bg-gray-950 text-gray-300"
    >
      {/* Fancy top hairline (fallback if you don’t have `gradient-brand`) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-emerald-400/0 via-emerald-400/60 to-emerald-400/0"
      />
      {/* If you already have .gradient-brand, you can also keep this: */}
      {/* <div className="h-0.5 gradient-brand" /> */}

      {/* Soft radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_60rem_at_50%_-10%,rgba(16,185,129,0.08),transparent_60%)]"
      />

      <Container>
        <div className="py-10 md:py-12 grid gap-8 md:grid-cols-3 md:items-center">
          {/* Brand / Copyright */}
          <div className="text-center md:text-left space-y-2">
            <Link
              href={BRAND.href}
              className="inline-block text-base font-semibold tracking-tight hover:text-white transition-colors"
            >
              {BRAND.name}
            </Link>
            <p className="text-sm text-gray-400">
              © {year} <a href={BRAND.href} className="underline-offset-4 hover:underline">{BRAND.name}</a>. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <nav
            aria-label="Footer"
            className="justify-center md:justify-center flex"
          >
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 rounded-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li className="text-gray-600">•</li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 rounded-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li className="text-gray-600 hidden sm:list-item">•</li>
              <li className="hidden sm:list-item">
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 rounded-sm"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          {/* Socials */}
          <div className="flex justify-center md:justify-end">
            <ul className="flex items-center gap-4">
              {SOCIAL.map(({ name, href, Icon }) => (
                <li key={name}>
                  <a
                    href={href}
                    aria-label={name}
                    className="group inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm transition
                               hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/20
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
                  >
                    <Icon className="h-5 w-5 transition group-hover:scale-110" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Developer credit */}
        <div className="border-t border-white/10 pt-6 pb-10">
          <p className="text-center text-xs text-gray-500">
            Developed by {" "}
            <a
              href={DEVELOPER.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-white transition-colors"
            >
              {DEVELOPER.name}
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
