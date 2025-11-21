import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SharedFooter from './SharedFooter';
import Loader from './Loader';
import { getBlogPostBySlug } from '../services/geminiService';
import { BlogPost } from '../types';

type Page = 'contact' | 'about' | 'api' | 'privacy' | 'terms' | 'docs' | 'apiKey' | 'careers' | 'research' | 'sdk' | 'blog';

interface BlogPostPageProps {
  slug: string;
  onBack: () => void;
  onNavigate: (page: Page | string) => void;
}

const updateMetaTags = (post: BlogPost) => {
    document.title = `${post.title} — CubeGen AI Blog`;

    const selectors: { selector: string, attribute: string, value: string }[] = [
        { selector: 'meta[name="description"]', attribute: 'content', value: post.meta_description },
        { selector: 'meta[name="keywords"]', attribute: 'content', value: post.meta_keywords },
        { selector: 'link[rel="canonical"]', attribute: 'href', value: `https://cubegenai.com/#blog/${post.slug}` },
        { selector: 'meta[property="og:title"]', attribute: 'content', value: post.title },
        { selector: 'meta[property="og:description"]', attribute: 'content', value: post.meta_description },
        { selector: 'meta[property="og:url"]', attribute: 'content', value: `https://cubegenai.com/#blog/${post.slug}` },
        { selector: 'meta[property="og:image"]', attribute: 'content', value: post.feature_image_url },
        { selector: 'meta[property="og:type"]', attribute: 'content', value: 'article' },
        { selector: 'meta[property="twitter:title"]', attribute: 'content', value: post.title },
        { selector: 'meta[property="twitter:description"]', attribute: 'content', value: post.meta_description },
        { selector: 'meta[property="twitter:image"]', attribute: 'content', value: post.feature_image_url },
    ];

    selectors.forEach(({ selector, attribute, value }) => {
        const element = document.querySelector(selector);
        if (element) {
            element.setAttribute(attribute, value);
        }
    });

    // Update JSON-LD structured data
    const script = document.querySelector('script[type="application/ld+json"]');
    if (script) {
        script.innerHTML = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "image": post.feature_image_url,
            "author": {
                "@type": "Organization",
                "name": "CubeGen AI"
            },
            "publisher": {
                "@type": "Organization",
                "name": "CubeGen AI",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://cubegenai.com/logo.svg" // Replace with actual logo URL
                }
            },
            "datePublished": post.published_at,
            "description": post.meta_description
        });
    }
};

const renderMarkdown = (text: string) => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-xl lg:text-2xl font-bold text-gray-800 mt-8 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl lg:text-3xl font-bold text-gray-900 mt-10 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-12 mb-6">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-6 my-2">$1</li>')
      .replace(/^\* (.*$)/gim, '<ul class="list-disc list-inside space-y-2 my-4">$1</ul>')
      .replace(/`([^`]+)`/g, '<code class="bg-pink-100 text-pink-800 font-mono text-sm py-0.5 px-1.5 rounded">$1</code>')
      .replace(/\n/g, '<br />')
      .replace(/<br \/><ul>/g, '<ul>') // Fix spacing around lists
      .replace(/<\/ul><br \/>/g, '</ul>');
};

const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug, onBack, onNavigate }) => {
    const [post, setPost] = useState<BlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedPost = await getBlogPostBySlug(slug);
                setPost(fetchedPost);
                updateMetaTags(fetchedPost);
            } catch (err: any) {
                setError(err.message || 'Failed to load this blog post.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPost();
    }, [slug]);

    return (
        <div className="bg-white text-[#2B2B2B] overflow-x-hidden">
            <header className="absolute top-0 left-0 w-full p-6 z-20">
                <button onClick={onBack} className="flex items-center gap-2 font-semibold text-[#555555] hover:text-[#2B2B2B] transition-colors pulse-subtle">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    All Posts
                </button>
            </header>

            <main>
                {isLoading ? (
                    <div className="min-h-screen flex items-center justify-center"><Loader /></div>
                ) : error ? (
                    <div className="min-h-screen flex items-center justify-center text-center text-red-500">{error}</div>
                ) : post && (
                    <article>
                        <header className="relative py-20 pt-32 md:pt-40 bg-gradient-to-b from-white to-[#FFF0F5]">
                            <div className="container mx-auto px-6 z-10 text-center">
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
                                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
                                        {post.title}
                                    </h1>
                                    <div className="mt-6 text-sm text-gray-500">
                                        <span>By {post.author_name}</span> &bull; <span>{new Date(post.published_at!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                </motion.div>
                            </div>
                        </header>
                        
                        <div className="py-12 bg-white">
                            <motion.img 
                                src={post.feature_image_url} 
                                alt={post.title} 
                                className="w-full max-w-5xl mx-auto rounded-2xl shadow-xl -mt-24 md:-mt-32 relative z-10"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            />
                            <div 
                                className="prose lg:prose-lg max-w-3xl mx-auto mt-12 px-6 text-gray-700"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
                            />
                        </div>
                    </article>
                )}
            </main>

            <SharedFooter onNavigate={onNavigate} />
        </div>
    );
};

export default BlogPostPage;