import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { getCurrentSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getCurrentSession();

  if (session?.user) {
    redirect("/");
  }

  return <LoginForm />;
}

