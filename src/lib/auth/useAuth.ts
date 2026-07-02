import { useEffect, useState } from "react";
import { currentUser, isBootstrapped, onSessionChange } from "./session";
import type { User } from "@/lib/data";

export function useAuth(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(currentUser());
  const [ready, setReady] = useState(isBootstrapped());
  useEffect(() => {
    const unsub = onSessionChange(() => {
      setUser(currentUser());
      setReady(isBootstrapped());
    });
    return () => {
      unsub();
    };
  }, []);
  return { user, loading: !ready };
}
