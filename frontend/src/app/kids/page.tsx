import type { Metadata } from "next";
import { AudienceLanding } from "@/components/home/AudienceLanding";

export const metadata: Metadata = {
  title: "Kids' Wear",
  description: "Shop kids' t-shirts, hoodies, cargo pants, jackets, and more.",
};

export default function KidsPage() {
  return <AudienceLanding audience="KIDS" label="Kids' Wear" />;
}
