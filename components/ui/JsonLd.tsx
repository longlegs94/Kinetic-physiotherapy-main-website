/**
 * Serialises a value for embedding inside a `<script>` element.
 *
 * `JSON.stringify` escapes what JSON needs, not what HTML needs. A string
 * containing `</script>` terminates the element early no matter how valid the
 * surrounding JSON is, and everything after it is parsed as markup — so a
 * value that reaches this component can inject executable script. The data
 * here comes from content/site-content.json and MDX front matter, which the
 * clinic edits by hand, so this is a realistic path rather than a theoretical
 * one.
 *
 * `<` and `>` become unicode escapes: valid inside JSON strings, and decoded
 * back to the original characters by JSON.parse, so no consumer sees altered
 * data. U+2028 and U+2029 are escaped because they are legal in JSON strings
 * but are line terminators in JavaScript source, which breaks parsing.
 *
 * Both the patterns and the replacements are written as `\u` escapes rather
 * than literal characters — a literal U+2028 inside the regex below would
 * terminate the literal, which is the very hazard this function exists to
 * neutralise.
 */
function serializeForScript(data: object | object[]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Renders a JSON-LD structured-data block. Server component.
 *
 * `type="application/ld+json"` is a data block rather than executable script,
 * so script-src does not apply to it and it needs no CSP nonce.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeForScript(data) }}
    />
  );
}

/** Exported for tests. */
export const __serializeForScript = serializeForScript;
