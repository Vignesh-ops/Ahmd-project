"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock, User } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await signIn("credentials", {
      username: form.username,
      password: form.password,
      redirect: false
    });

    setLoading(false);

    if (response?.error) {
      setError("Wrong username or password.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="page-fade flex min-h-screen items-center justify-center bg-mesh-dark px-4 py-10">
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <div className="glass-panel w-full max-w-md rounded-[32px] border border-gold/20 p-8 shadow-glow">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-white/95 shadow-[0_0_0_6px_rgba(212,168,67,0.08)]">
            <div className="relative h-24 w-24">
              <Image
                src="/Ahmad_logo.png"
                alt="Ahmad company logo"
                fill
                priority
                quality={100}
                unoptimized
                className="object-contain"
                sizes="96px"
              />
            </div>
          </div>
          <p className="mt-4 font-display text-2xl font-bold tracking-[0.18em] text-gold-light">AHMAD ENTERPRISES</p>
          <p className="mt-3 text-sm text-white/55">Store remittance order management</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Username"
            placeholder="Enter username"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            prefix={<User className="h-4 w-4" />}
          />
          <Input
            label="Password"
            type="password"
            allowPasswordToggle
            placeholder="Enter password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            prefix={<Lock className="h-4 w-4" />}
          />

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <Button type="submit" fullWidth loading={loading} className="mt-2">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
