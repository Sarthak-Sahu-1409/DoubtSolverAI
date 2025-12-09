import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MathMarkdownProps {
  text: string;
  className?: string;
}

declare global {
  interface Window {
    katex: any;
  }
}

const MathMarkdown: React.FC<MathMarkdownProps> = ({ text, className }) => {
  if (!text) return null;

  // 1. Basic cleanup of the text
  const cleanText = text
    .replace(/\\\[/g, '$$') // Normalize \[ \] to $$
    .replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$')  // Normalize \( \) to $
    .replace(/\\\)/g, '$')
    .replace(/\\\$(\$)/g, '$$$1'); // Fix double escaped

  // 2. Regex to find math blocks: $$...$$ OR $...$
  // This regex looks for:
  // (\$\$[\s\S]*?\$\$) -> Block math
  // |
  // (\$[^\$\n]+?\$) -> Inline math (single $, at least one char inside, no newlines)
  const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;

  const parts = cleanText.split(regex);

  return (
    <span className={`markdown-content ${className || ''}`}>
      {parts.map((part, index) => {
        // Check if this part is math
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Block Math
          const formula = part.slice(2, -2);
          try {
            const html = window.katex?.renderToString(formula, { displayMode: true, throwOnError: false }) || formula;
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <span key={index} className="text-red-400">{part}</span>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline Math
          const formula = part.slice(1, -1);
          try {
             // Basic fix for common spacing issues in inline math
            const html = window.katex?.renderToString(formula, { displayMode: false, throwOnError: false }) || formula;
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <span key={index} className="text-red-400">{part}</span>;
          }
        } else {
          // Standard Markdown
          if (!part) return null;
          return (
            <span key={index} className="inline-block align-top">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({node, ...props}) => <span className="mb-2 block last:mb-0 leading-relaxed" {...props} />,
                    h1: ({node, ...props}) => <strong className="block text-xl font-bold mb-2 text-white" {...props} />,
                    h2: ({node, ...props}) => <strong className="block text-lg font-bold mb-2 text-white" {...props} />,
                    strong: ({node, ...props}) => <span className="font-bold text-white" {...props} />,
                    em: ({node, ...props}) => <span className="italic text-gray-300" {...props} />,
                    code: ({node, inline, className, children, ...props}) => {
                        return inline ? 
                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-blue-200" {...props}>{children}</code> :
                        <code className="block bg-black/30 p-3 rounded-lg overflow-x-auto text-sm my-3 border border-white/10 font-mono text-gray-300" {...props}>{children}</code>
                    },
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1 text-gray-200" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-gray-200" {...props} />,
                    li: ({node, ...props}) => <li className="pl-1" {...props} />,
                }}
              >
                {part}
              </ReactMarkdown>
            </span>
          );
        }
      })}
    </span>
  );
};

export default MathMarkdown;