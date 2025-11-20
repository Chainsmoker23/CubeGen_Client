import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getAdminBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, uploadBlogImage } from '../../services/geminiService';
import { BlogPost } from '../../types';
import Loader from '../Loader';

type View = 'list' | 'editor';

const BlogManagement: React.FC = () => {
    const { adminToken } = useAdminAuth();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<View>('list');
    const [currentPost, setCurrentPost] = useState<Partial<BlogPost> | null>(null);

    const fetchPosts = useCallback(async () => {
        if (!adminToken) return;
        setIsLoading(true);
        try {
            const fetchedPosts = await getAdminBlogPosts(adminToken);
            setPosts(fetchedPosts);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch posts.');
        } finally {
            setIsLoading(false);
        }
    }, [adminToken]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleNewPost = () => {
        setCurrentPost({
            title: '',
            content: '',
            author_name: 'CubeGen AI Team',
            is_published: false,
            meta_description: '',
            meta_keywords: '',
        });
        setView('editor');
    };

    const handleEditPost = (post: BlogPost) => {
        setCurrentPost(post);
        setView('editor');
    };

    const handleDeletePost = async (postId: string) => {
        if (window.confirm('Are you sure you want to delete this post? This cannot be undone.')) {
            if (!adminToken) return;
            try {
                await deleteBlogPost(postId, adminToken);
                await fetchPosts();
            } catch (err: any) {
                setError(err.message || 'Failed to delete post.');
            }
        }
    };
    
    const handleSavePost = async (postData: Partial<BlogPost>, imageFile: File | null) => {
        if (!adminToken) return;
        
        let feature_image_url = postData.feature_image_url;

        if (imageFile) {
            const { publicUrl } = await uploadBlogImage(imageFile, adminToken);
            feature_image_url = publicUrl;
        }

        const finalPostData = { ...postData, feature_image_url };

        if (finalPostData.id) {
            await updateBlogPost(finalPostData.id, finalPostData, adminToken);
        } else {
            await createBlogPost(finalPostData, adminToken);
        }
        await fetchPosts();
        setView('list');
        setCurrentPost(null);
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
            <AnimatePresence mode="wait">
                {view === 'list' ? (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Blog Management</h2>
                                <p className="text-gray-500 text-sm">Create, edit, and publish articles.</p>
                            </div>
                            <button onClick={handleNewPost} className="bg-pink-600 text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-pink-700 transition-colors">
                                New Post
                            </button>
                        </div>
                        {isLoading ? <div className="flex justify-center py-20"><Loader /></div> :
                         error ? <p className="text-red-500">{error}</p> :
                         <PostList posts={posts} onEdit={handleEditPost} onDelete={handleDeletePost} />}
                    </motion.div>
                ) : (
                    <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <PostEditor 
                            post={currentPost}
                            onSave={handleSavePost}
                            onCancel={() => { setView('list'); setCurrentPost(null); }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const PostList: React.FC<{ posts: BlogPost[], onEdit: (post: BlogPost) => void, onDelete: (id: string) => void }> = ({ posts, onEdit, onDelete }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Published Date</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {posts.map(post => (
                    <tr key={post.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{post.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {post.is_published ? 'Published' : 'Draft'}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => onEdit(post)} className="text-pink-600 hover:text-pink-900">Edit</button>
                            <button onClick={() => onDelete(post.id)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const PostEditor: React.FC<{ post: Partial<BlogPost> | null, onSave: (data: Partial<BlogPost>, image: File | null) => void, onCancel: () => void }> = ({ post, onSave, onCancel }) => {
    const [formData, setFormData] = useState(post || {});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(formData.feature_image_url || null);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData, imageFile);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-4">{formData.id ? 'Edit Post' : 'Create New Post'}</h2>
            <div className="space-y-6">
                <input name="title" value={formData.title || ''} onChange={handleChange} placeholder="Post Title" className="w-full text-2xl font-bold p-2 border-b focus:outline-none focus:border-pink-500" required />
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Feature Image</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
                    {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-auto rounded-lg object-cover" />}
                </div>
                <textarea name="content" value={formData.content || ''} onChange={handleChange} placeholder="Write your post content here (Markdown supported)..." rows={15} className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-pink-500" required />
                
                <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">SEO Settings</h3>
                    <div className="space-y-4">
                         <input name="meta_description" value={formData.meta_description || ''} onChange={handleChange} placeholder="Meta Description (for search results)" className="w-full p-2 border rounded-lg" required />
                         <input name="meta_keywords" value={formData.meta_keywords || ''} onChange={handleChange} placeholder="Meta Keywords (comma-separated)" className="w-full p-2 border rounded-lg" required />
                    </div>
                </div>

                <div className="flex items-center">
                    <input type="checkbox" id="is_published" name="is_published" checked={formData.is_published || false} onChange={e => setFormData({ ...formData, is_published: e.target.checked })} className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500" />
                    <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">Publish this post</label>
                </div>

            </div>
            <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-full hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-pink-600 text-white font-bold py-2 px-4 rounded-full hover:bg-pink-700 disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Post'}
                </button>
            </div>
        </form>
    );
};

export default BlogManagement;