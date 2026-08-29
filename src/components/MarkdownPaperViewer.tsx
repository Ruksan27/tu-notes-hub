'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

// Removed local import to prevent build errors if katex isn't installed locally
// import 'katex/dist/katex.min.css';

interface Props {
  content: string;
}

export default function MarkdownPaperViewer({ content }: Props) {
  return (
    <div className="w-full max-w-[900px] mx-auto text-black font-serif text-[15px] leading-relaxed">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" crossOrigin="anonymous" />
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Header 1 (TRIBHUVAN UNIVERSITY)
          h1: ({ node, ...props }) => (
            <h1 className="text-xl md:text-2xl font-bold uppercase text-center tracking-wide mb-1" {...props} />
          ),
          // Header 2 & 3 (Faculty / Office of the Dean)
          h2: ({ node, ...props }) => (
            <h2 className="text-base md:text-lg font-normal text-center mb-1" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-sm md:text-base font-bold uppercase text-center mb-2" {...props} />
          ),
          // Horizontal Line (---)
          hr: ({ node, ...props }) => (
            <hr className="border-t border-black my-4" {...props} />
          ),
          // Paragraphs & Spacing
          p: ({ node, ...props }) => (
            <p className="mb-3 text-justify leading-relaxed" {...props} />
          ),
          // Ordered List (1. 2. 3.)
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 space-y-3 mb-6 text-justify" {...props} />
          ),
          // Unordered List
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 space-y-1 mb-4" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="pl-1" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-black" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-gray-800" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
