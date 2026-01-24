import React, { useState, useCallback, useEffect, Suspense } from 'react';
// Lazy Load Pages for Performance
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const ContactPage = React.lazy(() => import('./components/ContactPage'));
const AboutPage = React.lazy(() => import('./components/AboutPage'));
const ApiPricingPage = React.lazy(() => import('./components/ApiPricingPage'));
const AuthPage = React.lazy(() => import('./components/AuthPage'));
const ApiKeyPage = React.lazy(() => import('./components/ApiKeyPage'));
const PrivacyPage = React.lazy(() => import('./components/PrivacyPage'));
const TermsPage = React.lazy(() => import('./components/TermsPage'));
const DocsPage = React.lazy(() => import('./components/DocsPage'));
const NeuralNetworkPage = React.lazy(() => import('./components/NeuralNetworkPage'));
const CareersPage = React.lazy(() => import('./components/CareersPage'));
const ResearchPage = React.lazy(() => import('./components/ResearchPage'));
const GeneralArchitecturePage = React.lazy(() => import('./components/GeneralArchitecturePage'));
const AdminPage = React.lazy(() => import('./components/AdminPage'));
const AdminLoginPage = React.lazy(() => import('./components/AdminLoginPage'));
const PaymentStatusPage = React.lazy(() => import('./components/PaymentStatusPage'));
const SdkPage = React.lazy(() => import('./components/SdkPage'));
const BlogListPage = React.lazy(() => import('./components/BlogListPage'));
const BlogPostPage = React.lazy(() => import('./components/BlogPostPage'));
const PlaygroundPage = React.lazy(() => import('./components/PlaygroundPage'));

import Loader from './components/Loader';
import { useAuth } from './contexts/AuthContext';
import { useAdminAuth } from './contexts/AdminAuthContext';
import InstallPromptToast from './components/InstallPromptToast';
import { AnimatePresence } from 'framer-motion';

type Page = 'landing' | 'auth' | 'app' | 'contact' | 'about' | 'api' | 'apiKey' | 'privacy' | 'terms' | 'docs' | 'neuralNetwork' | 'careers' | 'research' | 'admin' | 'adminLogin' | 'sdk' | 'blog' | 'blogPost' | 'playground';

// Helper to parse route string into Page object
const parseRoute = (route: string): { page: Page; subpage?: string } => {
  if (!route || route === '/') return { page: 'landing' };

  // Remove leading slash or hash
  const cleanRoute = route.replace(/^[\/#]+/, '');
  const [mainPage, subpage] = cleanRoute.split('/');

  // Special handling for blog post pages like /blog/my-post-slug
  if (mainPage === 'blog' && subpage) {
    return { page: 'blogPost', subpage };
  }

  const validPages: Page[] = ['landing', 'auth', 'app', 'contact', 'about', 'api', 'apiKey', 'privacy', 'terms', 'docs', 'neuralNetwork', 'careers', 'research', 'admin', 'adminLogin', 'sdk', 'blog', 'playground'];
  if (validPages.includes(mainPage as Page)) {
    return { page: mainPage as Page };
  }
  return { page: 'landing' };
};

// Hybrid Router: Checks Hash first (legacy), then Path (SEO)
const getCurrentPageInfo = (): { page: Page; subpage?: string } => {
  // 1. Priority: Hash (Legacy support & Deep links)
  const hash = window.location.hash.split('?')[0];
  if (hash && hash.length > 1) {
    return parseRoute(hash);
  }

  // 2. Secondary: Pathname (SEO / Modern)
  const path = window.location.pathname;
  if (path && path !== '/') {
    return parseRoute(path);
  }

  return { page: 'landing' };
};

const App: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { isAdminAuthenticated, loading: adminAuthLoading } = useAdminAuth();

  // Initialize state based on current URL
  const [pageInfo, setPageInfo] = useState<{ page: Page; subpage?: string } | null>(null);

  // --- PWA Install Prompt State ---
  const [installPromptEvent, setInstallPromptEvent] = useState<Event | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = () => {
    if (!installPromptEvent) return;
    // @ts-ignore
    installPromptEvent.prompt();
    // @ts-ignore
    installPromptEvent.userChoice.then((choiceResult) => {
      setInstallPromptEvent(null);
      setShowInstallPrompt(false);
    });
  };

  const handleDismissInstall = () => setShowInstallPrompt(false);

  // --- Routing Logic ---
  const handleUrlChange = useCallback(() => {
    setPageInfo(getCurrentPageInfo());
  }, []);

  useEffect(() => {
    // Initial Load
    handleUrlChange();

    // Listen to Back/Forward navigation
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange); // Support hash changes too

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [handleUrlChange]);

  const onNavigate = useCallback((targetPage: Page | string) => {
    // Convert logic: if simple string, assume root page. If path, keep it.
    // We want clean URLs: /about

    const targetUrl = targetPage.toString().startsWith('/') ? targetPage : `/${targetPage}`;

    // Update History
    // If we are currently on hash, maybe we should clear hash? 
    // For now, simple pushState.
    window.history.pushState(null, '', targetUrl);

    // Manually trigger update since pushState doesn't fire popstate
    handleUrlChange();

    window.scrollTo(0, 0);
  }, [handleUrlChange]);

  useEffect(() => {
    if (authLoading || adminAuthLoading || !pageInfo) return;

    // --- Admin Route Handling ---
    if (pageInfo.page === 'admin' || pageInfo.page === 'adminLogin') {
      const targetPage = isAdminAuthenticated ? 'admin' : 'adminLogin';
      if (pageInfo.page !== targetPage) {
        onNavigate(targetPage);
      }
      return;
    }

    // --- Auth Redirects ---
    if (currentUser && pageInfo.page === 'auth') {
      onNavigate('app');
      return;
    }

    const isProtectedPage = ['app', 'neuralNetwork', 'apiKey', 'playground'].includes(pageInfo.page);
    if (!currentUser && isProtectedPage) {
      onNavigate('landing');
      return;
    }
  }, [authLoading, adminAuthLoading, currentUser, isAdminAuthenticated, onNavigate, pageInfo]);


  if (pageInfo === null || authLoading || adminAuthLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // --- Payment Verification ---
  const searchParams = new URLSearchParams(window.location.search);
  const paymentId = searchParams.get('payment_id');
  const paymentStatus = searchParams.get('status');
  // Check hash params too just in case
  const hashVal = window.location.hash.split('?')[1];
  const hashParams = new URLSearchParams(hashVal);
  const paymentSuccessInHash = hashParams.get('payment') === 'success';

  if ((paymentId && paymentStatus === 'succeeded') || paymentSuccessInHash) {
    return <PaymentStatusPage onNavigate={onNavigate} />;
  }

  // --- Page rendering logic ---
  const renderPage = () => {
    switch (pageInfo.page) {
      case 'landing': return <LandingPage onLaunch={() => onNavigate(currentUser ? 'app' : 'auth')} onNavigate={onNavigate} />;
      case 'auth': return <AuthPage onBack={() => onNavigate('landing')} />;
      case 'admin': return <AdminPage onNavigate={onNavigate} />;
      case 'adminLogin': return <AdminLoginPage onBack={() => onNavigate('landing')} />;
      case 'contact': return <ContactPage onBack={() => onNavigate('landing')} onNavigate={onNavigate} />;
      case 'about': return <AboutPage onBack={() => onNavigate('landing')} onLaunch={() => onNavigate(currentUser ? 'app' : 'auth')} onNavigate={onNavigate} />;
      case 'api': return <ApiPricingPage onBack={() => onNavigate('landing')} onNavigate={onNavigate} />;
      case 'apiKey': return <ApiKeyPage onBack={() => onNavigate('landing')} onLaunch={() => onNavigate(currentUser ? 'app' : 'auth')} onNavigate={onNavigate} />;
      case 'privacy': return <PrivacyPage onBack={() => onNavigate('landing')} onNavigate={onNavigate} />;
      case 'terms': return <TermsPage onBack={() => onNavigate('landing')} onNavigate={onNavigate} />;
      case 'docs': return <DocsPage onBack={() => onNavigate('landing')} onLaunch={() => onNavigate(currentUser ? 'app' : 'auth')} onNavigateToApi={() => onNavigate('api')} onNavigate={onNavigate} />;
      case 'neuralNetwork': return <NeuralNetworkPage onNavigate={onNavigate} />;
      case 'careers': return <CareersPage onBack={() => onNavigate('landing')} onNavigate={onNavigate} />;
      case 'research': return <ResearchPage onBack={() => onNavigate('landing')} onNavigate={onNavigate} />;
      case 'sdk': return <SdkPage onBack={() => onNavigate('landing')} onLaunch={() => onNavigate(currentUser ? 'app' : 'auth')} onNavigate={onNavigate} />;
      case 'app': return <GeneralArchitecturePage onNavigate={onNavigate} />;
      case 'playground': return <PlaygroundPage onNavigate={onNavigate} />;
      case 'blog': return <BlogListPage onBack={() => onNavigate('landing')} onNavigate={onNavigate} />;
      case 'blogPost':
        if (pageInfo.subpage) {
          return <BlogPostPage slug={pageInfo.subpage} onBack={() => onNavigate('blog')} onNavigate={onNavigate} />;
        }
        return <LandingPage onLaunch={() => onNavigate('auth')} onNavigate={onNavigate} />; // Fallback
      default: return <LandingPage onLaunch={() => onNavigate('auth')} onNavigate={onNavigate} />;
    }
  }

  return (
    <>
      <Suspense fallback={
        <div className="fixed inset-0 bg-white flex items-center justify-center">
          <Loader />
        </div>
      }>
        {renderPage()}
      </Suspense>
      <AnimatePresence>
        {showInstallPrompt && (
          <InstallPromptToast onInstall={handleInstall} onDismiss={handleDismissInstall} />
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
