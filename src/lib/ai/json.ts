/**
 * Parse a JSON object returned by an LLM. Models often wrap JSON in Markdown
 * code fences (```json ... ```) or add prose around it, which breaks a raw
 * JSON.parse. This strips fences and falls back to the outermost {...} / [...]
 * span before parsing.
 */
export function parseJsonResponse<T = unknown>(raw: string): T {
  const trimmed = raw.trim();

  // Strip a leading/trailing Markdown code fence (```json ... ``` or ``` ... ```).
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(candidate, safeReviver) as T;
  } catch {
    // Fall back to the first balanced object/array span anywhere in the text.
    const start = candidate.search(/[[{]/);
    const end = Math.max(
      candidate.lastIndexOf("}"),
      candidate.lastIndexOf("]"),
    );
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1), safeReviver) as T;
    }
    throw new Error("No JSON found in AI response");
  }
}

// Drop prototype-polluting keys from untrusted model output before they land in
// any object. Defense-in-depth: callers also re-validate with Zod.
function safeReviver(key: string, value: unknown): unknown {
  if (key === "__proto__" || key === "constructor" || key === "prototype") {
    return undefined;
  }
  return value;
}
