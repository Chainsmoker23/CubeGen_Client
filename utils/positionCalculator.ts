import { LayoutConfiguration, ArchitectureAnalysis, ComponentRelationship } from './layoutDecisionEngine';

export interface PositionedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionedContainer {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PositionCalculator {
  
  /**
   * Calculates positions for nodes based on the layout configuration
   */
  public calculatePositions(
    nodes: { id: string; label: string; width?: number; height?: number }[],
    containers: { id: string; label: string; width?: number; height?: number }[],
    relationships: ComponentRelationship[],
    layoutConfig: LayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedNode[]; positionedContainers: PositionedContainer[] } {
    
    switch (layoutConfig.algorithm) {
      case 'hierarchical':
        return this.calculateHierarchicalPositions(nodes, containers, layoutConfig, analysis);
      case 'radial':
        return this.calculateRadialPositions(nodes, containers, layoutConfig, analysis);
      case 'grid':
        return this.calculateGridPositions(nodes, containers, layoutConfig, analysis);
      case 'cluster':
        return this.calculateClusterPositions(nodes, containers, relationships, layoutConfig, analysis);
      case 'flow':
        return this.calculateFlowPositions(nodes, containers, relationships, layoutConfig, analysis);
      default:
        return this.calculateDefaultPositions(nodes, containers, layoutConfig, analysis);
    }
  }
  
  private calculateHierarchicalPositions(
    nodes: { id: string; label: string; width?: number; height?: number }[],
    containers: { id: string; label: string; width?: number; height?: number }[],
    layoutConfig: LayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedNode[]; positionedContainers: PositionedContainer[] } {
    
    const positionedNodes: PositionedNode[] = [];
    const positionedContainers: PositionedContainer[] = [];
    
    // For hierarchical layouts, we need to determine the hierarchy first
    const hierarchy = this.buildHierarchy(nodes, analysis.relationships);
    
    // Calculate positions based on hierarchy levels
    const nodeSpacing = layoutConfig.nodeSpacing || 120;
    const levelSpacing = layoutConfig.levelSpacing || 180;
    
    if (layoutConfig.direction === 'top-down' || layoutConfig.direction === 'left-right') {
      // Top-down layout
      if (layoutConfig.direction === 'top-down') {
        let currentY = 50;
        for (const level of hierarchy.levels) {
          let currentX = 100;
          for (const nodeId of level) {
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
              positionedNodes.push({
                id: node.id,
                label: node.label,
                x: currentX,
                y: currentY,
                width: node.width || 150,
                height: node.height || 80
              });
              currentX += (node.width || 150) + nodeSpacing;
            }
          }
          currentY += levelSpacing;
        }
      } 
      // Left-right layout
      else {
        let currentX = 100;
        for (const level of hierarchy.levels) {
          let currentY = 50;
          for (const nodeId of level) {
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
              positionedNodes.push({
                id: node.id,
                label: node.label,
                x: currentX,
                y: currentY,
                width: node.width || 150,
                height: node.height || 80
              });
              currentY += (node.height || 80) + nodeSpacing;
            }
          }
          currentX += levelSpacing;
        }
      }
    } else {
      // Default to top-down
      let currentY = 50;
      for (const level of hierarchy.levels) {
        let currentX = 100;
        for (const nodeId of level) {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            positionedNodes.push({
              id: node.id,
              label: node.label,
              x: currentX,
              y: currentY,
              width: node.width || 150,
              height: node.height || 80
            });
            currentX += (node.width || 150) + nodeSpacing;
          }
        }
        currentY += levelSpacing;
      }
    }
    
    // Position containers based on their child nodes
    for (const container of containers) {
      positionedContainers.push({
        id: container.id,
        label: container.label,
        x: 100,
        y: 100,
        width: container.width || 500,
        height: container.height || 300
      });
    }
    
    return { positionedNodes, positionedContainers };
  }
  
  private buildHierarchy(nodes: { id: string }[], relationships: ComponentRelationship[]) {
    // Simple hierarchy builder based on dependencies
    // In a real implementation, this would be more sophisticated
    
    // For now, just group nodes by their relationship patterns
    const levels: string[][] = [];
    const processed = new Set<string>();
    
    // Find root nodes (nodes that are only targets, never sources)
    const allSources = new Set(relationships.map(r => r.source));
    const allTargets = new Set(relationships.map(r => r.target));
    
    const rootNodes = nodes
      .map(n => n.id)
      .filter(id => !allSources.has(id) && allTargets.has(id));
    
    if (rootNodes.length > 0) {
      levels.push(rootNodes);
      rootNodes.forEach(id => processed.add(id));
    }
    
    // Add remaining nodes to levels based on dependencies
    let remainingNodes = nodes.filter(n => !processed.has(n.id)).map(n => n.id);
    while (remainingNodes.length > 0) {
      const currentLevel: string[] = [];
      
      for (const nodeId of remainingNodes) {
        // Check if all dependencies of this node are already processed
        const dependencies = relationships
          .filter(r => r.target === nodeId)
          .map(r => r.source);
        
        const allDependenciesProcessed = dependencies.every(dep => processed.has(dep));
        
        if (allDependenciesProcessed) {
          currentLevel.push(nodeId);
          processed.add(nodeId);
        }
      }
      
      if (currentLevel.length === 0) {
        // If no nodes can be added, add remaining nodes to last level
        currentLevel.push(...remainingNodes);
        remainingNodes = [];
      } else {
        levels.push(currentLevel);
        remainingNodes = nodes.filter(n => !processed.has(n.id)).map(n => n.id);
      }
    }
    
    return { levels };
  }
  
  private calculateRadialPositions(
    nodes: { id: string; label: string; width?: number; height?: number }[],
    containers: { id: string; label: string; width?: number; height?: number }[],
    layoutConfig: LayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedNode[]; positionedContainers: PositionedContainer[] } {
    
    const positionedNodes: PositionedNode[] = [];
    const positionedContainers: PositionedContainer[] = [];
    
    const centerX = layoutConfig.centerX || 500;
    const centerY = layoutConfig.centerY || 300;
    const radius = layoutConfig.clusterRadius || 250;
    const nodeSpacing = layoutConfig.nodeSpacing || 120;
    
    // Calculate positions in a circular pattern
    const angleStep = (2 * Math.PI) / Math.max(1, nodes.length);
    
    nodes.forEach((node, index) => {
      const angle = index * angleStep;
      const x = centerX + radius * Math.cos(angle) - (node.width || 150) / 2;
      const y = centerY + radius * Math.sin(angle) - (node.height || 80) / 2;
      
      positionedNodes.push({
        id: node.id,
        label: node.label,
        x,
        y,
        width: node.width || 150,
        height: node.height || 80
      });
    });
    
    // Position containers
    for (const container of containers) {
      positionedContainers.push({
        id: container.id,
        label: container.label,
        x: centerX - (container.width || 500) / 2,
        y: centerY - (container.height || 300) / 2,
        width: container.width || 500,
        height: container.height || 300
      });
    }
    
    return { positionedNodes, positionedContainers };
  }
  
  private calculateGridPositions(
    nodes: { id: string; label: string; width?: number; height?: number }[],
    containers: { id: string; label: string; width?: number; height?: number }[],
    layoutConfig: LayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedNode[]; positionedContainers: PositionedContainer[] } {
    
    const positionedNodes: PositionedNode[] = [];
    const positionedContainers: PositionedContainer[] = [];
    
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const nodeSpacing = layoutConfig.nodeSpacing || 120;
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const x = 100 + col * ((node.width || 150) + nodeSpacing);
      const y = 100 + row * ((node.height || 80) + nodeSpacing);
      
      positionedNodes.push({
        id: node.id,
        label: node.label,
        x,
        y,
        width: node.width || 150,
        height: node.height || 80
      });
    });
    
    // Position containers
    for (const container of containers) {
      positionedContainers.push({
        id: container.id,
        label: container.label,
        x: 100,
        y: 100,
        width: container.width || 500,
        height: container.height || 300
      });
    }
    
    return { positionedNodes, positionedContainers };
  }
  
  private calculateClusterPositions(
    nodes: { id: string; label: string; width?: number; height?: number }[],
    containers: { id: string; label: string; width?: number; height?: number }[],
    relationships: ComponentRelationship[],
    layoutConfig: LayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedNode[]; positionedContainers: PositionedContainer[] } {
    
    const positionedNodes: PositionedNode[] = [];
    const positionedContainers: PositionedContainer[] = [];
    
    const centerX = layoutConfig.centerX || 500;
    const centerY = layoutConfig.centerY || 300;
    const clusterRadius = layoutConfig.clusterRadius || 200;
    const nodeSpacing = layoutConfig.nodeSpacing || 100;
    
    // Group nodes based on relationships
    const nodeGroups = this.groupNodesByRelationships(nodes, relationships);
    
    // Position each group in a cluster
    let groupIndex = 0;
    for (const group of nodeGroups) {
      // Calculate group center
      const groupAngle = (2 * Math.PI * groupIndex) / Math.max(1, nodeGroups.length);
      const groupCenterX = centerX + clusterRadius * Math.cos(groupAngle);
      const groupCenterY = centerY + clusterRadius * Math.sin(groupAngle);
      
      // Position nodes within the group
      const groupNodeSpacing = Math.max(nodeSpacing, 80);
      const groupCols = Math.ceil(Math.sqrt(group.length));
      
      group.forEach((nodeId, nodeIndex) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          const row = Math.floor(nodeIndex / groupCols);
          const col = nodeIndex % groupCols;
          
          const x = groupCenterX - (groupCols * (node.width || 150 + nodeSpacing)) / 2 + 
                   col * ((node.width || 150) + nodeSpacing);
          const y = groupCenterY - (Math.ceil(group.length / groupCols) * (node.height || 80 + nodeSpacing)) / 2 + 
                   row * ((node.height || 80) + nodeSpacing);
          
          positionedNodes.push({
            id: node.id,
            label: node.label,
            x,
            y,
            width: node.width || 150,
            height: node.height || 80
          });
        }
      });
      
      groupIndex++;
    }
    
    // Position containers
    for (const container of containers) {
      positionedContainers.push({
        id: container.id,
        label: container.label,
        x: centerX - (container.width || 500) / 2,
        y: centerY - (container.height || 300) / 2,
        width: container.width || 500,
        height: container.height || 300
      });
    }
    
    return { positionedNodes, positionedContainers };
  }
  
  private calculateFlowPositions(
    nodes: { id: string; label: string; width?: number; height?: number }[],
    containers: { id: string; label: string; width?: number; height?: number }[],
    relationships: ComponentRelationship[],
    layoutConfig: LayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedNode[]; positionedContainers: PositionedContainer[] } {
    
    const positionedNodes: PositionedNode[] = [];
    const positionedContainers: PositionedContainer[] = [];
    
    const nodeSpacing = layoutConfig.nodeSpacing || 130;
    const levelSpacing = layoutConfig.levelSpacing || 160;
    
    // Create a flow layout based on relationships
    const flow = this.createFlowLayout(nodes, relationships);
    
    if (layoutConfig.direction === 'left-right') {
      let currentX = 100;
      for (const level of flow.levels) {
        let currentY = 100;
        for (const nodeId of level) {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            positionedNodes.push({
              id: node.id,
              label: node.label,
              x: currentX,
              y: currentY,
              width: node.width || 150,
              height: node.height || 80
            });
            currentY += (node.height || 80) + nodeSpacing;
          }
        }
        currentX += levelSpacing;
      }
    } else {
      // Default to top-down flow
      let currentY = 100;
      for (const level of flow.levels) {
        let currentX = 100;
        for (const nodeId of level) {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            positionedNodes.push({
              id: node.id,
              label: node.label,
              x: currentX,
              y: currentY,
              width: node.width || 150,
              height: node.height || 80
            });
            currentX += (node.width || 150) + nodeSpacing;
          }
        }
        currentY += levelSpacing;
      }
    }
    
    // Position containers
    for (const container of containers) {
      positionedContainers.push({
        id: container.id,
        label: container.label,
        x: 100,
        y: 100,
        width: container.width || 500,
        height: container.height || 300
      });
    }
    
    return { positionedNodes, positionedContainers };
  }
  
  private createFlowLayout(nodes: { id: string }[], relationships: ComponentRelationship[]) {
    // Create a flow layout based on data flow relationships
    const levels: string[][] = [];
    const processed = new Set<string>();
    
    // Find starting nodes (nodes with no incoming data flows)
    const allTargets = new Set(relationships
      .filter(r => r.type === 'data-flow')
      .map(r => r.target));
    
    const startNodes = nodes
      .map(n => n.id)
      .filter(id => !allTargets.has(id));
    
    if (startNodes.length > 0) {
      levels.push(startNodes);
      startNodes.forEach(id => processed.add(id));
    }
    
    // Process remaining nodes by following data flow
    let remainingNodes = nodes.filter(n => !processed.has(n.id)).map(n => n.id);
    while (remainingNodes.length > 0) {
      const currentLevel: string[] = [];
      
      for (const nodeId of remainingNodes) {
        // Check if all data flow dependencies are already processed
        const dependencies = relationships
          .filter(r => r.target === nodeId && r.type === 'data-flow')
          .map(r => r.source);
        
        const allDependenciesProcessed = dependencies.every(dep => processed.has(dep));
        
        if (allDependenciesProcessed) {
          currentLevel.push(nodeId);
          processed.add(nodeId);
        }
      }
      
      if (currentLevel.length === 0) {
        // If no nodes can be added, add remaining nodes to last level
        currentLevel.push(...remainingNodes);
        remainingNodes = [];
      } else {
        levels.push(currentLevel);
        remainingNodes = nodes.filter(n => !processed.has(n.id)).map(n => n.id);
      }
    }
    
    return { levels };
  }
  
  private groupNodesByRelationships(
    nodes: { id: string }[],
    relationships: ComponentRelationship[]
  ): string[][] {
    // Group nodes based on relationships
    const groups: string[][] = [];
    const processed = new Set<string>();
    
    for (const node of nodes) {
      if (processed.has(node.id)) continue;
      
      // Find connected nodes
      const group: string[] = [node.id];
      processed.add(node.id);
      
      // Find directly connected nodes
      const connected = this.findConnectedNodes(node.id, relationships, nodes.map(n => n.id));
      for (const connectedId of connected) {
        if (!processed.has(connectedId)) {
          group.push(connectedId);
          processed.add(connectedId);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }
  
  private findConnectedNodes(startId: string, relationships: ComponentRelationship[], allNodeIds: string[]): string[] {
    // Find all nodes connected to the start node through relationships
    const connected = new Set<string>();
    const toVisit = [startId];
    
    while (toVisit.length > 0) {
      const currentId = toVisit.pop()!;
      
      // Find relationships involving this node
      const related = relationships.filter(r => 
        r.source === currentId || r.target === currentId
      );
      
      for (const rel of related) {
        const otherId = rel.source === currentId ? rel.target : rel.source;
        
        if (!connected.has(otherId) && allNodeIds.includes(otherId)) {
          connected.add(otherId);
          toVisit.push(otherId);
        }
      }
    }
    
    return Array.from(connected);
  }
  
  private calculateDefaultPositions(
    nodes: { id: string; label: string; width?: number; height?: number }[],
    containers: { id: string; label: string; width?: number; height?: number }[],
    layoutConfig: LayoutConfiguration,
    analysis: ArchitectureAnalysis
  ): { positionedNodes: PositionedNode[]; positionedContainers: PositionedContainer[] } {
    
    // Default layout: simple grid
    return this.calculateGridPositions(nodes, containers, layoutConfig, analysis);
  }
}
