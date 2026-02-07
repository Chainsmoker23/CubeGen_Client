/**
 * CodeEditor Component
 * A styled code input area with syntax highlighting for CubeGen DSL
 */

import React, { useCallback, useRef, useMemo } from 'react';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    errorLine?: number;
    className?: string;
}

// Syntax highlighting for CubeGen DSL
const highlightCode = (code: string): string => {
    // Process the entire code
    let highlighted = code
        // Escape HTML first
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Process line by line to handle comments correctly
    const lines = highlighted.split('\n');
    const processedLines = lines.map(line => {
        // Check if it's a comment line
        const trimmed = line.trim();
        if (trimmed.startsWith('//')) {
            return `<span class="dsl-comment">${line}</span>`;
        }

        let processed = line;

        // Keywords: node, container
        processed = processed.replace(
            /\b(node|container)\b/g,
            '<span class="dsl-keyword">$1</span>'
        );

        // Connection arrows: -> 
        processed = processed.replace(
            /(-&gt;)/g,
            '<span class="dsl-arrow">$1</span>'
        );

        // String values: "..." (do this before other replacements)
        processed = processed.replace(
            /"([^"]*)"/g,
            '<span class="dsl-string">"$1"</span>'
        );

        // Properties: icon=, x=, y=, type=
        processed = processed.replace(
            /\b(icon|x|y|type)=/g,
            '<span class="dsl-property">$1</span>='
        );

        // Icon types (PascalCase after =)
        processed = processed.replace(
            /=([A-Z][a-zA-Z0-9]*)\b(?!["<])/g,
            '=<span class="dsl-icon">$1</span>'
        );

        // Numbers (standalone)
        processed = processed.replace(
            /(?<![a-zA-Z])(\d+)(?![a-zA-Z])/g,
            '<span class="dsl-number">$1</span>'
        );

        return processed;
    });

    return processedLines.join('\n');
};

const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    placeholder = '// Write your CubeGen DSL code here...',
    errorLine,
    className = ''
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    const lines = value.split('\n');
    const lineCount = Math.max(lines.length, 10);

    // Memoize highlighted code
    const highlightedHtml = useMemo(() => highlightCode(value), [value]);

    // Sync scroll between all elements
    const handleScroll = useCallback(() => {
        if (textareaRef.current) {
            const scrollTop = textareaRef.current.scrollTop;
            const scrollLeft = textareaRef.current.scrollLeft;

            if (lineNumbersRef.current) {
                lineNumbersRef.current.scrollTop = scrollTop;
            }
            if (highlightRef.current) {
                highlightRef.current.scrollTop = scrollTop;
                highlightRef.current.scrollLeft = scrollLeft;
            }
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

            {/* Code Area Container */}
            <div className="flex-1 relative" style={{ minHeight: '400px' }}>
                {/* Syntax Highlighted Background */}
                <div
                    ref={highlightRef}
                    className="absolute inset-0 py-4 px-4 overflow-hidden pointer-events-none whitespace-pre font-mono text-sm leading-6"
                    style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                    }}
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
                />

                {/* Transparent Textarea for editing */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full py-4 px-4 bg-transparent text-transparent caret-[#f8f8f2] resize-none outline-none font-mono text-sm leading-6 whitespace-pre placeholder:text-[#6272a4]"
                    style={{
                        caretColor: '#f8f8f2',
                        WebkitTextFillColor: 'transparent',
                    }}
                />
            </div>

            {/* Inline Styles for Syntax Highlighting */}
            <style>{`
                .dsl-comment { color: #6272a4; font-style: italic; }
                .dsl-keyword { color: #ff79c6; font-weight: 600; }
                .dsl-arrow { color: #50fa7b; font-weight: 600; }
                .dsl-property { color: #8be9fd; }
                .dsl-string { color: #f1fa8c; }
                .dsl-icon { color: #bd93f9; }
                .dsl-number { color: #ffb86c; }
            `}</style>
        </div>
    );
};

export default CodeEditor;

