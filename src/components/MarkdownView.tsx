import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import { Check, Copy } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Configure marked for clean breaks & tables
  const htmlContent = useMemo(() => {
    if (!content) return '';
    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });
      return marked.parse(content) as string;
    } catch (e) {
      console.error('Markdown parse error:', e);
      return content;
    }
  }, [content]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // If the content is simple text without any markdown symbols, render directly
  const isSimpleText = !content.includes('```') && !content.includes('###') && !content.includes('|') && !content.includes('**');
  if (isSimpleText && content.length < 300) {
    return <p className={`leading-relaxed whitespace-pre-wrap ${className}`}>{content}</p>;
  }

  return (
    <div
      className={`prose prose-sm max-w-none text-inherit leading-relaxed space-y-2.5 
        [&_h1]:text-base [&_h1]:font-black [&_h1]:text-slate-900 [&_h1]:dark:text-slate-100 [&_h1]:mt-3 [&_h1]:mb-1.5
        [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:dark:text-slate-100 [&_h2]:mt-2.5 [&_h2]:mb-1
        [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-[#8150E8] [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:uppercase [&_h3]:tracking-wider
        [&_p]:text-xs [&_p]:sm:text-sm [&_p]:leading-relaxed [&_p]:my-1.5
        [&_strong]:font-bold [&_strong]:text-slate-900 [&_strong]:dark:text-slate-100
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ul]:space-y-1
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_ol]:space-y-1
        [&_li]:text-xs [&_li]:sm:text-sm [&_li]:leading-relaxed
        [&_code]:font-mono [&_code]:text-[11px] [&_code]:bg-slate-200/60 [&_code]:dark:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[#8150E8]
        [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3.5 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:shadow-inner
        [&_pre_code]:bg-transparent [&_pre_code]:text-slate-100 [&_pre_code]:p-0
        [&_blockquote]:border-l-4 [&_blockquote]:border-[#8150E8] [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:dark:text-slate-400
        [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_table]:text-xs
        [&_th]:border [&_th]:border-slate-200 [&_th]:dark:border-slate-700 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:dark:bg-slate-800 [&_th]:font-bold
        [&_td]:border [&_td]:border-slate-200 [&_td]:dark:border-slate-700 [&_td]:p-2
        ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
