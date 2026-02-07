/**
 * CodeEditor Component
 * A styled code input area with syntax highlighting for CubeGen DSL
 * Uses a contenteditable div approach for reliable highlighting
 */

import React, { useCallback, useRef, useMemo, useEffect } from 'react';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    errorLine?: number;
    className?: string;
}

// Syntax highlighting for CubeGen DSL
const highlightCode = (code: string): string => {
    if (!code) return '';

    // Escape HTML first
    let highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Process line by line for comments
    const lines = highlighted.split('\n');
    const processedLines = lines.map(line => {
        // Check if it's a comment line
        if (line.trim().startsWith('//')) {
            return `<span style="color:#6272a4;font-style:italic">${line}</span>`;
        }

        let processed = line;

        // Keywords: node, container
        processed = processed.replace(
            /\b(node|container)\b/g,
            '<span style="color:#ff79c6;font-weight:600">$1</span>'
        );

        // Connection arrows: ->
        processed = processed.replace(
            /(-&gt;)/g,
            '<span style="color:#50fa7b;font-weight:600">$1</span>'
        );

        // String values: "..."
        processed = processed.replace(
            /"([^"]*)"/g,
            '<span style="color:#f1fa8c">"$1"</span>'
        );

        // Properties: icon=, x=, y=, type=
        processed = processed.replace(
            /\b(icon|x|y|type)=/g,
            '<span style="color:#8be9fd">$1</span>='
        );

        // Icon types (PascalCase after =, not inside strings/spans)
        processed = processed.replace(
            /=([A-Z][a-zA-Z0-9]*)(?=\s|$)/g,
            '=<span style="color:#bd93f9">$1</span>'
        );

        // Numbers (standalone)
        processed = processed.replace(
            /\b(\d+)\b/g,
            '<span style="color:#ffb86c">$1</span>'
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
    const editorRef = useRef<HTMLDivElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    const lines = value.split('\n');
    const lineCount = Math.max(lines.length, 10);

    // Memoize highlighted code
    const highlightedHtml = useMemo(() => highlightCode(value), [value]);

    // Sync scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        if (lineNumbersRef.current && editorRef.current) {
            lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
        }
    }, []);

    // Handle input in contenteditable
    const handleInput = useCallback(() => {
        if (editorRef.current) {
            // Get plain text from the contenteditable
            const text = editorRef.current.innerText || '';
            onChange(text);
        }
    }, [onChange]);

    // Handle paste - ensure plain text only
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }, []);

    // Handle tab key
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
        }
    }, []);

    // Update content when value changes externally
    useEffect(() => {
        if (editorRef.current) {
            const currentText = editorRef.current.innerText || '';
            if (currentText !== value) {
                // Save cursor position
                const selection = window.getSelection();
                const range = selection?.getRangeAt(0);
                const cursorPos = range?.startOffset || 0;

                editorRef.current.innerHTML = highlightedHtml || placeholder;

                // Try to restore cursor (basic restoration)
                try {
                    if (editorRef.current.firstChild) {
                        const newRange = document.createRange();
                        newRange.setStart(editorRef.current, 0);
                        newRange.collapse(true);
                        selection?.removeAllRanges();
                        selection?.addRange(newRange);
                    }
                } catch (e) {
                    // Ignore cursor restoration errors
                }
            }
        }
    }, [highlightedHtml, value, placeholder]);

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

            {/* Code Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onScroll={handleScroll}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                className="flex-1 py-4 px-4 text-[#f8f8f2] outline-none leading-6 overflow-auto whitespace-pre"
                style={{
                    minHeight: '400px',
                    caretColor: '#f8f8f2',
                }}
                dangerouslySetInnerHTML={{ __html: highlightedHtml || `<span style="color:#6272a4">${placeholder}</span>` }}
            />
        </div>
    );
};

export default CodeEditor;
