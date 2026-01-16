/**
 * StructuredLayoutEngine - Creative, organized layout system for architecture diagrams
 * Focuses on structured placement with proper container/node organization
 */

import { ArchNode, Container, Link } from '../types';

export interface StructuredLayoutConfig {
  algorithm: 'grid-organized' | 'tier-structured' | 'container-clustered' | 'flow-sequential' | 'hierarchical-logical';
  containerSpacing: number;
  nodeSpacing: number;
  tierSpacing: number;
  maxNodesPerRow: number;
  maxNodesPerContainer: number;
  organizeByType: boolean;
  organizeByConnection: boolean;
  forceSymmetry: boolean;
  useQuadrants: boolean;
  centerOfGravity: boolean;
}

export interface NodePlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  containerId?: string;
  tier?: number;
  quadrant?: number;
}

export interface ContainerPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tier?: number;
  quadrant?: number;
}

export class StructuredLayoutEngine {
  
  /**
   * Creates a structured, organized layout for architecture diagrams
   */
  public createStructuredLayout(
    nodes: ArchNode[],
    containers: Container[],
    links: Link[]
  ): { nodePlacements: NodePlacement[], containerPlacements: ContainerPlacement[] } {
    
    // Analyze the architecture to determine best organization strategy
    const analysis = this.analyzeStructure(nodes, containers, links);
    const config = this.generateLayoutConfig(analysis);
    
    // Create structured layout based on analysis
    const { nodePlacements, containerPlacements } = this.applyStructuredLayout(
      nodes, containers, links, config
    );
    
    return { nodePlacements, containerPlacements };
  }

  private analyzeStructure(nodes: ArchNode[], containers: Container[], links: Link[]) {
    return {
      nodeCount: nodes.length,
      containerCount: containers.length,
      linkCount: links.length,
      hasContainers: containers.length > 0,
      isLinear: this.isLinearFlow(links, nodes),
      hasCentralNode: this.hasCentralHub(links),
      complexity: this.estimateComplexity(nodes, links),
      connectionDensity: links.length / Math.max(1, nodes.length),
      containerDensity: containers.length / Math.max(1, nodes.length)
    };
  }

  private isLinearFlow(links: Link[], nodes: ArchNode[]): boolean {
    // Check if architecture has a linear flow (e.g., ETL, pipeline)
    const nodeDegrees: Record<string, number> = {};
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      nodeDegrees[sourceId] = (nodeDegrees[sourceId] || 0) + 1;
      nodeDegrees[targetId] = (nodeDegrees[targetId] || 0) + 1;
    });
    
    // Linear if most nodes have degree 1 or 2 (except start/end nodes)
    const degreeCounts = Object.values(nodeDegrees);
    const linearRatio = degreeCounts.filter(deg => deg <= 2).length / degreeCounts.length;
    
    return linearRatio > 0.7;
  }

  private hasCentralHub(links: Link[]): boolean {
    // Check if there's a central hub/spoke pattern
    const nodeConnections: Record<string, number> = {};
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      nodeConnections[sourceId] = (nodeConnections[sourceId] || 0) + 1;
      nodeConnections[targetId] = (nodeConnections[targetId] || 0) + 1;
    });
    
    // Check if any node has significantly more connections than others
    const maxConnections = Math.max(...Object.values(nodeConnections));
    const avgConnections = Object.values(nodeConnections).reduce((a, b) => a + b, 0) / Object.keys(nodeConnections).length;
    
    return maxConnections > avgConnections * 1.5 && maxConnections >= 3;
  }

  private estimateComplexity(nodes: ArchNode[], links: Link[]): 'simple' | 'moderate' | 'complex' {
    const nodeCount = nodes.length;
    const linkCount = links.length;
    const avgConnections = linkCount / Math.max(1, nodeCount);
    
    if (nodeCount <= 5 && avgConnections <= 1.5) return 'simple';
    if (nodeCount <= 12 && avgConnections <= 2.5) return 'moderate';
    return 'complex';
  }

  private generateLayoutConfig(analysis: any): StructuredLayoutConfig {
    // Select algorithm based on architecture characteristics
    let algorithm: StructuredLayoutConfig['algorithm'] = 'grid-organized';
    
    if (analysis.isLinear) {
      algorithm = 'flow-sequential';
    } else if (analysis.hasCentralNode) {
      algorithm = 'hierarchical-logical';
    } else if (analysis.containerCount > 0) {
      algorithm = 'container-clustered';
    } else if (analysis.complexity === 'complex') {
      algorithm = 'tier-structured';
    }
    
    // Configure spacing and organization based on complexity
    const baseSpacing = 150;
    const complexityFactor = analysis.complexity === 'complex' ? 1.5 : 
                           analysis.complexity === 'moderate' ? 1.2 : 1.0;
    
    return {
      algorithm,
      containerSpacing: baseSpacing * complexityFactor,
      nodeSpacing: 120 * complexityFactor,
      tierSpacing: 200 * complexityFactor,
      maxNodesPerRow: analysis.complexity === 'complex' ? 4 : 6,
      maxNodesPerContainer: analysis.complexity === 'complex' ? 6 : 8,
      organizeByType: true,
      organizeByConnection: true,
      forceSymmetry: analysis.hasCentralNode,
      useQuadrants: analysis.complexity === 'complex',
      centerOfGravity: !analysis.isLinear
    };
  }

  private applyStructuredLayout(
    nodes: ArchNode[],
    containers: Container[],
    links: Link[],
    config: StructuredLayoutConfig
  ): { nodePlacements: NodePlacement[], containerPlacements: ContainerPlacement[] } {
    
    switch (config.algorithm) {
      case 'flow-sequential':
        return this.applySequentialFlowLayout(nodes, containers, links, config);
      case 'hierarchical-logical':
        return this.applyHierarchicalLogicalLayout(nodes, containers, links, config);
      case 'container-clustered':
        return this.applyContainerClusteredLayout(nodes, containers, links, config);
      case 'tier-structured':
        return this.applyTierStructuredLayout(nodes, containers, links, config);
      case 'grid-organized':
      default:
        return this.applyGridOrganizedLayout(nodes, containers, links, config);
    }
  }

  private applyGridOrganizedLayout(
    nodes: ArchNode[],
    containers: Container[],
    links: Link[],
    config: StructuredLayoutConfig
  ): { nodePlacements: NodePlacement[], containerPlacements: ContainerPlacement[] } {
    
    const nodePlacements: NodePlacement[] = [];
    const containerPlacements: ContainerPlacement[] = [];
    
    // Organize nodes by type if specified
    const nodesByType: Record<string, ArchNode[]> = {};
    if (config.organizeByType) {
      nodes.forEach(node => {
        if (!nodesByType[node.type]) nodesByType[node.type] = [];
        nodesByType[node.type].push(node);
      });
    } else {
      nodesByType['default'] = [...nodes];
    }
    
    let currentX = 100;
    let currentY = 100;
    let row = 0;
    
    // Place nodes in organized grid
    Object.values(nodesByType).forEach(typeGroup => {
      let col = 0;
      
      typeGroup.forEach(node => {
        const x = currentX + col * config.nodeSpacing;
        const y = currentY + row * config.nodeSpacing;
        
        nodePlacements.push({
          id: node.id,
          x,
          y,
          width: node.width || 120,
          height: node.height || 60
        });
        
        col++;
        if (col >= config.maxNodesPerRow) {
          col = 0;
          row++;
        }
      });
      
      currentY += (Math.ceil(typeGroup.length / config.maxNodesPerRow) + 1) * config.nodeSpacing;
    });
    
    // Place containers around organized node groups
    if (containers.length > 0) {
      const allNodeBounds = this.getBoundsForNodes(nodePlacements);
      
      containers.forEach((container, idx) => {
        const padding = 40;
        const containerX = allNodeBounds.minX - padding - idx * 30;
        const containerY = allNodeBounds.minY - padding - idx * 30;
        const containerWidth = allNodeBounds.maxX - allNodeBounds.minX + padding * 2;
        const containerHeight = allNodeBounds.maxY - allNodeBounds.minY + padding * 2;
        
        containerPlacements.push({
          id: container.id,
          x: containerX,
          y: containerY,
          width: containerWidth,
          height: containerHeight
        });
      });
    }
    
    return { nodePlacements, containerPlacements };
  }

  private applySequentialFlowLayout(
    nodes: ArchNode[],
    containers: Container[],
    links: Link[],
    config: StructuredLayoutConfig
  ): { nodePlacements: NodePlacement[], containerPlacements: ContainerPlacement[] } {
    
    const nodePlacements: NodePlacement[] = [];
    const containerPlacements: ContainerPlacement[] = [];
    
    // Find the start of the flow (node with no incoming connections)
    const nodeConnections: Record<string, { incoming: string[], outgoing: string[] }> = {};
    
    nodes.forEach(node => {
      nodeConnections[node.id] = { incoming: [], outgoing: [] };
    });
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      if (nodeConnections[sourceId]) {
        nodeConnections[sourceId].outgoing.push(targetId);
      }
      if (nodeConnections[targetId]) {
        nodeConnections[targetId].incoming.push(sourceId);
      }
    });
    
    // Find start nodes (no incoming connections)
    const startNodes = Object.entries(nodeConnections)
      .filter(([_, conn]) => conn.incoming.length === 0)
      .map(([id, _]) => id);
    
    // Arrange in flow sequence
    const placedNodes = new Set<string>();
    let currentX = 150;
    let currentY = 300;
    
    const placeSequentially = (nodeId: string, x: number, y: number) => {
      if (placedNodes.has(nodeId)) return;
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      nodePlacements.push({
        id: nodeId,
        x,
        y,
        width: node.width || 120,
        height: node.height || 60
      });
      
      placedNodes.add(nodeId);
      
      // Place connected nodes to the right
      const connections = nodeConnections[nodeId];
      connections.outgoing.forEach((connectedId, idx) => {
        const nextX = x + config.nodeSpacing;
        const nextY = y + (idx - (connections.outgoing.length - 1) / 2) * 80; // Vertical offset for branching
        placeSequentially(connectedId, nextX, nextY);
      });
    };
    
    // Start from start nodes
    startNodes.forEach((startId, idx) => {
      placeSequentially(startId, currentX, currentY + idx * 100);
    });
    
    // Place any unconnected nodes
    nodes.forEach(node => {
      if (!placedNodes.has(node.id)) {
        nodePlacements.push({
          id: node.id,
          x: currentX + 300,
          y: currentY + nodePlacements.length * 80,
          width: node.width || 120,
          height: node.height || 60
        });
        placedNodes.add(node.id);
      }
    });
    
    return { nodePlacements, containerPlacements };
  }

  private applyHierarchicalLogicalLayout(
    nodes: ArchNode[],
    containers: Container[],
    links: Link[],
    config: StructuredLayoutConfig
  ): { nodePlacements: NodePlacement[], containerPlacements: ContainerPlacement[] } {
    
    const nodePlacements: NodePlacement[] = [];
    const containerPlacements: ContainerPlacement[] = [];
    
    // Find the central hub node (highest connectivity)
    const nodeConnectivity: Record<string, number> = {};
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      nodeConnectivity[sourceId] = (nodeConnectivity[sourceId] || 0) + 1;
      nodeConnectivity[targetId] = (nodeConnectivity[targetId] || 0) + 1;
    });
    
    const centralNode = Object.entries(nodeConnectivity)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    if (!centralNode) {
      // Fallback to grid layout if no central node found
      return this.applyGridOrganizedLayout(nodes, containers, links, config);
    }
    
    // Place central node in the center
    const centerX = 600;
    const centerY = 400;
    
    const centralNodeObj = nodes.find(n => n.id === centralNode);
    if (centralNodeObj) {
      nodePlacements.push({
        id: centralNode,
        x: centerX,
        y: centerY,
        width: centralNodeObj.width || 140,
        height: centralNodeObj.height || 80
      });
    }
    
    // Group connected nodes by distance from center
    const levels: string[][] = [[centralNode]];
    const placedNodes = new Set([centralNode]);
    
    // Build levels of nodes based on distance from central node
    for (let level = 0; level < 3; level++) { // Max 3 levels
      const currentLevel = levels[level] || [];
      const nextLevel: string[] = [];
      
      currentLevel.forEach(nodeId => {
        links.forEach(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          
          if (sourceId === nodeId && !placedNodes.has(targetId)) {
            nextLevel.push(targetId);
            placedNodes.add(targetId);
          } else if (targetId === nodeId && !placedNodes.has(sourceId)) {
            nextLevel.push(sourceId);
            placedNodes.add(sourceId);
          }
        });
      });
      
      if (nextLevel.length > 0) {
        levels.push(nextLevel);
      }
    }
    
    // Place nodes in concentric rings around the center
    const ringRadius = [0, 150, 250, 350];
    
    levels.forEach((levelNodes, levelIdx) => {
      if (levelIdx === 0) return; // Central node already placed
      
      const radius = ringRadius[levelIdx];
      const angleStep = (2 * Math.PI) / levelNodes.length;
      
      levelNodes.forEach((nodeId, idx) => {
        const angle = idx * angleStep;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          nodePlacements.push({
            id: nodeId,
            x,
            y,
            width: node.width || 120,
            height: node.height || 60
          });
        }
      });
    });
    
    // Place any remaining unconnected nodes
    nodes.forEach(node => {
      if (!placedNodes.has(node.id)) {
        nodePlacements.push({
          id: node.id,
          x: centerX + 300,
          y: centerY + nodePlacements.length * 80,
          width: node.width || 120,
          height: node.height || 60
        });
        placedNodes.add(node.id);
      }
    });
    
    return { nodePlacements, containerPlacements };
  }

  private applyContainerClusteredLayout(
    nodes: ArchNode[],
    containers: Container[],
    links: Link[],
    config: StructuredLayoutConfig
  ): { nodePlacements: NodePlacement[], containerPlacements: ContainerPlacement[] } {
    
    const nodePlacements: NodePlacement[] = [];
    const containerPlacements: ContainerPlacement[] = [];
    
    if (containers.length === 0) {
      return this.applyGridOrganizedLayout(nodes, containers, links, config);
    }
    
    // Group nodes by their assigned containers
    const containerGroups: Record<string, ArchNode[]> = {};
    const unassignedNodes: ArchNode[] = [];
    
    nodes.forEach(node => {
      const containerId = containers.find(c => c.childNodeIds.includes(node.id))?.id;
      if (containerId) {
        if (!containerGroups[containerId]) containerGroups[containerId] = [];
        containerGroups[containerId].push(node);
      } else {
        unassignedNodes.push(node);
      }
    });
    
    // Place containers in a grid pattern
    const containerCols = Math.ceil(Math.sqrt(containers.length));
    let containerRow = 0, containerCol = 0;
    
    containers.forEach(container => {
      const containerX = 200 + containerCol * config.containerSpacing;
      const containerY = 150 + containerRow * config.containerSpacing;
      
      containerPlacements.push({
        id: container.id,
        x: containerX,
        y: containerY,
        width: container.width || 300,
        height: container.height || 200
      });
      
      // Place nodes within this container
      const nodesInContainer = containerGroups[container.id] || [];
      if (nodesInContainer.length > 0) {
        const containerCenterX = containerX + (container.width || 300) / 2;
        const containerCenterY = containerY + (container.height || 200) / 2;
        
        // Arrange nodes in grid within container
        const nodesPerRow = Math.min(config.maxNodesPerContainer, 4);
        let nodeRow = 0, nodeCol = 0;
        
        nodesInContainer.forEach(node => {
          const nodeX = containerCenterX - ((nodesPerRow - 1) * config.nodeSpacing) / 2 + nodeCol * config.nodeSpacing;
          const nodeY = containerCenterY - ((Math.ceil(nodesInContainer.length / nodesPerRow) - 1) * config.nodeSpacing) / 2 + nodeRow * config.nodeSpacing;
          
          nodePlacements.push({
            id: node.id,
            x: nodeX,
            y: nodeY,
            width: node.width || 120,
            height: node.height || 60,
            containerId: container.id
          });
          
          nodeCol++;
          if (nodeCol >= nodesPerRow) {
            nodeCol = 0;
            nodeRow++;
          }
        });
      }
      
      containerCol++;
      if (containerCol >= containerCols) {
        containerCol = 0;
        containerRow++;
      }
    });
    
    // Place unassigned nodes in a separate area
    if (unassignedNodes.length > 0) {
      const unassignedStartX = 200;
      const unassignedStartY = 150 + (containerRow + 1) * config.containerSpacing;
      
      unassignedNodes.forEach((node, idx) => {
        const nodeX = unassignedStartX + (idx % 6) * config.nodeSpacing;
        const nodeY = unassignedStartY + Math.floor(idx / 6) * config.nodeSpacing;
        
        nodePlacements.push({
          id: node.id,
          x: nodeX,
          y: nodeY,
          width: node.width || 120,
          height: node.height || 60
        });
      });
    }
    
    return { nodePlacements, containerPlacements };
  }

  private applyTierStructuredLayout(
    nodes: ArchNode[],
    containers: Container[],
    links: Link[],
    config: StructuredLayoutConfig
  ): { nodePlacements: NodePlacement[], containerPlacements: ContainerPlacement[] } {
    
    const nodePlacements: NodePlacement[] = [];
    const containerPlacements: ContainerPlacement[] = [];
    
    // Analyze flow direction to determine tiers
    const tierAssignment = this.assignNodesToTiers(nodes, links);
    
    // Group nodes by tier
    const nodesByTier: Record<number, ArchNode[]> = {};
    tierAssignment.forEach(({ nodeId, tier }) => {
      if (!nodesByTier[tier]) nodesByTier[tier] = [];
      const node = nodes.find(n => n.id === nodeId);
      if (node) nodesByTier[tier].push(node);
    });
    
    // Place tiers horizontally
    const tierKeys = Object.keys(nodesByTier).map(Number).sort((a, b) => a - b);
    const tierSpacing = config.tierSpacing;
    
    tierKeys.forEach((tier, tierIdx) => {
      const tierX = 150 + tierIdx * tierSpacing;
      const tierNodes = nodesByTier[tier];
      
      // Center nodes vertically within the tier
      const tierHeight = Math.max(300, tierNodes.length * 80);
      const startY = 400 - tierHeight / 2;
      
      tierNodes.forEach((node, nodeIdx) => {
        const nodeY = startY + nodeIdx * 80;
        
        nodePlacements.push({
          id: node.id,
          x: tierX,
          y: nodeY,
          width: node.width || 120,
          height: node.height || 60,
          tier
        });
      });
    });
    
    // Create containers for each tier if not already present
    if (containers.length === 0) {
      tierKeys.forEach((tier, tierIdx) => {
        const tierNodes = nodesByTier[tier];
        if (tierNodes.length > 0) {
          const tierNodeIds = tierNodes.map(n => n.id);
          const tierNodePlacements = nodePlacements.filter(np => tierNodeIds.includes(np.id));
          
          if (tierNodePlacements.length > 0) {
            const bounds = this.getBoundsForNodes(tierNodePlacements);
            const padding = 50;
            
            containerPlacements.push({
              id: `tier-${tier}`,
              x: bounds.minX - padding,
              y: bounds.minY - padding,
              width: bounds.maxX - bounds.minX + padding * 2,
              height: bounds.maxY - bounds.minY + padding * 2,
              tier
            });
          }
        }
      });
    } else {
      // If containers exist, position them based on tier assignments
      containers.forEach(container => {
        const containerNodes = nodes.filter(n => container.childNodeIds.includes(n.id));
        if (containerNodes.length > 0) {
          // Find the tier of the first node in the container
          const firstNodeTier = tierAssignment.find(ta => ta.nodeId === containerNodes[0].id)?.tier || 0;
          
          // Position container based on tier
          const tierX = 150 + firstNodeTier * tierSpacing;
          const containerWidth = 300;
          const containerHeight = Math.max(200, containerNodes.length * 60);
          
          containerPlacements.push({
            id: container.id,
            x: tierX - containerWidth / 2,
            y: 400 - containerHeight / 2,
            width: containerWidth,
            height: containerHeight,
            tier: firstNodeTier
          });
        }
      });
    }
    
    return { nodePlacements, containerPlacements };
  }

  private assignNodesToTiers(nodes: ArchNode[], links: Link[]): Array<{ nodeId: string, tier: number }> {
    // Simple tier assignment based on connection flow
    const nodeTiers: Record<string, number> = {};
    
    // Initialize all nodes to tier 0
    nodes.forEach(node => {
      nodeTiers[node.id] = 0;
    });
    
    // Process links to determine tier relationships
    let changed = true;
    while (changed) {
      changed = false;
      
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        // If source tier >= target tier, promote target to next tier
        if (nodeTiers[sourceId] >= nodeTiers[targetId]) {
          const newTier = nodeTiers[sourceId] + 1;
          if (newTier > nodeTiers[targetId]) {
            nodeTiers[targetId] = newTier;
            changed = true;
          }
        }
      });
    }
    
    // Convert to array format
    return Object.entries(nodeTiers).map(([nodeId, tier]) => ({ nodeId, tier }));
  }

  private getBoundsForNodes(nodePlacements: NodePlacement[]) {
    if (nodePlacements.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodePlacements.forEach(np => {
      minX = Math.min(minX, np.x - np.width / 2);
      minY = Math.min(minY, np.y - np.height / 2);
      maxX = Math.max(maxX, np.x + np.width / 2);
      maxY = Math.max(maxY, np.y + np.height / 2);
    });
    
    return { minX, minY, maxX, maxY };
  }
}
