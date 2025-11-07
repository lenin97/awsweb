/**
   * Resolve a possibly-root-relative path ("/path") or absolute URL ("https://...") into
   * an absolute URL where possible. If base is not absolute, we fall back to the provided path.
   */
  export function resolveAbsoluteUrl(base: string, maybePath: string): string {
    if (!maybePath) return maybePath
    // already absolute
    if (/^https?:\/\//i.test(maybePath) || /^\/\/.*/.test(maybePath)) return maybePath
    // if base is absolute, join them smartly
    if (/^https?:\/\//i.test(base)) {
      const baseTrimmed = base.replace(/\/$/, '')
      if (maybePath.startsWith('/')) return `${baseTrimmed}${maybePath}`
      return `${baseTrimmed}/${maybePath.replace(/^\//, '')}`
    }
    // cannot form absolute URL; return the original (likely root-relative)
    return maybePath
  }