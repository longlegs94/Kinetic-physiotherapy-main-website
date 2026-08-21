import { describe, expect, it } from "vitest";

import { __serializeForScript as serialize } from "@/components/ui/JsonLd";

describe("JSON-LD script serialization", () => {
  it("round-trips to the original data", () => {
    const data = { "@type": "LocalBusiness", name: "Kinetic Physiotherapy" };
    expect(JSON.parse(serialize(data))).toEqual(data);
  });

  it("neutralises a closing script tag", () => {
    // The attack: a content field containing </script> ends the element early,
    // and everything after it is parsed as markup rather than data.
    const data = { name: "</script><script>alert(1)</script>" };
    const output = serialize(data);
    expect(output).not.toContain("</script>");
    expect(output).not.toContain("<script>");
    // The value itself survives intact for any consumer that parses it.
    expect(JSON.parse(output).name).toBe("</script><script>alert(1)</script>");
  });

  it("escapes every angle bracket, not just script tags", () => {
    const output = serialize({ note: "a < b > c" });
    expect(output).not.toMatch(/[<>]/);
    expect(JSON.parse(output).note).toBe("a < b > c");
  });

  it("neutralises an HTML comment opener", () => {
    const output = serialize({ note: "<!--" });
    expect(output).not.toContain("<!--");
    expect(JSON.parse(output).note).toBe("<!--");
  });

  it("escapes U+2028 and U+2029", () => {
    // Legal inside a JSON string, but line terminators in JavaScript source —
    // left raw they break parsing of the surrounding script element.
    const data = { note: "line\u2028break\u2029here" };
    const output = serialize(data);
    expect(output).not.toContain("\u2028");
    expect(output).not.toContain("\u2029");
    expect(JSON.parse(output).note).toBe("line\u2028break\u2029here");
  });

  it("handles arrays of schema objects", () => {
    const data = [{ "@type": "A" }, { "@type": "B", name: "</script>" }];
    const output = serialize(data);
    expect(output).not.toContain("</script>");
    expect(JSON.parse(output)).toEqual(data);
  });

  it("leaves ordinary content byte-identical to JSON.stringify", () => {
    // No gratuitous rewriting: only the dangerous characters change.
    const data = { name: "Kinetic Physiotherapy", phone: "(604) 467-2113" };
    expect(serialize(data)).toBe(JSON.stringify(data));
  });
});
