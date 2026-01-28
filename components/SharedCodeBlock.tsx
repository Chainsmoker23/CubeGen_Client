import React from 'react';

interface SharedCodeBlockProps {
    code: string;
    language?: string;
}

const highlightSyntax = (code: string) => {
    // Escape HTML entities first to prevent XSS and rendering issues
    let highlighted = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Syntax Highlighting Rules (Applied strictly in order)

    // 1. Strings (single or double quotes) - Yellow/Green
    highlighted = highlighted.replace(/(['"`])(.*?)\1/g, '<span class="text-[#f1fa8c]">$1$2$1</span>');

    // 2. Comments (// ...) - Gray
    // Note: This regex is simple and might catch inside strings if not careful, 
    // but running it after string replacement usually helps if we were tokenizing properly. 
    // For simple regex replacement, we assume standard usage.
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-[#6272a4] italic">$1</span>');

    // 3. Keywords (Deep Pink / Purple)
    // const, let, var, import, from, return, if, else, try, catch, await, async, function, new, export, default, class, interface, type
    const keywords = '\\b(const|let|var|import|from|return|if|else|try|catch|await|async|function|new|export|default|class|interface|type|void|boolean|string|number|any)\\b';
    highlighted = highlighted.replace(new RegExp(keywords, 'g'), '<span class="text-[#ff79c6] font-semibold">$1</span>');

    // 4. Function Calls (Blue/Cyan) - looks for words followed by (
    highlighted = highlighted.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\()/g, '<span class="text-[#8be9fd]">$1</span>');

    // 5. Numbers (Orange/Purple)
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-[#bd93f9]">$1</span>');

    // 6. Object Keys (in simple cases like key: value) - variable color or distinct? 
    // Let's keep it simple for now to avoid over-highlighting.

    // 7. Boolean / null / undefined (Purple)
    highlighted = highlighted.replace(/\b(true|false|null|undefined)\b/g, '<span class="text-[#bd93f9]">$1</span>');

    return { __html: highlighted };
};

const SharedCodeBlock: React.FC<SharedCodeBlockProps> = ({ code }) => {
    return (
        <pre className="relative p-6 text-sm font-mono leading-relaxed text-[#f8f8f2] bg-[#282a36] rounded-xl overflow-x-auto shadow-2xl border border-[#44475a]">
            {/* Window controls decoration */}
            <div className="flex items-center gap-2 mb-4 absolute top-4 left-4">
                <div className="w-3 h-3 rounded-full bg-[#ff5555]"></div>
                <div className="w-3 h-3 rounded-full bg-[#f1fa8c]"></div>
                <div className="w-3 h-3 rounded-full bg-[#50fa7b]"></div>
            </div>
            <code
                className="block pt-6"
                dangerouslySetInnerHTML={highlightSyntax(code)}
            />
        </pre>
    );
};

export default SharedCodeBlock;
