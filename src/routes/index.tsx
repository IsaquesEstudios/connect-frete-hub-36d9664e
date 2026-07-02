import { createFileRoute, redirect } from "@tanstack/react-router";
import { currentUser, homeFor } from "@/lib/auth/session";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    const u = currentUser();
    if (u) throw redirect({ to: homeFor(u) as "/admin" });
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
