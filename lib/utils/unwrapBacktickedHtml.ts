// utils/unwrapBacktickedHtml.ts
export function unwrapBacktickedHtml(md?: string) {
  if (!md) return md;
  return md.replace(/`([^`]*)`/g, (_, inner) => {
    const trimmed = inner.trim();
    // Only unwrap if it looks like HTML (starts with '<' and ends with '>')
    if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
      return inner; // remove surrounding backticks
    }
    return "`" + inner + "`"; // keep as-is
  });
}
