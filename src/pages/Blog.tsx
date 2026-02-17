import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { blogPosts } from '@/data/blogPosts';

export default function Blog() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Beauty Blog</h1>
            <p className="mt-2 text-gray-600">Tips, trends, and business advice from the BeautyFetch community.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {blogPosts.map((post) => (
              <article key={post.slug} className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
                <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                  <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-purple-50 px-2 py-1 font-semibold text-beauty-purple">
                      {post.category}
                    </span>
                    <span>{post.date}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-gray-900">{post.title}</h2>
                  <p className="mt-2 text-sm text-gray-600">{post.excerpt}</p>
                  <div className="mt-4">
                    <Button asChild variant="outline">
                      <Link to={`/blog/${post.slug}`}>Read More</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

