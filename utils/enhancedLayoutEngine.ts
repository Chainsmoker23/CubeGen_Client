/**
 * EnhancedLayoutEngine - Advanced layout decision system for complex architectures
 * Overcomes limitations of simple swimlane approach for large, complex systems
 */

export interface EnhancedLayoutConfiguration {
  algorithm: 'hierarchical' | 'radial' | 'grid' | 'cluster' | 'flow' | 'hybrid' | 'organic';
  direction?: 'top-down' | 'left-right' | 'radial' | 'bidirectional' | 'organic';
  nodeSpacing: number;
  levelSpacing: number;
  containerSpacing: number;  // New: spacing between containers
  clusterRadius?: number;
  centerX?: number;
  centerY?: number;
  maxWidth?: number;         // Canvas constraints
  maxHeight?: number;
  useFlexibleContainers: boolean; // New: allow nested/multiple container arrangements
  containerHierarchy: 'flat' | 'nested' | 'mixed'; // New: container organization style
  optimizeForDensity: boolean; // New: compact vs spread-out layouts
}

export interface ComponentRelationship {
  source: string;
  target: string;
  type: 'dependency' | 'data-flow' | 'communication' | 'containment' | 'replication' | 'backup';
  strength: number; // 1-10 scale
  direction?: 'unidirectional' | 'bidirectional';
}

export interface ArchitectureAnalysis {
  pattern: 'client-server' | 'layered' | 'microservices' | 'event-driven' | 'n-tier' | 'hub-spoke' | 'distributed' | 'enterprise' | 'hybrid';
  primaryFlow: 'horizontal' | 'vertical' | 'radial' | 'organic';
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  scale: 'small' | 'medium' | 'large' | 'enterprise';
  mainEntities: string[];
  relationships: ComponentRelationship[];
  containerRequirements: {
    count: number;
    nestingDepth: number;
    typeDistribution: Record<string, number>;
  };
  densityMetrics: {
    componentDensity: number; // components per unit area
    connectionDensity: number; // connections per component
    spatialSpread: number; // 0-1 scale of how spread out components are
  };
}

export class EnhancedLayoutEngine {
  
  /**
   * Comprehensive architecture analysis with enhanced metrics
   */
  public analyzeArchitecture(prompt: string): ArchitectureAnalysis {
    const lowerPrompt = prompt.toLowerCase();
    
    // Enhanced pattern detection
    const pattern = this.identifyPattern(lowerPrompt);
    const primaryFlow = this.determinePrimaryFlow(pattern, lowerPrompt);
    const complexity = this.estimateComplexity(prompt);
    const scale = this.estimateScale(prompt);
    const mainEntities = this.extractMainEntities(prompt);
    const relationships = this.inferRelationships(prompt, mainEntities);
    const containerRequirements = this.analyzeContainerNeeds(prompt, mainEntities);
    const densityMetrics = this.calculateDensityMetrics(mainEntities, relationships);
    
    return {
      pattern,
      primaryFlow,
      complexity,
      scale,
      mainEntities,
      relationships,
      containerRequirements,
      densityMetrics
    };
  }
  
  /**
   * Determines optimal layout configuration based on comprehensive analysis
   */
  public determineLayout(analysis: ArchitectureAnalysis): EnhancedLayoutConfiguration {
    // Scale-based adjustments
    const scaleMultiplier = this.getScaleMultiplier(analysis.scale);
    const complexityAdjustment = this.getComplexityAdjustment(analysis.complexity);
    
    // Base configuration
    let config: EnhancedLayoutConfiguration = {
      algorithm: 'hierarchical',
      direction: 'top-down',
      nodeSpacing: 120 * scaleMultiplier * complexityAdjustment,
      levelSpacing: 180 * scaleMultiplier * complexityAdjustment,
      containerSpacing: 200 * scaleMultiplier, // New: container separation
      useFlexibleContainers: true,
      containerHierarchy: 'mixed',
      optimizeForDensity: analysis.densityMetrics.componentDensity > 0.7,
      maxWidth: 1200 * scaleMultiplier,
      maxHeight: 800 * scaleMultiplier
    };

    // Pattern-specific configurations
    switch (analysis.pattern) {
      case 'enterprise':
        return this.getEnterpriseLayout(analysis, config);
      case 'hybrid':
        return this.getHybridLayout(analysis, config);
      case 'client-server':
        return this.getEnhancedClientServerLayout(analysis, config);
      case 'layered':
        return this.getEnhancedLayeredLayout(analysis, config);
      case 'microservices':
        return this.getEnhancedMicroservicesLayout(analysis, config);
      case 'event-driven':
        return this.getEnhancedEventDrivenLayout(analysis, config);
      case 'n-tier':
        return this.getEnhancedNTierLayout(analysis, config);
      case 'hub-spoke':
        return this.getEnhancedHubSpokeLayout(analysis, config);
      case 'distributed':
        return this.getEnhancedDistributedLayout(analysis, config);
      default:
        return this.getAdaptiveLayout(analysis, config);
    }
  }

  private identifyPattern(prompt: string): ArchitectureAnalysis['pattern'] {
    const lowerPrompt = prompt.toLowerCase();
    
    // Enterprise/Hybrid detection (new)
    if (lowerPrompt.includes('enterprise') || lowerPrompt.includes('corporate') ||
        lowerPrompt.includes('organization') || lowerPrompt.includes('company-wide') ||
        (lowerPrompt.includes('multiple') && lowerPrompt.includes('system'))) {
      if (lowerPrompt.includes('integration') || lowerPrompt.includes('federation') ||
          lowerPrompt.includes('hybrid')) {
        return 'hybrid';
      }
      return 'enterprise';
    }
    
    // Existing pattern detection with enhanced logic
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
      const tierCount = (prompt.match(/(tier|layer)/gi) || []).length;
      if (tierCount >= 4) return 'enterprise'; // 4+ tiers = enterprise complexity
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
    
    // Default to layered for simple cases, enterprise for complex
    const complexity = this.estimateComplexity(prompt);
    return complexity === 'enterprise' ? 'enterprise' : 'layered';
  }

  private estimateScale(prompt: string): ArchitectureAnalysis['scale'] {
    const entityCount = this.extractMainEntities(prompt).length;
    const relationshipCount = this.inferRelationships(prompt, []).length;
    const totalComponents = entityCount + relationshipCount;
    
    if (totalComponents <= 8) return 'small';
    if (totalComponents <= 15) return 'medium';
    if (totalComponents <= 25) return 'large';
    return 'enterprise';
  }

  private getScaleMultiplier(scale: ArchitectureAnalysis['scale']): number {
    const multipliers = {
      'small': 1.0,
      'medium': 1.3,
      'large': 1.6,
      'enterprise': 2.0
    };
    return multipliers[scale];
  }

  private getComplexityAdjustment(complexity: ArchitectureAnalysis['complexity']): number {
    const adjustments = {
      'simple': 0.8,
      'moderate': 1.0,
      'complex': 1.3,
      'enterprise': 1.6
    };
    return adjustments[complexity];
  }

  private analyzeContainerNeeds(prompt: string, entities: string[]): ArchitectureAnalysis['containerRequirements'] {
    const containerTypes = ['vpc', 'subnet', 'availability-zone', 'region', 'tier', 'zone', 'domain', 'boundary'];
    const typeDistribution: Record<string, number> = {};
    
    containerTypes.forEach(type => {
      const count = (prompt.toLowerCase().match(new RegExp(type, 'g')) || []).length;
      if (count > 0) {
        typeDistribution[type] = count;
      }
    });
    
    // Estimate nesting depth based on hierarchical keywords
    const nestingIndicators = ['within', 'inside', 'contains', 'nested', 'sub', 'child'];
    const nestingScore = nestingIndicators.reduce((score, indicator) => 
      score + (prompt.toLowerCase().match(new RegExp(indicator, 'g')) || []).length, 0);
    
    return {
      count: Object.keys(typeDistribution).length,
      nestingDepth: Math.min(3, Math.ceil(nestingScore / 2)),
      typeDistribution
    };
  }

  private calculateDensityMetrics(entities: string[], relationships: ComponentRelationship[]): ArchitectureAnalysis['densityMetrics'] {
    const componentCount = entities.length;
    const relationshipCount = relationships.length;
    
    // Simplified density calculations
    const componentDensity = Math.min(1, componentCount / 20); // Normalize to 0-1
    const connectionDensity = componentCount > 0 ? relationshipCount / componentCount : 0;
    const spatialSpread = Math.min(1, relationshipCount / (componentCount * 2)); // Estimate spread
    
    return {
      componentDensity,
      connectionDensity,
      spatialSpread
    };
  }

  // Enhanced layout configurations
  private getEnterpriseLayout(analysis: ArchitectureAnalysis, baseConfig: EnhancedLayoutConfiguration): EnhancedLayoutConfiguration {
    return {
      ...baseConfig,
      algorithm: 'hybrid',
      direction: 'organic',
      nodeSpacing: baseConfig.nodeSpacing * 1.4,
      levelSpacing: baseConfig.levelSpacing * 1.6,
      containerSpacing: baseConfig.containerSpacing * 1.8,
      containerHierarchy: 'nested',
      useFlexibleContainers: true,
      optimizeForDensity: false, // Spread out for clarity
      maxWidth: baseConfig.maxWidth * 1.8,
      maxHeight: baseConfig.maxHeight * 1.5
    };
  }

  private getHybridLayout(analysis: ArchitectureAnalysis, baseConfig: EnhancedLayoutConfiguration): EnhancedLayoutConfiguration {
    return {
      ...baseConfig,
      algorithm: 'hybrid',
      direction: analysis.primaryFlow === 'radial' ? 'radial' : 'organic',
      nodeSpacing: baseConfig.nodeSpacing * 1.2,
      levelSpacing: baseConfig.levelSpacing * 1.3,
      containerSpacing: baseConfig.containerSpacing * 1.5,
      containerHierarchy: 'mixed',
      useFlexibleContainers: true
    };
  }

  private getEnhancedClientServerLayout(analysis: ArchitectureAnalysis, baseConfig: EnhancedLayoutConfiguration): EnhancedLayoutConfiguration {
    const isComplex = analysis.complexity === 'complex' || analysis.complexity === 'enterprise';
    
    return {
      ...baseConfig,
      algorithm: isComplex ? 'hybrid' : 'hierarchical',
      direction: isComplex ? 'organic' : 'left-right',
      nodeSpacing: baseConfig.nodeSpacing * (isComplex ? 1.3 : 1.0),
      levelSpacing: baseConfig.levelSpacing * (isComplex ? 1.5 : 1.0),
      containerSpacing: baseConfig.containerSpacing * (isComplex ? 1.4 : 1.0),
      containerHierarchy: isComplex ? 'nested' : 'flat',
      useFlexibleContainers: isComplex
    };
  }

  private getEnhancedLayeredLayout(analysis: ArchitectureAnalysis, baseConfig: EnhancedLayoutConfiguration): EnhancedLayoutConfiguration {
    const tierCount = (analysis.mainEntities.join(' ').match(/(tier|layer)/gi) || []).length;
    const isDeep = tierCount >= 4;
    
    return {
      ...baseConfig,
      algorithm: isDeep ? 'hybrid' : 'hierarchical',
      direction: analysis.primaryFlow === 'horizontal' ? 'left-right' : 'top-down',
      nodeSpacing: baseConfig.nodeSpacing * (isDeep ? 1.4 : 1.0),
      levelSpacing: baseConfig.levelSpacing * (isDeep ? 1.8 : 1.0),
      containerSpacing: baseConfig.containerSpacing * (isDeep ? 1.6 : 1.0),
      containerHierarchy: isDeep ? 'nested' : 'flat',
      useFlexibleContainers: isDeep,
      maxWidth: isDeep ? baseConfig.maxWidth * 2 : baseConfig.maxWidth,
      maxHeight: isDeep ? baseConfig.maxHeight * 1.8 : baseConfig.maxHeight
    };
  }

  private getAdaptiveLayout(analysis: ArchitectureAnalysis, baseConfig: EnhancedLayoutConfiguration): EnhancedLayoutConfiguration {
    // Adaptive layout that responds to complexity metrics
    const densityFactor = analysis.densityMetrics.componentDensity;
    const connectionFactor = analysis.densityMetrics.connectionDensity;
    
    return {
      ...baseConfig,
      algorithm: densityFactor > 0.7 ? 'organic' : 'hierarchical',
      direction: densityFactor > 0.8 ? 'organic' : 
        analysis.primaryFlow === 'horizontal' ? 'left-right' : 
        analysis.primaryFlow === 'vertical' ? 'top-down' : 
        analysis.primaryFlow,
      nodeSpacing: baseConfig.nodeSpacing * (1 + densityFactor * 0.5),
      levelSpacing: baseConfig.levelSpacing * (1 + connectionFactor * 0.3),
      containerSpacing: baseConfig.containerSpacing * (1 + analysis.containerRequirements.count * 0.2),
      containerHierarchy: analysis.containerRequirements.nestingDepth > 1 ? 'nested' : 'flat',
      useFlexibleContainers: analysis.containerRequirements.count > 2,
      optimizeForDensity: densityFactor > 0.6
    };
  }

  // Placeholder methods for other layouts (similar enhancements)
  private getEnhancedMicroservicesLayout(analysis: ArchitectureAnalysis, baseConfig: EnhancedLayoutConfiguration): EnhancedLayoutConfiguration {
    return {
      ...baseConfig,
      algorithm: 'cluster',
      nodeSpacing: baseConfig.nodeSpacing * 1.1,
      levelSpacing: baseConfig.levelSpacing * 1.2,
      clusterRadius: 250,
      containerHierarchy: 'flat',
      useFlexibleContainers: true
    };
  }

  private getEnhancedEventDrivenLayout(analysis: ArchitectureAnalysis, baseConfig: EnhancedLayoutConfiguration): EnhancedLayoutConfiguration {
    return {
      ...baseConfig,
      algorithm: 'flow',
      direction: 'left-right',
      nodeSpacing: baseConfig.nodeSpacing * 1.2,
      levelSpacing: baseConfig.levelSpacing * 1.1,
      containerHierarchy: 'flat',
      useFlexibleContainers: analysis.complexity !== 'simple'
    };
  }

  private getEnhancedNTierLayout(analysis: ArchitectureAnalysis, baseConfig: EnhancedLayoutConfiguration): EnhancedLayoutConfiguration {
    return this.getEnhancedLayeredLayout(analysis, baseConfig);
  }

  private getEnhancedHubSpokeLayout(analysis: ArchitectureAnalysis, baseConfig: EnhancedLayoutConfiguration): EnhancedLayoutConfiguration {
    return {
      ...baseConfig,
      algorithm: 'radial',
      nodeSpacing: baseConfig.nodeSpacing,
      levelSpacing: baseConfig.levelSpacing,
      centerX: 600,
      centerY: 400,
      clusterRadius: 300,
      containerHierarchy: 'flat',
      useFlexibleContainers: false
    };
  }

  private getEnhancedDistributedLayout(analysis: ArchitectureAnalysis, baseConfig: EnhancedLayoutConfiguration): EnhancedLayoutConfiguration {
    return {
      ...baseConfig,
      algorithm: 'cluster',
      nodeSpacing: baseConfig.nodeSpacing * 1.3,
      levelSpacing: baseConfig.levelSpacing * 1.4,
      clusterRadius: 280,
      containerHierarchy: 'mixed',
      useFlexibleContainers: true
    };
  }

  // Relationship inference helpers
  private extractMainEntities(prompt: string): string[] {
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
    
    return Array.from(entities).slice(0, 20);
  }

  private inferRelationships(prompt: string, entities: string[]): ComponentRelationship[] {
    const relationships: ComponentRelationship[] = [];
    
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
        
        if (entities.some(e => e.toLowerCase() === source) && 
            entities.some(e => e.toLowerCase() === target)) {
          relationships.push({
            source,
            target,
            type: pattern.type as ComponentRelationship['type'],
            strength: 8
          });
        }
      }
    }
    
    return relationships;
  }

  private determinePrimaryFlow(pattern: ArchitectureAnalysis['pattern'], prompt: string): 'horizontal' | 'vertical' | 'radial' | 'organic' {
    const defaultFlows: Record<ArchitectureAnalysis['pattern'], 'horizontal' | 'vertical' | 'radial' | 'organic'> = {
      'client-server': 'vertical',
      'layered': 'vertical',
      'microservices': 'radial',
      'event-driven': 'horizontal',
      'n-tier': 'vertical',
      'hub-spoke': 'radial',
      'distributed': 'radial',
      'enterprise': 'organic',
      'hybrid': 'organic'
    };
    
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
    if (totalCount <= 20) return 'complex';
    return 'enterprise';
  }
}
