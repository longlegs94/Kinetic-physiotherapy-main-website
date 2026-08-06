/** Renders a JSON-LD structured-data block. Server component. */
export function JsonLd({ data }: { data: object | object[] }) {
  // Escape "<" so content sourced from site-content.json or blog frontmatter
  // (e.g. an FAQ answer containing "</script>") can't break out of the tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
