import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Standalone, manually-invoked provisioning script — intentionally not an HTTP
// endpoint. Promotes an existing user to ADMIN, or creates a new admin account
// if ADMIN_PASSWORD is supplied. Never overwrites an existing user's password.
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email) {
    throw new Error(
      "Set ADMIN_EMAIL (and ADMIN_PASSWORD, if the account doesn't exist yet) and re-run: " +
        "ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... npm run create-admin",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === "ADMIN") {
      console.log(`${email} is already an admin. No changes made.`);
      return;
    }
    await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    console.log(`Promoted existing user ${email} to ADMIN.`);
    return;
  }

  if (!password) {
    throw new Error(
      `No user found with email ${email}. Set ADMIN_PASSWORD to create a new admin account.`,
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, password: hashed, role: "ADMIN" },
  });
  console.log(`Created new admin account for ${email}.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
