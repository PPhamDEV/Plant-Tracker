import { auth } from "./auth";
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

/** Get the current user ID from session or default user in single-user mode */
export async function getCurrentUserId(): Promise<string> {
  if (process.env.SINGLE_USER_MODE === "true") {
    return getDefaultUserId();
  }
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Nicht authentifiziert");
  }
  return session.user.id;
}
