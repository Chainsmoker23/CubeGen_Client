import React, { useState, useEffect } from 'react';
import { InteractiveAutoLayout, AutoLayoutOptions } from '../utils/autoLayout';
import { DiagramData } from '../types';

interface AutoLayoutControlsProps {
  diagramData: DiagramData;
  onLayoutApplied: (updatedDiagram: DiagramData) => void;
  disabled?: boolean;
}

const AutoLayoutControls: React.FC<AutoLayoutControlsProps> = ({ 
  diagramData, 
  onLayoutApplied, 
  disabled = false 
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [options, setOptions] = useState<AutoLayoutOptions>({
    algorithm: 'force-directed',
    iterations: 100,
    nodeSpacing: 100,
    edgeLength: 150,
    direction: 'TB',
    animate: true
  });

  const handleApplyLayout = () => {
    if (disabled) return;
    
    setIsApplying(true);
    
    try {
      const layoutEngine = new InteractiveAutoLayout(options);
      const updatedDiagram = layoutEngine.applyLayout(diagramData);
      onLayoutApplied(updatedDiagram);
    } catch (error) {
      console.error('Error applying auto layout:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleOptionChange = (field: keyof AutoLayoutOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-apply layout when options change (if desired)
  useEffect(() => {
    // Uncomment the following lines if you want auto-update on option changes
    /*
    if (options.animate) {
      const timer = setTimeout(() => {
        handleApplyLayout();
      }, 500);
      return () => clearTimeout(timer);
    }
    */
  }, [options]);

  return (
    <div className={`p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-bg)] ${disabled ? 'opacity-50' : ''}`}>
      <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Auto-Layout</h3>
      
      <div className="space-y-4">
        {/* Algorithm Selection */}
        <div>
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Layout Algorithm</label>
          <select
            value={options.algorithm}
            onChange={(e) => handleOptionChange('algorithm', e.target.value as any)}
            className="w-full p-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-sm"
            disabled={isApplying || disabled}
          >
            <option value="force-directed">Force-Directed</option>
            <option value="hierarchical">Hierarchical</option>
            <option value="circular">Circular</option>
            <option value="grid">Grid</option>
            <option value="radial">Radial</option>
          </select>
        </div>

        {/* Direction for Hierarchical Layout */}
        {options.algorithm === 'hierarchical' && (
          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Direction</label>
            <div className="grid grid-cols-2 gap-2">
              {(['TB', 'LR', 'RL', 'BT'] as const).map(dir => (
                <button
                  key={dir}
                  className={`py-1.5 text-xs rounded-lg border ${
                    options.direction === dir
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                      : 'bg-[var(--color-bg-input)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-button-bg)]'
                  }`}
                  onClick={() => handleOptionChange('direction', dir)}
                  disabled={isApplying || disabled}
                >
                  {dir === 'TB' ? 'Top-Bottom' : 
                   dir === 'LR' ? 'Left-Right' : 
                   dir === 'RL' ? 'Right-Left' : 'Bottom-Top'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Spacing Controls */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Node Spacing</label>
            <input
              type="range"
              min="50"
              max="200"
              value={options.nodeSpacing}
              onChange={(e) => handleOptionChange('nodeSpacing', parseInt(e.target.value))}
              className="w-full"
              disabled={isApplying || disabled}
            />
            <div className="text-xs text-[var(--color-text-secondary)] text-center">{options.nodeSpacing}px</div>
          </div>

          {options.algorithm === 'force-directed' && (
            <div>
              <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Edge Length</label>
              <input
                type="range"
                min="50"
                max="300"
                value={options.edgeLength}
                onChange={(e) => handleOptionChange('edgeLength', parseInt(e.target.value))}
                className="w-full"
                disabled={isApplying || disabled}
              />
              <div className="text-xs text-[var(--color-text-secondary)] text-center">{options.edgeLength}px</div>
            </div>
          )}
        </div>

        {/* Iterations for Force-Directed */}
        {options.algorithm === 'force-directed' && (
          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Iterations</label>
            <input
              type="range"
              min="10"
              max="500"
              value={options.iterations}
              onChange={(e) => handleOptionChange('iterations', parseInt(e.target.value))}
              className="w-full"
              disabled={isApplying || disabled}
            />
            <div className="text-xs text-[var(--color-text-secondary)] text-center">{options.iterations} iterations</div>
          </div>
        )}

        {/* Apply Button */}
        <button
          onClick={handleApplyLayout}
          disabled={isApplying || disabled}
          className={`w-full py-2 rounded-lg font-medium text-sm ${
            isApplying
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent)] text-white'
          }`}
        >
          {isApplying ? 'Applying...' : 'Apply Layout'}
        </button>

        {/* Reset Button */}
        <button
          onClick={() => {
            setOptions({
              algorithm: 'force-directed',
              iterations: 100,
              nodeSpacing: 100,
              edgeLength: 150,
              direction: 'TB',
              animate: true
            });
          }}
          disabled={isApplying || disabled}
          className="w-full py-2 rounded-lg font-medium text-sm bg-[var(--color-button-bg)] hover:bg-[var(--color-button-bg-hover)] text-[var(--color-text-primary)] border border-[var(--color-border)]"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default AutoLayoutControls;
