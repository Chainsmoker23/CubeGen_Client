import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DiagramData, ArchNode, Link, Container } from '../types';
import { IconType } from '../types';
import { generateDiagramData, generateAwsArchitectureData } from '../services/geminiService';
import Loader from './Loader';
import ArchitectureIcon from './ArchitectureIcon';
import DiagramCanvas from './DiagramCanvas';
import ApiKeyModal from './ApiKeyModal';
import { useTheme } from '../contexts/ThemeProvider';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import SettingsSidebar from './SettingsSidebar';
import Toast from './Toast';
import ErrorModal from './ErrorModal';
import SummaryModal from './SummaryModal';
import Toolbar from './Toolbar';
import PropertiesSidebar from './PropertiesSidebar';
import PromptInput from './PromptInput';
import { nanoid } from 'nanoid';
import Playground from './Playground';
import MobilePlayground from './MobilePlayground';
import MobileWarning from './MobileWarning';

type Page = 'contact' | 'about' | 'api' | 'privacy' | 'terms' | 'docs' | 'apiKey' | 'careers' | 'research' | 'sdk' | 'blog' | 'generalArchitecture' | 'neuralNetwork' | 'awsArchitecture';

interface AwsArchitecturePageProps {
  onNavigate: (page: Page | string) => void;
}

// Example prompts for AWS architecture
const EXAMPLE_PROMPTS_LIST = [
  "A scalable 3-tier AWS architecture with Application Load Balancer, EC2 Auto Scaling Group, RDS database, and S3 storage",
  "A serverless architecture using API Gateway, Lambda functions, DynamoDB, and S3",
  "A VPC with public and private subnets, NAT Gateway, and EC2 instances",
  "A microservices architecture with ECS, ECR, Application Load Balancer, and RDS",
  "A data pipeline with Kinesis, Lambda, S3, and Redshift",
];

const EXAMPLE_PROMPT = EXAMPLE_PROMPTS_LIST[0];

const pageContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const pageItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const AwsArchitecturePage: React.FC<AwsArchitecturePageProps> = ({ onNavigate }) => {
  const { currentUser, refreshUser, updateCurrentUserMetadata } = useAuth();
  const [prompt, setPrompt] = useState<string>(EXAMPLE_PROMPT);
  const [promptIndex, setPromptIndex] = useState(0);

  const [history, setHistory] = useState<(DiagramData | null)[]>([null]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const diagramData = history[historyIndex];

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPlaygroundMode, setIsPlaygroundMode] = useState<boolean>(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState<boolean>(false);
  const [editingTitle, setEditingTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const isPropertiesPanelOpen = selectedIds.length > 0;

  const svgRef = useRef<SVGSVGElement>(null);
  const fitScreenRef = useRef<(() => void) | null>(null);

  const [userApiKey, setUserApiKey] = useState<string | null>(() => {
    try { return window.localStorage.getItem('user-api-key'); } catch { return null; }
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<{ type: 'generate' | 'explain', payload: any } | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    try {
        if (userApiKey) {
            window.localStorage.setItem('user-api-key', userApiKey);
        } else {
            window.localStorage.removeItem('user-api-key');
        }
    } catch (error) {
        console.error("Could not access localStorage to save API key:", String(error));
    }
  }, [userApiKey]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'png' | 'json' | 'html') => {
    if (!diagramData) return;
    const filename = diagramData.title.replace(/[\s/]/g, '_').toLowerCase();

    if (format === 'json') {
      const dataStr = JSON.stringify(diagramData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      downloadBlob(blob, `${filename}.json`);
      return;
    }
    
    const svgElement = svgRef.current;
    if (!svgElement) {
        setError("Export failed: SVG element not found.");
        return;
    }

    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    
    const originalElements = Array.from(svgElement.querySelectorAll('*'));
    originalElements.unshift(svgElement);
    const clonedElements = Array.from(svgClone.querySelectorAll('*'));
    clonedElements.unshift(svgClone);

    originalElements.forEach((sourceEl, index) => {
        const targetEl = clonedElements[index] as Element;
        if (targetEl && (targetEl as SVGElement).style) {
            const computedStyle = window.getComputedStyle(sourceEl as Element);
            let cssText = '';
            for (let i = 0; i < computedStyle.length; i++) {
                const prop = computedStyle[i];
                cssText += `${prop}: ${computedStyle.getPropertyValue(prop)};`;
            }
            (targetEl as SVGElement).style.cssText = cssText;
        }
    });
    
    const contentGroup = svgElement.querySelector('#diagram-content');
    if (!contentGroup) {
        setError("Export failed: Diagram content not found.");
        return;
    }
    const bbox = (contentGroup as SVGGraphicsElement).getBBox();

    const padding = 20;
    const exportWidth = Math.round(bbox.width + padding * 2);
    const exportHeight = Math.round(bbox.height + padding * 2);
    
    svgClone.setAttribute('width', `${exportWidth}`);
    svgClone.setAttribute('height', `${exportHeight}`);
    svgClone.setAttribute('viewBox', `0 0 ${exportWidth} ${exportHeight}`);
    
    const exportRoot = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const rootStyle = getComputedStyle(document.documentElement);
    const bgColor = rootStyle.getPropertyValue('--color-canvas-bg').trim() || '#FFF9FB';
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', bgColor);
    exportRoot.appendChild(bgRect);

    const clonedContentGroup = svgClone.querySelector('#diagram-content');
    if (clonedContentGroup instanceof globalThis.Element) {
        clonedContentGroup.setAttribute('transform', `translate(${-bbox.x + padding}, ${-bbox.y + padding})`);
        exportRoot.appendChild(clonedContentGroup);
    }
    
    const clonedDefs = svgClone.querySelector<SVGDefsElement>('defs');
    if (clonedDefs) {
        exportRoot.insertBefore(clonedDefs, exportRoot.firstChild);
    }
    
    while (svgClone.firstChild) {
      svgClone.removeChild(svgClone.firstChild);
    }
    svgClone.appendChild(exportRoot);

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgClone);
    svgString = svgString.replace(/xmlns:xlink="http:\/\/www.w3.org\/1999\/xlink"/g, '');

    if (format === 'html') {
      const htmlString = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${diagramData.title}</title>
          <style> body { margin: 0; background-color: #f0f0f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 2rem; box-sizing: border-box; } svg { max-width: 100%; height: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 1rem; } </style>
        </head>
        <body>${svgString}</body>
        </html>`;
      const blob = new Blob([htmlString], { type: 'text/html' });
      downloadBlob(blob, `${filename}.html`);
      return;
    }

    if (format === 'png') {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = exportWidth * scale;
      canvas.height = exportHeight * scale;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
          setError("Export failed: Could not create canvas context.");
          return;
      }
      ctx.scale(scale, scale);

      const img = new Image();
      const svgUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

      img.onload = () => {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
              if (blob) {
                  downloadBlob(blob, `${filename}.png`);
              } else {
                   setError("Export failed: Canvas returned empty blob for png.");
              }
          }, 'image/png');
      };

      img.onerror = () => {
          setError("Export failed: The generated SVG could not be loaded as an image.");
      };

      img.src = svgUrl;
    }
  };

  const handleDiagramUpdate = (newData: DiagramData, fromHistory = false) => {
    if (fromHistory) {
       setHistory(prev => {
         const newHistory = [...prev];
         newHistory[historyIndex] = newData;
         return newHistory;
       });
    } else {
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, newData]);
      setHistoryIndex(newHistory.length);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSelectedIds([]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSelectedIds([]);
    }
  };
  
  const handleFitToScreen = () => {
    fitScreenRef.current?.();
  };

  const handleGenerate = useCallback(async (keyOverride?: string) => {
    if (!prompt) {
      setError("Please enter a prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setHistory([null]);
    setHistoryIndex(0);
    setSelectedIds([]);
    setLastAction({ type: 'generate', payload: { prompt } });

    try {
      const apiKeyToUse = keyOverride || userApiKey;
      // Using the general generateDiagramData function for now since we're adding a new endpoint
      // In the actual implementation, we'd call a specific AWS generation function
      const { diagram, newGenerationCount } = await generateAwsArchitectureData(prompt, apiKeyToUse || undefined);
      
      if (currentUser && newGenerationCount !== null && newGenerationCount !== undefined) {
        updateCurrentUserMetadata({ generation_count: newGenerationCount });
      } else if (currentUser) {
        await refreshUser();
      }

      setHistory([diagram]);
      setHistoryIndex(0);
      setSuccessMessage('AWS Diagram Generated!');
      setTimeout(() => handleFitToScreen(), 100);
    } catch (err: any) {
      console.error(String(err));
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      
      if (errorMessage.includes('SHARED_KEY_QUOTA_EXCEEDED')) {
          setShowApiKeyModal(true);
          setError(null);
      } else {
          setError(errorMessage);
          setHistory([null]);
          setHistoryIndex(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompt, userApiKey, currentUser, refreshUser, updateCurrentUserMetadata]);
  
  const handleExplain = useCallback(async (keyOverride?: string) => {
    if (!diagramData) return;
    setIsExplaining(true);
    setError(null);
    setLastAction({ type: 'explain', payload: { diagramData } });
    try {
      const apiKeyToUse = keyOverride || userApiKey;
      // For now, we'll use the same function as generation since we're explaining AWS architecture
      const { diagram } = await generateAwsArchitectureData(prompt, apiKeyToUse || undefined);
      const explanation = diagram.title + ' explained'; // Placeholder for actual explanation
      setSummary(explanation);
      setShowSummaryModal(true);
    } catch (err) {
       console.error(String(err));
       const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
       if (errorMessage.includes('SHARED_KEY_QUOTA_EXCEEDED')) {
            setShowApiKeyModal(true);
            setError(null);
       } else {
           setError(errorMessage);
       }
    } finally {
        setIsExplaining(false);
    }
  }, [diagramData, userApiKey, prompt]);

  const handleSaveAndRetryApiKey = (key: string) => {
    setUserApiKey(key);
    setShowApiKeyModal(false);
    setError(null);

    if (lastAction?.type === 'generate') {
      handleGenerate(key);
    } else if (lastAction?.type === 'explain') {
      handleExplain(key);
    }
    setLastAction(null);
  };

  const handleRetry = () => {
    setError(null);
    if (lastAction?.type === 'generate') {
        handleGenerate(userApiKey || undefined);
    } else if (lastAction?.type === 'explain') {
        handleExplain(userApiKey || undefined);
    }
  };

  const handlePropertyChange = (itemId: string, newProps: Partial<ArchNode | Container | Link>) => {
    if (!diagramData) return;
    const newNodes = diagramData.nodes.map(n => n.id === itemId ? {...n, ...newProps} : n);
    const newContainers = diagramData.containers?.map(c => c.id === itemId ? {...c, ...newProps as Partial<Container>} : c);
    const newLinks = diagramData.links.map(l => l.id === itemId ? {...l, ...newProps as Partial<Link>} : l);
    handleDiagramUpdate({ ...diagramData, nodes: newNodes, containers: newContainers, links: newLinks }, true);
  }

  const handleTitleSave = () => {
    if (diagramData && editingTitle && editingTitle !== diagramData.title) {
        handleDiagramUpdate({ ...diagramData, title: editingTitle });
    }
    setIsEditingTitle(false);
  };

  const handleCyclePrompt = () => {
    const nextIndex = (promptIndex + 1) % EXAMPLE_PROMPTS_LIST.length;
    setPromptIndex(nextIndex);
    setPrompt(EXAMPLE_PROMPTS_LIST[nextIndex]);
  };

  const handleEnterPlayground = () => {
    if (isMobile) {
      setShowMobileWarning(true);
    } else {
      setIsPlaygroundMode(true);
    }
  };
  
  if (isPlaygroundMode && diagramData) {
    const playgroundProps = {
      data: diagramData,
      onDataChange: handleDiagramUpdate,
      onExit: () => setIsPlaygroundMode(false),
      selectedIds: selectedIds,
      setSelectedIds: setSelectedIds,
      onUndo: handleUndo,
      onRedo: handleRedo,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
      onExplain: handleExplain,
      isExplaining: isExplaining,
    };

    return isMobile
      ? <MobilePlayground {...playgroundProps} />
      : <Playground {...playgroundProps} />;
  }

  const selectedItem = useMemo(() => {
    if (!diagramData || selectedIds.length !== 1) return null;
    const selectedId = selectedIds[0];
    const items: (ArchNode | Container | Link)[] = [
        ...(diagramData.nodes || []),
        ...(diagramData.containers || []),
        ...(diagramData.links || []),
    ];
    return items.find(item => item.id === selectedId) || null;
  }, [diagramData, selectedIds]);

  return (
    <div className="h-screen text-[var(--color-text-primary)] flex flex-col transition-colors duration-300 app-bg">
      <SettingsSidebar userApiKey={userApiKey} setUserApiKey={setUserApiKey} onNavigate={onNavigate} />
      <button
          onClick={() => onNavigate('landing')}
          className="fixed top-4 right-4 z-40 p-2 rounded-full bg-[var(--color-panel-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] shadow-sm hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Back to Home"
      >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
      </button>
      <motion.div 
        variants={pageContainerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col"
      >
        <header className="w-full text-center relative py-4 px-20">
            <h1 className="text-2xl font-bold tracking-tight flex items-center justify-center gap-x-2">
                <span>CubeGen</span>
                <div className="pulse-subtle">
                    <Logo className="h-6 w-6 text-[var(--color-accent-text)]" />
                </div>
                <span>AI - AWS Architecture</span>
            </h1>
        </header>
        
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 pb-4">
          <motion.aside variants={pageItemVariants} className="lg:col-span-3 rounded-2xl shadow-sm flex flex-col glass-panel">
             <PromptInput
                prompt={prompt}
                setPrompt={setPrompt}
                onGenerate={() => handleGenerate()}
                isLoading={isLoading}
                onCyclePrompt={handleCyclePrompt}
            />
          </motion.aside>
          
          <motion.section 
              variants={pageItemVariants} 
              className={`rounded-2xl shadow-sm flex flex-col relative min-h-[60vh] lg:min-h-0 glass-panel transition-all duration-300 ${isPropertiesPanelOpen ? 'lg:col-span-6' : 'lg:col-span-9'}`}
          >
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[var(--color-panel-bg-translucent)] flex flex-col items-center justify-center z-20 rounded-2xl"
                >
                  <Loader />
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {!diagramData && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-8"
                >
                  <ArchitectureIcon type={IconType.Cloud} className="h-20 w-20 text-[var(--color-text-tertiary)]" />
                  <h3 className="mt-4 text-xl font-semibold text-[var(--color-text-primary)]">Your AWS diagram will appear here</h3>
                  <p className="mt-1 text-[var(--color-text-secondary)]">Describe your AWS architecture and click "Generate".</p>
                </motion.div>
              )}
            </AnimatePresence>

            {diagramData && (
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col relative"
              >
                <div className="p-4 border-b border-[var(--color-border-translucent)] flex justify-between items-center gap-4">
                  <div className="group min-w-0 flex items-center gap-2">
                    {isEditingTitle ? (
                       <input
                          ref={titleInputRef}
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={handleTitleSave}
                          onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                          className="text-xl font-semibold bg-transparent border-b border-[var(--color-accent-soft)] focus:outline-none focus:border-[var(--color-accent-text)]"
                       />
                    ) : (
                      <>
                        <h2 className="text-xl font-semibold truncate" title={diagramData.title}>{diagramData.title}</h2>
                        <button onClick={() => { setIsEditingTitle(true); setEditingTitle(diagramData.title); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArchitectureIcon type={IconType.Edit} className="w-4 h-4 text-[var(--color-text-secondary)]" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <Toolbar 
                        onExport={handleExport}
                        onExplain={() => handleExplain()}
                        isExplaining={isExplaining}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        canUndo={historyIndex > 0}
                        canRedo={historyIndex < history.length - 1}
                        onFitToScreen={handleFitToScreen}
                        onGoToPlayground={handleEnterPlayground}
                        canGoToPlayground={!!diagramData}
                    />
                  </div>
                </div>
                <div className="flex-1 relative">
                  <DiagramCanvas 
                    forwardedRef={svgRef}
                    fitScreenRef={fitScreenRef}
                    data={diagramData} 
                    onDataChange={handleDiagramUpdate} 
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    isEditable={false}
                  />
                </div>
              </motion.div>
            )}
          </motion.section>

          <AnimatePresence>
              {isPropertiesPanelOpen && (
                  <motion.aside 
                      key="properties-sidebar-desktop"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="lg:col-span-3 h-full flex-col hidden lg:flex"
                  >
                    <PropertiesSidebar 
                      item={selectedItem}
                      onPropertyChange={handlePropertyChange}
                      selectedCount={selectedIds.length}
                    />
                  </motion.aside>
              )}
          </AnimatePresence>

        </main>
      </motion.div>

      <AnimatePresence>
          {successMessage && (
              <Toast message={successMessage} onDismiss={() => setSuccessMessage(null)} />
          )}
          {error && !showApiKeyModal && (
              <ErrorModal
                  message={error}
                  onClose={() => setError(null)}
                  onRetry={handleRetry}
              />
          )}
      </AnimatePresence>

      <AnimatePresence>
          {isPropertiesPanelOpen && (
              <motion.div
                  key="properties-backdrop"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                  onClick={() => setSelectedIds([])}
              />
          )}
      </AnimatePresence>
      <AnimatePresence>
          {isPropertiesPanelOpen && (
              <motion.div
                  key="properties-sheet"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                  className="fixed bottom-0 left-0 right-0 h-[60vh] bg-[var(--color-panel-bg)] rounded-t-2xl border-t border-[var(--color-border)] shadow-2xl p-4 z-40 lg:hidden"
              >
                  <div className="w-12 h-1.5 bg-[var(--color-border)] rounded-full mx-auto mb-4" />
                  <div className="overflow-y-auto h-[calc(60vh-40px)] px-2">
                      <PropertiesSidebar
                          item={selectedItem}
                          onPropertyChange={handlePropertyChange}
                          selectedCount={selectedIds.length}
                      />
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence>
        {showSummaryModal && summary && (
          <SummaryModal summary={summary} onClose={() => setShowSummaryModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showApiKeyModal && (
            <ApiKeyModal
                onClose={() => {
                    setShowApiKeyModal(false);
                    setLastAction(null);
                    setError("Generation cancelled. Please provide an API key in settings to proceed.");
                }}
                onSave={handleSaveAndRetryApiKey}
            />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showMobileWarning && (
          <MobileWarning
            onProceed={() => {
              setIsPlaygroundMode(true);
              setShowMobileWarning(false);
            }}
            onCancel={() => setShowMobileWarning(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AwsArchitecturePage;
