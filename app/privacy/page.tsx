import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="container section-padding fade-in max-w-3xl">
      <nav className="mb-12">
        <Link href="/" className="text-secondary hover:text-white transition-colors">← Back to 100 Tools</Link>
      </nav>
      
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="space-y-6 text-slate-300 leading-relaxed">
        <p>
          Your privacy is important to us. Here is how we handle your data:
        </p>
        
        <h2 className="text-2xl font-bold text-white mt-8">1. No Personal Data Collection</h2>
        <p>
          We do not require an account to use our tools. We do not store your name, email, or any personal identification.
        </p>
        
        <h2 className="text-2xl font-bold text-white mt-8">2. Extraction Requests</h2>
        <p>
          When you use our tools to extract content, we may temporarily cache the extraction results to improve performance for other users. We do not store the original source URLs in a way that identifies you.
        </p>
        
        <h2 className="text-2xl font-bold text-white mt-8">3. Cookies</h2>
        <p>
          We use minimal cookies or local storage only for functional purposes (like remembering your preferences) or for basic analytics.
        </p>
      </div>
    </main>
  );
}
