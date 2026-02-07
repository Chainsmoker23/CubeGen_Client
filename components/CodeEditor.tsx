/**
 * CodeEditor Component
 * A styled code input area with syntax highlighting for CubeGen DSL
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    errorLine?: number;
    className?: string;
}

// Syntax highlighting for CubeGen DSL
const highlightCode = (code: string): string => {
    // Split into lines and process each
    return code.split('\n').map(line => {
        let highlighted = line
            // Escape HTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Comments (// ...)
        if (highlighted.trim().startsWith('//')) {
            return `<span class="dsl-comment">${highlighted}</span>`;
        }

        // Keywords: node, container
        highlighted = highlighted.replace(
            /\b(node|container)\b/g,
            '<span class="dsl-keyword">$1</span>'
        );

        // Connection arrows: -> with optional label
        highlighted = highlighted.replace(
            /(-&gt;)/g,
            '<span class="dsl-arrow">$1</span>'
        );

        // Properties: icon=, x=, y=, type=
        highlighted = highlighted.replace(
            /\b(icon|x|y|type)=/g,
            '<span class="dsl-property">$1</span>='
        );

        // String values: "..." 
        highlighted = highlighted.replace(
            /"([^"]*)"/g,
            '<span class="dsl-string">"$1"</span>'
        );

        // Icon types (after icon=)
        highlighted = highlighted.replace(
            /=([A-Z][a-zA-Z0-9]*)\b/g,
            '=<span class="dsl-icon">$1</span>'
        );

        // Numbers
        highlighted = highlighted.replace(
            /\b(\d+)\b/g,
            '<span class="dsl-number">$1</span>'
        );

        // Node/container identifiers (word before colon)
        highlighted = highlighted.replace(
            /^(\s*)(\w+):/gm,
            '$1<span class="dsl-identifier">$2</span>:'
        );

        return highlighted;
    }).join('\n');
};

const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    placeholder = '// Write your CubeGen DSL code here...',
    errorLine,
    className = ''
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLPreElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    const lines = value.split('\n');
    const lineCount = Math.max(lines.length, 10);

    // Memoize highlighted code
    const highlightedHtml = useMemo(() => highlightCode(value), [value]);

    // Sync scroll between textarea, highlight overlay, and line numbers
    const handleScroll = useCallback(() => {
        if (textareaRef.current) {
            if (lineNumbersRef.current) {
                lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
            }
            if (highlightRef.current) {
                highlightRef.current.scrollTop = textareaRef.current.scrollTop;
                highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
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

            {/* Code Area with Syntax Highlighting */}
            <div className="flex-1 relative overflow-hidden">
                {/* Syntax Highlighted Overlay */}
                <pre
                    ref={highlightRef}
                    className="absolute inset-0 py-4 px-4 m-0 overflow-hidden pointer-events-none leading-6 whitespace-pre-wrap break-words"
                    style={{ tabSize: 4 }}
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
                />

                {/* Actual Textarea (invisible text, visible caret) */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    spellCheck={false}
                    className="relative w-full h-full py-4 px-4 bg-transparent text-transparent caret-white resize-none outline-none leading-6 placeholder:text-[#6272a4]"
                    style={{
                        minHeight: '400px',
                        tabSize: 4,
                        caretColor: '#f8f8f2',
                    }}
                />
            </div>

            {/* Syntax Highlighting Styles */}
            <style>{`
                .dsl-comment { color: #6272a4; font-style: italic; }
                .dsl-keyword { color: #ff79c6; font-weight: 600; }
                .dsl-arrow { color: #50fa7b; font-weight: 600; }
                .dsl-property { color: #8be9fd; }
                .dsl-string { color: #f1fa8c; }
                .dsl-icon { color: #bd93f9; }
                .dsl-number { color: #ffb86c; }
                .dsl-identifier { color: #50fa7b; }
            `}</style>
        </div>
    );
};

export default CodeEditor;

