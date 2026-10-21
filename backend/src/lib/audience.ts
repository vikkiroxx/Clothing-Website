import { Audience } from "@prisma/client";

const AUDIENCES = new Set(Object.values(Audience));

export function parseAudience(value: string | undefined): Audience | undefined {
  return value && AUDIENCES.has(value as Audience) ? (value as Audience) : undefined;
}

// MEN/WOMEN pages also include UNISEX products, so a product can be listed
// without needing a separate unisex page or a many-to-many audience field.
// KIDS stays exclusive — unisex is scoped to adult sizing only.
export function audienceWhere(audience: Audience | undefined): { audience?: Audience | { in: Audience[] } } {
  if (!audience) return {};
  if (audience === "KIDS") return { audience: "KIDS" };
  return { audience: { in: [audience, "UNISEX"] } };
}
