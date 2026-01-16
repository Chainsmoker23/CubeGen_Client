/**
 * AIArchitecturePlanner - AI-powered architecture planning and layout service
 * Uses Gemini's reasoning to plan the entire architecture before generation
 */

import { ArchNode, Container, Link, DiagramData } from '../types';
import { supabase } from '../supabaseClient';

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
    // This allows components to access richer error details.
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

export interface ArchitecturePlan {
  nodes: PlannedNode[];
  containers: PlannedContainer[];
  links: PlannedLink[];
  layoutStrategy: 'linear' | 'tiered' | 'hub-spoke' | 'grid' | 'radial' | 'clustered';
  canvasDimensions: { width: number; height: number };
  criticalPaths: string[][]; // Sequences of critical components
  securityZones: SecurityZone[];
}

export interface PlannedNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layer?: string;
  securityZone?: string;
  importance: 'critical' | 'important' | 'supporting' | 'infrastructure';
  dependencies: string[]; // Node IDs this node depends on
  connections: string[]; // Node IDs this node connects to
}

export interface PlannedContainer {
  id: string;
  label: string;
  type: 'vpc' | 'availability-zone' | 'subnet' | 'region' | 'tier' | 'security-zone';
  x: number;
  y: number;
  width: number;
  height: number;
  childNodeIds: string[];
  layer?: string;
  securityZone?: string;
}

export interface PlannedLink {
  id: string;
  source: string;
  target: string;
  label?: string;
  style: 'solid' | 'dashed' | 'dotted';
  thickness: 'thin' | 'medium' | 'thick';
  bidirectional: boolean;
  critical: boolean; // Part of a critical path
}

export interface SecurityZone {
  id: string;
  name: string;
  nodeIds: string[];
  containerIds: string[];
  level: 'public' | 'private' | 'trusted' | 'restricted';
}

export interface ArchitectureContext {
  prompt: string;
  pattern: 'microservices' | 'monolithic' | 'event-driven' | 'layered' | 'hub-spoke' | 'client-server' | 'pipeline';
  layers: string[];
  criticalComponents: string[];
  infrastructureComponents: string[];
  securityRequirements: string[];
  scalabilityRequirements: string[];
  performanceRequirements: string[];
}

export class AIArchitecturePlanner {
  constructor() {
  }

  /**
   * Plans the entire architecture using AI reasoning before generation
   */
  async planArchitecture(prompt: string): Promise<ArchitecturePlan> {
    // First, analyze the architecture context
    const context = await this.analyzeArchitectureContext(prompt);
    
    // Then, plan the components iteratively
    const plan = await this.iterativeArchitecturePlanning(context);
    
    return plan;
  }

  /**
   * Analyzes the architecture context using AI
   */
  private async analyzeArchitectureContext(prompt: string): Promise<ArchitectureContext> {
    const analysisPrompt = `
      Analyze the following architecture prompt and identify key characteristics:

      PROMPT: ${prompt}

      Respond with a JSON object containing:
      {
        "pattern": "Identify the main architectural pattern (microservices, monolithic, event-driven, layered, hub-spoke, client-server, pipeline)",
        "layers": ["List the logical layers identified in the architecture"],
        "criticalComponents": ["List components that are critical to the system"],
        "infrastructureComponents": ["List supporting infrastructure components"],
        "securityRequirements": ["List security requirements identified"],
        "scalabilityRequirements": ["List scalability requirements"],
        "performanceRequirements": ["List performance requirements"]
      }

      Be specific about component types and requirements. Focus on technical architecture.
    `;

    try {
      const response = await this.callGemini(analysisPrompt, {
        temperature: 0.3,
        maxOutputTokens: 1000
      });

      const parsed = JSON.parse(response);
      return {
        prompt,
        pattern: parsed.pattern || 'microservices',
        layers: parsed.layers || [],
        criticalComponents: parsed.criticalComponents || [],
        infrastructureComponents: parsed.infrastructureComponents || [],
        securityRequirements: parsed.securityRequirements || [],
        scalabilityRequirements: parsed.scalabilityRequirements || [],
        performanceRequirements: parsed.performanceRequirements || []
      };
    } catch (error) {
      console.error('Error analyzing architecture context:', error);
      // Return a default context
      return {
        prompt,
        pattern: 'microservices',
        layers: ['presentation', 'business', 'data'],
        criticalComponents: [],
        infrastructureComponents: [],
        securityRequirements: [],
        scalabilityRequirements: [],
        performanceRequirements: []
      };
    }
  }

  /**
   * Performs iterative architecture planning using AI reasoning
   */
  private async iterativeArchitecturePlanning(context: ArchitectureContext): Promise<ArchitecturePlan> {
    // Step 1: Plan critical components first
    const criticalNodes = await this.planCriticalComponents(context);
    
    // Step 2: Plan supporting infrastructure
    const infrastructureNodes = await this.planInfrastructureComponents(context);
    
    // Step 3: Plan remaining components
    const remainingNodes = await this.planRemainingComponents(context, [...criticalNodes, ...infrastructureNodes]);
    
    // Combine all nodes
    const allNodes = [...criticalNodes, ...infrastructureNodes, ...remainingNodes];
    
    // Step 4: Plan containers based on nodes and context
    const containers = await this.planContainers(context, allNodes);
    
    // Step 5: Plan connections between components
    const links = await this.planConnections(context, allNodes);
    
    // Step 6: Determine layout strategy
    const layoutStrategy = this.determineLayoutStrategy(context, allNodes, containers);
    
    // Step 7: Calculate positions based on strategy
    const positionedNodes = this.calculateNodePositions(allNodes, layoutStrategy, containers);
    const positionedContainers = this.calculateContainerPositions(containers, positionedNodes);
    
    // Step 8: Identify critical paths
    const criticalPaths = this.identifyCriticalPaths(positionedNodes, links);
    
    // Step 9: Define security zones
    const securityZones = this.defineSecurityZones(context, positionedNodes, positionedContainers);
    
    return {
      nodes: positionedNodes,
      containers: positionedContainers,
      links,
      layoutStrategy,
      canvasDimensions: { width: 1200, height: 800 },
      criticalPaths,
      securityZones
    };
  }

  private async planCriticalComponents(context: ArchitectureContext): Promise<PlannedNode[]> {
    const prompt = `
      Based on this architecture context, identify and plan the critical components:

      CONTEXT: ${JSON.stringify(context, null, 2)}

      Plan the critical components with the following details for each:
      - ID (kebab-case)
      - Label (descriptive name)
      - Type (from available types like aws-ec2, aws-s3, aws-rds, etc.)
      - Estimated width and height
      - Importance (critical)
      - Dependencies on other components
      - Connections to other components

      Return as a JSON array of planned nodes.
    `;

    try {
      const response = await this.callGemini(prompt, {
        temperature: 0.2,
        maxOutputTokens: 1500
      });

      const nodes = JSON.parse(response);
      return nodes.map((node: any) => ({
        ...node,
        x: 0, // Will be set later
        y: 0, // Will be set later
        importance: 'critical' as const
      }));
    } catch (error) {
      console.error('Error planning critical components:', error);
      return [];
    }
  }

  private async planInfrastructureComponents(context: ArchitectureContext): Promise<PlannedNode[]> {
    const prompt = `
      Plan the infrastructure components for this architecture:

      CONTEXT: ${JSON.stringify(context, null, 2)}

      Focus on supporting infrastructure like:
      - Load balancers
      - Caches (Redis, Memcached)
      - Gateways
      - Security components
      - Monitoring/logging
      - Backup systems

      Return as a JSON array of planned nodes with details.
    `;

    try {
      const response = await this.callGemini(prompt, {
        temperature: 0.2,
        maxOutputTokens: 1000
      });

      const nodes = JSON.parse(response);
      return nodes.map((node: any) => ({
        ...node,
        x: 0, // Will be set later
        y: 0, // Will be set later
        importance: 'infrastructure' as const
      }));
    } catch (error) {
      console.error('Error planning infrastructure components:', error);
      return [];
    }
  }

  private async planRemainingComponents(context: ArchitectureContext, existingNodes: PlannedNode[]): Promise<PlannedNode[]> {
    const prompt = `
      Plan the remaining components for this architecture:

      CONTEXT: ${JSON.stringify(context, null, 2)}
      
      EXISTING COMPONENTS: ${JSON.stringify(existingNodes, null, 2)}

      Plan any remaining components that haven't been addressed yet.
      Consider how they relate to existing components.

      Return as a JSON array of planned nodes with details.
    `;

    try {
      const response = await this.callGemini(prompt, {
        temperature: 0.3,
        maxOutputTokens: 1000
      });

      const nodes = JSON.parse(response);
      return nodes.map((node: any) => ({
        ...node,
        x: 0, // Will be set later
        y: 0, // Will be set later
        importance: 'important' as const
      }));
    } catch (error) {
      console.error('Error planning remaining components:', error);
      return [];
    }
  }

  private async planContainers(context: ArchitectureContext, nodes: PlannedNode[]): Promise<PlannedContainer[]> {
    const prompt = `
      Plan containers for this architecture based on:

      CONTEXT: ${JSON.stringify(context, null, 2)}
      NODES: ${JSON.stringify(nodes, null, 2)}

      Consider logical groupings like:
      - VPCs for network isolation
      - Availability zones for redundancy
      - Subnets for security zones
      - Tiers for layer organization
      - Security zones for access control

      Return as a JSON array of planned containers with child node assignments.
    `;

    try {
      const response = await this.callGemini(prompt, {
        temperature: 0.3,
        maxOutputTokens: 1000
      });

      const containers = JSON.parse(response);
      return containers.map((container: any) => ({
        ...container,
        x: 0, // Will be set later
        y: 0, // Will be set later
      }));
    } catch (error) {
      console.error('Error planning containers:', error);
      return [];
    }
  }

  private async planConnections(context: ArchitectureContext, nodes: PlannedNode[]): Promise<PlannedLink[]> {
    const prompt = `
      Plan connections between components for this architecture:

      CONTEXT: ${JSON.stringify(context, null, 2)}
      NODES: ${JSON.stringify(nodes, null, 2)}

      Identify logical connections based on:
      - Data flow
      - Dependencies
      - Communication patterns
      - Critical paths

      Mark connections that are part of critical paths.
      Specify appropriate styles and thickness based on connection importance.

      Return as a JSON array of planned links.
    `;

    try {
      const response = await this.callGemini(prompt, {
        temperature: 0.3,
        maxOutputTokens: 1000
      });

      const links = JSON.parse(response);
      return links.map((link: any) => ({
        ...link,
        critical: link.critical || false
      }));
    } catch (error) {
      console.error('Error planning connections:', error);
      return [];
    }
  }

  private determineLayoutStrategy(context: ArchitectureContext, nodes: PlannedNode[], containers: PlannedContainer[]): ArchitecturePlan['layoutStrategy'] {
    // Determine the best layout strategy based on architecture pattern
    switch (context.pattern) {
      case 'layered':
      case 'client-server':
        return 'tiered';
      case 'hub-spoke':
        return 'radial';
      case 'event-driven':
        return 'clustered';
      case 'pipeline':
        return 'linear';
      default:
        return nodes.length > 10 ? 'clustered' : 'grid';
    }
  }

  private calculateNodePositions(nodes: PlannedNode[], strategy: ArchitecturePlan['layoutStrategy'], containers: PlannedContainer[]): PlannedNode[] {
    // Calculate positions based on the determined strategy
    switch (strategy) {
      case 'linear':
        return this.positionLinearly(nodes);
      case 'tiered':
        return this.positionByTiers(nodes, containers);
      case 'hub-spoke':
        return this.positionRadially(nodes);
      case 'grid':
        return this.positionInGrid(nodes);
      case 'radial':
        return this.positionRadially(nodes);
      case 'clustered':
        return this.positionInClusters(nodes, containers);
      default:
        return this.positionInGrid(nodes);
    }
  }

  private positionLinearly(nodes: PlannedNode[]): PlannedNode[] {
    const startX = 150;
    const spacing = 200;
    
    return nodes.map((node, index) => ({
      ...node,
      x: startX + index * spacing,
      y: 400
    }));
  }

  private positionByTiers(nodes: PlannedNode[], containers: PlannedContainer[]): PlannedNode[] {
    // Group nodes by layer/tier
    const tierSpacing = 250;
    const nodesByTier: Record<string, PlannedNode[]> = {};
    
    // Assign nodes to tiers based on layer property or importance
    nodes.forEach(node => {
      const tier = node.layer || 
                   (node.importance === 'critical' ? 'core' : 
                   node.importance === 'infrastructure' ? 'infrastructure' : 'supporting');
      
      if (!nodesByTier[tier]) nodesByTier[tier] = [];
      nodesByTier[tier].push(node);
    });
    
    const tiers = Object.keys(nodesByTier);
    const positionedNodes: PlannedNode[] = [];
    
    tiers.forEach((tier, tierIndex) => {
      const tierNodes = nodesByTier[tier];
      const tierX = 200 + tierIndex * tierSpacing;
      
      tierNodes.forEach((node, nodeIndex) => {
        positionedNodes.push({
          ...node,
          x: tierX,
          y: 200 + nodeIndex * 80
        });
      });
    });
    
    return positionedNodes;
  }

  private positionRadially(nodes: PlannedNode[]): PlannedNode[] {
    const centerX = 600;
    const centerY = 400;
    const radius = 250;
    
    return nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    });
  }

  private positionInGrid(nodes: PlannedNode[]): PlannedNode[] {
    const gridWidth = 10;
    const spacing = 150;
    const startX = 100;
    const startY = 100;
    
    return nodes.map((node, index) => {
      const row = Math.floor(index / gridWidth);
      const col = index % gridWidth;
      
      return {
        ...node,
        x: startX + col * spacing,
        y: startY + row * spacing
      };
    });
  }

  private positionInClusters(nodes: PlannedNode[], containers: PlannedContainer[]): PlannedNode[] {
    // For now, position in grid but this would be enhanced to group by clusters
    return this.positionInGrid(nodes);
  }

  private calculateContainerPositions(containers: PlannedContainer[], nodes: PlannedNode[]): PlannedContainer[] {
    // Calculate container positions based on their contained nodes
    return containers.map(container => {
      const containerNodes = nodes.filter(node => container.childNodeIds.includes(node.id));
      
      if (containerNodes.length > 0) {
        // Calculate bounding box of contained nodes
        const minX = Math.min(...containerNodes.map(n => n.x - n.width / 2));
        const maxX = Math.max(...containerNodes.map(n => n.x + n.width / 2));
        const minY = Math.min(...containerNodes.map(n => n.y - n.height / 2));
        const maxY = Math.max(...containerNodes.map(n => n.y + n.height / 2));
        
        const padding = 40;
        
        return {
          ...container,
          x: minX - padding,
          y: minY - padding,
          width: maxX - minX + padding * 2,
          height: maxY - minY + padding * 2
        };
      }
      
      // Default position if no nodes
      return {
        ...container,
        x: 200,
        y: 200,
        width: 300,
        height: 200
      };
    });
  }

  private identifyCriticalPaths(nodes: PlannedNode[], links: PlannedLink[]): string[][] {
    // Identify critical paths (simplified - in practice, this would be more complex)
    const criticalLinks = links.filter(link => link.critical);
    const criticalPaths: string[][] = [];
    
    // For now, return a simple path of critical components
    const criticalNodes = nodes.filter(node => node.importance === 'critical');
    if (criticalNodes.length > 1) {
      criticalPaths.push(criticalNodes.map(node => node.id));
    }
    
    return criticalPaths;
  }

  private defineSecurityZones(context: ArchitectureContext, nodes: PlannedNode[], containers: PlannedContainer[]): SecurityZone[] {
    // Define security zones based on context and component types
    const zones: SecurityZone[] = [];
    
    // Example security zones based on common patterns
    if (context.securityRequirements.length > 0) {
      zones.push(
        { id: 'public-zone', name: 'Public Zone', nodeIds: [], containerIds: [], level: 'public' },
        { id: 'private-zone', name: 'Private Zone', nodeIds: [], containerIds: [], level: 'private' },
        { id: 'trusted-zone', name: 'Trusted Zone', nodeIds: [], containerIds: [], level: 'trusted' }
      );
    }
    
    return zones;
  }

  private async callGemini(prompt: string, options: { temperature?: number; maxOutputTokens?: number } = {}): Promise<string> {
    // In a real implementation, this would call the backend API
    // For now, we'll simulate the response based on the prompt type
    console.log(`[SIMULATED] Calling backend with prompt: ${prompt.substring(0, 100)}...`);
    
    // Simulate different responses based on prompt content
    if (prompt.includes('analyze') || prompt.includes('context')) {
      return JSON.stringify({
        pattern: "microservices",
        layers: ["presentation", "business", "data"],
        criticalComponents: ["api-gateway", "user-service", "order-service"],
        infrastructureComponents: ["load-balancer", "cache", "database"],
        securityRequirements: ["authentication", "encryption"],
        scalabilityRequirements: ["auto-scaling", "load-balancing"],
        performanceRequirements: ["low-latency", "high-throughput"]
      });
    } else if (prompt.includes('critical')) {
      return JSON.stringify([
        {
          id: "api-gateway",
          label: "API Gateway",
          type: "aws-api-gateway",
          width: 140,
          height: 80,
          dependencies: [],
          connections: ["user-service", "order-service"]
        },
        {
          id: "user-service",
          label: "User Service",
          type: "aws-ec2",
          width: 120,
          height: 60,
          dependencies: ["api-gateway"],
          connections: ["user-database"]
        }
      ]);
    } else if (prompt.includes('infrastructure')) {
      return JSON.stringify([
        {
          id: "load-balancer",
          label: "Application Load Balancer",
          type: "aws-load-balancer",
          width: 140,
          height: 60,
          dependencies: ["api-gateway"],
          connections: ["microservices"]
        }
      ]);
    } else if (prompt.includes('container')) {
      return JSON.stringify([
        {
          id: "vpc-main",
          label: "Main VPC",
          type: "vpc",
          childNodeIds: ["api-gateway", "load-balancer"]
        }
      ]);
    } else if (prompt.includes('connections')) {
      return JSON.stringify([
        {
          id: "gateway-to-user",
          source: "api-gateway",
          target: "user-service",
          critical: true
        }
      ]);
    }
    
    // Default response
    return JSON.stringify([]);
  }
}
