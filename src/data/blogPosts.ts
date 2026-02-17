export const blogPosts = [
  {
    slug: 'skincare-myths-debunked',
    title: '10 Skincare Myths Debunked by Dermatologists',
    excerpt: 'We asked top dermatologists to clear up common misconceptions about skincare routines and products.',
    image:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
    category: 'Skincare',
    date: 'Jun 15, 2023',
    author: {
      name: 'Dr. Emma Reed',
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    },
  },
  {
    slug: 'clean-beauty-guide',
    title: 'The Ultimate Guide to Clean Beauty',
    excerpt: 'Everything you need to know about clean beauty products, ingredients to avoid, and trusted brands.',
    image:
      'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=1200&q=80',
    category: 'Clean Beauty',
    date: 'May 28, 2023',
    author: {
      name: 'Sophia Wang',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
  },
  {
    slug: 'summer-makeup-trends',
    title: 'Summer Makeup Trends You Need to Try',
    excerpt: 'From dewy skin to bold colors, these are the makeup trends taking over this summer season.',
    image:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    category: 'Makeup',
    date: 'May 12, 2023',
    author: {
      name: 'Ava Johnson',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
  },
] as const;

export type BlogPost = (typeof blogPosts)[number];

export const getBlogPostBySlug = (slug: string) => blogPosts.find((p) => p.slug === slug);

