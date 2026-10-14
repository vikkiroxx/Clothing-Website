import type { Metadata } from "next";
import { AudienceLanding } from "@/components/home/AudienceLanding";

export const metadata: Metadata = {
  title: "Men's Wear",
  description: "Shop men's t-shirts, hoodies, cargo pants, jackets, and more.",
};

export default function MenPage() {
  return <AudienceLanding audience="MEN" label="Men's Wear" />;
}
