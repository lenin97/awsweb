'use client';

import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema as defaultSanitizeSchema } from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import type { Pluggable } from 'unified';

// ---------- Types ----------
type MarkdownRendererProps = {
  content: string;
  useBreaks?: boolean;
  allowHtml?: 'none' | 'sanitize';
  prose?: boolean;
};

type RendererProps<T extends HTMLElement> = {
  node?: unknown;
  children?: React.ReactNode;
} & React.HTMLAttributes<T>;

type HeadingProps = RendererProps<HTMLHeadingElement>;
type ParaProps = RendererProps<HTMLParagraphElement>;
type ListProps = RendererProps<HTMLUListElement | HTMLOListElement>;
type LinkProps = {
  node?: unknown;
  href?: string;
  children?: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;
type CodeProps = {
  node?: unknown;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

// Minimal HAST element shape used for node inspection (no `any` here)
type HastElement = {
  type?: string;
  tagName?: string;
  children?: Array<HastElement | string | { type?: string; [key: string]: unknown }>;
};

// ---------- Helper: extend sanitize schema ----------
function makeExtendedSchema() {
  const cloned = JSON.parse(JSON.stringify(defaultSanitizeSchema)) as Record<string, unknown>;

  cloned.tagNames = Array.from(
    new Set([...(Array.isArray(cloned.tagNames) ? (cloned.tagNames as string[]) : []), 'mark', 'span'])
  );

  cloned.attributes = cloned.attributes ?? {};

  const pushAllowed = (nodeName: string, rule: unknown) => {
    const attrs = (cloned.attributes as Record<string, unknown>)[nodeName];
    if (!attrs) {
      (cloned.attributes as Record<string, unknown>)[nodeName] = [rule];
    } else if (Array.isArray(attrs)) {
      (cloned.attributes as Record<string, unknown>)[nodeName] = [...attrs, rule];
    } else {
      (cloned.attributes as Record<string, unknown>)[nodeName] = [attrs, rule];
    }
  };

  pushAllowed('code', ['className', /^language-/]);
  pushAllowed('code', ['className', /^hljs/]);
  pushAllowed('pre', ['className', /^language-/]);
  pushAllowed('span', ['className', /^hljs/]);
  pushAllowed('mark', 'className');
  pushAllowed('span', 'className');

  return cloned;
}

// ---------- Helper: recursive block detection ----------
const blockTags = new Set([
  'pre', 'code', 'table', 'div', 'ul', 'ol', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
]);

function containsBlockElementDeep(node: React.ReactNode): boolean {
  if (!React.isValidElement(node)) return false;

  const el = node as React.ReactElement<{ children?: React.ReactNode }>;

  // direct block
  if (typeof el.type === 'string' && blockTags.has(el.type)) {
    return true;
  }

  // recurse into children
  return React.Children.toArray(el.props.children).some(containsBlockElementDeep);
}

// ---------- Custom renderers ----------
const components: Partial<Components> = {
  h1: ({ children, ...props }: HeadingProps) => (
    <h1 className={`text-3xl font-bold my-4 ${props.className ?? ''}`} aria-level={1}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: HeadingProps) => (
    <h2 className={`text-2xl font-semibold my-3 ${props.className ?? ''}`} aria-level={2}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: HeadingProps) => (
    <h3 className={`text-xl font-semibold my-2 ${props.className ?? ''}`} aria-level={3}>
      {children}
    </h3>
  ),

  ul: ({ children, ...props }: ListProps) => (
    <ul className={`list-disc ml-6 my-2 ${props.className ?? ''}`}>{children}</ul>
  ),
  ol: ({ children, ...props }: ListProps) => (
    <ol className={`list-decimal ml-6 my-2 ${props.className ?? ''}`}>{children}</ol>
  ),

  a: ({ href, children, ...props }: LinkProps) => {
    const isExternal = typeof href === 'string' && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={`text-blue-600 hover:underline ${props.className ?? ''}`}
      >
        {children}
      </a>
    );
  },

  // IMPORTANT: inspect the `node` AST for block children to avoid nesting block elements inside <p>
  p: ({ node, children, ...props }: ParaProps & { node?: HastElement | null }) => {
    const n = node as HastElement | undefined | null;

    const hasBlockChildFromNode =
      n &&
      Array.isArray(n.children) &&
      n.children.some((child) => {
        // child may be a string or an element-like object
        if (typeof child === 'string') return false;
        // narrow to HastElement-like shape
        const el = child as HastElement;
        return el && el.type === 'element' && typeof el.tagName === 'string' && blockTags.has(el.tagName);
      });

    if (hasBlockChildFromNode) {
      return <>{children}</>;
    }

    // Fallback: still check the React children tree (covers cases where node isn't available)
    const hasBlockChildFromReactTree = React.Children.toArray(children).some(containsBlockElementDeep);
    if (hasBlockChildFromReactTree) {
      return <>{children}</>;
    }

    return <p {...props}>{children}</p>;
  },

  code: ({ inline, className, children, ...props }: CodeProps) => {
    if (!inline) {
      return (
        <pre className="bg-gray-900 text-white p-3 rounded overflow-x-auto whitespace-pre">
          <code className={className ?? undefined}>{children}</code>
        </pre>
      );
    }
    return (
      <code className="bg-gray-100 rounded px-1 py-0.5" {...props}>
        {children}
      </code>
    );
  },
};

// ---------- Main component ----------
export default function MarkdownRenderer({
  content,
  useBreaks = false,
  allowHtml = 'none',
  prose = false,
}: MarkdownRendererProps) {
  const remarkPlugins: Pluggable[] = [
    remarkGfm as unknown as Pluggable,
    ...(useBreaks ? ([remarkBreaks as unknown as Pluggable] as Pluggable[]) : []),
  ];

  const remarkRehypeOptions = allowHtml === 'sanitize' ? { allowDangerousHtml: true } : undefined;

  const rehypePlugins: Pluggable[] = [];
  if (allowHtml === 'sanitize') {
    rehypePlugins.push(rehypeRaw as unknown as Pluggable);
    const extendedSchema = makeExtendedSchema();
    rehypePlugins.push([rehypeSanitize as unknown as Pluggable, extendedSchema as unknown as Pluggable] as unknown as Pluggable);
    rehypePlugins.push(rehypeHighlight as unknown as Pluggable);
  } else {
    rehypePlugins.push(rehypeHighlight as unknown as Pluggable);
  }

  const wrapperClass = prose ? 'prose max-w-none dark:prose-invert' : '';

  return (
    <div className={wrapperClass}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        remarkRehypeOptions={remarkRehypeOptions}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
