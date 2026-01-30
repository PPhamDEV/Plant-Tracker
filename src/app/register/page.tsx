"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf } from "lucide-react";
import { register } from "@/app/actions/auth";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      const result = await register(form);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const signInResult = await signIn("credentials", {
        email: form.get("email") as string,
        password: form.get("password") as string,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Registrierung erfolgreich, aber Login fehlgeschlagen. Bitte manuell anmelden.");
        setLoading(false);
        return;
      }

      router.push("/");
    } catch {
      setError("Ein Fehler ist aufgetreten");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Leaf className="mx-auto h-10 w-10 text-primary" />
          <CardTitle>Registrieren</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" type="text" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Mindestens 8 Zeichen"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird registriert..." : "Registrieren"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Bereits registriert?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Anmelden
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
