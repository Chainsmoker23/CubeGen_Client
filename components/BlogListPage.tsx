import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SharedFooter from './SharedFooter';
import Loader from './Loader';
import { getPublishedBlogPosts } from '../services/geminiService';
import { BlogPost } from '../types';

type Page = 'contact' | 'about' | 'api' | 'privacy' | 'terms' | 'docs' | 'apiKey' | 'careers' | 'research' | 'sdk' | 'blog';

interface BlogListPageProps {
  onBack: () => void;
  onNavigate: (page: Page | string) => void;
}

// MODULE-LEVEL CACHE - persists across component mount/unmount cycles
let cachedBlogPosts: BlogPost[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 300000; // 5 minutes

const PostCard: React.FC<{ post: BlogPost; onNavigate: (slug: string) => void }> = ({ post, onNavigate }) => {
  const excerpt = post.content.substring(0, 120) + '...';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(233, 30, 99, 0.15)' }}
      className="bg-white rounded-2xl shadow-md border border-pink-100 overflow-hidden flex flex-col cursor-pointer"
      onClick={() => onNavigate(`blog/${post.slug}`)}
    >
      <img src={post.feature_image_url} alt={post.title} className="w-full h-48 object-cover" />
      <div className="p-6 flex flex-col flex-grow">
        <h2 className="text-xl font-bold mb-2 text-gray-800">{post.title}</h2>
        <p className="text-sm text-gray-600 flex-grow">{excerpt}</p>
        <div className="mt-4 pt-4 border-t border-pink-100 text-xs text-gray-500 flex justify-between items-center">
          <span>By {post.author_name}</span>
          <span>{new Date(post.published_at!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    </motion.div>
  );
};

const BlogListPage: React.FC<BlogListPageProps> = ({ onBack, onNavigate }) => {
  // Initialize from cache immediately - no loading flash!
  const [posts, setPosts] = useState<BlogPost[]>(cachedBlogPosts || []);
  const [isLoading, setIsLoading] = useState(cachedBlogPosts === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const now = Date.now();

      // Use cache if valid - don't fetch
      if (cachedBlogPosts !== null && (now - cacheTimestamp < CACHE_DURATION)) {
        setPosts(cachedBlogPosts);
        setIsLoading(false);
        return;
      }

      // First time only - show loading
      if (cachedBlogPosts === null) {
        setIsLoading(true);
      }

      try {
        const fetchedPosts = await getPublishedBlogPosts();

        // Update module-level cache
        cachedBlogPosts = fetchedPosts;
        cacheTimestamp = now;

        setPosts(fetchedPosts);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load blog posts.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="bg-white text-[#2B2B2B] overflow-x-hidden">
      <header className="absolute top-0 left-0 w-full p-6 z-20">
        <button onClick={onBack} className="flex items-center gap-2 font-semibold text-[#555555] hover:text-[#2B2B2B] transition-colors pulse-subtle">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Back to Home
        </button>
      </header>

      <main>
        <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-[#FFF0F5] py-20 pt-32 md:pt-40">
          <div className="container mx-auto px-6 z-10 text-center">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                The CubeGen <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E91E63] to-[#F06292]">Blog</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-[#555555]">
                Insights on AI, system design, and the future of software architecture from our team.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-6xl">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader /></div>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : posts.length === 0 ? (
              <p className="text-center text-gray-500">No blog posts have been published yet. Check back soon!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} onNavigate={onNavigate} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SharedFooter onNavigate={onNavigate} activePage="blog" />
    </div>
  );
};

export default BlogListPage;
