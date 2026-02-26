import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPage } from "./login-client";

export const metadata: Metadata = { title: "Sign In" };

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
