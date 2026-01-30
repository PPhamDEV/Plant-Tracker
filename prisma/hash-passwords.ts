import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany();
  let updated = 0;

  for (const user of users) {
    // Skip already-hashed passwords (bcrypt hashes start with "$2")
    if (user.password.startsWith("$2")) {
      console.log(`Skipping ${user.email} (already hashed)`);
      continue;
    }

    const hashed = await bcrypt.hash(user.password, 12);
    await db.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    console.log(`Hashed password for ${user.email}`);
    updated++;
  }

  console.log(`Done. ${updated} password(s) hashed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
