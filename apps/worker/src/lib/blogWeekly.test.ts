import { describe, expect, it } from "vitest";

/** Mirrors slug uniqueness helper behavior used by weekly publish. */
function ensureUniqueSlug(desired: string, taken: Set<string>): string {
  let slug = desired;
  let n = 2;
  while (taken.has(slug.toLowerCase())) {
    slug = `${desired.slice(0, 76)}-${n}`;
    n += 1;
  }
  return slug;
}

describe("weekly blog slug uniqueness", () => {
  it("keeps the preferred slug when free", () => {
    expect(ensureUniqueSlug("how-to-sign-online", new Set())).toBe("how-to-sign-online");
  });

  it("suffixes when colliding", () => {
    const taken = new Set(["how-to-sign-online"]);
    expect(ensureUniqueSlug("how-to-sign-online", taken)).toBe("how-to-sign-online-2");
  });
});
