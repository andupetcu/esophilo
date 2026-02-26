import type { Metadata } from "next";
import { SearchPage } from "./search-client";

export const metadata: Metadata = { title: "Search" };

export default function Page() {
  return <SearchPage />;
}
