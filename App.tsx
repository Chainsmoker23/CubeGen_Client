import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ContactPage from './components/ContactPage';
import AboutPage from './components/AboutPage';
import ApiPricingPage from './components/ApiPricingPage';
import AuthPage from './components/AuthPage';
import ApiKeyPage from './components/ApiKeyPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import DocsPage from './components/DocsPage';
import NeuralNetworkPage from './components/NeuralNetworkPage';
import CareersPage from './components/CareersPage';
import ResearchPage from './components/ResearchPage';
import GeneralArchitecturePage from './components/GeneralArchitecturePage';
import AdminPage from './components/AdminPage';
import AdminLoginPage from './components/AdminLoginPage';
import Loader from './components/Loader';
import PaymentStatusPage from './components/PaymentStatusPage'; // Import the new component
import SdkPage from './components/SdkPage';
import BlogListPage from './components/BlogListPage';
import BlogPostPage from './components/BlogPostPage';
import { useAuth } from './contexts/AuthContext';
import { useAdminAuth } from './contexts/AdminAuthContext';
import InstallPromptToast from './components/InstallPromptToast';
import { AnimatePresence } from 'framer-motion';
import SEO from './components/SEO';

type Page = 'landing' | 'auth' | 'app' | 'contact' | 'about' | 'api' | 'apiKey' | 'privacy' | 'terms' | 'docs' | 'neuralNetwork' | 'careers' | 'research' | 'admin' | 'adminLogin' | 'sdk' | 'blog' | 'blogPost';

// Define route mappings for proper URLs
const ROUTE_MAP: Record<string, Page> = {
  '/': 'landing',
  '/about': 'about',
  '/contact': 'contact',
  '/api': 'api',
  '/docs': 'docs',
  '/sdk': 'sdk',
  '/blog': 'blog',
  '/careers': 'careers',
  '/research': 'research',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/app': 'app',
  '/neural-network': 'neuralNetwork',
  '/admin': 'admin',
  '/admin-login': 'adminLogin',
  '/auth': 'auth',
  '/api-keys': 'apiKey',
};

const REVERSE_ROUTE_MAP: Record<Page, string> = {
  landing: '/',
  about: '/about',
  contact: '/contact',
  api: '/api',
  docs: '/docs',
  sdk: '/sdk',
  blog: '/blog',
  careers: '/careers',
  research: '/research',
  privacy: '/privacy',
  terms: '/terms',
  app: '/app',
  neuralNetwork: '/neural-network',
  admin: '/admin',
  adminLogin: '/admin-login',
  auth: '/auth',
  apiKey: '/api-keys',
  blogPost: '/blog',
};

const getRouteFromPathname = (pathname: string): Page => {
  // Special handling for blog posts: /blog/slug
  if (pathname.startsWith('/blog/') && pathname !== '/blog') {
    return 'blogPost';
  }
  
  return ROUTE_MAP[pathname] || 'landing';
};

const getPageFromUrl = (): { page: Page; subpage?: string } => {
  const { pathname, hash } = window.location;
  
  // First check for hash routes (legacy support)
  if (hash) {
    const hashRoute = hash.substring(1).split('/')[0];
    if (hashRoute) {
      // Special handling for blog post pages like #blog/my-post-slug
      if (hashRoute === 'blog') {
        const parts = hash.split('/');
        if (parts.length > 2) {
          return { page: 'blogPost', subpage: parts[2] };
        }
      }
      
      const validPages: Page[] = ['landing', 'auth', 'app', 'contact', 'about', 'api', 'apiKey', 'privacy', 'terms', 'docs', 'neuralNetwork', 'careers', 'research', 'admin', 'adminLogin', 'sdk', 'blog'];
      if (validPages.includes(hashRoute as Page)) {
        return { page: hashRoute as Page };
      }
    }
  }
  
  // Check for path-based routes
  const page = getRouteFromPathname(pathname);
  
  // Special handling for blog posts: /blog/slug
  if (pathname.startsWith('/blog/') && pathname !== '/blog') {
    const slug = pathname.split('/')[2];
    return { page: 'blogPost', subpage: slug };
  }
  
  return { page };
};

const getPageFromHash = (): { page: Page; subpage?: string } => {
  const hash = window.location.hash.substring(1).split('?')[0];
  if (!hash) {
    return { page: 'landing' };
  }
  const [mainPage, subpage] = hash.split('/');
  
  // Special handling for blog post pages like #blog/my-post-slug
  if (mainPage === 'blog' && subpage) {
    return { page: 'blogPost', subpage };
  }
  
  const validPages: Page[] = ['landing', 'auth', 'app', 'contact', 'about', 'api', 'apiKey', 'privacy', 'terms', 'docs', 'neuralNetwork', 'careers', 'research', 'admin', 'adminLogin', 'sdk', 'blog'];
  if (validPages.includes(mainPage as Page)) {
    return { page: mainPage as Page };
  }
  return { page: 'landing' };
};


const App: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { isAdminAuthenticated, loading: adminAuthLoading } = useAdminAuth();
  const [page, setPage] = useState<{ page: Page; subpage?: string } | null>(null);

  const [hash, setHash] = useState(() => window.location.hash);
  
  // --- PWA Install Prompt State ---
  const [installPromptEvent, setInstallPromptEvent] = useState<Event | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPromptEvent(e);
      // Show our custom UI
      setShowInstallPrompt(true);
      console.log('`beforeinstallprompt` event was fired.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = () => {
    if (!installPromptEvent) return;
    // @ts-ignore - The 'prompt' method exists on the BeforeInstallPromptEvent
    installPromptEvent.prompt();
    // @ts-ignore
    installPromptEvent.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      // We can only prompt once. Clear the event.
      setInstallPromptEvent(null);
      setShowInstallPrompt(false);
    });
  };
  
  const handleDismissInstall = () => {
      setShowInstallPrompt(false);
  };

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const onNavigate = useCallback((targetPage: Page | string) => {
    // Map the target page to the proper URL if it's a known page
    const targetPageEnum = targetPage as Page;
    const properUrl = REVERSE_ROUTE_MAP[targetPageEnum] || `#${targetPage}`;
    
    window.scrollTo(0, 0);
    // Use pushState to make the URL clean and navigate.
    window.history.pushState(null, '', properUrl);
    // Manually update the state to trigger the app's reactive loop.
    setHash(window.location.hash);
  }, []);

  useEffect(() => {
    if (authLoading || adminAuthLoading) return;

    const currentPageInfo = getPageFromUrl();
    
    // --- Admin Route Handling (Highest Priority) ---
    if (currentPageInfo.page === 'admin' || currentPageInfo.page === 'adminLogin') {
        const targetPage = isAdminAuthenticated ? 'admin' : 'adminLogin';
        
        // If we are on the right page, set the state to render it.
        // Otherwise, navigate, which will re-trigger this effect.
        if (currentPageInfo.page === targetPage) {
            setPage({ page: targetPage });
        } else {
            onNavigate(targetPage);
        }
        return; // IMPORTANT: Prevent other logic from running for admin routes.
    }
    
    // --- General Redirect Rules for Regular Users ---
    if (currentUser && currentPageInfo.page === 'auth') {
      onNavigate('app');
      return;
    }
    
    const isProtectedPage = ['app', 'neuralNetwork', 'apiKey'].includes(currentPageInfo.page);
    if (!currentUser && isProtectedPage) {
      onNavigate('landing');
      return;
    }
    
    // If no other rules matched, render the page from the URL.
    setPage(currentPageInfo);

  }, [authLoading, adminAuthLoading, currentUser, isAdminAuthenticated, onNavigate]);

  
  if (page === null || authLoading || adminAuthLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // --- Automatic Payment Verification (Top Priority) ---
  const searchParams = new URLSearchParams(window.location.search);
  const paymentId = searchParams.get('payment_id');
  const paymentStatus = searchParams.get('status');
  const hashParams = new URLSearchParams(hash.split('?')[1]);
  const paymentSuccessInHash = hashParams.get('payment') === 'success';

  if ((paymentId && paymentStatus === 'succeeded') || paymentSuccessInHash) {
      return <PaymentStatusPage onNavigate={onNavigate} />;
  }
  
  // Add SEO component based on current page
  const renderSEO = () => {
    switch (page.page) {
      case 'landing':
        return (
          <SEO
            title="CubeGen AI: Instant AI Architecture Diagrams"
            description="Generate professional software architecture diagrams for free, instantly from a single prompt with CubeGen AI. AI-powered design for AWS, GCP, Azure, microservices, and more."
            canonical="https://cubegenai.com/"
            ogTitle="CubeGen AI — AI Software Architecture Generator"
            ogDescription="Generate professional software architecture diagrams instantly from a single prompt with CubeGen AI."
          />
        );
      case 'about':
        return (
          <SEO
            title="About CubeGen AI - AI-Powered Architecture Diagrams"
            description="Learn about CubeGen AI, the leading platform for generating professional software architecture diagrams instantly from a single prompt."
            canonical="https://cubegenai.com/about"
            ogTitle="About CubeGen AI"
            ogDescription="Learn about CubeGen AI, the leading platform for generating professional software architecture diagrams instantly from a single prompt."
          />
        );
      case 'contact':
        return (
          <SEO
            title="Contact CubeGen AI - Get in Touch"
            description="Contact the CubeGen AI team for support, partnerships, or questions about our AI-powered architecture diagram generation tool."
            canonical="https://cubegenai.com/contact"
            ogTitle="Contact CubeGen AI"
            ogDescription="Contact the CubeGen AI team for support, partnerships, or questions about our AI-powered architecture diagram generation tool."
          />
        );
      case 'api':
        return (
          <SEO
            title="CubeGen AI API & Pricing - Enterprise Solutions"
            description="Access the CubeGen AI API for generating architecture diagrams programmatically. Flexible pricing for individuals and enterprises."
            canonical="https://cubegenai.com/api"
            ogTitle="CubeGen AI API & Pricing"
            ogDescription="Access the CubeGen AI API for generating architecture diagrams programmatically. Flexible pricing for individuals and enterprises."
          />
        );
      case 'docs':
        return (
          <SEO
            title="CubeGen AI Documentation - Getting Started Guide"
            description="Complete documentation for CubeGen AI, including API references, integration guides, and best practices for generating architecture diagrams."
            canonical="https://cubegenai.com/docs"
            ogTitle="CubeGen AI Documentation"
            ogDescription="Complete documentation for CubeGen AI, including API references, integration guides, and best practices for generating architecture diagrams."
          />
        );
      case 'sdk':
        return (
          <SEO
            title="CubeGen AI SDK - Integrate Architecture Generation"
            description="Integrate CubeGen AI's powerful architecture generation capabilities directly into your development workflow with our SDK."
            canonical="https://cubegenai.com/sdk"
            ogTitle="CubeGen AI SDK"
            ogDescription="Integrate CubeGen AI's powerful architecture generation capabilities directly into your development workflow with our SDK."
          />
        );
      case 'blog':
        return (
          <SEO
            title="CubeGen AI Blog - Architecture & AI Insights"
            description="Stay updated with the latest insights on software architecture, AI developments, and best practices from the CubeGen AI team."
            canonical="https://cubegenai.com/blog"
            ogTitle="CubeGen AI Blog"
            ogDescription="Stay updated with the latest insights on software architecture, AI developments, and best practices from the CubeGen AI team."
          />
        );
      case 'careers':
        return (
          <SEO
            title="Careers at CubeGen AI - Join Our Team"
            description="Explore career opportunities at CubeGen AI and join our mission to revolutionize software architecture design with AI."
            canonical="https://cubegenai.com/careers"
            ogTitle="Careers at CubeGen AI"
            ogDescription="Explore career opportunities at CubeGen AI and join our mission to revolutionize software architecture design with AI."
          />
        );
      case 'research':
        return (
          <SEO
            title="CubeGen AI Research - AI Architecture Innovation"
            description="Explore CubeGen AI's research in artificial intelligence and software architecture generation. Discover our latest findings and innovations."
            canonical="https://cubegenai.com/research"
            ogTitle="CubeGen AI Research"
            ogDescription="Explore CubeGen AI's research in artificial intelligence and software architecture generation. Discover our latest findings and innovations."
          />
        );
      case 'privacy':
        return (
          <SEO
            title="Privacy Policy - CubeGen AI"
            description="Read CubeGen AI's privacy policy to understand how we collect, use, and protect your personal information when using our services."
            canonical="https://cubegenai.com/privacy"
            ogTitle="Privacy Policy - CubeGen AI"
            ogDescription="Read CubeGen AI's privacy policy to understand how we collect, use, and protect your personal information when using our services."
          />
        );
      case 'terms':
        return (
          <SEO
            title="Terms of Service - CubeGen AI"
            description="Review CubeGen AI's terms of service to understand your rights and responsibilities when using our AI-powered architecture generation platform."
            canonical="https://cubegenai.com/terms"
            ogTitle="Terms of Service - CubeGen AI"
            ogDescription="Review CubeGen AI's terms of service to understand your rights and responsibilities when using our AI-powered architecture generation platform."
          />
        );
      case 'app':
        return (
          <SEO
            title="Architecture Playground - CubeGen AI"
            description="Create and edit your architecture diagrams in the CubeGen AI playground. Generate professional diagrams with our AI-powered tools."
            canonical="https://cubegenai.com/app"
            ogTitle="Architecture Playground - CubeGen AI"
            ogDescription="Create and edit your architecture diagrams in the CubeGen AI playground. Generate professional diagrams with our AI-powered tools."
          />
        );
      case 'neuralNetwork':
        return (
          <SEO
            title="Neural Network Diagrams - CubeGen AI"
            description="Generate professional neural network diagrams with CubeGen AI. Visualize your machine learning architectures instantly."
            canonical="https://cubegenai.com/neural-network"
            ogTitle="Neural Network Diagrams - CubeGen AI"
            ogDescription="Generate professional neural network diagrams with CubeGen AI. Visualize your machine learning architectures instantly."
          />
        );
      case 'blogPost':
        // For blog posts, we'd need to fetch the specific post details
        return (
          <SEO
            title={`${page.subpage ? page.subpage.replace(/-/g, ' ') : 'Blog Post'} - CubeGen AI`}
            description="Read the latest insights on software architecture and AI from the CubeGen AI blog."
            canonical={`https://cubegenai.com/blog/${page.subpage}`}
            ogTitle={`${page.subpage ? page.subpage.replace(/-/g, ' ') : 'Blog Post'} - CubeGen AI`}
            ogDescription="Read the latest insights on software architecture and AI from the CubeGen AI blog."
          />
        );
      default:
        return <SEO />;
    }
  };

  // --- Page rendering logic ---
  const renderPage = () => {
    switch (page.page) {
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
      case 'blog': return <BlogListPage onBack={() => onNavigate('landing')} onNavigate={onNavigate} />;
      case 'blogPost':
        if (page.subpage) {
          return <BlogPostPage slug={page.subpage} onBack={() => onNavigate('blog')} onNavigate={onNavigate} />;
        }
        return <LandingPage onLaunch={() => onNavigate('auth')} onNavigate={onNavigate} />; // Fallback
      default: return <LandingPage onLaunch={() => onNavigate('auth')} onNavigate={onNavigate} />;
    }
  }

  return (
    <>
      {renderSEO()}
      {renderPage()}
      <AnimatePresence>
        {showInstallPrompt && (
          <InstallPromptToast onInstall={handleInstall} onDismiss={handleDismissInstall} />
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
