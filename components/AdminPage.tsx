import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminConfig, updateAdminConfig } from '../services/geminiService';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import Logo from './Logo';
import Loader from './Loader';
import UserManagement from './admin/UserManagement';
import BlogManagement from './admin/BlogManagement';

type Page = 'app';
interface AdminPageProps {
    onNavigate: (page: Page) => void;
}

type AdminTab = 'config' | 'users' | 'blog';

const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
    const { logout } = useAdminAuth();
    const [activeTab, setActiveTab] = useState<AdminTab>('config');

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Logo className="h-8 w-8 text-[#D6336C]" />
                        <h1 className="text-xl font-bold">CubeGen AI - Admin Panel</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <button onClick={() => onNavigate('app')} className="font-semibold text-sm text-pink-600 hover:text-pink-800">
                            &larr; Back to App
                        </button>
                        <button onClick={logout} className="font-semibold text-sm text-gray-500 hover:text-gray-800">
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-6 py-8">
                 <div className="max-w-6xl mx-auto">
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <TabButton name="Configuration" isActive={activeTab === 'config'} onClick={() => setActiveTab('config')} />
                            <TabButton name="User Management" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                            <TabButton name="Blog Management" isActive={activeTab === 'blog'} onClick={() => setActiveTab('blog')} />
                        </nav>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'config' && <ConfigPanel />}
                            {activeTab === 'users' && <UserManagement />}
                            {activeTab === 'blog' && <BlogManagement />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

const TabButton: React.FC<{name: string, isActive: boolean, onClick: () => void}> = ({ name, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`${
            isActive
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
    >
        {name}
    </button>
);

const InputField: React.FC<{name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, isText?: boolean, placeholder?: string}> = ({ name, label, value, onChange, isText = false, placeholder }) => {
    const [isVisible, setIsVisible] = useState(isText);
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-600">{label}</label>
            <div className="mt-1 relative">
                <input id={name} name={name} type={isVisible ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} className="w-full p-3 pr-10 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition font-mono"/>
                {!isText && (
                     <button type="button" onClick={() => setIsVisible(!isVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600" aria-label={isVisible ? "Hide key" : "Show key"}>
                        {isVisible ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 6.957 15.425 5 12 5c-.913 0-1.794.19-2.62.533L7.743 3.812A9.957 9.957 0 0112 3c4.257 0 7.927 3.013 9.428 7.025a1 1 0 010 .95C20.302 15.488 16.892 18 12 18c-1.353 0-2.656-.32-3.84-.897L6.23 18.81A1 1 0 014.816 17.396l-1.109-1.11z M12 15c2.206 0 4-1.794 4-4a4.008 4.008 0 00-1.19-2.828l-5.63 5.63A3.987 3.987 0 0012 15z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.73 6.957 4.575 5 8 5s6.27 1.957 7.542 5c-1.272 3.043-4.117 5-7.542 5S1.73 13.043.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
};

const AiProviderConfigPanel: React.FC<{ config: string; onChange: (newConfig: string) => void; }> = ({ config, onChange }) => {
    const parsedConfig = useMemo(() => {
        try {
            const parsed = JSON.parse(config || '{}');
            // Keep the default structure for backend compatibility, even if not shown in UI
            const defaults = { activeProvider: 'gemini', providers: { gemini: {}, openai: {}, deepseek: {} } };
            if (!parsed.providers) parsed.providers = defaults.providers;
            Object.keys(defaults.providers).forEach(p => {
                if (!parsed.providers[p]) parsed.providers[p] = {};
            });
            // Force active provider to gemini on load
            parsed.activeProvider = 'gemini';
            return parsed;
        } catch (e) {
            return { activeProvider: 'gemini', providers: { gemini: {}, openai: {}, deepseek: {} } };
        }
    }, [config]);

    const handleProviderDetailChange = (provider: 'gemini', field: 'model', value: string) => {
        const newConfig = JSON.parse(JSON.stringify(parsedConfig)); // Deep copy
        newConfig.providers[provider][field] = value;
        newConfig.activeProvider = 'gemini'; // Ensure it stays gemini
        onChange(JSON.stringify(newConfig, null, 2));
    };
    
    const handleApiKeyPoolChange = (index: number, value: string) => {
        const newConfig = JSON.parse(JSON.stringify(parsedConfig));
        // Initialize pool if it doesn't exist on gemini object
        if (!newConfig.providers.gemini.apiKeyPool) {
            newConfig.providers.gemini.apiKeyPool = '';
        }
        const pool = newConfig.providers.gemini.apiKeyPool.split(',');
        while (pool.length < 50) {
            pool.push('');
        }
        pool[index] = value;
        newConfig.providers.gemini.apiKeyPool = pool.join(',');
        newConfig.activeProvider = 'gemini'; // Ensure it stays gemini
        onChange(JSON.stringify(newConfig, null, 2));
    };

    const geminiKeyPool = useMemo(() => {
        const pool = (parsedConfig.providers?.gemini?.apiKeyPool || '').split(',');
        return Array.from({ length: 50 }, (_, i) => pool[i] || '');
    }, [parsedConfig.providers?.gemini?.apiKeyPool]);

    return (
        <div className="space-y-8">
            <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-bold text-gray-700">Google Gemini Configuration</h4>
                <p className="text-xs text-gray-500 mt-1">This is the active AI provider for all generation tasks.</p>
                <div className="mt-4 space-y-4">
                    <h5 className="text-md font-semibold text-gray-600">API Key Pool</h5>
                    <p className="text-xs text-gray-500 -mt-2">The system will automatically rotate through these keys to handle high traffic and avoid rate limits. Add keys from top to bottom.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {geminiKeyPool.map((key, index) => (
                        <InputField 
                            key={`gemini-key-${index}`}
                            name={`gemini_apiKey_${index}`}
                            label={`API Key ${index + 1}`}
                            value={key}
                            onChange={(e) => handleApiKeyPoolChange(index, e.target.value)}
                        />
                    ))}
                    </div>
                        <InputField 
                        name="gemini_model"
                        label="Model Name"
                        value={parsedConfig.providers?.gemini?.model || ''}
                        onChange={(e) => handleProviderDetailChange('gemini', 'model', e.target.value)}
                        isText={true}
                    />
                </div>
            </div>
        </div>
    );
};

const ConfigPanel: React.FC = () => {
    const { adminToken } = useAdminAuth();
    const [config, setConfig] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            if (!adminToken) return;
            setIsLoading(true);
            try {
                const fetchedConfig = await getAdminConfig(adminToken);
                setConfig(fetchedConfig);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch config.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, [adminToken]);

    const handleValueChange = (key: string, value: string) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!adminToken) return;
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await updateAdminConfig(config, adminToken);
            setSuccess('Configuration updated successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update config.');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-2">Application Configuration</h2>
            <p className="text-gray-500 mb-6">Manage live configuration variables for the application. Changes take effect immediately.</p>
            
            {error && <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            {success && <div className="bg-green-100 border border-green-300 text-green-700 p-3 rounded-lg mb-4 text-sm">{success}</div>}

            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">AI Provider Settings</h3>
                    <AiProviderConfigPanel 
                        config={config.ai_provider_config || ''}
                        onChange={(value) => handleValueChange('ai_provider_config', value)}
                    />
                </div>
                 <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Payment & Site Settings</h3>
                    <div className="space-y-6 mt-4">
                        <InputField name="dodo_secret_key" label="Dodo Payments Secret Key" value={config.dodo_secret_key || ''} onChange={e => handleValueChange('dodo_secret_key', e.target.value)} />
                        <InputField name="dodo_webhook_secret" label="Dodo Payments Webhook Secret" value={config.dodo_webhook_secret || ''} onChange={e => handleValueChange('dodo_webhook_secret', e.target.value)} />
                        <InputField name="dodo_hobbyist_product_id" label="Dodo Hobbyist Product ID" value={config.dodo_hobbyist_product_id || ''} onChange={e => handleValueChange('dodo_hobbyist_product_id', e.target.value)} isText={true} />
                        <InputField name="dodo_pro_product_id" label="Dodo Pro Product ID" value={config.dodo_pro_product_id || ''} onChange={e => handleValueChange('dodo_pro_product_id', e.target.value)} isText={true} />
                        <InputField name="site_url" label="Site URL" value={config.site_url || ''} onChange={e => handleValueChange('site_url', e.target.value)} isText={true} />
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button onClick={handleSave} disabled={isSaving} className="bg-pink-600 text-white font-bold py-2 px-6 rounded-full shadow-md hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center">
                    {isSaving && <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    );
};

export default AdminPage;