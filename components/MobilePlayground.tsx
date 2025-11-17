import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiagramData, ArchNode, Link, Container, IconType } from '../types';
import DiagramCanvas from './DiagramCanvas';
import PropertiesSidebar from './PropertiesSidebar';
import { customAlphabet } from 'nanoid';
import { ZoomTransform, zoomIdentity } from 'd3-zoom';
import AddNodePanel from './AddNodePanel';
import Toast from './Toast';
import ContextualActionBar from './ContextualActionBar';

const nanoid = customAlphabet('1234567890abcdef', 10);

interface MobilePlaygroundProps {
    data: DiagramData;
    onDataChange: (newData: DiagramData, fromHistory?: boolean) => void;
    onExit: () => void;
    selectedIds: string[];
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onExplain: () => void;
    isExplaining: boolean;
}

const MobileToolbarButton: React.FC<{ 'aria-label': string; onClick?: () => void; isDisabled?: boolean; children: React.ReactNode; }> =
 ({ 'aria-label': ariaLabel, onClick, isDisabled = false, children }) => (
    <button
        aria-label={ariaLabel}
        onClick={onClick}
        disabled={isDisabled}
        className="flex flex-col items-center justify-center text-[var(--color-text-secondary)] disabled:opacity-50 w-16 h-16"
    >
        {children}
    </button>
);

const MobilePlayground: React.FC<MobilePlaygroundProps> = (props) => {
    const { data, onDataChange, onExit, selectedIds, setSelectedIds, canUndo, canRedo, onUndo, onRedo, onExplain, isExplaining } = props;

    const [isAddNodePanelOpen, setIsAddNodePanelOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [viewTransform, setViewTransform] = useState<ZoomTransform>(() => zoomIdentity);
    const [linkingState, setLinkingState] = useState<{ sourceNodeId: string; startPos: { x: number, y: number } } | null>(null);
    const [previewLinkTarget, setPreviewLinkTarget] = useState<{ x: number; y: number; targetNodeId?: string } | null>(null);

    const [isPropertiesSheetOpen, setIsPropertiesSheetOpen] = useState(false);
    const [actionBarPosition, setActionBarPosition] = useState<{ x: number; y: number } | null>(null);

    const svgRef = useRef<SVGSVGElement>(null);
    const fitScreenRef = useRef<(() => void) | null>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    const showToast = (message: string) => {
        setToastMessage(message);
    };

    const handleFitToScreen = () => {
        fitScreenRef.current?.();
        setIsMoreMenuOpen(false);
        showToast('Fit to screen');
    };
    
    const handleAddNode = (type: IconType) => {
        const canvasEl = svgRef.current;
        if (!canvasEl) return;

        const canvasRect = canvasEl.getBoundingClientRect();
        const [viewX, viewY] = viewTransform.invert([canvasRect.width / 2, canvasRect.height / 2]);

        const newNode: ArchNode = {
            id: nanoid(),
            label: type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: type,
            x: viewX,
            y: viewY,
            width: 140,
            height: 70,
        };
        const newData = { ...data, nodes: [...data.nodes, newNode] };
        onDataChange(newData);
        setIsAddNodePanelOpen(false);
        setSelectedIds([newNode.id]);
        showToast(`${newNode.label} added`);
    };

    const selectedItem = useMemo(() => {
        if (selectedIds.length !== 1) return null;
        const items: (ArchNode | Container | Link)[] = [...data.nodes, ...(data.containers || []), ...data.links];
        return items.find(item => item.id === selectedIds[0]) || null;
    }, [data, selectedIds]);

    const handlePropertyChange = (itemId: string, newProps: Partial<ArchNode | Container | Link>) => {
        const newNodes = data.nodes.map(n => n.id === itemId ? { ...n, ...newProps } : n);
        const newContainers = (data.containers || []).map(c => c.id === itemId ? { ...c, ...newProps as Partial<Container> } : c);
        const newLinks = data.links.map(l => l.id === itemId ? { ...l, ...newProps as Partial<Link> } : l);
        onDataChange({ ...data, nodes: newNodes, containers: newContainers, links: newLinks }, true);
    };

    useEffect(() => {
        if (selectedIds.length === 1 && data && svgRef.current && canvasContainerRef.current) {
            const selectedItem = data.nodes.find(n => n.id === selectedIds[0]); // Action bar only for nodes
            if (selectedItem) {
                const [screenX, screenY] = viewTransform.apply([selectedItem.x, selectedItem.y - selectedItem.height / 2]);
                const canvasRect = canvasContainerRef.current.getBoundingClientRect();
                setActionBarPosition({ x: screenX, y: screenY - canvasRect.top - 60 });
            }
        } else {
            setActionBarPosition(null);
        }
    }, [selectedIds, data, viewTransform]);
    
    const handleDelete = () => {
        if (selectedIds.length === 0) return;
        const selectedIdSet = new Set(selectedIds);
        const newNodes = data.nodes.filter(n => !selectedIdSet.has(n.id));
        const newContainers = (data.containers || []).filter(c => !selectedIdSet.has(c.id));
        const remainingNodeIds = new Set(newNodes.map(n => n.id));
        const newLinks = data.links.filter(l => {
            if (selectedIdSet.has(l.id)) return false;
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return remainingNodeIds.has(sourceId) && remainingNodeIds.has(targetId);
        });
        onDataChange({ ...data, nodes: newNodes, containers: newContainers, links: newLinks });
        setSelectedIds([]);
        showToast(`${selectedIds.length} item(s) deleted`);
    };
    
    const handleDuplicate = () => {
        if (selectedIds.length === 0) return;
        const nodesToDup = data.nodes.filter(n => selectedIds.includes(n.id));
        if (nodesToDup.length === 0) return;

        const newNodes = nodesToDup.map(n => ({...n, id: nanoid(), x: n.x + 20, y: n.y + 20}));
        onDataChange({ ...data, nodes: [...data.nodes, ...newNodes] });
        setSelectedIds(newNodes.map(n => n.id));
        showToast(`${nodesToDup.length} item(s) duplicated`);
    };

    const handleLinkStart = useCallback(() => {
        if (selectedIds.length !== 1) return;
        const sourceNode = data.nodes.find(n => n.id === selectedIds[0]);
        if (!sourceNode) return;
        setLinkingState({ sourceNodeId: sourceNode.id, startPos: { x: sourceNode.x, y: sourceNode.y } });
        setSelectedIds([]); // Deselect to close the action bar
        showToast('Tap a target node to connect');
    }, [selectedIds, data.nodes, setSelectedIds]);

    const handleCanvasClick = (event?: PointerEvent) => {
        if (linkingState && event) {
            const targetEl = event.target as SVGElement;
            const nodeGroup = targetEl.closest('g.diagram-node');
            if (nodeGroup) {
                const targetNodeId = Array.from(nodeGroup.classList).find(c => c.startsWith('node-id-'))?.replace('node-id-', '');
                if (targetNodeId && targetNodeId !== linkingState.sourceNodeId) {
                    const newLink: Link = { id: nanoid(), source: linkingState.sourceNodeId, target: targetNodeId };
                    onDataChange({ ...data, links: [...data.links, newLink] });
                    showToast('Nodes connected');
                } else {
                    showToast('Link cancelled: Cannot link a node to itself.');
                }
            } else {
                 showToast('Link cancelled');
            }
            setLinkingState(null);
            setPreviewLinkTarget(null);
        } else {
            setSelectedIds([]);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-[var(--color-bg)] flex flex-col z-30">
            <AnimatePresence>
                {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
            </AnimatePresence>

            <header className="p-4 flex justify-between items-center bg-[var(--color-panel-bg)] border-b border-[var(--color-border)]">
                 <h1 className="text-lg font-bold truncate pr-4">{data.title}</h1>
                 <button onClick={onExit} className="text-sm font-semibold bg-[var(--color-button-bg)] px-4 py-2 rounded-lg">Exit</button>
            </header>

            <main className="flex-1 relative" ref={canvasContainerRef}>
                <DiagramCanvas
                    forwardedRef={svgRef}
                    fitScreenRef={fitScreenRef}
                    data={data}
                    onDataChange={onDataChange}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    isEditable={true}
                    interactionMode="select" // Simplified for mobile
                    onTransformChange={setViewTransform}
                    onCanvasClick={handleCanvasClick}
                    onLinkStart={() => {}} // Use custom linking logic
                    linkingState={linkingState}
                    previewLinkTarget={previewLinkTarget}
                />
                 {actionBarPosition && selectedIds.length > 0 && (
                    <ContextualActionBar
                        position={actionBarPosition}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        selectedCount={selectedIds.length}
                        onEditProperties={() => {
                            setIsPropertiesSheetOpen(true);
                            setActionBarPosition(null);
                        }}
                        onLink={handleLinkStart}
                    />
                )}
            </main>

            {/* Bottom Toolbar */}
            <footer className="bg-[var(--color-panel-bg)] border-t border-[var(--color-border)] flex justify-around items-center h-20">
                <MobileToolbarButton aria-label="Add Node" onClick={() => setIsAddNodePanelOpen(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-xs mt-1">Add</span>
                </MobileToolbarButton>
                <MobileToolbarButton aria-label="Undo" onClick={onUndo} isDisabled={!canUndo}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
                     <span className="text-xs mt-1">Undo</span>
                </MobileToolbarButton>
                 <MobileToolbarButton aria-label="Redo" onClick={onRedo} isDisabled={!canRedo}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 15l3-3m0 0l-3-3m3 3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     <span className="text-xs mt-1">Redo</span>
                </MobileToolbarButton>
                <div className="relative" ref={moreMenuRef}>
                    <MobileToolbarButton aria-label="More Options" onClick={() => setIsMoreMenuOpen(p => !p)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                        <span className="text-xs mt-1">More</span>
                    </MobileToolbarButton>
                    <AnimatePresence>
                        {isMoreMenuOpen && (
                            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 10}} className="absolute bottom-full right-0 mb-2 w-40 bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl shadow-lg p-1 z-30">
                                <button onClick={handleFitToScreen} className="w-full text-left block px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-button-bg-hover)] rounded-md">Fit to Screen</button>
                                <button onClick={() => { onExplain(); setIsMoreMenuOpen(false); }} disabled={isExplaining} className="w-full text-left block px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-button-bg-hover)] rounded-md">Explain</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </footer>
            
            {/* Add Node Panel */}
            <AnimatePresence>
                {isAddNodePanelOpen && (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsAddNodePanelOpen(false)} />
                )}
                {isAddNodePanelOpen && (
                     <motion.div initial={{y: "100%"}} animate={{y: 0}} exit={{y: "100%"}} transition={{type: 'spring', stiffness: 400, damping: 40}} className="fixed bottom-0 left-0 right-0 h-[70vh] z-50">
                        <AddNodePanel onSelectNodeType={handleAddNode} onClose={() => setIsAddNodePanelOpen(false)} />
                     </motion.div>
                )}
            </AnimatePresence>

            {/* Properties Sheet */}
            <AnimatePresence>
                {isPropertiesSheetOpen && selectedItem && (
                     <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsPropertiesSheetOpen(false)} />
                )}
                {isPropertiesSheetOpen && selectedItem && (
                    <motion.div initial={{y: "100%"}} animate={{y: 0}} exit={{y: "100%"}} transition={{type: 'spring', stiffness: 400, damping: 40}} className="fixed bottom-0 left-0 right-0 h-[80vh] bg-[var(--color-panel-bg)] rounded-t-2xl border-t border-[var(--color-border)] shadow-2xl z-50 flex flex-col">
                        
                        <div className="flex-1 overflow-y-auto">
                             <PropertiesSidebar 
                                item={selectedItem}
                                onPropertyChange={handlePropertyChange}
                                selectedCount={1}
                                onClose={() => setIsPropertiesSheetOpen(false)}
                             />
                        </div>
                       
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobilePlayground;