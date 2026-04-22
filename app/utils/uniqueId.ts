// Simple unique ID generator (not cryptographically secure)
export function generateUniqueId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substr(2, 9)
  );
}
