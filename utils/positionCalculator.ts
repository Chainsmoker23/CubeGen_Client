/**
 * PositionCalculator - Advanced positioning engine for architecture diagrams
 * 
 * Implements ELK-inspired layered layout algorithms with:
 * - Smart layer assignment based on data flow
 * - Container-aware node centering
 * - Dynamic spacing calculations
 * - Collision detection and prevention
 */

import { ArchNode, Container } from '../types';
import {
    ArchitectureAnalysis,
    LayoutConfig,
    RelationshipInfo,
    LayoutStrategy
} from './layoutDecisionEngine';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PositionedNode extends ArchNode {
    layer: number;
    orderInLayer: number;
    containerId?: string;
}

export interface PositionedContainer extends Container {
    layer?: number;
    calculatedBounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
}

export interface EdgeRoute {
    id: string;
    sourceId: string;
    targetId: string;
    points: Array<{ x: number; y: number }>;
    type: 'straight' | 'orthogonal' | 'curved';
}

export interface PositionedResult {
    positionedNodes: PositionedNode[];
    positionedContainers: PositionedContainer[];
    edgeRoutes: EdgeRoute[];
    canvasBounds: { width: number; height: number };
}

// ============================================================================
// POSITION CALCULATOR CLASS
// ============================================================================

export class PositionCalculator {

    private readonly DEFAULT_NODE_WIDTH = 150;
    private readonly DEFAULT_NODE_HEIGHT = 80;
    private readonly CANVAS_PADDING = 100;
    private readonly CONTAINER_HEADER_HEIGHT = 40;

    /**
     * Main entry point - calculates positions for all elements
     */
    calculatePositions(
        nodes: ArchNode[],
        containers: Container[],
        relationships: RelationshipInfo[],
        layoutConfig: LayoutConfig,
        analysis: ArchitectureAnalysis
    ): PositionedResult {

        // Handle empty input
        if (!nodes || nodes.length === 0) {
            return {
                positionedNodes: [],
                positionedContainers: containers.map(c => this.createDefaultContainerPosition(c)),
                edgeRoutes: [],
                canvasBounds: { width: 1200, height: 800 }
            };
        }

        // Step 1: Assign nodes to layers
        const layeredNodes = this.assignNodesToLayers(nodes, containers, relationships, layoutConfig, analysis);

        // Step 2: Order nodes within each layer to minimize crossings (optional optimization)
        const orderedNodes = this.orderNodesInLayers(layeredNodes, relationships);

        // Step 3: Calculate actual positions based on layout strategy
        const positionedNodes = this.calculateNodePositions(orderedNodes, layoutConfig, analysis);

        // Step 4: Size and position containers based on their children
        const positionedContainers = this.calculateContainerPositions(containers, positionedNodes, layoutConfig);

        // Step 5: Center nodes within their containers
        const centeredNodes = this.centerNodesInContainers(positionedNodes, positionedContainers);

        // Step 6: Calculate canvas bounds
        const canvasBounds = this.calculateCanvasBounds(centeredNodes, positionedContainers);

        // Step 7: Calculate edge routes (simplified - just use node centers)
        const edgeRoutes = this.calculateEdgeRoutes(centeredNodes, relationships, layoutConfig);

        return {
            positionedNodes: centeredNodes,
            positionedContainers,
            edgeRoutes,
            canvasBounds
        };
    }

    // ============================================================================
    // LAYER ASSIGNMENT
    // ============================================================================

    private assignNodesToLayers(
        nodes: ArchNode[],
        containers: Container[],
        relationships: RelationshipInfo[],
        layoutConfig: LayoutConfig,
        analysis: ArchitectureAnalysis
    ): PositionedNode[] {

        // Create a map of container to layer (based on container order)
        const containerLayerMap = new Map<string, number>();
        containers.forEach((container, index) => {
            containerLayerMap.set(container.id, index);
        });

        // Assign nodes to layers based on their container
        return nodes.map(node => {
            // Find which container this node belongs to
            let nodeLayer = 0;
            let containerId: string | undefined;

            for (const container of containers) {
                if (container.childNodeIds?.includes(node.id)) {
                    nodeLayer = containerLayerMap.get(container.id) || 0;
                    containerId = container.id;
                    break;
                }
            }

            // If no container, try to infer layer from node position or type
            if (!containerId) {
                nodeLayer = this.inferLayerFromNodeType(node, analysis);
            }

            return {
                ...node,
                layer: nodeLayer,
                orderInLayer: 0, // Will be set in ordering phase
                containerId
            } as PositionedNode;
        });
    }

    private inferLayerFromNodeType(node: ArchNode, analysis: ArchitectureAnalysis): number {
        const nodeType = node.type.toLowerCase();
        const nodeLabel = node.label.toLowerCase();

        // Input/User layer (leftmost)
        if (/user|client|browser|mobile|frontend/.test(nodeType) ||
            /user|client/.test(nodeLabel)) {
            return 0;
        }

        // Application/Processing layer
        if (/service|api|gateway|handler|controller/.test(nodeType) ||
            /chatbot|application|app/.test(nodeLabel)) {
            return 1;
        }

        // Data/Storage layer
        if (/database|db|storage|cache|vector|embed/.test(nodeType) ||
            /database|storage|retrieval/.test(nodeLabel)) {
            return 2;
        }

        // Output/Generation layer (rightmost for RAG)
        if (/llm|gpt|gemini|generation|output/.test(nodeType) ||
            /llm|generation|output/.test(nodeLabel)) {
            return 3;
        }

        return 1; // Default to middle layer
    }

    // ============================================================================
    // NODE ORDERING WITHIN LAYERS
    // ============================================================================

    private orderNodesInLayers(
        nodes: PositionedNode[],
        relationships: RelationshipInfo[]
    ): PositionedNode[] {
        // Group nodes by layer
        const layerGroups = new Map<number, PositionedNode[]>();

        nodes.forEach(node => {
            const layer = node.layer;
            if (!layerGroups.has(layer)) {
                layerGroups.set(layer, []);
            }
            layerGroups.get(layer)!.push(node);
        });

        // Order nodes within each layer
        const orderedNodes: PositionedNode[] = [];

        layerGroups.forEach((layerNodes, layer) => {
            layerNodes.forEach((node, index) => {
                orderedNodes.push({
                    ...node,
                    orderInLayer: index
                });
            });
        });

        return orderedNodes;
    }

    // ============================================================================
    // POSITION CALCULATION
    // ============================================================================

    private calculateNodePositions(
        nodes: PositionedNode[],
        layoutConfig: LayoutConfig,
        analysis: ArchitectureAnalysis
    ): PositionedNode[] {

        const { spacing, direction, strategy } = layoutConfig;

        // Group nodes by layer
        const layerGroups = new Map<number, PositionedNode[]>();
        nodes.forEach(node => {
            const layer = node.layer;
            if (!layerGroups.has(layer)) {
                layerGroups.set(layer, []);
            }
            layerGroups.get(layer)!.push(node);
        });

        const positionedNodes: PositionedNode[] = [];
        const layers = Array.from(layerGroups.keys()).sort((a, b) => a - b);

        layers.forEach((layer, layerIndex) => {
            const layerNodes = layerGroups.get(layer)!;

            layerNodes.forEach((node, nodeIndex) => {
                const position = this.calculateSingleNodePosition(
                    node,
                    layerIndex,
                    nodeIndex,
                    layerNodes.length,
                    layers.length,
                    layoutConfig,
                    strategy
                );

                positionedNodes.push({
                    ...node,
                    x: position.x,
                    y: position.y,
                    width: node.width || this.DEFAULT_NODE_WIDTH,
                    height: node.height || this.DEFAULT_NODE_HEIGHT
                });
            });
        });

        return positionedNodes;
    }

    private calculateSingleNodePosition(
        node: PositionedNode,
        layerIndex: number,
        nodeIndex: number,
        nodesInLayer: number,
        totalLayers: number,
        config: LayoutConfig,
        strategy: LayoutStrategy
    ): { x: number; y: number } {

        const { spacing } = config;
        const nodeWidth = node.width || this.DEFAULT_NODE_WIDTH;
        const nodeHeight = node.height || this.DEFAULT_NODE_HEIGHT;

        // Calculate positions based on strategy
        switch (strategy) {
            case 'swimlane':
            case 'tiered':
                // Horizontal layout - layers go left to right
                return this.calculateSwimLanePosition(
                    layerIndex, nodeIndex, nodesInLayer,
                    nodeWidth, nodeHeight, spacing
                );

            case 'layered':
                // Vertical layout - layers go top to bottom
                return this.calculateLayeredPosition(
                    layerIndex, nodeIndex, nodesInLayer,
                    nodeWidth, nodeHeight, spacing
                );

            case 'pipeline':
                // Linear horizontal layout
                return this.calculatePipelinePosition(
                    layerIndex, nodeIndex, nodesInLayer,
                    nodeWidth, nodeHeight, spacing
                );

            case 'hub-spoke':
            case 'radial':
                // Radial layout with center hub
                return this.calculateRadialPosition(
                    layerIndex, nodeIndex, nodesInLayer, totalLayers,
                    nodeWidth, nodeHeight, spacing
                );

            case 'clustered':
                // Clustered grid layout
                return this.calculateClusteredPosition(
                    node, layerIndex, nodeIndex, nodesInLayer,
                    nodeWidth, nodeHeight, spacing
                );

            case 'grid':
            default:
                return this.calculateGridPosition(
                    layerIndex, nodeIndex, nodesInLayer,
                    nodeWidth, nodeHeight, spacing
                );
        }
    }

    // ============================================================================
    // STRATEGY-SPECIFIC POSITIONING
    // ============================================================================

    private calculateSwimLanePosition(
        layerIndex: number,
        nodeIndex: number,
        nodesInLayer: number,
        nodeWidth: number,
        nodeHeight: number,
        spacing: LayoutConfig['spacing']
    ): { x: number; y: number } {
        // Horizontal lanes - containers as vertical columns
        const containerWidth = 200; // Base container width
        const layerGap = spacing.layerGap;

        // X position based on layer (left to right)
        const x = this.CANVAS_PADDING + layerIndex * (containerWidth + layerGap) + containerWidth / 2;

        // Y position - center nodes vertically within container
        const totalHeight = nodesInLayer * (nodeHeight + spacing.nodeVertical) - spacing.nodeVertical;
        const startY = this.CANVAS_PADDING + this.CONTAINER_HEADER_HEIGHT + 50;
        const y = startY + totalHeight / 2 - (totalHeight / 2) + nodeIndex * (nodeHeight + spacing.nodeVertical) + nodeHeight / 2;

        return { x, y };
    }

    private calculateLayeredPosition(
        layerIndex: number,
        nodeIndex: number,
        nodesInLayer: number,
        nodeWidth: number,
        nodeHeight: number,
        spacing: LayoutConfig['spacing']
    ): { x: number; y: number } {
        // Vertical layers - top to bottom
        const rowHeight = 150;

        // Y position based on layer (top to bottom)
        const y = this.CANVAS_PADDING + layerIndex * (rowHeight + spacing.layerGap) + rowHeight / 2;

        // X position - center nodes horizontally within layer
        const totalWidth = nodesInLayer * (nodeWidth + spacing.nodeHorizontal) - spacing.nodeHorizontal;
        const startX = this.CANVAS_PADDING + totalWidth / 2 - totalWidth / 2;
        const x = startX + nodeIndex * (nodeWidth + spacing.nodeHorizontal) + nodeWidth / 2;

        return { x, y };
    }

    private calculatePipelinePosition(
        layerIndex: number,
        nodeIndex: number,
        nodesInLayer: number,
        nodeWidth: number,
        nodeHeight: number,
        spacing: LayoutConfig['spacing']
    ): { x: number; y: number } {
        // Linear left-to-right flow
        const x = this.CANVAS_PADDING + layerIndex * (nodeWidth + spacing.layerGap) + nodeWidth / 2;

        // Single row or stacked if multiple nodes in same layer
        const baseY = 400; // Center vertically
        const y = baseY + (nodeIndex - (nodesInLayer - 1) / 2) * (nodeHeight + spacing.nodeVertical);

        return { x, y };
    }

    private calculateRadialPosition(
        layerIndex: number,
        nodeIndex: number,
        nodesInLayer: number,
        totalLayers: number,
        nodeWidth: number,
        nodeHeight: number,
        spacing: LayoutConfig['spacing']
    ): { x: number; y: number } {
        const centerX = 600;
        const centerY = 400;

        // First layer is the hub (center)
        if (layerIndex === 0) {
            // Center position for hub nodes
            const hubOffset = (nodeIndex - (nodesInLayer - 1) / 2) * (nodeHeight + 20);
            return { x: centerX, y: centerY + hubOffset };
        }

        // Outer layers arranged in a circle
        const radius = 200 + (layerIndex - 1) * 150;
        const angleStart = -Math.PI / 2; // Start from top
        const angleSpan = 2 * Math.PI;

        // Calculate total nodes in outer layers for proper distribution
        const angle = angleStart + (nodeIndex / Math.max(nodesInLayer, 1)) * angleSpan;

        return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        };
    }

    private calculateClusteredPosition(
        node: PositionedNode,
        layerIndex: number,
        nodeIndex: number,
        nodesInLayer: number,
        nodeWidth: number,
        nodeHeight: number,
        spacing: LayoutConfig['spacing']
    ): { x: number; y: number } {
        // Clustered layout - group related nodes
        const clusterWidth = 300;
        const clusterHeight = 250;
        const clustersPerRow = 3;

        const clusterRow = Math.floor(layerIndex / clustersPerRow);
        const clusterCol = layerIndex % clustersPerRow;

        const clusterX = this.CANVAS_PADDING + clusterCol * (clusterWidth + spacing.layerGap);
        const clusterY = this.CANVAS_PADDING + clusterRow * (clusterHeight + spacing.layerGap);

        // Position nodes within cluster
        const nodesPerRow = 2;
        const nodeRow = Math.floor(nodeIndex / nodesPerRow);
        const nodeCol = nodeIndex % nodesPerRow;

        return {
            x: clusterX + 50 + nodeCol * (nodeWidth + 30) + nodeWidth / 2,
            y: clusterY + 50 + nodeRow * (nodeHeight + 30) + nodeHeight / 2
        };
    }

    private calculateGridPosition(
        layerIndex: number,
        nodeIndex: number,
        nodesInLayer: number,
        nodeWidth: number,
        nodeHeight: number,
        spacing: LayoutConfig['spacing']
    ): { x: number; y: number } {
        const gridCols = 4;
        const totalIndex = layerIndex * 10 + nodeIndex; // Flatten

        const col = totalIndex % gridCols;
        const row = Math.floor(totalIndex / gridCols);

        return {
            x: this.CANVAS_PADDING + col * (nodeWidth + spacing.nodeHorizontal) + nodeWidth / 2,
            y: this.CANVAS_PADDING + row * (nodeHeight + spacing.nodeVertical) + nodeHeight / 2
        };
    }

    // ============================================================================
    // CONTAINER POSITIONING
    // ============================================================================

    private calculateContainerPositions(
        containers: Container[],
        nodes: PositionedNode[],
        layoutConfig: LayoutConfig
    ): PositionedContainer[] {

        return containers.map((container, containerIndex) => {
            // Find all nodes that belong to this container
            const childNodes = nodes.filter(n => n.containerId === container.id ||
                container.childNodeIds?.includes(n.id));

            if (childNodes.length === 0) {
                // No children - create default positioned container
                return this.createDefaultContainerPosition(container, containerIndex, layoutConfig);
            }

            // Calculate bounding box of child nodes
            const bounds = this.calculateBoundingBox(childNodes);

            // Add padding and header space
            const padding = layoutConfig.spacing.containerPadding;

            return {
                ...container,
                x: bounds.minX - padding,
                y: bounds.minY - padding - this.CONTAINER_HEADER_HEIGHT,
                width: bounds.maxX - bounds.minX + padding * 2,
                height: bounds.maxY - bounds.minY + padding * 2 + this.CONTAINER_HEADER_HEIGHT,
                calculatedBounds: bounds
            } as PositionedContainer;
        });
    }

    private createDefaultContainerPosition(
        container: Container,
        containerIndex: number = 0,
        layoutConfig?: LayoutConfig
    ): PositionedContainer {
        const defaultWidth = 200;
        const defaultHeight = 300;
        const gap = layoutConfig?.spacing.layerGap || 50;

        return {
            ...container,
            x: this.CANVAS_PADDING + containerIndex * (defaultWidth + gap),
            y: this.CANVAS_PADDING,
            width: defaultWidth,
            height: defaultHeight,
            calculatedBounds: {
                minX: this.CANVAS_PADDING + containerIndex * (defaultWidth + gap),
                minY: this.CANVAS_PADDING,
                maxX: this.CANVAS_PADDING + containerIndex * (defaultWidth + gap) + defaultWidth,
                maxY: this.CANVAS_PADDING + defaultHeight
            }
        };
    }

    private calculateBoundingBox(nodes: PositionedNode[]): {
        minX: number; minY: number; maxX: number; maxY: number;
    } {
        if (nodes.length === 0) {
            return { minX: 0, minY: 0, maxX: 200, maxY: 200 };
        }

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        nodes.forEach(node => {
            const halfWidth = (node.width || this.DEFAULT_NODE_WIDTH) / 2;
            const halfHeight = (node.height || this.DEFAULT_NODE_HEIGHT) / 2;

            minX = Math.min(minX, node.x - halfWidth);
            minY = Math.min(minY, node.y - halfHeight);
            maxX = Math.max(maxX, node.x + halfWidth);
            maxY = Math.max(maxY, node.y + halfHeight);
        });

        return { minX, minY, maxX, maxY };
    }

    // ============================================================================
    // CENTERING & ALIGNMENT
    // ============================================================================

    private centerNodesInContainers(
        nodes: PositionedNode[],
        containers: PositionedContainer[]
    ): PositionedNode[] {

        return nodes.map(node => {
            // Find the container for this node
            const container = containers.find(c =>
                c.childNodeIds?.includes(node.id) || node.containerId === c.id
            );

            if (!container) {
                return node;
            }

            // Calculate container center (accounting for header)
            const containerCenterX = container.x + container.width / 2;
            const containerContentCenterY = container.y + this.CONTAINER_HEADER_HEIGHT +
                (container.height - this.CONTAINER_HEADER_HEIGHT) / 2;

            // Get all nodes in this container
            const siblingsInContainer = nodes.filter(n =>
                container.childNodeIds?.includes(n.id) || n.containerId === container.id
            );

            // Calculate current center of nodes in container
            const siblingBounds = this.calculateBoundingBox(siblingsInContainer as PositionedNode[]);
            const currentCenterX = (siblingBounds.minX + siblingBounds.maxX) / 2;
            const currentCenterY = (siblingBounds.minY + siblingBounds.maxY) / 2;

            // Calculate offset to center
            const offsetX = containerCenterX - currentCenterX;
            const offsetY = containerContentCenterY - currentCenterY;

            // Apply offset to center nodes within container
            return {
                ...node,
                x: node.x + offsetX,
                y: node.y + offsetY
            };
        });
    }

    // ============================================================================
    // CANVAS BOUNDS & EDGE ROUTING
    // ============================================================================

    private calculateCanvasBounds(
        nodes: PositionedNode[],
        containers: PositionedContainer[]
    ): { width: number; height: number } {
        let maxX = 1200;
        let maxY = 800;

        nodes.forEach(node => {
            const nodeRight = node.x + (node.width || this.DEFAULT_NODE_WIDTH) / 2;
            const nodeBottom = node.y + (node.height || this.DEFAULT_NODE_HEIGHT) / 2;
            maxX = Math.max(maxX, nodeRight + this.CANVAS_PADDING);
            maxY = Math.max(maxY, nodeBottom + this.CANVAS_PADDING);
        });

        containers.forEach(container => {
            const containerRight = container.x + container.width;
            const containerBottom = container.y + container.height;
            maxX = Math.max(maxX, containerRight + this.CANVAS_PADDING);
            maxY = Math.max(maxY, containerBottom + this.CANVAS_PADDING);
        });

        return {
            width: Math.max(1200, maxX),
            height: Math.max(800, maxY)
        };
    }

    private calculateEdgeRoutes(
        nodes: PositionedNode[],
        relationships: RelationshipInfo[],
        layoutConfig: LayoutConfig
    ): EdgeRoute[] {
        // Simplified edge routing - just use node centers
        // In a full implementation, this would calculate orthogonal paths
        return relationships.map(rel => {
            const sourceNode = nodes.find(n => n.id === rel.source);
            const targetNode = nodes.find(n => n.id === rel.target);

            if (!sourceNode || !targetNode) {
                return {
                    id: `${rel.source}-${rel.target}`,
                    sourceId: rel.source,
                    targetId: rel.target,
                    points: [],
                    type: 'straight' as const
                };
            }

            return {
                id: `${rel.source}-${rel.target}`,
                sourceId: rel.source,
                targetId: rel.target,
                points: [
                    { x: sourceNode.x, y: sourceNode.y },
                    { x: targetNode.x, y: targetNode.y }
                ],
                type: layoutConfig.edgeRouting as 'straight' | 'orthogonal' | 'curved'
            };
        });
    }
}

// Export singleton for convenience
export const positionCalculator = new PositionCalculator();
