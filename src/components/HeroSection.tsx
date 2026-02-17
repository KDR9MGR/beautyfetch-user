
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles, Star, Truck } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-beauty-gradient">
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="max-w-xl animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm text-white">
              <Sparkles className="h-4 w-4" />
              Curated beauty, delivered fast
            </div>
            <h1 className="mt-4 text-4xl md:text-6xl font-bold text-white leading-tight">
              Glow up your routine with top local beauty stores
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/90">
              Shop trusted brands, discover new favorites, and enjoy same-day delivery from stores near you.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" className="bg-white text-beauty-purple hover:bg-white/90">
                <Link to="/explore">Shop Now</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                <Link to="/stores">Browse Stores</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Truck className="h-4 w-4" />
                  Same-day delivery
                </div>
                <p className="text-xs text-white/80 mt-1">Get orders in 30–60 minutes</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  Verified stores
                </div>
                <p className="text-xs text-white/80 mt-1">Quality you can trust</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-white backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Star className="h-4 w-4" />
                  4.9 average rating
                </div>
                <p className="text-xs text-white/80 mt-1">Loved by local shoppers</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl bg-white/20 p-3 shadow-2xl backdrop-blur">
              <img
                src="/placeholder.svg"
                alt="Beauty products showcase"
                className="aspect-[4/5] w-full rounded-2xl object-cover"
              />
              <div className="absolute bottom-6 left-6 rounded-2xl bg-white px-4 py-3 shadow-lg">
                <div className="text-sm font-semibold text-gray-900">BeautyFetch Picks</div>
                <div className="text-xs text-gray-500">Trending bundles this week</div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 hidden rounded-2xl bg-white px-4 py-3 shadow-xl md:block">
              <div className="text-sm font-semibold text-gray-900">Free delivery</div>
              <div className="text-xs text-gray-500">On orders over $50</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
