// lib/mdxCache.ts
import { cache } from 'react';
import React from 'react';
import { MDXProvider } from '@mdx-js/react';

/**
 * Memoize component creation by the compiledSource string.
 * On first call with a given string, we build the fn+component.
 * On warm calls with the same string, React.cache returns the cached component.
 */
export const getMdxComponent = cache((compiledSource: string) => {
  const fn = new Function(
    'React',
    'MDXProvider',
    `return function MDXContent(props) { ${compiledSource} }`
  );
  return fn(React, MDXProvider);
});
