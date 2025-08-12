import { Container } from '@/components/ui/Container';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="h-0.5 gradient-brand" />
      <Container>
        <div className="py-10 flex flex-col items-center gap-4">
          <p className="text-sm">© {new Date().getFullYear()} ZEVARONE. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" aria-label="Facebook" className="hover:text-white"><Facebook className="w-5 h-5" /></a>
            <a href="#" aria-label="Twitter" className="hover:text-white"><Twitter className="w-5 h-5" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-white"><Instagram className="w-5 h-5" /></a>
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}