import type { Metadata } from "next";
import { AskPage } from "./ask-client";

export const metadata: Metadata = {
  title: "Ask the Sages",
  description: "AI-powered exploration of ancient wisdom traditions",
};

export default function Page() {
  return <AskPage />;
}
