import { Link, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { getBlogPostBySlug } from '@/data/blogPosts';

export default function BlogPost() {
  const { slug } = useParams();
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Post not found</h1>
            <p className="mt-2 text-gray-600">The blog post you requested does not exist.</p>
            <div className="mt-6">
              <Button asChild>
                <Link to="/blog">Back to Blog</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6">
              <Link to="/blog" className="text-sm font-medium text-beauty-purple hover:text-beauty-purple/80">
                ← Back to Blog
              </Link>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="rounded-full bg-purple-50 px-2 py-1 font-semibold text-beauty-purple">
                {post.category}
              </span>
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.author.name}</span>
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900">{post.title}</h1>
            <p className="mt-3 text-gray-600">{post.excerpt}</p>

            <div className="mt-8 overflow-hidden rounded-2xl bg-gray-100">
              <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
            </div>

            <div className="prose prose-gray mt-8 max-w-none">
              <p>
                This is a preview article. You can connect your blog_posts table and render real content here
                when you’re ready.
              </p>
              <p>
                In the meantime, this page ensures your home page “Visit Our Blog” flow works end-to-end and
                matches the new UX.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

