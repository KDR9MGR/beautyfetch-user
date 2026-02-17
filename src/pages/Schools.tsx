import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';

export default function Schools() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900">Find a Beauty School</h1>
            <p className="mt-2 text-gray-600">
              This page is a placeholder for the Beauty School directory. You can connect it to your database
              when you’re ready.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-beauty-purple hover:bg-beauty-purple/90">
                <Link to="/merchant-signup">Partner With Us</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

