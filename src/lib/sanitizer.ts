// Simple server & client safe HTML content sanitizer / cleaner
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  // Strip dangerous script tags, onload, onerror, javascript: protocols
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:[^\s"']*/gi, '#');
}
