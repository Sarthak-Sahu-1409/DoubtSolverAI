import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MathMarkdownProps {
  text: string;
  className?: string;
}

const MathMarkdown: React.FC<MathMarkdownProps> = ({ text, className }) => {
  if (!text) return null;

  // 1. Basic cleanup of the text
  // Normalize \[...\] to $$...$$ and \(...\) to $...$
  const cleanText = text
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');

  // 2. Regex to split by delimiters
  // Matches $$...$$ (Block) OR $...$ (Inline)
  // Logic: 
  // \$\$[\s\S]*?\$\$ matches block math
  // (?<!\\)\$(?!$)[\s\S]*?(?<!\\)\$ matches inline math ($...$) not preceded by backslash
  const regex = /(\$\$[\s\S]*?\$\$|(?<!\\)\$(?!$)[\s\S]*?(?<!\\)\$)/g;

  const parts = cleanText.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Block Math
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim();
          try {
            const html = window.katex?.renderToString(formula, {
              displayMode: true,
              throwOnError: false,
              output: 'html',
            });
            return (
              <span
                key={index}
                dangerouslySetInnerHTML={{ __html: html || formula }}
              />
            );
          } catch (e) {
            return <code key={index} className="text-red-400">{part}</code>;
          }
        }
        // Inline Math
        else if (part.startsWith('$') && part.endsWith('$')) {
          const formula = part.slice(1, -1).trim();
          // Safety: Don't render empty math
          if (!formula) return <span key={index}>$</span>;
          
          try {
            const html = window.katex?.renderToString(formula, {
              displayMode: false,
              throwOnError: false,
              output: 'html',
            });
            return (
              <span
                key={index}
                dangerouslySetInnerHTML={{ __html: html || formula }}
              />
            );
          } catch (e) {
            return <span key={index}>{part}</span>;
          }
        }
        // Regular Text
        else {
          if (!part) return null;
          return (
            <ReactMarkdown 
              key={index} 
              remarkPlugins={[remarkGfm]}
              components={{
                // Avoid block elements inside spans
                p: ({node, ...props}) => <span {...props} />,
                // Fix TypeScript error for 'inline' prop in code blocks
                code: ({node, className, children, ...props}: any) => {
                   return <code className={`${className} bg-white/10 rounded px-1`} {...props}>{children}</code>;
                }
              }}
            >
              {part}
            </ReactMarkdown>
          );
        }
      })}
    </span>
  );
};

export default MathMarkdown;