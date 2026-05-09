import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="container section-padding fade-in max-w-3xl">
      <nav className="mb-12">
        <Link href="/" className="text-secondary hover:text-white transition-colors">← Back to 100 Tools</Link>
      </nav>
      
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      
      <div className="space-y-6 text-slate-300 leading-relaxed">
        <p>
          Welcome to 100 Tools. By using our services, you agree to these terms.
        </p>
        
        <h2 className="text-2xl font-bold text-white mt-8">1. Fair Use</h2>
        <p>
          Our tools (like BeDownloader) are designed to help you access publicly available assets for personal, educational, or archival use. You are responsible for respecting the intellectual property rights of the original creators.
        </p>
        
        <h2 className="text-2xl font-bold text-white mt-8">2. Disclaimer</h2>
        <p>
          The services are provided "as is" without any warranties. We are not responsible for any misuse of the data extracted through our tools.
        </p>
        
        <h2 className="text-2xl font-bold text-white mt-8">3. Not Affiliated</h2>
        <p>
          We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with Behance, Adobe, Dribbble, or any other platform we might support.
        </p>
      </div>
    </main>
  );
}
