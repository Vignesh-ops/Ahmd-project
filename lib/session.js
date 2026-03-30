import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireAdminPage() {
  const session = await requireSession();

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return session;
}

