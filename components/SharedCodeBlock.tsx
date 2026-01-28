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

    // Syntax Highlighting Rules
    // We use inline styles instead of classes to avoid regex collisions where a keyword (like 'class')
    // matches the attribute name in our injected spans.

    // 1. Strings (single or double quotes or backticks) - Yellow
    highlighted = highlighted.replace(/(['"`])(.*?)\1/g, '<span style="color: #f1fa8c">$1$2$1</span>');

    // 2. Comments (// ...) - Gray
    // We apply this BEFORE keywords to avoid highlighting keywords inside comments,
    // though perfect tokenization would require a loop. Simple regex approach:
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span style="color: #6272a4; font-style: italic">$1</span>');

    // 3. Numbers (Orange/Purple) - Moved up to avoid matching '600' in font-weight style injected later
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span style="color: #bd93f9">$1</span>');

    // 4. Keywords (Deep Pink / Purple)
    // const, let, var, import, from, return, if, else, try, catch, await, async, function, new, export, default, class, interface, type, void, boolean, string, number, any
    // Removed 'class' from the regex to avoid matching the 'class' keyword if we were using classes, but with inline styles it's safer.
    // However, we WANT to highlight the word 'class' in the code.
    // Since we are using style="...", the word "class" does not appear in our tags. So we can safely highlight "class".
    const keywords = '\\b(const|let|var|import|from|return|if|else|try|catch|await|async|function|new|export|default|class|interface|type|void|boolean|string|number|any)\\b';
    highlighted = highlighted.replace(new RegExp(keywords, 'g'), '<span style="color: #ff79c6; font-weight: 600">$1</span>');

    // 5. Function Calls (Blue/Cyan) - looks for words followed by (
    highlighted = highlighted.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\()/g, '<span style="color: #8be9fd">$1</span>');

    // 6. Boolean / null / undefined (Purple)
    highlighted = highlighted.replace(/\b(true|false|null|undefined)\b/g, '<span style="color: #bd93f9">$1</span>');

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
