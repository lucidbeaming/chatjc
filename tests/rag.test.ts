import { describe, it, expect } from "vitest";
import { splitMarkdownSections, buildChunks } from "../src/services/rag.js";

const experience = `# Experience

## Senior AI Developer
### Walmart
*Jul 2026 - Sep 2026*

- Built a screen recording tool

## Senior Full Stack Developer
### Berliner Verlag
*Jan 2023 - Dec 2024*

- Maintained a Next.js codebase
`;

describe("splitMarkdownSections", () => {
  it("tracks the heading path for each section", () => {
    const sections = splitMarkdownSections(experience);

    expect(sections).toEqual([
      {
        headings: ["Experience", "Senior AI Developer", "Walmart"],
        body: "*Jul 2026 - Sep 2026*\n\n- Built a screen recording tool",
      },
      {
        headings: ["Experience", "Senior Full Stack Developer", "Berliner Verlag"],
        body: "*Jan 2023 - Dec 2024*\n\n- Maintained a Next.js codebase",
      },
    ]);
  });

  it("skips headings with no body", () => {
    const sections = splitMarkdownSections("# Title\n\n## Empty\n\n## Full\ntext");

    expect(sections).toEqual([{ headings: ["Title", "Full"], body: "text" }]);
  });

  it("ignores heading-like lines inside code fences", () => {
    const sections = splitMarkdownSections("# Doc\n```\n# not a heading\n```");

    expect(sections).toHaveLength(1);
    expect(sections[0].headings).toEqual(["Doc"]);
    expect(sections[0].body).toContain("# not a heading");
  });

  it("handles skipped heading levels", () => {
    const sections = splitMarkdownSections("# Doc\n### Deep\ntext");

    expect(sections).toEqual([{ headings: ["Doc", "Deep"], body: "text" }]);
  });
});

describe("buildChunks", () => {
  it("prefixes every chunk of a long section with its heading path", async () => {
    const bullets = Array.from(
      { length: 30 },
      (_, i) => `- Bullet ${i} about agent orchestration and token usage`,
    ).join("\n");
    const markdown = `# Experience\n\n## Senior AI Developer\n### Walmart\n${bullets}`;

    const chunks = await buildChunks([markdown]);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.pageContent).toMatch(
        /^Experience > Senior AI Developer > Walmart\n/,
      );
    }
  });

  it("leaves chunks from files without headings unprefixed", async () => {
    const chunks = await buildChunks(["Just some text."]);

    expect(chunks.map((c) => c.pageContent)).toEqual(["Just some text."]);
  });
});
