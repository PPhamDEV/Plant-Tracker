"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { signIn } from "@/lib/auth";

export async function register(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const data = registerSchema.parse(raw);

  const existing = await db.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    return { error: "E-Mail ist bereits registriert" };
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });

  await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirect: false,
  });

  return { success: true };
}
