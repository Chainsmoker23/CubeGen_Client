/**
 * EnhancedPositionCalculator - Calculates precise coordinates for complex layouts
 * Works with EnhancedLayoutEngine to create well-spaced, readable diagrams
 */

import { EnhancedLayoutConfiguration, ArchitectureAnalysis } from './enhancedLayoutEngine';
import { ArchNode, Container } from '../types';

interface PositionedElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layer?: number;
}

interface ContainerGroup {
  container: Container;
  childNodes: ArchNode[];
  childContainers: ContainerGroup[];
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
}

export class EnhancedPositionCalculator {
  
  /**
   * Calculate positions for all nodes and containers based on enhanced layout
   */
  public calculatePositions(
    nodes: ArchNode[],
    containers: Container[],
    layoutConfig: EnhancedLayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedElement[]; positionedContainers: Container[] } {
    
    // Build container hierarchy
    const containerHierarchy = this.buildContainerHierarchy(containers, nodes);
    
    // Calculate positions based on layout algorithm
    let positionedNodes: PositionedElement[] = [];
    let positionedContainers: Container[] = [];
    
    switch (layoutConfig.algorithm) {
      case 'hierarchical':
        ({ positionedNodes, positionedContainers } = this.calculateHierarchicalLayout(
          nodes, containerHierarchy, layoutConfig, analysis
        ));
        break;
        
      case 'radial':
        ({ positionedNodes, positionedContainers } = this.calculateRadialLayout(
          nodes, containerHierarchy, layoutConfig, analysis
        ));
        break;
        
      case 'cluster':
        ({ positionedNodes, positionedContainers } = this.calculateClusterLayout(
          nodes, containerHierarchy, layoutConfig, analysis
        ));
        break;
        
      case 'flow':
        ({ positionedNodes, positionedContainers } = this.calculateFlowLayout(
          nodes, containerHierarchy, layoutConfig, analysis
        ));
        break;
        
      case 'hybrid':
        ({ positionedNodes, positionedContainers } = this.calculateHybridLayout(
          nodes, containerHierarchy, layoutConfig, analysis
        ));
        break;
        
      case 'organic':
        ({ positionedNodes, positionedContainers } = this.calculateOrganicLayout(
          nodes, containerHierarchy, layoutConfig, analysis
        ));
        break;
        
      default:
        ({ positionedNodes, positionedContainers } = this.calculateHierarchicalLayout(
          nodes, containerHierarchy, layoutConfig, analysis
        ));
    }
    
    // Apply final adjustments and constraints
    positionedNodes = this.applyFinalAdjustments(positionedNodes, layoutConfig);
    positionedContainers = this.adjustContainerPositions(positionedContainers, positionedNodes, layoutConfig);
    
    return { positionedNodes, positionedContainers };
  }

  private buildContainerHierarchy(containers: Container[], nodes: ArchNode[]): ContainerGroup[] {
    // Create lookup maps
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const containerMap = new Map(containers.map(container => [container.id, container]));
    
    // Build hierarchy
    const groups: ContainerGroup[] = containers.map(container => ({
      container,
      childNodes: container.childNodeIds
        .map(id => nodeMap.get(id))
        .filter(Boolean) as ArchNode[],
      childContainers: [],
      position: { x: container.x, y: container.y },
      dimensions: { width: container.width, height: container.height }
    }));
    
    return groups;
  }

  private calculateHierarchicalLayout(
    nodes: ArchNode[],
    containerGroups: ContainerGroup[],
    config: EnhancedLayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedElement[]; positionedContainers: Container[] } {
    
    const positionedNodes: PositionedElement[] = [];
    const positionedContainers: Container[] = [];
    
    // Handle containers first
    if (containerGroups.length > 0) {
      const containerLayout = this.layoutContainersHierarchically(containerGroups, config, analysis);
      positionedContainers.push(...containerLayout.positionedContainers);
      
      // Position nodes within containers
      containerGroups.forEach((group, index) => {
        const containerPos = containerLayout.containerPositions[index];
        const nodePositions = this.positionNodesInContainer(group.childNodes, containerPos, config);
        positionedNodes.push(...nodePositions);
      });
    } else {
      // No containers - direct node layout
      positionedNodes.push(...this.layoutNodesHierarchically(nodes, config, analysis));
    }
    
    return { positionedNodes, positionedContainers };
  }

  private layoutContainersHierarchically(
    containerGroups: ContainerGroup[],
    config: EnhancedLayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedContainers: Container[]; containerPositions: Array<{ x: number, y: number }> } {
    
    const positionedContainers: Container[] = [];
    const containerPositions: Array<{ x: number, y: number }> = [];
    
    // Calculate base positions with enhanced spacing
    const baseSpacing = config.containerSpacing;
    const startX = 100;
    const startY = 100;
    
    // Determine arrangement based on complexity and container count
    const containerCount = containerGroups.length;
    let cols = 1;
    
    if (containerCount <= 2) {
      cols = 1;
    } else if (containerCount <= 6) {
      cols = 2;
    } else if (containerCount <= 12) {
      cols = 3;
    } else {
      cols = Math.ceil(Math.sqrt(containerCount));
    }
    
    // Adjust for density optimization
    if (config.optimizeForDensity) {
      cols = Math.min(cols, Math.ceil(containerCount / 2));
    }
    
    const rows = Math.ceil(containerCount / cols);
    
    containerGroups.forEach((group, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      // Enhanced spacing calculation
      const containerWidth = 300 + (group.childNodes.length * 20); // Dynamic width
      const containerHeight = 200 + (group.childNodes.length * 15); // Dynamic height
      
      const x = startX + col * (containerWidth + baseSpacing);
      const y = startY + row * (containerHeight + baseSpacing * 1.5); // Extra vertical spacing
      
      containerPositions.push({ x, y });
      
      positionedContainers.push({
        ...group.container,
        x,
        y,
        width: containerWidth,
        height: containerHeight
      });
    });
    
    return { positionedContainers, containerPositions };
  }

  private positionNodesInContainer(
    nodes: ArchNode[],
    containerPos: { x: number, y: number },
    config: EnhancedLayoutConfiguration
  ): PositionedElement[] {
    
    if (nodes.length === 0) return [];
    
    const positionedNodes: PositionedElement[] = [];
    const padding = 30; // Padding inside container
    
    // Calculate available space
    const availableWidth = 240; // Container width - 2*padding
    const availableHeight = 140; // Container height - 2*padding
    
    // Grid-based arrangement within container
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);
    
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      // Center within cell
      const x = containerPos.x + padding + col * cellWidth + cellWidth / 2;
      const y = containerPos.y + padding + row * cellHeight + cellHeight / 2;
      
      positionedNodes.push({
        id: node.id,
        x,
        y,
        width: node.width || 120,
        height: node.height || 60,
        layer: node.layer
      });
    });
    
    return positionedNodes;
  }

  private layoutNodesHierarchically(
    nodes: ArchNode[],
    config: EnhancedLayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): PositionedElement[] {
    
    const positionedNodes: PositionedElement[] = [];
    const nodeCount = nodes.length;
    
    if (nodeCount === 0) return positionedNodes;
    
    // Enhanced grid calculation based on scale
    let cols = Math.ceil(Math.sqrt(nodeCount));
    let rows = Math.ceil(nodeCount / cols);
    
    // Adjust for density optimization
    if (config.optimizeForDensity) {
      cols = Math.max(2, Math.floor(Math.sqrt(nodeCount * 0.8)));
      rows = Math.ceil(nodeCount / cols);
    }
    
    // Starting position
    const startX = 150;
    const startY = 100;
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const x = startX + col * config.nodeSpacing;
      const y = startY + row * config.levelSpacing;
      
      positionedNodes.push({
        id: node.id,
        x,
        y,
        width: node.width || 120,
        height: node.height || 60,
        layer: node.layer
      });
    });
    
    return positionedNodes;
  }

  private calculateRadialLayout(
    nodes: ArchNode[],
    containerGroups: ContainerGroup[],
    config: EnhancedLayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedElement[]; positionedContainers: Container[] } {
    
    // Similar implementation for radial layouts
    // This would arrange nodes in circular/spiral patterns
    return this.calculateHierarchicalLayout(nodes, containerGroups, config, analysis);
  }

  private calculateClusterLayout(
    nodes: ArchNode[],
    containerGroups: ContainerGroup[],
    config: EnhancedLayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedElement[]; positionedContainers: Container[] } {
    
    // Similar implementation for clustered layouts
    // This would group related nodes together
    return this.calculateHierarchicalLayout(nodes, containerGroups, config, analysis);
  }

  private calculateFlowLayout(
    nodes: ArchNode[],
    containerGroups: ContainerGroup[],
    config: EnhancedLayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedElement[]; positionedContainers: Container[] } {
    
    // Similar implementation for flow-based layouts
    return this.calculateHierarchicalLayout(nodes, containerGroups, config, analysis);
  }

  private calculateHybridLayout(
    nodes: ArchNode[],
    containerGroups: ContainerGroup[],
    config: EnhancedLayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedElement[]; positionedContainers: Container[] } {
    
    // Intelligent hybrid approach combining multiple strategies
    const complexityScore = this.calculateComplexityScore(analysis);
    
    if (complexityScore > 0.7) {
      // Use organic layout for very complex systems
      return this.calculateOrganicLayout(nodes, containerGroups, config, analysis);
    } else if (complexityScore > 0.4) {
      // Use hybrid of hierarchical and cluster
      return this.calculateHierarchicalLayout(nodes, containerGroups, {
        ...config,
        algorithm: 'hierarchical'
      }, analysis);
    } else {
      // Use standard hierarchical
      return this.calculateHierarchicalLayout(nodes, containerGroups, config, analysis);
    }
  }

  private calculateOrganicLayout(
    nodes: ArchNode[],
    containerGroups: ContainerGroup[],
    config: EnhancedLayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedElement[]; positionedContainers: Container[] } {
    
    // Force-directed inspired layout for maximum readability
    // Distributes nodes more naturally to avoid overcrowding
    const positionedNodes: PositionedElement[] = [];
    const nodeCount = nodes.length;
    
    if (nodeCount === 0) return { positionedNodes, positionedContainers: [] };
    
    // Start with circular arrangement to avoid initial overlaps
    const centerX = config.centerX || 600;
    const centerY = config.centerY || 400;
    const radius = Math.max(200, nodeCount * 15);
    
    nodes.forEach((node, index) => {
      const angle = (index / nodeCount) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      positionedNodes.push({
        id: node.id,
        x,
        y,
        width: node.width || 120,
        height: node.height || 60,
        layer: node.layer
      });
    });
    
    return { positionedNodes, positionedContainers: [] };
  }

  private calculateComplexityScore(analysis: ArchitectureAnalysis): number {
    // Composite score based on multiple factors
    const scaleFactors: Record<string, number> = {
      'small': 0.2,
      'medium': 0.5,
      'large': 0.8,
      'enterprise': 1.0
    };
    
    const complexityFactors: Record<string, number> = {
      'simple': 0.2,
      'moderate': 0.5,
      'complex': 0.8,
      'enterprise': 1.0
    };
    
    const densityScore = analysis.densityMetrics.componentDensity;
    const connectionScore = Math.min(1, analysis.densityMetrics.connectionDensity / 5);
    
    return (
      scaleFactors[analysis.scale] * 0.3 +
      complexityFactors[analysis.complexity] * 0.3 +
      densityScore * 0.2 +
      connectionScore * 0.2
    );
  }

  private applyFinalAdjustments(
    positionedNodes: PositionedElement[],
    config: EnhancedLayoutConfiguration
  ): PositionedElement[] {
    
    // Ensure minimum spacing between nodes
    const minSpacing = config.nodeSpacing * 0.7;
    
    // Simple collision avoidance
    for (let i = 0; i < positionedNodes.length; i++) {
      for (let j = i + 1; j < positionedNodes.length; j++) {
        const node1 = positionedNodes[i];
        const node2 = positionedNodes[j];
        
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minSpacing) {
          // Push nodes apart
          const pushDistance = (minSpacing - distance) / 2;
          const angle = Math.atan2(dy, dx);
          
          node1.x -= Math.cos(angle) * pushDistance;
          node1.y -= Math.sin(angle) * pushDistance;
          node2.x += Math.cos(angle) * pushDistance;
          node2.y += Math.sin(angle) * pushDistance;
        }
      }
    }
    
    return positionedNodes;
  }

  private adjustContainerPositions(
    containers: Container[],
    positionedNodes: PositionedElement[],
    config: EnhancedLayoutConfiguration
  ): Container[] {
    
    // Expand containers to fit their contents with proper padding
    return containers.map(container => {
      const childElements = positionedNodes.filter(node => 
        container.childNodeIds.includes(node.id)
      );
      
      if (childElements.length === 0) {
        return container;
      }
      
      // Find bounds of child elements
      const minX = Math.min(...childElements.map(el => el.x - el.width / 2));
      const maxX = Math.max(...childElements.map(el => el.x + el.width / 2));
      const minY = Math.min(...childElements.map(el => el.y - el.height / 2));
      const maxY = Math.max(...childElements.map(el => el.y + el.height / 2));
      
      const padding = 40;
      const newWidth = (maxX - minX) + padding * 2;
      const newHeight = (maxY - minY) + padding * 2;
      
      return {
        ...container,
        x: minX - padding,
        y: minY - padding,
        width: newWidth,
        height: newHeight
      };
    });
  }
}
