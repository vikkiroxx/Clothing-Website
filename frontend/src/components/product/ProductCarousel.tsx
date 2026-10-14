import { api } from "@/lib/api";
import { Audience, Product } from "@/types";
import { CarouselTrack } from "@/components/product/CarouselTrack";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface ProductCarouselProps {
  audience: Audience;
}

async function getLatestProducts(audience: Audience, limit: number): Promise<Product[]> {
  try {
    return await api.get<Product[]>(`/products?audience=${audience}&limit=${limit}`);
  } catch {
    return [];
  }
}

export async function ProductCarousel({ audience }: ProductCarouselProps) {
  const products = await getLatestProducts(audience, 8);

  if (products.length === 0) return null;

  return (
    <section>
      <SectionHeading
        eyebrow="Just In"
        title="Latest Drops"
        viewAllHref={`/products?audience=${audience}`}
      />
      <CarouselTrack products={products} />
    </section>
  );
}
