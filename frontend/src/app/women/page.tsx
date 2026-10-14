import type { Metadata } from "next";
import { AudienceLanding } from "@/components/home/AudienceLanding";

export const metadata: Metadata = {
  title: "Women's Wear",
  description: "Shop women's t-shirts, hoodies, cargo pants, jackets, and more.",
};

export default function WomenPage() {
  return <AudienceLanding audience="WOMEN" label="Women's Wear" />;
}
