import { api } from "@/lib/api";
import { Product } from "@/types";
import { CarouselTrack } from "@/components/product/CarouselTrack";
import { SectionHeading } from "@/components/ui/SectionHeading";

async function getLatestProducts(limit: number): Promise<Product[]> {
  try {
    return await api.get<Product[]>(`/products?limit=${limit}`);
  } catch {
    return [];
  }
}

export async function ProductCarousel() {
  const products = await getLatestProducts(8);

  if (products.length === 0) return null;

  return (
    <section>
      <SectionHeading eyebrow="Just In" title="Latest Drops" viewAllHref="/products" />
      <CarouselTrack products={products} />
    </section>
  );
}
