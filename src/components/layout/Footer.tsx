import { Container } from '@/components/ui/Container';

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <Container>
        <div className="py-8 text-center">
          <p>© {new Date().getFullYear()} ZEVARONE. All Rights Reserved.</p>
          <div className="mt-4 space-x-6">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}