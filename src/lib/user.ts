import { db } from "./db";

export async function getDefaultUserId(): Promise<string> {
  let user = await db.user.findFirst();
  if (!user) {
    user = await db.user.create({
      data: {
        email: "admin@plant-tracker.local",
        password: "not-used",
        name: "Admin",
      },
    });
  }
  return user.id;
}
