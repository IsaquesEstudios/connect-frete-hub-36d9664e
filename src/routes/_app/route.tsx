import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { currentUser } from "@/lib/auth/session";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: () => {
    const u = currentUser();
    if (!u) throw redirect({ to: "/auth" });
    return { user: u };
  },
  component: () => <Outlet />,
});
