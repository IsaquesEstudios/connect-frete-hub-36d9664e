import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { homeFor } from "@/lib/auth/session";

export const Route = createFileRoute("/")({
  ssr: false,
  component: IndexRedirect,
});

function IndexRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (user) navigate({ to: homeFor(user) as "/admin" });
    else navigate({ to: "/auth" });
  }, [user, loading, navigate]);
  return null;
}
