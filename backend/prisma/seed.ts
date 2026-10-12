import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type VariantSeed = { size: string; color: string; sku: string; stock: number };

type ProductSeed = {
  slug: string;
  name: string;
  description: string;
  price: number;
  categorySlug: string;
  variants: VariantSeed[];
};

// images[0] = primary (front) shot, images[1] = hover (back) shot.
function productImages(label: string): [string, string] {
  const encoded = encodeURIComponent(label);
  return [
    `https://placehold.co/900x1125/0d0f13/eef1f6?text=${encoded}+Front`,
    `https://placehold.co/900x1125/060708/39f3c4?text=${encoded}+Back`,
  ];
}

async function upsertProduct(categoryId: string, seed: ProductSeed) {
  await prisma.product.upsert({
    where: { slug: seed.slug },
    update: {},
    create: {
      name: seed.name,
      slug: seed.slug,
      description: seed.description,
      price: seed.price,
      images: productImages(seed.name),
      categoryId,
      variants: { create: seed.variants },
    },
  });
}

async function main() {
  await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      name: "Test User",
      email: "test@example.com",
      password: await bcrypt.hash("password123", 10),
      addresses: {
        create: [
          {
            line1: "221B Baker Street",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
            phone: "9876543210",
            isDefault: true,
          },
          {
            line1: "12 MG Road",
            line2: "Near City Mall",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560001",
            phone: "9123456780",
            isDefault: false,
          },
        ],
      },
    },
  });

  const categorySeeds = [
    { name: "T-Shirts", slug: "t-shirts" },
    { name: "Hoodies", slug: "hoodies" },
    { name: "Cargo Pants", slug: "cargo-pants" },
    { name: "Jackets", slug: "jackets" },
  ];

  const resolvedCategories: Record<string, { id: string }> = {};
  for (const c of categorySeeds) {
    resolvedCategories[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  const productSeeds: ProductSeed[] = [
    {
      slug: "classic-oversized-tee",
      name: "Classic Oversized Tee",
      description: "100% cotton oversized fit t-shirt.",
      price: 799,
      categorySlug: "t-shirts",
      variants: [
        { size: "S", color: "Black", sku: "TEE-BLK-S", stock: 20 },
        { size: "M", color: "Black", sku: "TEE-BLK-M", stock: 25 },
        { size: "L", color: "Black", sku: "TEE-BLK-L", stock: 15 },
      ],
    },
    {
      slug: "graphic-print-tee",
      name: "Graphic Print Tee",
      description: "Relaxed fit tee with front graphic print.",
      price: 899,
      categorySlug: "t-shirts",
      variants: [
        { size: "S", color: "White", sku: "GTEE-WHT-S", stock: 18 },
        { size: "M", color: "White", sku: "GTEE-WHT-M", stock: 22 },
        { size: "L", color: "White", sku: "GTEE-WHT-L", stock: 4 },
      ],
    },
    {
      slug: "pullover-hoodie",
      name: "Pullover Hoodie",
      description: "Heavyweight fleece pullover hoodie.",
      price: 1899,
      categorySlug: "hoodies",
      variants: [
        { size: "M", color: "Charcoal", sku: "HOOD-CHR-M", stock: 12 },
        { size: "L", color: "Charcoal", sku: "HOOD-CHR-L", stock: 10 },
        { size: "XL", color: "Charcoal", sku: "HOOD-CHR-XL", stock: 0 },
      ],
    },
    {
      slug: "zip-up-hoodie",
      name: "Zip-Up Hoodie",
      description: "Full-zip hoodie with kangaroo pocket.",
      price: 2099,
      categorySlug: "hoodies",
      variants: [
        { size: "S", color: "Navy", sku: "ZHOOD-NVY-S", stock: 14 },
        { size: "M", color: "Navy", sku: "ZHOOD-NVY-M", stock: 3 },
      ],
    },
    {
      slug: "utility-cargo-pants",
      name: "Utility Cargo Pants",
      description: "Six-pocket utility cargo pants with adjustable cuffs.",
      price: 1799,
      categorySlug: "cargo-pants",
      variants: [
        { size: "30", color: "Olive", sku: "CARGO-OLV-30", stock: 16 },
        { size: "32", color: "Olive", sku: "CARGO-OLV-32", stock: 20 },
        { size: "34", color: "Olive", sku: "CARGO-OLV-34", stock: 9 },
      ],
    },
    {
      slug: "relaxed-cargo-joggers",
      name: "Relaxed Cargo Joggers",
      description: "Tapered-fit cargo joggers with elastic waistband.",
      price: 1599,
      categorySlug: "cargo-pants",
      variants: [
        { size: "M", color: "Black", sku: "JOG-BLK-M", stock: 25 },
        { size: "L", color: "Black", sku: "JOG-BLK-L", stock: 2 },
      ],
    },
    {
      slug: "bomber-jacket",
      name: "Bomber Jacket",
      description: "Water-resistant bomber jacket with ribbed trims.",
      price: 3299,
      categorySlug: "jackets",
      variants: [
        { size: "M", color: "Black", sku: "BOMB-BLK-M", stock: 8 },
        { size: "L", color: "Black", sku: "BOMB-BLK-L", stock: 6 },
      ],
    },
    {
      slug: "windbreaker-jacket",
      name: "Windbreaker Jacket",
      description: "Lightweight packable windbreaker.",
      price: 2499,
      categorySlug: "jackets",
      variants: [
        { size: "S", color: "Electric Teal", sku: "WIND-TEAL-S", stock: 11 },
        { size: "M", color: "Electric Teal", sku: "WIND-TEAL-M", stock: 0 },
      ],
    },
  ];

  for (const seed of productSeeds) {
    await upsertProduct(resolvedCategories[seed.categorySlug]!.id, seed);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
