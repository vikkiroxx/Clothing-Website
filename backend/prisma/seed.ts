import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "t-shirts" },
    update: {},
    create: { name: "T-Shirts", slug: "t-shirts" },
  });

  await prisma.product.upsert({
    where: { slug: "classic-oversized-tee" },
    update: {},
    create: {
      name: "Classic Oversized Tee",
      slug: "classic-oversized-tee",
      description: "100% cotton oversized fit t-shirt.",
      price: 799,
      images: ["https://placehold.co/600x600"],
      categoryId: category.id,
      variants: {
        create: [
          { size: "S", color: "Black", sku: "TEE-BLK-S", stock: 20 },
          { size: "M", color: "Black", sku: "TEE-BLK-M", stock: 25 },
          { size: "L", color: "Black", sku: "TEE-BLK-L", stock: 15 },
        ],
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
