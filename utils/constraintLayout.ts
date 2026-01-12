import { DiagramData, ArchNode, Container } from '../types';

export type ArchitecturePattern = 
  | 'client-server'
  | 'three-tier'
  | 'four-tier'
  | 'microservices'
  | 'event-driven'
  | 'layered'
  | 'monolithic'
  | 'service-oriented'
  | 'peer-to-peer'
  | 'hub-and-spoke'
  | 'n-tier'
  | 'hybrid';

export interface PositionConstraint {
  priority: number; // Lower numbers are higher priority
  apply: (nodes: ArchNode[], containers: Container[]) => void;
}

// Define constraint types
export interface RelativePositionConstraint {
  nodeId: string;
  relativeTo: string;
  direction: 'left' | 'right' | 'above' | 'below' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  distance?: number; // Minimum distance between nodes
}

export interface AlignmentConstraint {
  nodeIds: string[];
  axis: 'horizontal' | 'vertical';
  spacing?: number; // Distance between aligned elements
}

export interface GroupingConstraint {
  nodeIds: string[];
  containerId?: string;
  layout: 'horizontal' | 'vertical' | 'grid' | 'cluster';
}

export interface BoundaryConstraint {
  nodeId: string;
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
}

export class ConstraintBasedLayoutEngine {
  private constraints: PositionConstraint[] = [];
  
  constructor() {
    this.initializeDefaultConstraints();
  }

  private initializeDefaultConstraints() {
    // Add default constraints for common architectural patterns
    this.constraints.push(
      // Default spacing constraint
      {
        priority: 10,
        apply: (nodes, containers) => this.applySpacingConstraints(nodes, containers)
      },
      
      // Boundary constraints
      {
        priority: 20,
        apply: (nodes, containers) => this.applyBoundaryConstraints(nodes, containers)
      }
    );
  }

  public addConstraint(constraint: PositionConstraint) {
    this.constraints.push(constraint);
    // Keep constraints sorted by priority
    this.constraints.sort((a, b) => a.priority - b.priority);
  }

  public addRelativePositionConstraint(constraint: RelativePositionConstraint) {
    this.addConstraint({
      priority: 50,
      apply: (nodes, containers) => this.applyRelativePositionConstraint(nodes, constraint)
    });
  }

  public addAlignmentConstraint(constraint: AlignmentConstraint) {
    this.addConstraint({
      priority: 40,
      apply: (nodes, containers) => this.applyAlignmentConstraint(nodes, constraint)
    });
  }

  public addGroupingConstraint(constraint: GroupingConstraint) {
    this.addConstraint({
      priority: 30,
      apply: (nodes, containers) => this.applyGroupingConstraint(nodes, containers, constraint)
    });
  }

  public addBoundaryConstraint(constraint: BoundaryConstraint) {
    this.addConstraint({
      priority: 25,
      apply: (nodes, containers) => this.applyBoundaryConstraint(nodes, constraint)
    });
  }

  public applyConstraints(diagramData: DiagramData): DiagramData {
    // First apply pattern-based layout
    let updatedDiagram = this.applyPatternBasedLayout(diagramData);
    
    // Then apply any custom constraints
    let updatedNodes = [...updatedDiagram.nodes];
    const updatedContainers = updatedDiagram.containers ? [...updatedDiagram.containers] : [];

    // Apply constraints in priority order
    for (const constraint of this.constraints) {
      constraint.apply(updatedNodes, updatedContainers);
    }

    return {
      ...updatedDiagram,
      nodes: updatedNodes,
      containers: updatedContainers
    };
  }

  private applySpacingConstraints(nodes: ArchNode[], containers: Container[]) {
    const MIN_SPACING = 100;
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        
        // Calculate distance between centers
        const centerX1 = nodeA.x + nodeA.width / 2;
        const centerY1 = nodeA.y + nodeA.height / 2;
        const centerX2 = nodeB.x + nodeB.width / 2;
        const centerY2 = nodeB.y + nodeB.height / 2;
        
        const distanceX = Math.abs(centerX1 - centerX2);
        const distanceY = Math.abs(centerY1 - centerY2);
        
        // Adjust positions if nodes are too close
        if (distanceX < MIN_SPACING) {
          const overlapX = MIN_SPACING - distanceX;
          if (centerX1 < centerX2) {
            nodeB.x += overlapX / 2;
            nodeA.x -= overlapX / 2;
          } else {
            nodeA.x += overlapX / 2;
            nodeB.x -= overlapX / 2;
          }
        }
        
        if (distanceY < MIN_SPACING) {
          const overlapY = MIN_SPACING - distanceY;
          if (centerY1 < centerY2) {
            nodeB.y += overlapY / 2;
            nodeA.y -= overlapY / 2;
          } else {
            nodeA.y += overlapY / 2;
            nodeB.y -= overlapY / 2;
          }
        }
      }
    }
  }

  private applyBoundaryConstraints(nodes: ArchNode[], containers: Container[]) {
    const CANVAS_MIN_X = 50;
    const CANVAS_MIN_Y = 50;
    const CANVAS_MAX_X = 2000;
    const CANVAS_MAX_Y = 1200;
    
    for (const node of nodes) {
      // Ensure node is within canvas bounds
      if (node.x < CANVAS_MIN_X) {
        node.x = CANVAS_MIN_X;
      }
      if (node.y < CANVAS_MIN_Y) {
        node.y = CANVAS_MIN_Y;
      }
      
      // Adjust if node exceeds boundaries based on its size
      if (node.x + node.width > CANVAS_MAX_X) {
        node.x = CANVAS_MAX_X - node.width;
      }
      if (node.y + node.height > CANVAS_MAX_Y) {
        node.y = CANVAS_MAX_Y - node.height;
      }
    }
  }

  private applyRelativePositionConstraint(nodes: ArchNode[], constraint: RelativePositionConstraint) {
    const node = nodes.find(n => n.id === constraint.nodeId);
    const targetNode = nodes.find(n => n.id === constraint.relativeTo);
    
    if (!node || !targetNode) return;

    const nodeCenterX = node.x + node.width / 2;
    const nodeCenterY = node.y + node.height / 2;
    const targetCenterX = targetNode.x + targetNode.width / 2;
    const targetCenterY = targetNode.y + targetNode.height / 2;
    
    const distance = constraint.distance || 150;
    
    switch (constraint.direction) {
      case 'left':
        node.x = targetNode.x - node.width - distance;
        node.y = targetNode.y;
        break;
      case 'right':
        node.x = targetNode.x + targetNode.width + distance;
        node.y = targetNode.y;
        break;
      case 'above':
        node.x = targetNode.x;
        node.y = targetNode.y - node.height - distance;
        break;
      case 'below':
        node.x = targetNode.x;
        node.y = targetNode.y + targetNode.height + distance;
        break;
      case 'center':
        node.x = targetNode.x + (targetNode.width - node.width) / 2;
        node.y = targetNode.y + (targetNode.height - node.height) / 2;
        break;
      case 'top-left':
        node.x = targetNode.x;
        node.y = targetNode.y;
        break;
      case 'top-right':
        node.x = targetNode.x + targetNode.width - node.width;
        node.y = targetNode.y;
        break;
      case 'bottom-left':
        node.x = targetNode.x;
        node.y = targetNode.y + targetNode.height - node.height;
        break;
      case 'bottom-right':
        node.x = targetNode.x + targetNode.width - node.width;
        node.y = targetNode.y + targetNode.height - node.height;
        break;
    }
  }

  private applyAlignmentConstraint(nodes: ArchNode[], constraint: AlignmentConstraint) {
    const validNodes = nodes.filter(n => constraint.nodeIds.includes(n.id));
    if (validNodes.length < 2) return;

    if (constraint.axis === 'horizontal') {
      // Align nodes horizontally (same Y coordinate)
      const avgY = validNodes.reduce((sum, node) => sum + node.y + node.height / 2, 0) / validNodes.length;
      const spacing = constraint.spacing || 150;
      
      // Sort nodes by their original X position to maintain order
      validNodes.sort((a, b) => (a.x + a.width / 2) - (b.x + b.width / 2));
      
      let currentX = Math.min(...validNodes.map(n => n.x));
      for (const node of validNodes) {
        node.y = avgY - node.height / 2; // Center align vertically
        node.x = currentX;
        currentX += node.width + spacing;
      }
    } else if (constraint.axis === 'vertical') {
      // Align nodes vertically (same X coordinate)
      const avgX = validNodes.reduce((sum, node) => sum + node.x + node.width / 2, 0) / validNodes.length;
      const spacing = constraint.spacing || 100;
      
      // Sort nodes by their original Y position to maintain order
      validNodes.sort((a, b) => (a.y + a.height / 2) - (b.y + b.height / 2));
      
      let currentY = Math.min(...validNodes.map(n => n.y));
      for (const node of validNodes) {
        node.x = avgX - node.width / 2; // Center align horizontally
        node.y = currentY;
        currentY += node.height + spacing;
      }
    }
  }

  private applyGroupingConstraint(nodes: ArchNode[], containers: Container[], constraint: GroupingConstraint) {
    const groupNodes = nodes.filter(n => constraint.nodeIds.includes(n.id));
    if (groupNodes.length === 0) return;

    if (constraint.layout === 'horizontal') {
      this.arrangeHorizontally(groupNodes, 150);
    } else if (constraint.layout === 'vertical') {
      this.arrangeVertically(groupNodes, 100);
    } else if (constraint.layout === 'grid') {
      this.arrangeGrid(groupNodes, 150, 100);
    } else if (constraint.layout === 'cluster') {
      this.arrangeCluster(groupNodes);
    }
  }

  private arrangeHorizontally(nodes: ArchNode[], spacing: number) {
    if (nodes.length === 0) return;
    
    nodes.sort((a, b) => (a.x + a.width / 2) - (b.x + b.width / 2));
    
    let currentX = Math.min(...nodes.map(n => n.x));
    const centerY = Math.max(...nodes.map(n => n.y)) + Math.max(...nodes.map(n => n.height)) / 2;
    
    for (const node of nodes) {
      node.y = centerY - node.height / 2;
      node.x = currentX;
      currentX += node.width + spacing;
    }
  }

  private arrangeVertically(nodes: ArchNode[], spacing: number) {
    if (nodes.length === 0) return;
    
    nodes.sort((a, b) => (a.y + a.height / 2) - (b.y + b.height / 2));
    
    const centerX = Math.max(...nodes.map(n => n.x)) + Math.max(...nodes.map(n => n.width)) / 2;
    let currentY = Math.min(...nodes.map(n => n.y));
    
    for (const node of nodes) {
      node.x = centerX - node.width / 2;
      node.y = currentY;
      currentY += node.height + spacing;
    }
  }

  private arrangeGrid(nodes: ArchNode[], horizontalSpacing: number, verticalSpacing: number) {
    if (nodes.length === 0) return;
    
    // Simple grid: 3 columns max
    const cols = Math.min(3, nodes.length);
    const rows = Math.ceil(nodes.length / cols);
    
    const startX = Math.min(...nodes.map(n => n.x));
    const startY = Math.min(...nodes.map(n => n.y));
    
    for (let i = 0; i < nodes.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      nodes[i].x = startX + col * (nodes[i].width + horizontalSpacing);
      nodes[i].y = startY + row * (nodes[i].height + verticalSpacing);
    }
  }

  private arrangeCluster(nodes: ArchNode[]) {
    if (nodes.length === 0) return;
    
    // Calculate center point
    const centerX = nodes.reduce((sum, node) => sum + node.x + node.width / 2, 0) / nodes.length;
    const centerY = nodes.reduce((sum, node) => sum + node.y + node.height / 2, 0) / nodes.length;
    
    // Arrange in a circular cluster around the center
    const radius = Math.max(200, nodes.length * 30); // Adjust radius based on number of nodes
    
    for (let i = 0; i < nodes.length; i++) {
      const angle = (2 * Math.PI * i) / nodes.length;
      const x = centerX + radius * Math.cos(angle) - nodes[i].width / 2;
      const y = centerY + radius * Math.sin(angle) - nodes[i].height / 2;
      
      nodes[i].x = x;
      nodes[i].y = y;
    }
  }

  private applyBoundaryConstraint(nodes: ArchNode[], constraint: BoundaryConstraint) {
    const node = nodes.find(n => n.id === constraint.nodeId);
    if (!node) return;

    if (constraint.minX !== undefined && node.x < constraint.minX) {
      node.x = constraint.minX;
    }
    if (constraint.minY !== undefined && node.y < constraint.minY) {
      node.y = constraint.minY;
    }
    if (constraint.maxX !== undefined && node.x + node.width > constraint.maxX) {
      node.x = constraint.maxX - node.width;
    }
    if (constraint.maxY !== undefined && node.y + node.height > constraint.maxY) {
      node.y = constraint.maxY - node.height;
    }
  }

  public detectArchitecturePattern(diagramData: DiagramData): ArchitecturePattern {
    // Analyze the diagram structure to identify the architecture pattern
    const nodeCount = diagramData.nodes.length;
    const linkCount = diagramData.links.length;
    
    // Simple heuristic-based pattern detection
    if (nodeCount <= 3 && linkCount <= 3) {
      return 'client-server';
    } else if (nodeCount >= 4 && nodeCount <= 6 && this.hasTierStructure(diagramData)) {
      return 'three-tier';
    } else if (nodeCount >= 7 && nodeCount <= 10 && this.hasTierStructure(diagramData)) {
      return 'four-tier';
    } else if (nodeCount >= 11 && this.hasTierStructure(diagramData)) {
      return 'n-tier';
    } else if (linkCount >= nodeCount * 1.5) {
      // Highly connected system
      return 'microservices';
    } else if (this.hasCentralHub(diagramData)) {
      return 'hub-and-spoke';
    } else if (this.hasEventDrivenPattern(diagramData)) {
      return 'event-driven';
    } else {
      return 'layered'; // Default fallback
    }
  }

  private hasEventDrivenPattern(diagramData: DiagramData): boolean {
    // Check for event-driven patterns (queues, pub/sub, event buses, etc.)
    const eventComponents = ['queue', 'bus', 'event', 'message', 'stream', 'topic', 'producer', 'consumer'];
    const eventNodes = diagramData.nodes.filter(node => 
      eventComponents.some(comp => node.label.toLowerCase().includes(comp))
    );
    
    return eventNodes.length >= 2;
  }

  public applyPatternBasedLayout(diagramData: DiagramData): DiagramData {
    const pattern = this.detectArchitecturePattern(diagramData);
    
    switch (pattern) {
      case 'client-server':
        return this.applyClientServerLayout(diagramData);
      case 'three-tier':
        return this.applyThreeTierLayout(diagramData);
      case 'four-tier':
        return this.applyFourTierLayout(diagramData);
      case 'n-tier':
        return this.applyNTierLayout(diagramData);
      case 'microservices':
        return this.applyMicroservicesLayout(diagramData);
      case 'hub-and-spoke':
        return this.applyHubSpokeLayout(diagramData);
      case 'event-driven':
        return this.applyEventDrivenLayout(diagramData);
      case 'layered':
      case 'service-oriented':
      case 'monolithic':
      case 'peer-to-peer':
      case 'hybrid':
      default:
        return this.applyGenericLayout(diagramData);
    }
  }

  private applyClientServerLayout(diagramData: DiagramData): DiagramData {
    const updatedNodes = [...diagramData.nodes];
    const clientNodes = updatedNodes.filter(node => 
      ['client', 'ui', 'frontend', 'mobile', 'web'].some(c => 
        node.label.toLowerCase().includes(c)
      )
    );
    const serverNodes = updatedNodes.filter(node => 
      ['server', 'backend', 'api', 'database', 'db'].some(s => 
        node.label.toLowerCase().includes(s)
      )
    );

    // Position clients on the left, servers on the right
    const startX = 100;
    const startY = 300;
    const spacingX = 300;
    const spacingY = 150;

    // Position clients
    clientNodes.forEach((node, index) => {
      node.x = startX;
      node.y = startY + (index * spacingY);
    });

    // Position servers
    serverNodes.forEach((node, index) => {
      node.x = startX + spacingX;
      node.y = startY + (index * spacingY);
    });

    return { ...diagramData, nodes: updatedNodes };
  }

  private applyThreeTierLayout(diagramData: DiagramData): DiagramData {
    const updatedNodes = [...diagramData.nodes];
    
    // Identify presentation, business, and data layers
    const presentationNodes = updatedNodes.filter(node => 
      ['ui', 'frontend', 'web', 'client', 'presentation'].some(p => 
        node.label.toLowerCase().includes(p)
      )
    );
    const businessNodes = updatedNodes.filter(node => 
      ['business', 'logic', 'service', 'application', 'app'].some(b => 
        node.label.toLowerCase().includes(b)
      )
    );
    const dataNodes = updatedNodes.filter(node => 
      ['database', 'data', 'storage', 'db', 'repository', 'cache'].some(d => 
        node.label.toLowerCase().includes(d)
      )
    );
    
    // Position in three vertical columns
    const startX = 200;
    const spacingX = 300;
    const centerY = 300;
    const spacingY = 100;

    // Position presentation tier (left)
    presentationNodes.forEach((node, index) => {
      node.x = startX;
      node.y = centerY + (index - Math.floor(presentationNodes.length / 2)) * spacingY;
    });

    // Position business tier (middle)
    businessNodes.forEach((node, index) => {
      node.x = startX + spacingX;
      node.y = centerY + (index - Math.floor(businessNodes.length / 2)) * spacingY;
    });

    // Position data tier (right)
    dataNodes.forEach((node, index) => {
      node.x = startX + (spacingX * 2);
      node.y = centerY + (index - Math.floor(dataNodes.length / 2)) * spacingY;
    });

    return { ...diagramData, nodes: updatedNodes };
  }

  private applyFourTierLayout(diagramData: DiagramData): DiagramData {
    const updatedNodes = [...diagramData.nodes];
    
    // Identify four tiers: presentation, business, application, data
    const presentationNodes = updatedNodes.filter(node => 
      ['ui', 'frontend', 'web', 'client', 'presentation'].some(p => 
        node.label.toLowerCase().includes(p)
      )
    );
    const businessNodes = updatedNodes.filter(node => 
      ['business', 'logic', 'service'].some(b => 
        node.label.toLowerCase().includes(b)
      )
    );
    const applicationNodes = updatedNodes.filter(node => 
      ['application', 'app', 'middleware'].some(a => 
        node.label.toLowerCase().includes(a)
      )
    );
    const dataNodes = updatedNodes.filter(node => 
      ['database', 'data', 'storage', 'db', 'repository'].some(d => 
        node.label.toLowerCase().includes(d)
      )
    );
    
    // Position in four vertical columns
    const startX = 150;
    const spacingX = 250;
    const centerY = 250;
    const spacingY = 100;

    // Position each tier
    [presentationNodes, businessNodes, applicationNodes, dataNodes].forEach((tierNodes, tierIndex) => {
      tierNodes.forEach((node, nodeIndex) => {
        node.x = startX + (tierIndex * spacingX);
        node.y = centerY + (nodeIndex - Math.floor(tierNodes.length / 2)) * spacingY;
      });
    });

    return { ...diagramData, nodes: updatedNodes };
  }

  private applyNTierLayout(diagramData: DiagramData): DiagramData {
    const updatedNodes = [...diagramData.nodes];
    
    // Group nodes by likely tier based on common labels
    const tiers: ArchNode[][] = [[], [], [], [], []]; // Up to 5 tiers
    
    for (const node of updatedNodes) {
      const label = node.label.toLowerCase();
      
      if (['ui', 'frontend', 'web', 'client', 'presentation', 'user'].some(t => label.includes(t))) {
        tiers[0].push(node); // Presentation tier
      } else if (['api', 'service', 'gateway', 'proxy'].some(t => label.includes(t))) {
        tiers[1].push(node); // Service tier
      } else if (['business', 'logic', 'workflow', 'process'].some(t => label.includes(t))) {
        tiers[2].push(node); // Business tier
      } else if (['integration', 'adapter', 'middleware'].some(t => label.includes(t))) {
        tiers[3].push(node); // Integration tier
      } else {
        tiers[4].push(node); // Data/Infrastructure tier
      }
    }
    
    // Position in vertical columns
    const startX = 100;
    const spacingX = 200;
    const centerY = 200;
    const spacingY = 80;

    // Position each tier
    tiers.forEach((tierNodes, tierIndex) => {
      if (tierNodes.length > 0) {
        const offsetX = startX + (tierIndex * spacingX);
        tierNodes.forEach((node, nodeIndex) => {
          node.x = offsetX;
          node.y = centerY + (nodeIndex - Math.floor(tierNodes.length / 2)) * spacingY;
        });
      }
    });

    return { ...diagramData, nodes: updatedNodes };
  }

  private applyMicroservicesLayout(diagramData: DiagramData): DiagramData {
    const updatedNodes = [...diagramData.nodes];
    
    // Group related services together based on naming patterns
    const serviceGroups: { [key: string]: ArchNode[] } = {};
    
    for (const node of updatedNodes) {
      const label = node.label.toLowerCase();
      let groupName = 'general';
      
      // Identify potential service groups
      if (label.includes('user') || label.includes('auth') || label.includes('account')) {
        groupName = 'user-management';
      } else if (label.includes('order') || label.includes('cart') || label.includes('checkout')) {
        groupName = 'commerce';
      } else if (label.includes('payment') || label.includes('billing')) {
        groupName = 'payment';
      } else if (label.includes('notification') || label.includes('email')) {
        groupName = 'communication';
      } else if (label.includes('analytics') || label.includes('report')) {
        groupName = 'analytics';
      }
      
      if (!serviceGroups[groupName]) {
        serviceGroups[groupName] = [];
      }
      serviceGroups[groupName].push(node);
    }
    
    // Position groups in clusters
    const groupNames = Object.keys(serviceGroups);
    const centerX = 500;
    const centerY = 400;
    const radius = 300;
    
    groupNames.forEach((groupName, groupIndex) => {
      const angle = (2 * Math.PI * groupIndex) / groupNames.length;
      const groupCenterX = centerX + radius * Math.cos(angle);
      const groupCenterY = centerY + radius * Math.sin(angle);
      
      const groupNodes = serviceGroups[groupName];
      const groupRadius = Math.max(80, groupNodes.length * 15);
      
      groupNodes.forEach((node, nodeIndex) => {
        const nodeAngle = (2 * Math.PI * nodeIndex) / groupNodes.length;
        node.x = groupCenterX + groupRadius * Math.cos(nodeAngle) - node.width / 2;
        node.y = groupCenterY + groupRadius * Math.sin(nodeAngle) - node.height / 2;
      });
    });

    return { ...diagramData, nodes: updatedNodes };
  }

  private applyHubSpokeLayout(diagramData: DiagramData): DiagramData {
    const updatedNodes = [...diagramData.nodes];
    
    // Identify the hub (most connected node)
    const nodeConnections: { [key: string]: number } = {};
    
    for (const link of diagramData.links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      nodeConnections[sourceId] = (nodeConnections[sourceId] || 0) + 1;
      nodeConnections[targetId] = (nodeConnections[targetId] || 0) + 1;
    }
    
    // Find the hub node (highest connection count)
    let hubNode: ArchNode | null = null;
    let maxConnections = 0;
    
    for (const node of updatedNodes) {
      const connections = nodeConnections[node.id] || 0;
      if (connections > maxConnections) {
        maxConnections = connections;
        hubNode = node;
      }
    }
    
    if (!hubNode) {
      // If no clear hub found, use the first node as default
      hubNode = updatedNodes[0];
    }
    
    // Position hub in the center
    hubNode.x = 500;
    hubNode.y = 300;
    
    // Position spoke nodes around the hub
    const spokeNodes = updatedNodes.filter(node => node.id !== hubNode!.id);
    const radius = 250;
    
    spokeNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / spokeNodes.length;
      node.x = hubNode!.x + radius * Math.cos(angle) - node.width / 2;
      node.y = hubNode!.y + radius * Math.sin(angle) - node.height / 2;
    });

    return { ...diagramData, nodes: updatedNodes };
  }

  private applyEventDrivenLayout(diagramData: DiagramData): DiagramData {
    const updatedNodes = [...diagramData.nodes];
    
    // Classify nodes into producers, consumers, and event infrastructure
    const producers: ArchNode[] = [];
    const consumers: ArchNode[] = [];
    const infrastructure: ArchNode[] = []; // Queues, topics, etc.
    
    for (const node of updatedNodes) {
      const label = node.label.toLowerCase();
      
      if (label.includes('producer') || label.includes('publisher') || label.includes('source')) {
        producers.push(node);
      } else if (label.includes('consumer') || label.includes('subscriber') || label.includes('listener')) {
        consumers.push(node);
      } else if (label.includes('queue') || label.includes('topic') || label.includes('bus') || 
                 label.includes('event') || label.includes('stream')) {
        infrastructure.push(node);
      } else {
        // Default to producer if not clearly consumer or infrastructure
        producers.push(node);
      }
    }
    
    // Position in a flow: producers -> infrastructure -> consumers
    const startX = 150;
    const spacingX = 300;
    const centerY = 300;
    const spacingY = 100;
    
    // Position producers (left)
    producers.forEach((node, index) => {
      node.x = startX;
      node.y = centerY + (index - Math.floor(producers.length / 2)) * spacingY;
    });
    
    // Position infrastructure (center)
    infrastructure.forEach((node, index) => {
      node.x = startX + spacingX;
      node.y = centerY + (index - Math.floor(infrastructure.length / 2)) * spacingY;
    });
    
    // Position consumers (right)
    consumers.forEach((node, index) => {
      node.x = startX + (spacingX * 2);
      node.y = centerY + (index - Math.floor(consumers.length / 2)) * spacingY;
    });

    return { ...diagramData, nodes: updatedNodes };
  }

  private applyGenericLayout(diagramData: DiagramData): DiagramData {
    // For generic layout, just apply the basic constraints
    return this.applyConstraints(diagramData);
  }

  private hasTierStructure(diagramData: DiagramData): boolean {
    // Check if nodes can be grouped into distinct tiers
    // This is a simplified version - in practice, you'd analyze the actual connections
    const labels = diagramData.nodes.map(n => n.label.toLowerCase());
    
    const presentationLayers = ['ui', 'frontend', 'web', 'client', 'mobile'];
    const businessLayers = ['business', 'logic', 'service', 'application'];
    const dataLayers = ['database', 'data', 'storage', 'repository'];
    
    const hasPresentation = labels.some(label => 
      presentationLayers.some(layer => label.includes(layer)));
    const hasBusiness = labels.some(label => 
      businessLayers.some(layer => label.includes(layer)));
    const hasData = labels.some(label => 
      dataLayers.some(layer => label.includes(layer)));
    
    return hasPresentation && hasBusiness && hasData;
  }

  private hasCentralHub(diagramData: DiagramData): boolean {
    // Check if there's a central node connected to many others
    const nodeConnections: { [key: string]: number } = {};
    
    for (const link of diagramData.links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      nodeConnections[sourceId] = (nodeConnections[sourceId] || 0) + 1;
      nodeConnections[targetId] = (nodeConnections[targetId] || 0) + 1;
    }
    
    const maxConnections = Math.max(...Object.values(nodeConnections));
    return maxConnections > diagramData.nodes.length * 0.4; // If one node connects to more than 40% of nodes
  }
}
