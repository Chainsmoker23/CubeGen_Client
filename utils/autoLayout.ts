import { DiagramData, ArchNode, Container, Link } from '../types';

export interface AutoLayoutOptions {
  algorithm: 'force-directed' | 'hierarchical' | 'circular' | 'grid' | 'radial';
  iterations?: number;
  padding?: number;
  nodeSpacing?: number;
  edgeLength?: number;
  direction?: 'TB' | 'LR' | 'RL' | 'BT'; // Top-Bottom, Left-Right, etc.
  animate?: boolean;
}

export class InteractiveAutoLayout {
  private layoutOptions: AutoLayoutOptions;
  
  constructor(options: AutoLayoutOptions = { algorithm: 'force-directed', iterations: 100 }) {
    this.layoutOptions = {
      algorithm: 'force-directed',
      iterations: 100,
      padding: 20,
      nodeSpacing: 100,
      edgeLength: 150,
      ...options
    };
  }

  public setOptions(options: Partial<AutoLayoutOptions>) {
    this.layoutOptions = { ...this.layoutOptions, ...options };
  }

  public applyLayout(diagramData: DiagramData): DiagramData {
    const nodes = [...diagramData.nodes];
    const containers = diagramData.containers ? [...diagramData.containers] : [];
    
    switch (this.layoutOptions.algorithm) {
      case 'force-directed':
        return this.forceDirectedLayout({ ...diagramData, nodes, containers });
      case 'hierarchical':
        return this.hierarchicalLayout({ ...diagramData, nodes, containers });
      case 'circular':
        return this.circularLayout({ ...diagramData, nodes, containers });
      case 'grid':
        return this.gridLayout({ ...diagramData, nodes, containers });
      case 'radial':
        return this.radialLayout({ ...diagramData, nodes, containers });
      default:
        return diagramData;
    }
  }

  private forceDirectedLayout(diagramData: DiagramData): DiagramData {
    const { nodes, links } = diagramData;
    const iterations = this.layoutOptions.iterations || 100;
    const nodeSpacing = this.layoutOptions.nodeSpacing || 100;
    const edgeLength = this.layoutOptions.edgeLength || 150;
    
    // Initialize positions randomly if not set
    nodes.forEach(node => {
      if (isNaN(node.x) || isNaN(node.y)) {
        node.x = Math.random() * 800;
        node.y = Math.random() * 600;
      }
    });
    
    // Simulate force-directed physics
    for (let i = 0; i < iterations; i++) {
      // Calculate repulsive forces between nodes
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const node1 = nodes[j];
          const node2 = nodes[k];
          
          // Calculate distance vector
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 0.1; // Avoid division by zero
          
          // Normalize and scale repulsion
          const force = (nodeSpacing * nodeSpacing) / distance;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          // Apply repulsive force
          node1.x -= fx / 2;
          node1.y -= fy / 2;
          node2.x += fx / 2;
          node2.y += fy / 2;
        }
      }
      
      // Calculate attractive forces along edges
      for (const link of links) {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);
        
        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;
          
          // Normalize and scale attraction
          const force = (distance * distance) / edgeLength;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          // Apply attractive force
          sourceNode.x += fx / 2;
          sourceNode.y += fy / 2;
          targetNode.x -= fx / 2;
          targetNode.y -= fy / 2;
        }
      }
    }
    
    return { ...diagramData, nodes };
  }

  private hierarchicalLayout(diagramData: DiagramData): DiagramData {
    const { nodes, links } = diagramData;
    const direction = this.layoutOptions.direction || 'TB'; // Top to Bottom by default
    const nodeSpacing = this.layoutOptions.nodeSpacing || 100;
    const padding = this.layoutOptions.padding || 20;
    
    // Build adjacency lists to understand the graph structure
    const incoming: Record<string, string[]> = {};
    const outgoing: Record<string, string[]> = {};
    
    for (const node of nodes) {
      incoming[node.id] = [];
      outgoing[node.id] = [];
    }
    
    for (const link of links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      if (outgoing[sourceId] && incoming[targetId]) {
        outgoing[sourceId].push(targetId);
        incoming[targetId].push(sourceId);
      }
    }
    
    // Find nodes with no incoming edges (roots)
    const roots = nodes.filter(node => incoming[node.id].length === 0);
    
    // Assign levels using BFS from roots
    const levels: string[][] = [];
    const visited = new Set<string>();
    const queue: { id: string; level: number }[] = [];
    
    // Initialize queue with roots at level 0
    for (const root of roots) {
      queue.push({ id: root.id, level: 0 });
      visited.add(root.id);
    }
    
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      
      if (!levels[level]) {
        levels[level] = [];
      }
      levels[level].push(id);
      
      // Add children to queue at next level
      for (const childId of outgoing[id]) {
        if (!visited.has(childId)) {
          visited.add(childId);
          queue.push({ id: childId, level: level + 1 });
        }
      }
    }
    
    // Position nodes based on assigned levels
    for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
      const levelNodes = levels[levelIdx];
      const numNodes = levelNodes.length;
      
      // Calculate positions based on direction
      if (direction === 'TB' || direction === 'BT') {
        // Top-Bottom or Bottom-Top layout
        const y = levelIdx * (nodeSpacing + 50) + padding;
        
        for (let i = 0; i < numNodes; i++) {
          const node = nodes.find(n => n.id === levelNodes[i]);
          if (node) {
            node.x = i * (nodeSpacing + 100) + padding;
            node.y = direction === 'TB' ? y : -y;
          }
        }
      } else {
        // Left-Right or Right-Left layout
        const x = levelIdx * (nodeSpacing + 50) + padding;
        
        for (let i = 0; i < numNodes; i++) {
          const node = nodes.find(n => n.id === levelNodes[i]);
          if (node) {
            node.x = direction === 'LR' ? x : -x;
            node.y = i * (nodeSpacing + 100) + padding;
          }
        }
      }
    }
    
    return { ...diagramData, nodes };
  }

  private circularLayout(diagramData: DiagramData): DiagramData {
    const { nodes } = diagramData;
    const centerX = 500;
    const centerY = 300;
    const radius = Math.max(200, nodes.length * 20);
    
    for (let i = 0; i < nodes.length; i++) {
      const angle = (2 * Math.PI * i) / nodes.length;
      nodes[i].x = centerX + radius * Math.cos(angle) - nodes[i].width / 2;
      nodes[i].y = centerY + radius * Math.sin(angle) - nodes[i].height / 2;
    }
    
    return { ...diagramData, nodes };
  }

  private gridLayout(diagramData: DiagramData): DiagramData {
    const { nodes } = diagramData;
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);
    const spacing = this.layoutOptions.nodeSpacing || 100;
    const padding = this.layoutOptions.padding || 20;
    
    for (let i = 0; i < nodes.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      nodes[i].x = col * (spacing + 100) + padding;
      nodes[i].y = row * (spacing + 50) + padding;
    }
    
    return { ...diagramData, nodes };
  }

  private radialLayout(diagramData: DiagramData): DiagramData {
    const { nodes } = diagramData;
    
    // Find the most connected node to be the center
    const connections: Record<string, number> = {};
    
    for (const node of nodes) {
      connections[node.id] = 0;
    }
    
    for (const link of diagramData.links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      if (connections[sourceId] !== undefined) connections[sourceId]++;
      if (connections[targetId] !== undefined) connections[targetId]++;
    }
    
    // Find the node with the most connections
    let centerNode = nodes[0];
    let maxConnections = -1;
    
    for (const node of nodes) {
      if (connections[node.id] > maxConnections) {
        maxConnections = connections[node.id];
        centerNode = node;
      }
    }
    
    // Position center node in the middle
    centerNode.x = 500;
    centerNode.y = 300;
    
    // Position other nodes in rings around the center
    const otherNodes = nodes.filter(n => n.id !== centerNode.id);
    const ringCount = Math.ceil(Math.sqrt(otherNodes.length));
    const nodesPerRing = Math.max(1, Math.ceil(otherNodes.length / ringCount));
    
    for (let i = 0; i < otherNodes.length; i++) {
      const ringIndex = Math.floor(i / nodesPerRing);
      const nodeInRingIndex = i % nodesPerRing;
      const radius = (ringIndex + 1) * 100;
      const angle = (2 * Math.PI * nodeInRingIndex) / Math.max(1, nodesPerRing);
      
      otherNodes[i].x = centerNode.x + radius * Math.cos(angle) - otherNodes[i].width / 2;
      otherNodes[i].y = centerNode.y + radius * Math.sin(angle) - otherNodes[i].height / 2;
    }
    
    return { ...diagramData, nodes };
  }

  public getAvailableAlgorithms(): string[] {
    return ['force-directed', 'hierarchical', 'circular', 'grid', 'radial'];
  }
}
