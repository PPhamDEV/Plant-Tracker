import { auth } from "./auth";

export async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Nicht authentifiziert");
  }
  return session.user.id;
}
