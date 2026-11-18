"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
}

interface WakeLockNavigator {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
}

/**
 * Keeps the phone screen awake during a meditation (Screen Wake Lock API),
 * re-acquiring the lock when the tab becomes visible again.
 * Unsupported browsers silently continue without it.
 */
export function useWakeLock() {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const wantedRef = useRef(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setSupported(Boolean((navigator as WakeLockNavigator).wakeLock));
  }, []);

  const request = useCallback(async () => {
    wantedRef.current = true;
    const api = (navigator as WakeLockNavigator).wakeLock;
    if (!api) return;
    try {
      const sentinel = await api.request("screen");
      sentinelRef.current = sentinel;
      setActive(true);
      sentinel.addEventListener("release", () => setActive(false));
    } catch {
      setActive(false);
    }
  }, []);

  const release = useCallback(async () => {
    wantedRef.current = false;
    try {
      await sentinelRef.current?.release();
    } catch {
      /* already released */
    }
    sentinelRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => {
      if (document.visibilityState === "visible" && wantedRef.current) {
        void request();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [request]);

  useEffect(() => {
    return () => {
      void sentinelRef.current?.release();
    };
  }, []);

  return { supported, active, request, release };
}
