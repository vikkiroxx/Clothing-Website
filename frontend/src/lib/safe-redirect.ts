// Guards against open-redirect: only a same-origin, path-relative destination
// (e.g. "/admin") is accepted — never an absolute or protocol-relative URL.
export function sanitizeRedirect(path: string | null): string | null {
  if (!path) return null;
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//") || path.startsWith("/\\")) return null;
  return path;
}
