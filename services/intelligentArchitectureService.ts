/**
 * IntelligentArchitectureService - Main service that orchestrates AI-powered architecture planning
 * Uses iterative approach to plan and generate architecture with proper understanding
 */

import { AIArchitecturePlanner, ArchitecturePlan } from './aiArchitecturePlanner';
import { ArchNode, Container, Link, DiagramData } from '../types';

export interface GenerationProgress {
  stage: 'planning' | 'nodes' | 'containers' | 'links' | 'positioning' | 'complete';
  progress: number;
  message: string;
  currentComponent?: string;
}

export interface ArchitectureGenerationOptions {
  prompt: string;
  maxIterations?: number;
  useReasoningModel?: boolean; // Use advanced reasoning model like Gemini 2.5 Pro
  temperature?: number;
  detailLevel?: 'basic' | 'standard' | 'detailed';
}

export class IntelligentArchitectureService {
  private planner: AIArchitecturePlanner;
  private onProgress?: (progress: GenerationProgress) => void;

  constructor(onProgress?: (progress: GenerationProgress) => void) {
    this.planner = new AIArchitecturePlanner();
    this.onProgress = onProgress;
  }

  /**
   * Generates a complete architecture with intelligent planning
   */
  async generateArchitecture(options: ArchitectureGenerationOptions): Promise<DiagramData> {
    this.updateProgress('planning', 10, 'Analyzing architecture requirements...');
    
    // Step 1: Plan the entire architecture using AI reasoning
    const plan = await this.planner.planArchitecture(options.prompt);
    
    this.updateProgress('nodes', 30, 'Generating nodes with proper placement...');
    
    // Step 2: Create nodes based on the plan
    const nodes = plan.nodes.map(node => ({
      id: node.id,
      label: node.label,
      type: node.type,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      properties: {
        layer: node.layer,
        securityZone: node.securityZone,
        importance: node.importance
      }
    }));

    this.updateProgress('containers', 50, 'Creating containers with proper sizing...');
    
    // Step 3: Create containers based on the plan
    const containers = plan.containers.map(container => ({
      id: container.id,
      label: container.label,
      type: container.type === 'security-zone' ? 'tier' : container.type, // Map to compatible type
      x: container.x,
      y: container.y,
      width: container.width,
      height: container.height,
      childNodeIds: container.childNodeIds,
      properties: {
        layer: container.layer,
        securityZone: container.securityZone
      }
    }));

    this.updateProgress('links', 70, 'Establishing connections...');
    
    // Step 4: Create links based on the plan
    const links = plan.links.map(link => ({
      id: link.id,
      source: link.source,
      target: link.target,
      label: link.label,
      style: link.style,
      thickness: link.thickness,
      bidirectional: link.bidirectional
    }));

    this.updateProgress('positioning', 90, 'Finalizing layout...');
    
    // Step 5: Create the final diagram data
    const diagramData: DiagramData = {
      title: 'AI-Generated Architecture',
      architectureType: plan.layoutStrategy,
      nodes,
      containers,
      links
    };

    this.updateProgress('complete', 100, 'Architecture generation complete!');
    
    return diagramData;
  }

  /**
   * Iteratively improves an existing architecture
   */
  async refineArchitecture(currentData: DiagramData, improvementPrompt: string): Promise<DiagramData> {
    // Convert current data to a descriptive prompt for the AI
    const currentDescription = this.describeCurrentArchitecture(currentData);
    const fullPrompt = `Current architecture: ${currentDescription}\n\nImprovement request: ${improvementPrompt}`;
    
    // Regenerate with the combined prompt
    return this.generateArchitecture({
      prompt: fullPrompt,
      detailLevel: 'detailed'
    });
  }

  /**
   * Generates architecture in an iterative, component-by-component manner
   */
  async generateIteratively(options: ArchitectureGenerationOptions): Promise<AsyncGenerator<DiagramData, void, unknown>> {
    return this.iterativeGenerationProcess(options);
  }

  private async *iterativeGenerationProcess(options: ArchitectureGenerationOptions): AsyncGenerator<DiagramData, void, unknown> {
    // Start with empty diagram
    let currentDiagram: DiagramData = { 
      nodes: [], 
      containers: [], 
      links: [],
      title: 'Generated Architecture',
      architectureType: 'general'
    };
    
    // Plan the architecture first
    this.updateProgress('planning', 5, 'Planning architecture structure...');
    const plan = await this.planner.planArchitecture(options.prompt);
    
    // Generate nodes one by one
    this.updateProgress('nodes', 10, 'Adding nodes iteratively...');
    for (let i = 0; i < plan.nodes.length; i++) {
      const node = plan.nodes[i];
      
      // Add node to diagram
      const newNode = {
        id: node.id,
        label: node.label,
        type: node.type,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        properties: {
          layer: node.layer,
          securityZone: node.securityZone,
          importance: node.importance
        }
      };
      
      currentDiagram.nodes.push(newNode);
      
      // Yield intermediate result
      yield { ...currentDiagram };
      
      this.updateProgress('nodes', 10 + Math.floor((i / plan.nodes.length) * 20), 
                         `Adding node ${i + 1}/${plan.nodes.length}: ${node.label}`);
    }
    
    // Add containers
    this.updateProgress('containers', 30, 'Adding containers iteratively...');
    for (let i = 0; i < plan.containers.length; i++) {
      const container = plan.containers[i];
      
      // Add container to diagram
      const newContainer = {
        id: container.id,
        label: container.label,
        type: container.type === 'security-zone' ? 'tier' : container.type, // Map to compatible type
        x: container.x,
        y: container.y,
        width: container.width,
        height: container.height,
        childNodeIds: container.childNodeIds,
        properties: {
          layer: container.layer,
          securityZone: container.securityZone
        }
      };
      
      currentDiagram.containers.push(newContainer);
      
      // Yield intermediate result
      yield { ...currentDiagram };
      
      this.updateProgress('containers', 30 + Math.floor((i / plan.containers.length) * 20),
                         `Adding container ${i + 1}/${plan.containers.length}: ${container.label}`);
    }
    
    // Add links
    this.updateProgress('links', 50, 'Adding connections iteratively...');
    for (let i = 0; i < plan.links.length; i++) {
      const link = plan.links[i];
      
      // Add link to diagram
      const newLink = {
        id: link.id,
        source: link.source,
        target: link.target,
        label: link.label,
        style: link.style,
        thickness: link.thickness,
        bidirectional: link.bidirectional
      };
      
      currentDiagram.links.push(newLink);
      
      // Yield intermediate result
      yield { ...currentDiagram };
      
      this.updateProgress('links', 50 + Math.floor((i / plan.links.length) * 40),
                         `Adding link ${i + 1}/${plan.links.length}: ${link.source} → ${link.target}`);
    }
    
    this.updateProgress('complete', 100, 'Architecture generation complete!');
    
    // Yield final result
    yield currentDiagram;
  }

  private describeCurrentArchitecture(data: DiagramData): string {
    const nodeTypes = [...new Set(data.nodes.map(n => n.type))].join(', ');
    const containerTypes = [...new Set(data.containers.map(c => c.type))].join(', ');
    const nodeCount = data.nodes.length;
    const containerCount = data.containers.length;
    const linkCount = data.links.length;
    
    return `Architecture with ${nodeCount} nodes (${nodeTypes}), ${containerCount} containers (${containerTypes}), and ${linkCount} connections.`;
  }

  private updateProgress(stage: GenerationProgress['stage'], progress: number, message: string, currentComponent?: string) {
    const progressUpdate: GenerationProgress = { stage, progress, message };
    if (currentComponent) {
      progressUpdate.currentComponent = currentComponent;
    }
    
    this.onProgress?.(progressUpdate);
  }

  /**
   * Validates the generated architecture for common issues
   */
  validateArchitecture(diagramData: DiagramData): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for overlapping nodes
    for (let i = 0; i < diagramData.nodes.length; i++) {
      for (let j = i + 1; j < diagramData.nodes.length; j++) {
        const node1 = diagramData.nodes[i];
        const node2 = diagramData.nodes[j];
        
        if (this.doNodesOverlap(node1, node2)) {
          issues.push(`Overlapping nodes: ${node1.label} and ${node2.label}`);
        }
      }
    }

    // Check for orphaned nodes (nodes with no connections)
    diagramData.nodes.forEach(node => {
      const hasIncoming = diagramData.links.some(link => 
        typeof link.target === 'string' ? link.target === node.id : link.target.id === node.id
      );
      const hasOutgoing = diagramData.links.some(link => 
        typeof link.source === 'string' ? link.source === node.id : link.source.id === node.id
      );
      
      if (!hasIncoming && !hasOutgoing) {
        issues.push(`Orphaned node: ${node.label} (no connections)`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private doNodesOverlap(node1: ArchNode, node2: ArchNode): boolean {
    const xOverlap = Math.abs(node1.x - node2.x) * 2 < (node1.width + node2.width);
    const yOverlap = Math.abs(node1.y - node2.y) * 2 < (node1.height + node2.height);
    return xOverlap && yOverlap;
  }
}
