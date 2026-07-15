// Thin localStorage + BroadcastChannel wrapper.
// UI must not touch localStorage directly — go through repository.

const PREFIX = "svlogistica:";
const CHANNEL = "svlogistica";

type Listener = (key: string) => void;
const listeners = new Set<Listener>();
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (channel) return channel;
  if (typeof BroadcastChannel === "undefined") return null;
  channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (e) => {
    const key = e.data?.key as string | undefined;
    if (key) listeners.forEach((l) => l(key));
  };
  return channel;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith(PREFIX)) {
      const key = e.key.slice(PREFIX.length);
      listeners.forEach((l) => l(key));
    }
  });
}

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  const ch = getChannel();
  ch?.postMessage({ key });
  // Local subscribers (same tab) — storage event doesn't fire in same tab.
  listeners.forEach((l) => l(key));
}

export function subscribe(cb: Listener) {
  getChannel();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Ephemeral (typing/presence) — broadcast only, not persisted.
type Ephemeral = { type: string; payload: unknown };
const ephemeralListeners = new Set<(e: Ephemeral) => void>();

if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  const ch = new BroadcastChannel(CHANNEL + ":ephemeral");
  ch.onmessage = (e) => {
    ephemeralListeners.forEach((l) => l(e.data as Ephemeral));
  };
  // Store reference so it isn't GC'd
  (window as unknown as { __cfEph?: BroadcastChannel }).__cfEph = ch;
}

export function broadcastEphemeral(type: string, payload: unknown) {
  if (typeof window === "undefined") return;
  const ch = (window as unknown as { __cfEph?: BroadcastChannel }).__cfEph;
  ch?.postMessage({ type, payload });
}

export function subscribeEphemeral(cb: (e: Ephemeral) => void) {
  ephemeralListeners.add(cb);
  return () => ephemeralListeners.delete(cb);
}
