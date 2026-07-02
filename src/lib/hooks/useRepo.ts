import { useEffect, useState } from "react";
import { repo } from "@/lib/data";

/** Re-render whenever any persisted data changes. */
export function useRepoVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const unsub = repo.subscribe(() => setV((x) => x + 1));
    return () => {
      unsub();
    };
  }, []);
  return v;
}

/** Presence heartbeat: mark current user online while mounted. */
export function usePresenceHeartbeat(userId: string | null | undefined) {
  useEffect(() => {
    if (!userId) return;
    repo.setPresence(userId, true);
    const t = setInterval(() => repo.setPresence(userId, true), 5000);
    const onUnload = () => repo.setPresence(userId, false);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      clearInterval(t);
      repo.setPresence(userId, false);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [userId]);
}

/** Watch ephemeral events, re-render on presence + typing. */
export function useEphemeralVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const unsub = repo.subscribeEphemeral(() => setV((x) => x + 1));
    return () => {
      unsub();
    };
  }, []);
  return v;
}
