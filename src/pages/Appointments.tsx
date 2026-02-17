import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';

export default function Appointments() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
            <p className="mt-2 text-gray-600">
              This section is ready for your salon/stylist marketplace UX. For now, use Explore and Stores to
              browse partners.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-beauty-purple hover:bg-beauty-purple/90">
                <Link to="/stores">Browse Stores</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/explore">Explore Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

