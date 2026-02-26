import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, Tag } from 'lucide-react';
import { publicApi } from '../lib/api';
import { formatDate, truncateText } from '../lib/utils';

const BLOG_IMAGE = "https://images.pexels.com/photos/8470842/pexels-photo-8470842.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const placeholderPosts = [
  {
    id: '1',
    title: 'Understanding Soil Bearing Capacity in Nigerian Construction',
    excerpt: 'A comprehensive guide to soil investigation and foundation design for Nigerian terrain.',
    author: 'Engr. Segun Labiran',
    created_at: '2024-01-15',
    tags: ['Geotechnical', 'Foundation'],
    image_url: BLOG_IMAGE,
  },
  {
    id: '2',
    title: 'Sustainable Construction Practices for Modern Nigeria',
    excerpt: 'How civil engineers can contribute to environmentally responsible building practices.',
    author: 'Engr. Adebayo Ogundimu',
    created_at: '2024-01-10',
    tags: ['Sustainability', 'Best Practices'],
    image_url: BLOG_IMAGE,
  },
  {
    id: '3',
    title: 'The Future of Structural Engineering in West Africa',
    excerpt: 'Emerging trends and technologies shaping the future of civil engineering in the region.',
    author: 'Engr. Funke Adesanya',
    created_at: '2024-01-05',
    tags: ['Industry Trends', 'Technology'],
    image_url: BLOG_IMAGE,
  },
];

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.getBlogPosts()
      .then(res => setPosts(res.data.length > 0 ? res.data : placeholderPosts))
      .catch(() => setPosts(placeholderPosts))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="blog-page">
      {/* Hero */}
      <section className="py-24 md:py-32 bg-slate-50 grid-texture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Insights</p>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-slate-900 mb-6">
              Blog & News
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Stay updated with the latest insights, industry news, and engineering knowledge 
              from our team of experts.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[16/10] bg-slate-200 mb-4"></div>
                  <div className="h-4 bg-slate-200 w-1/4 mb-2"></div>
                  <div className="h-6 bg-slate-200 mb-2"></div>
                  <div className="h-4 bg-slate-200 w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="blog-card group"
                  data-testid={`blog-card-${post.id}`}
                >
                  <Link to={`/blog/${post.id}`}>
                    <div className="aspect-[16/10] overflow-hidden bg-slate-100 mb-4">
                      <img 
                        src={post.image_url || BLOG_IMAGE}
                        alt={post.title}
                        className="w-full h-full object-cover img-grayscale group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {truncateText(post.excerpt, 120)}
                    </p>
                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag, i) => (
                          <span 
                            key={i}
                            className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </motion.article>
              ))}
            </div>
          )}

          {posts.length === 0 && !loading && (
            <div className="text-center py-16">
              <p className="text-slate-500">No blog posts available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24 md:py-32 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Stay Informed
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Get the latest engineering insights and industry updates delivered to your inbox.
          </p>
          <Link to="/contact">
            <button className="bg-white hover:bg-slate-100 text-slate-900 rounded-sm font-semibold tracking-wide uppercase text-sm px-8 py-4 inline-flex items-center transition-colors">
              Subscribe to Updates
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
