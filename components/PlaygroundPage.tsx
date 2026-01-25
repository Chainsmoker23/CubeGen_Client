import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { DiagramData, ArchNode, Container, Link } from '../types';
import { IconType } from '../types';
import DiagramCanvas from './DiagramCanvas';
import Toolbar from './Toolbar';
import Loader from './Loader';
import PropertiesSidebar from './PropertiesSidebar';
import SettingsSidebar from './SettingsSidebar';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Playground from './Playground';
import ArchitectureIcon from './ArchitectureIcon';
import MobilePlayground from './MobilePlayground';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import MobileWarning from './MobileWarning';
import Toast from './Toast';
import { TEMPLATES } from './content/templateData';

type Page = 'landing' | 'auth' | 'app' | 'contact' | 'about' | 'api' | 'apiKey' | 'privacy' | 'terms' | 'docs' | 'neuralNetwork' | 'careers' | 'research' | 'playground';

interface PlaygroundPageProps {
    onNavigate: (page: Page) => void;
}

// Empty diagram to start with
const createEmptyDiagram = (): DiagramData => ({
    title: 'Untitled Architecture',
    architectureType: 'general',
    nodes: [],
    links: [],
    containers: [],
});

const pageContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const pageItemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', damping: 15, stiffness: 100 }
    },
};


const PlaygroundPage: React.FC<PlaygroundPageProps> = ({ onNavigate }) => {
    const { currentUser } = useAuth();

    const [history, setHistory] = useState<DiagramData[]>([createEmptyDiagram()]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const diagramData = history[historyIndex];

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isPlaygroundMode, setIsPlaygroundMode] = useState<boolean>(false); // Start in Template Selection mode

    const [isMobile, setIsMobile] = useState(false);
    const [showMobileWarning, setShowMobileWarning] = useState<boolean>(false);

    const svgRef = useRef<SVGSVGElement>(null);
    const fitScreenRef = useRef<(() => void) | null>(null);

    const [userApiKey, setUserApiKey] = useState<string | null>(() => {
        try { return window.localStorage.getItem('user-api-key'); } catch { return null; }
    });

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Show warning on first load if mobile
            if (mobile && !showMobileWarning) {
                setShowMobileWarning(true);
            }
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
        const filename = diagramData.title.replace(/[\s/]/g, '_').toLowerCase();

        if (format === 'json') {
            const dataStr = JSON.stringify(diagramData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            downloadBlob(blob, `${filename}.json`);
            return;
        }

        const svgElement = svgRef.current;
        if (!svgElement) return;

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
        if (!contentGroup) return;
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

            if (!ctx) return;
            ctx.scale(scale, scale);

            const img = new Image();
            const svgUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        downloadBlob(blob, `${filename}.png`);
                    }
                }, 'image/png');
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

    const handleEnterPlayground = () => {
        if (isMobile) {
            setShowMobileWarning(true);
        } else {
            setIsPlaygroundMode(true);
        }
    };

    const handleExitPlayground = () => {
        // Navigate back to app
        onNavigate('app');
    };

    if (isPlaygroundMode) {
        const playgroundProps = {
            data: diagramData,
            onDataChange: handleDiagramUpdate,
            onExit: handleExitPlayground,
            selectedIds: selectedIds,
            setSelectedIds: setSelectedIds,
            onUndo: handleUndo,
            onRedo: handleRedo,
            canUndo: historyIndex > 0,
            canRedo: historyIndex < history.length - 1,
            onExplain: () => { }, // No explain in playground mode
            isExplaining: false,
        };

        return (
            <>
                {isMobile
                    ? <MobilePlayground {...playgroundProps} />
                    : <Playground {...playgroundProps} />}

                {/* Mobile Warning Modal */}
                <AnimatePresence>
                    {showMobileWarning && (
                        <MobileWarning
                            onProceed={() => setShowMobileWarning(false)}
                            onCancel={() => {
                                setShowMobileWarning(false);
                                onNavigate('app'); // Go back to general architecture
                            }}
                        />
                    )}
                </AnimatePresence>
            </>
        );
    }

    // Fallback view (shouldn't normally reach here since we start in playground mode)
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
                        <span>Custom</span>
                        <div className="pulse-subtle">
                            <Logo className="h-6 w-6 text-[var(--color-accent-text)]" />
                        </div>
                        <span>Playground</span>
                    </h1>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl font-bold mb-4">Start Designing</h2>
                            <p className="text-[var(--color-text-secondary)]">Choose a template to jumpstart your architecture or start from scratch.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                            {/* Blank Canvas Option */}
                            <motion.div
                                whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                className="bg-[var(--color-panel-bg)] rounded-2xl p-8 border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] cursor-pointer transition-all group flex flex-col items-center justify-center text-center min-h-[250px]"
                                onClick={() => {
                                    setHistory([createEmptyDiagram()]);
                                    setHistoryIndex(0);
                                    setIsPlaygroundMode(true);
                                }}
                            >
                                <div className="w-16 h-16 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <ArchitectureIcon type={IconType.Edit} className="w-8 h-8 text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)]" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Blank Canvas</h3>
                                <p className="text-sm text-[var(--color-text-secondary)]">Start with an empty grid</p>
                            </motion.div>

                            {/* Template Options */}
                            {TEMPLATES.map((template) => (
                                <motion.div
                                    key={template.id}
                                    whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    className="bg-[var(--color-panel-bg)] rounded-2xl p-8 border border-[var(--color-border)] hover:border-[var(--color-accent)] cursor-pointer transition-all flex flex-col min-h-[250px] relative overflow-hidden group"
                                    onClick={() => {
                                        setHistory([template.data]);
                                        setHistoryIndex(0);
                                        setIsPlaygroundMode(true);
                                    }}
                                >
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <ArchitectureIcon type={IconType.Sparkles} className="w-24 h-24 rotate-12" />
                                    </div>

                                    <div className="w-12 h-12 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center mb-6 z-10">
                                        <ArchitectureIcon type={IconType.Sparkles} className="w-6 h-6" />
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 z-10 relative">{template.title}</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)] flex-grow z-10 relative leading-relaxed">
                                        {template.description}
                                    </p>

                                    <div className="mt-6 flex items-center text-[var(--color-accent)] text-sm font-semibold z-10">
                                        <span>Use Template</span>
                                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </main>
            </motion.div>

            <AnimatePresence>
                {successMessage && (
                    <Toast message={successMessage} onDismiss={() => setSuccessMessage(null)} />
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

export default PlaygroundPage;
