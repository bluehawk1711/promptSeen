"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthProvider, useAuth } from "@/lib/auth";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/admin");
    } catch (err: any) {
      setError(
        err.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : err.code === "auth/user-not-found"
          ? "No account found with this email"
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.12_0.03_30)] p-4">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[oklch(0.75_0.19_45)]/[0.08] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[oklch(0.65_0.16_40)]/[0.06] blur-[100px]" />
      </div>

      <Card className="w-full max-w-md border-[oklch(0.25_0.03_35)] bg-[oklch(0.16_0.03_35)] relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[oklch(0.75_0.19_45)] text-white font-bold text-lg shadow-lg shadow-[oklch(0.75_0.19_45)]/20">
            PS
          </div>
          <CardTitle className="text-2xl text-[oklch(0.96_0.01_60)]">Admin Login</CardTitle>
          <CardDescription className="text-[oklch(0.65_0.05_45)]">
            Sign in to manage your PromptSeen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-[oklch(0.63_0.22_25)]/10 p-3 text-sm text-[oklch(0.63_0.22_25)]">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label className="text-[oklch(0.82_0.04_50)]">Email</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.55_0.04_40)]" />
                <Input
                  type="email"
                  placeholder="admin@promptseen.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-[oklch(0.20_0.03_35)] border-[oklch(0.25_0.03_35)] text-[oklch(0.96_0.01_60)] placeholder:text-[oklch(0.45_0.04_40)]"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-[oklch(0.82_0.04_50)]">Password</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.55_0.04_40)]" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-[oklch(0.20_0.03_35)] border-[oklch(0.25_0.03_35)] text-[oklch(0.96_0.01_60)] placeholder:text-[oklch(0.45_0.04_40)]"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[oklch(0.75_0.19_45)] hover:bg-[oklch(0.70_0.18_45)] text-white font-semibold shadow-lg shadow-[oklch(0.75_0.19_45)]/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[oklch(0.12_0.03_30)]">
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </body>
    </html>
  );
}
