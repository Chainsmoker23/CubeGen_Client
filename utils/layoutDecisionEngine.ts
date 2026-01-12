/**
 * LayoutDecisionEngine - Makes intelligent layout decisions based on architecture patterns
 */

export interface LayoutConfiguration {
  algorithm: 'hierarchical' | 'radial' | 'grid' | 'cluster' | 'flow';
  direction?: 'top-down' | 'left-right' | 'radial' | 'bidirectional';
  nodeSpacing: number;
  levelSpacing: number;
  clusterRadius?: number;
  centerX?: number;
  centerY?: number;
}

export interface ComponentRelationship {
  source: string;
  target: string;
  type: 'dependency' | 'data-flow' | 'communication' | 'containment';
  strength: number; // 1-10 scale
}

export interface ArchitectureAnalysis {
  pattern: 'client-server' | 'layered' | 'microservices' | 'event-driven' | 'n-tier' | 'hub-spoke' | 'distributed';
  primaryFlow: 'horizontal' | 'vertical' | 'radial';
  complexity: 'simple' | 'moderate' | 'complex';
  mainEntities: string[];
  relationships: ComponentRelationship[];
}

export class LayoutDecisionEngine {
  
  /**
   * Analyzes the architecture type and determines the best layout
   */
  public analyzeArchitecture(prompt: string): ArchitectureAnalysis {
    const lowerPrompt = prompt.toLowerCase();
    
    // Detect architecture pattern based on keywords
    const pattern = this.identifyPattern(lowerPrompt);
    const primaryFlow = this.determinePrimaryFlow(pattern, lowerPrompt);
    const complexity = this.estimateComplexity(prompt);
    const mainEntities = this.extractMainEntities(prompt);
    const relationships = this.inferRelationships(prompt, mainEntities);
    
    return {
      pattern,
      primaryFlow,
      complexity,
      mainEntities,
      relationships
    };
  }
  
  /**
   * Determines the optimal layout configuration based on architecture analysis
   */
  public determineLayout(analysis: ArchitectureAnalysis): LayoutConfiguration {
    switch (analysis.pattern) {
      case 'client-server':
        return this.getClientServerLayout(analysis);
      case 'layered':
        return this.getLayeredLayout(analysis);
      case 'microservices':
        return this.getMicroservicesLayout(analysis);
      case 'event-driven':
        return this.getEventDrivenLayout(analysis);
      case 'n-tier':
        return this.getNTierLayout(analysis);
      case 'hub-spoke':
        return this.getHubSpokeLayout(analysis);
      case 'distributed':
        return this.getDistributedLayout(analysis);
      default:
        return this.getDefaultLayout(analysis);
    }
  }
  
  private identifyPattern(prompt: string): ArchitectureAnalysis['pattern'] {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for specific patterns
    if (lowerPrompt.includes('client') || lowerPrompt.includes('frontend') || 
        lowerPrompt.includes('ui') || lowerPrompt.includes('mobile') || 
        lowerPrompt.includes('web')) {
      if (lowerPrompt.includes('server') || lowerPrompt.includes('backend') || 
          lowerPrompt.includes('api') || lowerPrompt.includes('database')) {
        return 'client-server';
      }
    }
    
    if (lowerPrompt.includes('microservice') || lowerPrompt.includes('micro-service') ||
        lowerPrompt.includes('service oriented') || lowerPrompt.includes('soa') ||
        lowerPrompt.includes('bounded context') || lowerPrompt.includes('domain driven')) {
      return 'microservices';
    }
    
    if (lowerPrompt.includes('event') || lowerPrompt.includes('message') ||
        lowerPrompt.includes('queue') || lowerPrompt.includes('stream') ||
        lowerPrompt.includes('pub sub') || lowerPrompt.includes('publish subscribe')) {
      return 'event-driven';
    }
    
    if (lowerPrompt.includes('tier') || lowerPrompt.includes('layer') ||
        lowerPrompt.includes('presentation') || lowerPrompt.includes('business') ||
        lowerPrompt.includes('data') || lowerPrompt.includes('persistence')) {
      // Count occurrences to determine n-tier
      const tierCount = (prompt.match(/(tier|layer)/gi) || []).length;
      if (tierCount >= 3) return 'n-tier';
      return 'layered';
    }
    
    if (lowerPrompt.includes('hub') || lowerPrompt.includes('spoke') ||
        lowerPrompt.includes('central') || lowerPrompt.includes('router') ||
        lowerPrompt.includes('gateway')) {
      return 'hub-spoke';
    }
    
    if (lowerPrompt.includes('distributed') || lowerPrompt.includes('decentralized') ||
        lowerPrompt.includes('peer to peer') || lowerPrompt.includes('p2p')) {
      return 'distributed';
    }
    
    // Default to layered if no specific pattern is detected
    return 'layered';
  }
  
  private determinePrimaryFlow(pattern: ArchitectureAnalysis['pattern'], prompt: string): 'horizontal' | 'vertical' | 'radial' {
    // Default flows for each pattern
    const defaultFlows: Record<ArchitectureAnalysis['pattern'], 'horizontal' | 'vertical' | 'radial'> = {
      'client-server': 'vertical',
      'layered': 'vertical',
      'microservices': 'radial',
      'event-driven': 'horizontal',
      'n-tier': 'vertical',
      'hub-spoke': 'radial',
      'distributed': 'radial'
    };
    
    // Check for specific directional hints in the prompt
    if (prompt.toLowerCase().includes('horizontal') || prompt.toLowerCase().includes('side by side')) {
      return 'horizontal';
    }
    
    if (prompt.toLowerCase().includes('vertical') || prompt.toLowerCase().includes('top down')) {
      return 'vertical';
    }
    
    if (prompt.toLowerCase().includes('circular') || prompt.toLowerCase().includes('radial') ||
        prompt.toLowerCase().includes('around')) {
      return 'radial';
    }
    
    return defaultFlows[pattern];
  }
  
  private estimateComplexity(prompt: string): ArchitectureAnalysis['complexity'] {
    // Estimate complexity based on number of entities and relationships
    const entityKeywords = [
      'service', 'component', 'module', 'system', 'database', 'server', 'client',
      'api', 'gateway', 'router', 'broker', 'queue', 'cache', 'store', 'engine'
    ];
    
    const relationshipKeywords = [
      'connects', 'communicates', 'interacts', 'depends', 'relies', 'uses',
      'calls', 'requests', 'responds', 'sends', 'receives', 'publishes', 'subscribes'
    ];
    
    const entityCount = entityKeywords.reduce((count, keyword) => 
      count + (prompt.toLowerCase().match(new RegExp(keyword, 'g')) || []).length, 0);
    
    const relationshipCount = relationshipKeywords.reduce((count, keyword) => 
      count + (prompt.toLowerCase().match(new RegExp(keyword, 'g')) || []).length, 0);
    
    const totalCount = entityCount + relationshipCount;
    
    if (totalCount <= 5) return 'simple';
    if (totalCount <= 10) return 'moderate';
    return 'complex';
  }
  
  private extractMainEntities(prompt: string): string[] {
    // Extract main entities/components from the prompt
    // This is a simplified version - in a real implementation, this would be more sophisticated
    const entityPatterns = [
      /(?:^|\W)([A-Za-z][A-Za-z0-9]*(?:[-_\s][A-Za-z0-9]+)*)(?:\s+(?:service|system|component|module|database|server|client|api|gateway|router|broker|queue|cache|store|engine))/g,
      /(user|client|frontend|backend|api|database|server|mobile|web|admin|dashboard|portal|application|service|microservice|gateway|router|load balancer|cache|cdn|storage|bucket|instance|container|pod|cluster|mesh|orchestrator|monitor|logger|tracing|alerting|notification|email|sms|push|websocket|mqtt|kafka|redis|memcached|mysql|postgres|mariadb|mongodb|cassandra|elasticsearch|kibana|grafana|prometheus|jenkins|gitlab|github|docker|kubernetes|aws|azure|gcp|lambda|s3|dynamodb|rds|ec2|eks|sqs|sns|iam|vpc|subnet|route53|cloudfront|elb|autoscaling|cloudwatch|secretsmanager|parameter store|key management|certificate manager|waf|shield|artifact|registry|repository)(?=\W|$)/gi
    ];
    
    const entities = new Set<string>();
    
    for (const pattern of entityPatterns) {
      let match;
      while ((match = pattern.exec(prompt)) !== null) {
        entities.add(match[1] || match[0]);
      }
    }
    
    return Array.from(entities).slice(0, 20); // Limit to 20 main entities
  }
  
  private inferRelationships(prompt: string, entities: string[]): ComponentRelationship[] {
    // Infer relationships between entities based on the prompt
    const relationships: ComponentRelationship[] = [];
    
    // Define common relationship patterns
    const patterns = [
      {
        regex: /(?:^|\W)(\w+)\s+(?:connects to|communicates with|interacts with|depends on|relies on|uses|calls|requests data from|accesses|reads from|writes to)\s+(\w+)(?=\W|$)/gi,
        type: 'dependency'
      },
      {
        regex: /(?:^|\W)(\w+)\s+(?:sends data to|transfers data to|passes data to|forwards data to)\s+(\w+)(?=\W|$)/gi,
        type: 'data-flow'
      },
      {
        regex: /(?:^|\W)(\w+)\s+(?:publishes to|emits to|broadcasts to)\s+(\w+)(?=\W|$)/gi,
        type: 'communication'
      },
      {
        regex: /(?:^|\W)(\w+)\s+(?:contains|manages|controls|owns|hosts)\s+(\w+)(?=\W|$)/gi,
        type: 'containment'
      }
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(prompt)) !== null) {
        const source = match[1].toLowerCase();
        const target = match[2].toLowerCase();
        
        // Validate that both entities exist in our extracted list
        if (entities.some(e => e.toLowerCase() === source) && 
            entities.some(e => e.toLowerCase() === target)) {
          relationships.push({
            source,
            target,
            type: pattern.type as ComponentRelationship['type'],
            strength: 8 // High strength for explicit relationships
          });
        }
      }
    }
    
    return relationships;
  }
  
  private getClientServerLayout(analysis: ArchitectureAnalysis): LayoutConfiguration {
    return {
      algorithm: 'hierarchical',
      direction: 'left-right',
      nodeSpacing: 150,
      levelSpacing: 200
    };
  }
  
  private getLayeredLayout(analysis: ArchitectureAnalysis): LayoutConfiguration {
    return {
      algorithm: 'hierarchical',
      direction: analysis.primaryFlow === 'horizontal' ? 'left-right' : 'top-down',
      nodeSpacing: 120,
      levelSpacing: 180
    };
  }
  
  private getMicroservicesLayout(analysis: ArchitectureAnalysis): LayoutConfiguration {
    return {
      algorithm: 'cluster',
      nodeSpacing: 100,
      levelSpacing: 150,
      clusterRadius: 200
    };
  }
  
  private getEventDrivenLayout(analysis: ArchitectureAnalysis): LayoutConfiguration {
    return {
      algorithm: 'flow',
      direction: 'left-right',
      nodeSpacing: 130,
      levelSpacing: 160
    };
  }
  
  private getNTierLayout(analysis: ArchitectureAnalysis): LayoutConfiguration {
    return {
      algorithm: 'hierarchical',
      direction: 'top-down',
      nodeSpacing: 140,
      levelSpacing: 200
    };
  }
  
  private getHubSpokeLayout(analysis: ArchitectureAnalysis): LayoutConfiguration {
    return {
      algorithm: 'radial',
      nodeSpacing: 120,
      levelSpacing: 180,
      centerX: 500,
      centerY: 300,
      clusterRadius: 250
    };
  }
  
  private getDistributedLayout(analysis: ArchitectureAnalysis): LayoutConfiguration {
    return {
      algorithm: 'cluster',
      nodeSpacing: 110,
      levelSpacing: 170,
      clusterRadius: 220
    };
  }
  
  private getDefaultLayout(analysis: ArchitectureAnalysis): LayoutConfiguration {
    return {
      algorithm: 'hierarchical',
      direction: analysis.primaryFlow === 'horizontal' ? 'left-right' : 'top-down',
      nodeSpacing: 130,
      levelSpacing: 180
    };
  }
}
