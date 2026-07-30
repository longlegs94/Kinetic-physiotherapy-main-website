/** Renders a JSON-LD structured-data block. Server component. */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD is server-generated, but fields (descriptions, FAQ answers) come
      // from editable content — escape `<` so a stray `</script>` can't break out.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
