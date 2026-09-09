import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PromptSeen",
  description: "Curated AI prompts with beautiful images",
};

/**
 * Root page — redirects to the admin panel.
 * The main app is the mobile app; this web app is the admin panel.
 */
export default function HomePage() {
  redirect("/admin");
}
