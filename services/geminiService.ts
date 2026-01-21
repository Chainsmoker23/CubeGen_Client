import { DiagramData, ArchNode, BlogPost, Link } from "../types";
import type { Content } from "@google/genai";
import { supabase } from '../supabaseClient';
import { LayoutDecisionEngine } from '../utils/layoutDecisionEngine';
import { PositionCalculator } from '../utils/positionCalculator';
import { generateLinkColors } from '../utils/linkColorAssigner';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'https://cubeapi-production-41a2.up.railway.app'; // Production backend URL

// Reusable fetch function for our backend API
const fetchFromApi = async (endpoint: string, body?: object, method: 'POST' | 'GET' | 'DELETE' | 'PUT' = 'POST', adminToken?: string | null) => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    // Use the admin token if provided, otherwise use the regular user's session token
    const token = adminToken || session?.access_token;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
        method,
        headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BACKEND_URL}/api${endpoint}`, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
        // Create a new Error object and attach the full data payload to it.
        // This allows components to access richer error details like 'generationCount'.
        const error = new Error(errorData.error || `An unknown error occurred on the server.`);
        (error as any).data = errorData;
        throw error;
    }

    // Handle responses that might not have a body (like DELETE)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return {}; // Return empty object for non-json responses
};

export const generateDiagramData = async (prompt: string, userApiKey?: string): Promise<{ diagram: DiagramData; newGenerationCount: number | null; }> => {
    try {
        const responseData = await fetchFromApi('/generate-diagram', { prompt, userApiKey });
        const parsedData = responseData.diagram;

        // Sanitize node and container data to prevent rendering issues from invalid values
        (parsedData.nodes || []).forEach((node: ArchNode) => {
            node.x = parseFloat(String(node.x));
            node.y = parseFloat(String(node.y));
            node.width = parseFloat(String(node.width));
            node.height = parseFloat(String(node.height));

            node.x = isFinite(node.x) ? node.x : 600;
            node.y = isFinite(node.y) ? node.y : 400;
            node.width = isFinite(node.width) && node.width > 10 ? node.width : 150;
            node.height = isFinite(node.height) && node.height > 10 ? node.height : 80;
            if (node.locked === undefined) node.locked = false;

            // Set default border properties if not defined
            if (node.borderStyle === undefined) node.borderStyle = 'solid';
            if (node.borderWidth === undefined) node.borderWidth = 'medium';
            if (node.borderColor === undefined) node.borderColor = '#000000';

            // Auto-sizing safety net to prevent text truncation
            if (node.label && node.type !== 'neuron' && node.type !== 'layer-label') {
                const labelLength = node.label.length;
                // Heuristic to ensure nodes are large enough for their labels.
                if (labelLength > 25) { // For very long labels
                    if (node.width < 180) node.width = 180;
                    if (node.height < 90) node.height = 90;
                } else if (labelLength > 18) { // For moderately long labels
                    if (node.width < 160) node.width = 160;
                }
            }
        });

        (parsedData.containers || []).forEach((container: any) => {
            container.x = parseFloat(container.x);
            container.y = parseFloat(container.y);
            container.width = parseFloat(container.width);
            container.height = parseFloat(container.height);

            container.x = isFinite(container.x) ? container.x : 100;
            container.y = isFinite(container.y) ? container.y : 100;
            container.width = isFinite(container.width) && container.width > 20 ? container.width : 500;
            container.height = isFinite(container.height) && container.height > 20 ? container.height : 500;

            // Set default border properties if not defined
            if (container.borderStyle === undefined) container.borderStyle = 'solid';
            if (container.borderWidth === undefined) container.borderWidth = 'medium';
            if (container.borderColor === undefined) container.borderColor = '#000000';
        });

        // =========================================================================
        // ADVANCED ADAPTIVE ARCHITECTURE LAYOUT SYSTEM
        // Handles small, medium, large, and enterprise architectures intelligently
        // =========================================================================

        const containers = parsedData.containers || [];
        const nodes = parsedData.nodes || [];
        const links = parsedData.links || [];

        // Calculate totals for adaptive sizing
        const totalNodes = nodes.length;
        const totalContainers = containers.length;

        // =========================================================================
        // ADAPTIVE SIZING BASED ON ARCHITECTURE COMPLEXITY
        // =========================================================================

        type ArchitectureSize = 'small' | 'medium' | 'large' | 'enterprise';
        const getArchitectureSize = (): ArchitectureSize => {
            if (totalNodes <= 5 && totalContainers <= 3) return 'small';
            if (totalNodes <= 15 && totalContainers <= 6) return 'medium';
            if (totalNodes <= 30 && totalContainers <= 10) return 'large';
            return 'enterprise';
        };

        const archSize = getArchitectureSize();

        // Adaptive layout parameters based on architecture size
        // PROFESSIONAL SPACING: Generous gaps for clean, readable diagrams
        const layoutParams = {
            small: {
                canvasPadding: 100,      // was 60 - more margin from canvas edge
                containerGap: 60,        // was 30 - doubled for breathing room
                baseNodeHeight: 80,
                baseNodeWidth: 140,
                nodeVerticalGap: 50,     // was 40 - more space between stacked nodes
                containerPadding: 80,    // was 60 - more internal breathing room
                headerHeight: 40,        // was 35 - taller headers
                maxContainersPerRow: 4,
                labelCharWidth: 8
            },
            medium: {
                canvasPadding: 80,       // was 50
                containerGap: 50,        // was 25 - doubled
                baseNodeHeight: 75,
                baseNodeWidth: 150,
                nodeVerticalGap: 45,     // was 35
                containerPadding: 70,    // was 50
                headerHeight: 36,        // was 32
                maxContainersPerRow: 4,  // was 5 - fewer per row = more space
                labelCharWidth: 7.5
            },
            large: {
                canvasPadding: 70,       // was 40
                containerGap: 45,        // was 20 - more than doubled
                baseNodeHeight: 70,
                baseNodeWidth: 140,
                nodeVerticalGap: 40,     // was 30
                containerPadding: 60,    // was 45
                headerHeight: 34,        // was 30
                maxContainersPerRow: 5,  // was 6
                labelCharWidth: 7
            },
            enterprise: {
                canvasPadding: 60,       // was 30 - doubled
                containerGap: 40,        // was 15 - almost tripled
                baseNodeHeight: 65,      // was 60
                baseNodeWidth: 130,      // was 120
                nodeVerticalGap: 35,     // was 25
                containerPadding: 50,    // was 35
                headerHeight: 32,        // was 28
                maxContainersPerRow: 6,  // was 8
                labelCharWidth: 6.5
            }
        };

        const params = layoutParams[archSize];

        // =========================================================================
        // SMART NODE SIZING - Based on label length
        // =========================================================================

        const calculateNodeWidth = (node: ArchNode): number => {
            const labelLength = node.label?.length || 10;
            const calculatedWidth = Math.max(
                params.baseNodeWidth,
                labelLength * params.labelCharWidth + 40 // padding for icon and margins
            );
            return Math.min(calculatedWidth, 250); // Max width cap
        };

        // Pre-calculate node dimensions
        const nodeDimensions = new Map<string, { width: number; height: number }>();
        nodes.forEach(node => {
            nodeDimensions.set(node.id, {
                width: calculateNodeWidth(node),
                height: node.height || params.baseNodeHeight
            });
        });

        // =========================================================================
        // CONTAINER HIERARCHY - Build parent-child relationships
        // =========================================================================

        // Identify root containers (no parent) and nested containers
        const rootContainers = containers.filter(c => !c.parentContainerId);
        const nestedContainers = containers.filter(c => c.parentContainerId);

        // Build container metrics for all containers
        const containerMetrics = containers.map((container, index) => {
            const childNodeIds = container.childNodeIds || [];
            const childNodes = nodes.filter(n => childNodeIds.includes(n.id));
            const nodeCount = childNodes.length;
            const orientation = container.orientation || 'vertical';

            // Find the widest/tallest node in this container based on orientation
            let maxNodeWidth = params.baseNodeWidth;
            let totalNodeWidth = 0;
            childNodes.forEach(node => {
                const dims = nodeDimensions.get(node.id);
                if (dims && dims.width > maxNodeWidth) {
                    maxNodeWidth = dims.width;
                }
                totalNodeWidth += dims?.width || params.baseNodeWidth;
            });

            // Calculate content dimensions based on orientation
            let contentHeight: number;
            let contentWidth: number;

            if (orientation === 'horizontal') {
                // Nodes arranged horizontally
                contentWidth = nodeCount > 0
                    ? totalNodeWidth + (nodeCount - 1) * params.nodeVerticalGap
                    : params.baseNodeWidth;
                contentHeight = params.baseNodeHeight;
            } else if (nodeCount >= 4) {
                // GRID LAYOUT: 2-column arrangement for 4+ nodes
                const columns = 2;
                const rows = Math.ceil(nodeCount / columns);
                contentWidth = (maxNodeWidth * columns) + params.nodeVerticalGap;
                contentHeight = rows * params.baseNodeHeight + (rows - 1) * params.nodeVerticalGap;
            } else {
                // Standard vertical arrangement
                contentHeight = nodeCount > 0
                    ? nodeCount * params.baseNodeHeight + (nodeCount - 1) * params.nodeVerticalGap
                    : params.baseNodeHeight;
                contentWidth = maxNodeWidth;
            }

            // Calculate child containers if this is a parent
            const childContainerMetrics = nestedContainers
                .filter(nc => nc.parentContainerId === container.id)
                .length;

            const containerWidth = contentWidth + params.containerPadding * 2;
            const containerHeight = contentHeight + params.containerPadding * 2 + params.headerHeight;

            return {
                container: {
                    ...container,
                    orientation,
                    nestingLevel: container.parentContainerId ? 1 : 0
                },
                index,
                nodeCount,
                contentHeight,
                contentWidth,
                containerWidth: Math.max(containerWidth, 280),  // was 200 - larger minimum
                containerHeight: Math.max(containerHeight, 200), // was 150 - larger minimum
                childNodeIds,
                maxNodeWidth,
                orientation,
                hasChildContainers: childContainerMetrics > 0,
                isNested: !!container.parentContainerId
            };
        });

        // =========================================================================
        // IDENTIFY STANDALONE NODES - Nodes not in any container
        // =========================================================================

        const allContainedNodeIds = new Set(containers.flatMap(c => c.childNodeIds || []));
        const standaloneNodes = nodes.filter(n => !allContainedNodeIds.has(n.id));
        const containedNodes = nodes.filter(n => allContainedNodeIds.has(n.id));

        // Analyze standalone node positions based on their links
        const standaloneNodePositions = standaloneNodes.map(node => {
            const nodeDims = nodeDimensions.get(node.id) || {
                width: params.baseNodeWidth,
                height: params.baseNodeHeight
            };

            // Check if this node is an entry point (only has outgoing links)
            const incomingLinks = links.filter(l => {
                const targetId = typeof l.target === 'string' ? l.target : l.target.id;
                return targetId === node.id;
            });
            const outgoingLinks = links.filter(l => {
                const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
                return sourceId === node.id;
            });

            let position: 'left' | 'right' | 'bottom' = 'left';
            if (incomingLinks.length === 0 && outgoingLinks.length > 0) {
                position = 'left'; // Entry point
            } else if (outgoingLinks.length === 0 && incomingLinks.length > 0) {
                position = 'right'; // Exit point
            } else {
                position = 'bottom'; // Intermediary
            }

            return {
                node,
                nodeDims,
                position: node.positionHint || position
            };
        });

        // =========================================================================
        // MULTI-ROW LAYOUT - Only for root containers
        // =========================================================================

        const rootContainerMetrics = containerMetrics.filter(m => !m.isNested);
        const maxContainersPerRow = params.maxContainersPerRow;
        const rows: typeof rootContainerMetrics[] = [];

        for (let i = 0; i < rootContainerMetrics.length; i += maxContainersPerRow) {
            rows.push(rootContainerMetrics.slice(i, i + maxContainersPerRow));
        }

        // Calculate row heights (max height in each row)
        const rowHeights = rows.map(row =>
            Math.max(...row.map(m => m.containerHeight), 200)
        );

        // Calculate space for left-side standalone nodes
        const leftStandaloneNodes = standaloneNodePositions.filter(n => n.position === 'left');
        const leftStandaloneWidth = leftStandaloneNodes.length > 0
            ? Math.max(...leftStandaloneNodes.map(n => n.nodeDims.width)) + params.containerGap * 2
            : 0;

        // =========================================================================
        // POSITION CONTAINERS - Multi-row aware with standalone node space
        // =========================================================================

        let globalContainerIndex = 0;
        const positionedContainers = rows.flatMap((row, rowIndex) => {
            let currentX = params.canvasPadding + leftStandaloneWidth;
            const rowY = params.canvasPadding +
                rowHeights.slice(0, rowIndex).reduce((sum, h) => sum + h + params.containerGap * 2, 0);
            const rowHeight = rowHeights[rowIndex];

            return row.map(metrics => {
                const x = currentX;
                currentX += metrics.containerWidth + params.containerGap;
                globalContainerIndex++;

                // Use individual container height, but vertically center within row for alignment
                const actualHeight = metrics.containerHeight;
                const verticalOffset = (rowHeight - actualHeight) / 2;

                return {
                    ...metrics.container,
                    x,
                    y: rowY + verticalOffset, // Vertically center smaller containers
                    width: metrics.containerWidth,
                    height: actualHeight // Use actual height, not max row height
                };
            });
        });

        // Re-map container positions by ID for node positioning
        const containerPositionMap = new Map(
            positionedContainers.map(c => [c.id, c])
        );

        // Calculate total container width for positioning right-side nodes
        const totalContainerWidth = positionedContainers.length > 0
            ? Math.max(...positionedContainers.map(c => c.x + c.width))
            : params.canvasPadding;

        // =========================================================================
        // POSITION STANDALONE NODES - Outside containers
        // =========================================================================

        const positionedStandaloneNodes: ArchNode[] = [];
        const mainRowHeight = rowHeights[0] || 300;
        const containerCenterY = params.canvasPadding + mainRowHeight / 2;

        // Position left-side nodes (entry points)
        const leftNodes = standaloneNodePositions.filter(n => n.position === 'left');
        leftNodes.forEach((nodeInfo, idx) => {
            const totalLeftHeight = leftNodes.length * params.baseNodeHeight +
                (leftNodes.length - 1) * params.nodeVerticalGap;
            const startY = containerCenterY - totalLeftHeight / 2;

            positionedStandaloneNodes.push({
                ...nodeInfo.node,
                x: params.canvasPadding + nodeInfo.nodeDims.width / 2,
                y: startY + idx * (params.baseNodeHeight + params.nodeVerticalGap) + params.baseNodeHeight / 2,
                width: nodeInfo.nodeDims.width,
                height: nodeInfo.nodeDims.height
            });
        });

        // Position right-side nodes (exit points)
        const rightNodes = standaloneNodePositions.filter(n => n.position === 'right');
        rightNodes.forEach((nodeInfo, idx) => {
            const totalRightHeight = rightNodes.length * params.baseNodeHeight +
                (rightNodes.length - 1) * params.nodeVerticalGap;
            const startY = containerCenterY - totalRightHeight / 2;

            positionedStandaloneNodes.push({
                ...nodeInfo.node,
                x: totalContainerWidth + params.containerGap + nodeInfo.nodeDims.width / 2,
                y: startY + idx * (params.baseNodeHeight + params.nodeVerticalGap) + params.baseNodeHeight / 2,
                width: nodeInfo.nodeDims.width,
                height: nodeInfo.nodeDims.height
            });
        });

        // Position bottom nodes
        const bottomNodes = standaloneNodePositions.filter(n => n.position === 'bottom');
        const bottomRowY = params.canvasPadding +
            rowHeights.reduce((sum, h) => sum + h + params.containerGap * 2, 0);
        bottomNodes.forEach((nodeInfo, idx) => {
            positionedStandaloneNodes.push({
                ...nodeInfo.node,
                x: params.canvasPadding + leftStandaloneWidth +
                    idx * (nodeInfo.nodeDims.width + params.containerGap) + nodeInfo.nodeDims.width / 2,
                y: bottomRowY + nodeInfo.nodeDims.height / 2,
                width: nodeInfo.nodeDims.width,
                height: nodeInfo.nodeDims.height
            });
        });

        // =========================================================================
        // POSITION CONTAINED NODES - Centered within containers with orientation
        // =========================================================================

        const positionedContainedNodes = containedNodes.map(node => {
            // Find which container this node belongs to
            const containerMetric = containerMetrics.find(m =>
                m.childNodeIds.includes(node.id)
            );

            const nodeDims = nodeDimensions.get(node.id) || {
                width: params.baseNodeWidth,
                height: params.baseNodeHeight
            };

            if (!containerMetric) {
                return { ...node, width: nodeDims.width, height: nodeDims.height };
            }

            const posContainer = containerPositionMap.get(containerMetric.container.id);
            if (!posContainer) {
                return { ...node, width: nodeDims.width, height: nodeDims.height };
            }

            const nodeIndex = containerMetric.childNodeIds.indexOf(node.id);
            const totalNodes = containerMetric.nodeCount;
            const orientation = containerMetric.orientation;

            if (orientation === 'horizontal') {
                // Horizontal node arrangement
                const containerContentAreaLeft = posContainer.x + params.containerPadding;
                const containerContentAreaRight = posContainer.x + posContainer.width - params.containerPadding;
                const contentAreaWidth = containerContentAreaRight - containerContentAreaLeft;

                const totalNodesWidth = totalNodes * params.baseNodeWidth +
                    (totalNodes - 1) * params.containerGap;
                const startX = containerContentAreaLeft + (contentAreaWidth - totalNodesWidth) / 2;
                const nodeX = startX + nodeIndex * (params.baseNodeWidth + params.containerGap) +
                    params.baseNodeWidth / 2;

                // Center Y
                const centerY = posContainer.y + params.headerHeight +
                    (posContainer.height - params.headerHeight) / 2;

                return {
                    ...node,
                    x: nodeX,
                    y: centerY,
                    width: nodeDims.width,
                    height: nodeDims.height
                };
            } else {
                // ADVANCED: Grid-based layout for containers with 4+ nodes
                const useGridLayout = totalNodes >= 4 && orientation !== 'horizontal';

                if (useGridLayout) {
                    // 2-column grid layout for better space utilization
                    const columns = 2;
                    const rows = Math.ceil(totalNodes / columns);
                    const col = nodeIndex % columns;
                    const row = Math.floor(nodeIndex / columns);

                    const containerContentAreaTop = posContainer.y + params.headerHeight + params.containerPadding;
                    const containerContentAreaLeft = posContainer.x + params.containerPadding;
                    const contentAreaWidth = posContainer.width - params.containerPadding * 2;
                    const contentAreaHeight = posContainer.height - params.headerHeight - params.containerPadding * 2;

                    // Calculate grid cell dimensions
                    const cellWidth = contentAreaWidth / columns;
                    const cellHeight = contentAreaHeight / rows;

                    // Center node within its grid cell
                    const nodeX = containerContentAreaLeft + cellWidth * col + cellWidth / 2;
                    const nodeY = containerContentAreaTop + cellHeight * row + cellHeight / 2;

                    return {
                        ...node,
                        x: nodeX,
                        y: nodeY,
                        width: nodeDims.width,
                        height: nodeDims.height
                    };
                } else {
                    // Standard vertical node arrangement
                    const centerX = posContainer.x + posContainer.width / 2;
                    const containerContentAreaTop = posContainer.y + params.headerHeight + params.containerPadding;
                    const containerContentAreaBottom = posContainer.y + posContainer.height - params.containerPadding;
                    const contentAreaHeight = containerContentAreaBottom - containerContentAreaTop;

                    const totalNodesHeight = totalNodes * params.baseNodeHeight +
                        (totalNodes - 1) * params.nodeVerticalGap;
                    const startY = containerContentAreaTop + (contentAreaHeight - totalNodesHeight) / 2;
                    const nodeY = startY + nodeIndex * (params.baseNodeHeight + params.nodeVerticalGap) +
                        params.baseNodeHeight / 2;

                    return {
                        ...node,
                        x: centerX,
                        y: nodeY,
                        width: nodeDims.width,
                        height: nodeDims.height
                    };
                }
            }
        });

        // Combine all positioned nodes
        const positionedNodes = [...positionedStandaloneNodes, ...positionedContainedNodes];

        // =========================================================================
        // DATA FLOW EMPHASIS - Assign colors and vary thickness by importance
        // =========================================================================

        const linkColorMap = generateLinkColors(links, nodes);

        // Analyze link importance (connections to/from more nodes = more important)
        const nodeConnectionCount = new Map<string, number>();
        links.forEach(link => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;
            nodeConnectionCount.set(sourceId, (nodeConnectionCount.get(sourceId) || 0) + 1);
            nodeConnectionCount.set(targetId, (nodeConnectionCount.get(targetId) || 0) + 1);
        });

        const coloredLinks = links.map((link: Link) => {
            const assignedColor = linkColorMap.get(link.id);
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;

            // Calculate importance: average connections of source and target
            const sourceConns = nodeConnectionCount.get(sourceId) || 1;
            const targetConns = nodeConnectionCount.get(targetId) || 1;
            const importance = (sourceConns + targetConns) / 2;

            // Vary stroke width based on importance (1-4)
            const strokeWidth = Math.min(4, Math.max(1.5, importance * 0.8));

            return {
                ...link,
                color: link.color || assignedColor || '#374151',
                strokeWidth: link.strokeWidth || strokeWidth
            };
        });

        // =========================================================================
        // FINAL OUTPUT
        // =========================================================================

        const updatedDiagram = {
            ...parsedData,
            nodes: positionedNodes,
            containers: positionedContainers,
            links: coloredLinks
        };

        return { diagram: updatedDiagram as DiagramData, newGenerationCount: responseData.newGenerationCount };
    } catch (error) {
        console.error("Error fetching diagram data from backend:", String(error));
        // Re-throw to be caught by the component
        throw error;
    }
};

export const generateNeuralNetworkData = async (prompt: string, userApiKey?: string): Promise<{ diagram: DiagramData; newGenerationCount: number | null; }> => {
    try {
        const responseData = await fetchFromApi('/generate-neural-network', { prompt, userApiKey });
        const parsedData = responseData.diagram;

        // Add dummy geometric properties to satisfy the DiagramData type; these will be calculated by the canvas.
        (parsedData.nodes || []).forEach((node: ArchNode) => {
            node.x = 0;
            node.y = 0;
            node.width = node.type === 'neuron' ? 40 : 100;
            node.height = node.type === 'neuron' ? 40 : 20;
        });

        const diagram = {
            ...parsedData,
            architectureType: 'Neural Network',
        } as DiagramData;

        // Apply intelligent layout positioning based on architecture analysis
        const layoutEngine = new LayoutDecisionEngine();
        const positionCalculator = new PositionCalculator();

        const analysis = layoutEngine.analyzeArchitecture(prompt);
        const layoutConfig = layoutEngine.determineLayout(analysis);

        // Calculate positions based on layout decision
        const relationships = analysis.relationships;
        const positionedResult = positionCalculator.calculatePositions(
            diagram.nodes || [],
            diagram.containers || [],
            relationships,
            layoutConfig,
            analysis
        );

        // Update node positions with calculated positions
        const updatedNodes = (diagram.nodes || []).map(node => {
            const positionedNode = positionedResult.positionedNodes.find(pn => pn.id === node.id);
            if (positionedNode) {
                return {
                    ...node,
                    x: positionedNode.x,
                    y: positionedNode.y,
                    width: positionedNode.width,
                    height: positionedNode.height
                };
            }
            return node;
        });

        // Update container positions with calculated positions
        const updatedContainers = (diagram.containers || []).map(container => {
            const positionedContainer = positionedResult.positionedContainers.find(pc => pc.id === container.id);
            if (positionedContainer) {
                return {
                    ...container,
                    x: positionedContainer.x,
                    y: positionedContainer.y,
                    width: positionedContainer.width,
                    height: positionedContainer.height
                };
            }
            return container;
        });

        const updatedDiagram = {
            ...diagram,
            nodes: updatedNodes,
            containers: updatedContainers
        };

        return { diagram: updatedDiagram, newGenerationCount: responseData.newGenerationCount };
    } catch (error) {
        console.error("Error fetching neural network data from backend:", String(error));
        throw error;
    }
};



export const explainArchitecture = async (diagramData: DiagramData, userApiKey?: string): Promise<string> => {
    try {
        const { explanation } = await fetchFromApi('/explain-architecture', { diagramData, userApiKey });
        return explanation;
    } catch (error) {
        console.error("Error fetching explanation from backend:", String(error));
        throw error;
    }
};

export const chatWithAssistant = async (history: Content[], userApiKey?: string): Promise<string> => {
    try {
        const { response } = await fetchFromApi('/chat', { history, userApiKey });
        return response;
    } catch (error) {
        console.error("Error fetching chat response from backend:", String(error));
        throw error;
    }
};

// --- Payment & Plan Services ---

export const verifyPaymentStatus = async (subscriptionId: string): Promise<{ success: boolean, message?: string }> => {
    try {
        // This can return a 202 "not yet confirmed" status, which is not an error.
        const result = await fetchFromApi('/verify-payment-status', { subscriptionId }, 'POST');
        return result;
    } catch (error) {
        console.error("Error verifying payment status via API call:", String(error));
        // Treat an API error (like 500) as a failure.
        return { success: false, message: (error as Error).message };
    }
};

export const recoverPaymentByPaymentId = async (paymentId: string): Promise<{ success: boolean, message?: string }> => {
    try {
        const result = await fetchFromApi('/recover-by-payment-id', { paymentId }, 'POST');
        return result;
    } catch (error) {
        console.error("Error recovering payment via payment ID:", String(error));
        return { success: false, message: (error as Error).message };
    }
};


// --- User Plan & API Key Management Services ---

export const getActiveUserPlans = async (): Promise<any[]> => {
    try {
        const { plans } = await fetchFromApi('/user/active-plans', undefined, 'GET');
        return plans || [];
    } catch (error) {
        console.error("Error fetching user's active plans:", String(error));
        throw error;
    }
};

export const switchUserPlan = async (subscriptionId: string): Promise<void> => {
    try {
        await fetchFromApi('/user/switch-plan', { subscriptionId }, 'POST');
    } catch (error) {
        console.error("Error switching user plan:", String(error));
        throw error;
    }
};

export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
    try {
        await fetchFromApi('/user/cancel-subscription', { subscriptionId }, 'POST');
    } catch (error) {
        console.error("Error canceling subscription:", String(error));
        throw error;
    }
};


export const getUserApiKey = async (): Promise<string | null> => {
    try {
        const { apiKey } = await fetchFromApi('/user/api-key', undefined, 'GET');
        return apiKey;
    } catch (error) {
        console.error("Error fetching user API key:", String(error));
        throw error;
    }
};

export const generateUserApiKey = async (): Promise<string> => {
    try {
        const { apiKey } = await fetchFromApi('/user/api-key', {}, 'POST');
        if (!apiKey) throw new Error("API key was not returned from the server.");
        return apiKey;
    } catch (error) {
        console.error("Error generating user API key:", String(error));
        throw error;
    }
};

export const revokeUserApiKey = async (): Promise<void> => {
    try {
        await fetchFromApi('/user/api-key', undefined, 'DELETE');
    } catch (error) {
        console.error("Error revoking user API key:", String(error));
        throw error;
    }
};

// --- Admin Services ---

export const adminLogin = async (email: string, password: string): Promise<string> => {
    try {
        const { token } = await fetchFromApi('/admin/login', { email, password });
        if (!token) throw new Error("Login failed, no token received.");
        return token;
    } catch (error) {
        console.error("Error during admin login:", String(error));
        throw error;
    }
};

export const adminLogout = async (token: string): Promise<void> => {
    try {
        await fetchFromApi('/admin/logout', {}, 'POST', token);
    } catch (error) {
        console.error("Error during admin logout:", String(error));
        // Don't re-throw, as logout should succeed client-side even if server fails
    }
};

export const getAdminConfig = async (adminToken: string): Promise<any> => {
    try {
        return await fetchFromApi('/admin/config', undefined, 'GET', adminToken);
    } catch (error) {
        console.error("Error fetching admin config:", String(error));
        throw error;
    }
};

export const updateAdminConfig = async (config: any, adminToken: string): Promise<void> => {
    try {
        await fetchFromApi('/admin/config', { config }, 'POST', adminToken);
    } catch (error) {
        console.error("Error updating admin config:", String(error));
        throw error;
    }
};

export const getAdminUsers = async (adminToken: string, email?: string): Promise<any[]> => {
    try {
        const endpoint = email ? `/admin/users?email=${encodeURIComponent(email)}` : '/admin/users';
        return await fetchFromApi(endpoint, undefined, 'GET', adminToken);
    } catch (error) {
        console.error("Error fetching admin users:", String(error));
        throw error;
    }
};

export const adminUpdateUserPlan = async (userId: string, newPlan: string, adminToken: string): Promise<{ requiresRefresh?: boolean }> => {
    try {
        const response = await fetchFromApi(`/admin/users/${userId}/update-plan`, { newPlan }, 'POST', adminToken);
        return response;
    } catch (error) {
        console.error("Error updating user plan via admin service:", String(error));
        throw error;
    }
};

// --- NEW BLOG SERVICES ---

// Helper function to convert a file to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // result is "data:image/png;base64,iVBORw0KGgo..."
            // we only want the part after the comma
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
};

// --- Public Blog Services ---
export const getPublishedBlogPosts = async (): Promise<BlogPost[]> => {
    try {
        return await fetchFromApi('/blog/posts', undefined, 'GET');
    } catch (error) {
        console.error("Error fetching published blog posts:", String(error));
        throw error;
    }
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost> => {
    try {
        return await fetchFromApi(`/blog/posts/${slug}`, undefined, 'GET');
    } catch (error) {
        console.error(`Error fetching blog post with slug ${slug}:`, String(error));
        throw error;
    }
};

// --- Admin Blog Services ---
export const getAdminBlogPosts = async (adminToken: string): Promise<BlogPost[]> => {
    try {
        return await fetchFromApi('/admin/blog/posts', undefined, 'GET', adminToken);
    } catch (error) {
        console.error("Error fetching admin blog posts:", String(error));
        throw error;
    }
};

export const createBlogPost = async (postData: Partial<BlogPost>, adminToken: string): Promise<BlogPost> => {
    try {
        return await fetchFromApi('/admin/blog/posts', postData, 'POST', adminToken);
    } catch (error) {
        console.error("Error creating blog post:", String(error));
        throw error;
    }
};

export const updateBlogPost = async (postId: string, postData: Partial<BlogPost>, adminToken: string): Promise<BlogPost> => {
    try {
        return await fetchFromApi(`/admin/blog/posts/${postId}`, postData, 'PUT', adminToken);
    } catch (error) {
        console.error(`Error updating blog post ${postId}:`, String(error));
        throw error;
    }
};

export const deleteBlogPost = async (postId: string, adminToken: string): Promise<void> => {
    try {
        await fetchFromApi(`/admin/blog/posts/${postId}`, undefined, 'DELETE', adminToken);
    } catch (error) {
        console.error(`Error deleting blog post ${postId}:`, String(error));
        throw error;
    }
};

export const uploadBlogImage = async (file: File, adminToken: string): Promise<{ publicUrl: string }> => {
    try {
        const base64Data = await fileToBase64(file);
        return await fetchFromApi('/admin/blog/upload-image', {
            fileName: file.name,
            fileType: file.type,
            base64Data
        }, 'POST', adminToken);
    } catch (error) {
        console.error("Error uploading blog image:", String(error));
        throw error;
    }
};
