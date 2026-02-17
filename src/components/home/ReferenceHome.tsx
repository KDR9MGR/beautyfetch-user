import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HomeSearchBar } from '@/components/home/HomeSearchBar';
import { HomeCtaCard } from '@/components/home/HomeCtaCard';
import { Briefcase, CalendarDays, GraduationCap, Truck, Users } from 'lucide-react';

export function ReferenceHome() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5eff8] via-[#f8f4fb] to-white">
      <div className="mx-auto w-full max-w-[740px] px-4 pb-10 pt-10 sm:px-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center">
            <span className="text-2xl font-semibold tracking-wide text-gray-900">
              Beauty <span className="font-extrabold">FETCH</span>
            </span>
          </Link>
        </div>

        <div className="mt-6">
          <HomeSearchBar />
        </div>

        <div className="mt-4 space-y-4">
          <HomeCtaCard
            title="Book an Appointment\nor Find a Stylist"
            description="Browse top-rated salons and book appointments with ease."
            imageUrl="https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=80"
            imageAlt="Salon appointment"
            imageSide="left"
            primaryCta={{ label: 'Get Started', to: '/appointments', icon: CalendarDays, variant: 'primary' }}
            secondaryCta={{ label: 'Learn More', to: '/appointments' }}
          />

          <HomeCtaCard
            title="Find a Beauty School"
            description="Start your beauty career at a top-rated school."
            imageUrl="https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=1200&q=80"
            imageAlt="Beauty school"
            imageSide="right"
            primaryCta={{ label: 'Explore Schools', to: '/schools', icon: GraduationCap, variant: 'secondary' }}
          />

          <HomeCtaCard
            title="Become a Driver"
            description="Earn money delivering beauty products and supplies."
            imageUrl="https://images.unsplash.com/photo-1520975958225-4e0a71cc7f6b?auto=format&fit=crop&w=1200&q=80"
            imageAlt="Driver"
            imageSide="left"
            primaryCta={{ label: 'Apply Now', to: '/driver-signup', icon: Truck, variant: 'secondary' }}
          />

          <HomeCtaCard
            title="Become a Merchant"
            description="Join our platform and expand your beauty business."
            imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
            imageAlt="Merchant"
            imageSide="right"
            primaryCta={{ label: 'Get Started', to: '/merchant-signup', icon: Briefcase, variant: 'secondary' }}
          />

          <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Visit Our Blog</h3>
                <p className="mt-1 text-sm text-gray-600">Read beauty tips, trends, and business advice.</p>
              </div>
              <Button
                asChild
                className="h-9 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-200"
              >
                <Link to="/blog" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Read Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

