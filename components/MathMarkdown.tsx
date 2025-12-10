import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

interface MathMarkdownProps {
  text: string;
  className?: string;
}

const MathMarkdown: React.FC<MathMarkdownProps> = ({ text, className }) => {
  if (!text) return null;

  // Pre-process text to fix common LLM formatting issues that break remark-math
  const cleanText = text
    // 1. Convert \[ \] block math to $$ $$
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    // 2. Convert \( \) inline math to $ $
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
    // 3. Fix escaped dollar signs that should be math delimiters
    .replace(/\\\$/g, '$')
    // 4. normalize non-breaking spaces
    .replace(/\u00A0/g, ' ');

  return (
    <div className={`markdown-content ${className || ''}`}>
      <ReactMarkdown
        children={cleanText}
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Override default elements to match app styling
          p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed break-words text-inherit" {...props} />,
          h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-4 text-white" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-md font-bold mb-2 mt-3 text-white" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
          // Style code blocks
          code: ({node, inline, className, children, ...props}: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre className="bg-black/30 p-3 rounded-lg overflow-x-auto text-sm my-2 border border-white/10">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-blue-200 break-all" {...props}>
                {children}
              </code>
            );
          },
          // Ensure tables look good
          table: ({node, ...props}) => <div className="overflow-x-auto my-3"><table className="min-w-full border-collapse text-sm" {...props} /></div>,
          th: ({node, ...props}) => <th className="p-2 border border-white/10 bg-white/5 font-bold text-left" {...props} />,
          td: ({node, ...props}) => <td className="p-2 border border-white/10" {...props} />,
          a: ({node, ...props}) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-white/20 pl-4 py-1 my-2 text-gray-400 italic" {...props} />,
        }}
      />
    </div>
  );
};

export default MathMarkdown;