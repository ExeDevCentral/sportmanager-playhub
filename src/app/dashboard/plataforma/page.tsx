import type { Metadata } from "next";
import { getPlatformOverview } from "@/services/platform";
import { requireDemoRole } from "@/lib/auth/role";
import { PlatformClient } from "./platform-client";

export const metadata: Metadata = {
  title: "Plataforma",
};

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  await requireDemoRole("platform");
  const data = await getPlatformOverview();
  return <PlatformClient data={data} />;
}