/**
 * CodeEditor Component
 * A styled code input area with line numbers
 */

import React, { useCallback, useRef } from 'react';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    errorLine?: number;
    className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    placeholder = '// Write your CubeGen DSL code here...',
    errorLine,
    className = ''
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    const lines = value.split('\n');
    const lineCount = Math.max(lines.length, 10);

    // Sync scroll between textarea and line numbers
    const handleScroll = useCallback(() => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    }, []);

    // Handle tab key for indentation
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const newValue = value.substring(0, start) + '    ' + value.substring(end);
            onChange(newValue);
            // Set cursor position after tab
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
                }
            }, 0);
        }
    }, [value, onChange]);

    return (
        <div className={`flex bg-[#282a36] rounded-xl border border-[#44475a] overflow-hidden font-mono text-sm ${className}`}>
            {/* Line Numbers */}
            <div
                ref={lineNumbersRef}
                className="flex-shrink-0 py-4 px-3 bg-[#21222c] text-[#6272a4] select-none overflow-hidden border-r border-[#44475a]"
                style={{ minWidth: '50px' }}
            >
                {Array.from({ length: lineCount }, (_, i) => (
                    <div
                        key={i + 1}
                        className={`text-right pr-2 leading-6 ${errorLine === i + 1 ? 'text-red-500 font-bold' : ''}`}
                    >
                        {i + 1}
                    </div>
                ))}
            </div>

            {/* Code Input */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                spellCheck={false}
                className="flex-1 py-4 px-4 bg-transparent text-[#f8f8f2] resize-none outline-none leading-6 placeholder:text-[#6272a4]"
                style={{
                    minHeight: '400px',
                    tabSize: 4,
                }}
            />
        </div>
    );
};

export default CodeEditor;
