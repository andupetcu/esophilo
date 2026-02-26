"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2 } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Invalid or missing magic link. Please try again.",
  expired: "This magic link has expired. Please request a new one.",
};

export function LoginPage() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    errorParam ? ERROR_MESSAGES[errorParam] || "An error occurred." : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSent(true);
      if (data.verifyUrl) {
        setVerifyUrl(data.verifyUrl);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl">
            Sign In to EsoPhilo
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your email to receive a magic link
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {sent ? (
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold">
                Check your email!
              </h3>
              <p className="text-muted-foreground text-sm">
                We sent a magic link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link to sign in.
              </p>
              {verifyUrl && (
                <div className="mt-4 rounded-md bg-muted p-3 text-xs">
                  <p className="font-medium mb-1 text-muted-foreground">
                    Dev mode - verify link:
                  </p>
                  <a
                    href={verifyUrl}
                    className="text-primary underline break-all"
                  >
                    {verifyUrl}
                  </a>
                </div>
              )}
              <Button
                variant="ghost"
                className="mt-2"
                onClick={() => {
                  setSent(false);
                  setVerifyUrl(null);
                  setEmail("");
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
