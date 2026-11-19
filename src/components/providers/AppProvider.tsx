"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { priceForMinutes } from "@/lib/booking";
import { dateKey } from "@/lib/date";
import { LocalDataSource } from "@/lib/data/local";
import type { DataSource, StoreMode } from "@/lib/data/source";
import { SupabaseDataSource } from "@/lib/data/supabase";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  defaultPrefs,
  normalizePrefs,
  readJson,
  STORAGE_KEY,
  writeJson,
} from "@/lib/storage";
import type {
  AppPrefs,
} from "@/lib/storage";
import type {
  Booking,
  CounselingNote,
  DiaryEntry,
  DiaryMoment,
  MoodId,
  PlayRecord,
  Slot,
  SlotStatus,
  Snapshot,
  UserProfile,
} from "@/lib/types";

const PREFS_KEY = `${STORAGE_KEY}.prefs`;

interface ToastState {
  id: number;
  message: string;
}

interface AppContextValue {
  hydrated: boolean;
  /** True once the active data source (local or Supabase) has finished loading. */
  dataReady: boolean;
  configured: boolean;
  mode: StoreMode;
  user: UserProfile | null;
  authLoading: boolean;
  diaries: DiaryEntry[];
  plays: PlayRecord[];
  slots: Slot[];
  bookings: Booking[];
  notes: CounselingNote[];
  prefs: AppPrefs;
  toastMessage: ToastState | null;
  toast: (message: string) => void;
  setPrefs: (patch: Partial<AppPrefs>) => void;
  saveDiary: (input: {
    moment: DiaryMoment;
    mood: MoodId;
    intensity: number;
    energy?: number;
    sessionLabel?: string;
    text: string;
  }) => Promise<DiaryEntry>;
  removeDiary: (id: string) => Promise<void>;
  recordPlay: (courseId: string, minutes: number, seconds?: number) => Promise<void>;
  setSlotStatus: (
    slot: Pick<Slot, "id" | "dateKey" | "time" | "minutes">,
    status: SlotStatus,
  ) => Promise<void>;
  createBooking: (input: {
    dateKey: string;
    time: string;
    minutes: number;
    consentListening: boolean;
    consentBriefing: boolean;
  }) => Promise<Booking>;
  updateBooking: (id: string, patch: Partial<Booking>) => Promise<void>;
  saveNote: (input: {
    bookingId: string;
    line1: string;
    line2: string;
    line3: string;
    nextStep: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_SNAPSHOT: Snapshot = {
  diaries: [],
  plays: [],
  slots: [],
  bookings: [],
  notes: [],
};

function newOrderId() {
  return `maeum_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureProfile(
  supabase: SupabaseClient,
  authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  },
): Promise<UserProfile> {
  const meta = authUser.user_metadata ?? {};
  const name = String(
    meta.name ?? meta.full_name ?? meta.nickname ?? meta.preferred_username ?? "이용자",
  ).slice(0, 40);
  const handle = String(
    meta.preferred_username ?? meta.nickname ?? authUser.email?.split("@")[0] ?? "maeum",
  ).slice(0, 40);
  const avatarUrl = (meta.avatar_url ?? meta.picture ?? null) as string | null;

  const { data } = await supabase
    .from("users")
    .select("id, name, handle, role, avatar_url")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!data) {
    await supabase
      .from("users")
      .upsert(
        { id: authUser.id, name, handle, role: "client", avatar_url: avatarUrl },
        { onConflict: "id" },
      );
    return { id: authUser.id, name, handle, role: "client", avatarUrl };
  }

  const row = data as {
    id: string;
    name: string | null;
    handle: string | null;
    role: string | null;
    avatar_url: string | null;
  };

  return {
    id: row.id,
    name: row.name ?? name,
    handle: row.handle ?? handle,
    role: row.role === "host" ? "host" : "client",
    avatarUrl: row.avatar_url ?? avatarUrl,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
  const [prefs, setPrefsState] = useState<AppPrefs>(defaultPrefs);
  const [hydrated, setHydrated] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(() => isSupabaseConfigured());
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const sourceRef = useRef<DataSource | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const configured = isSupabaseConfigured();
  const mode: StoreMode = configured && user ? "supabase" : "demo";

  const toast = useCallback((message: string) => {
    setToastState({ id: Date.now(), message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastState(null), 2800);
  }, []);

  const applySnapshot = useCallback((next: Snapshot) => {
    setSnapshot(next);
  }, []);

  const loadWith = useCallback(
    async (source: DataSource) => {
      sourceRef.current = source;
      setDataReady(false);
      try {
        const data = await source.load();
        applySnapshot(data);
      } finally {
        setDataReady(true);
      }
    },
    [applySnapshot],
  );

  /**
   * Mutations always target the backend that matches the current identity,
   * instead of whatever source was last loaded — this avoids writing a payment
   * confirmation to local storage while the Supabase session is still resolving.
   */
  const getSource = useCallback((): DataSource => {
    const supabase = getBrowserSupabase();
    if (supabase && user) return new SupabaseDataSource(supabase, user.id);
    return sourceRef.current ?? new LocalDataSource();
  }, [user]);

  /* Boot: local data first (instant), then Supabase if a session exists. */
  useEffect(() => {
    let cancelled = false;
    setPrefsState(normalizePrefs(readJson<unknown>(PREFS_KEY, null)));

    (async () => {
      try {
        await loadWith(new LocalDataSource());
      } catch {
        /* keep empty state */
      }
      if (!cancelled) setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [loadWith]);

  /* Auth: resolve the session once Supabase is configured. */
  useEffect(() => {
    if (!configured) {
      setAuthLoading(false);
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        if (sessionUser && !cancelled) {
          setUser(await ensureProfile(supabase, sessionUser));
        }
      } catch {
        /* Supabase unreachable or misconfigured — keep the app in demo mode. */
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null } } | null) => {
        const sessionUser = session?.user;
        if (!sessionUser) {
          setUser(null);
          return;
        }
        void ensureProfile(supabase, sessionUser)
          .then((profile) => {
            if (!cancelled) setUser(profile);
          })
          .catch(() => undefined);
      },
    );

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  /* Data: reload when the signed-in identity changes. */
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (user && supabase) {
      void loadWith(new SupabaseDataSource(supabase, user.id)).catch((error) => {
        toast(error instanceof Error ? error.message : "데이터를 불러오지 못했어요");
      });
    } else if (hydrated) {
      void loadWith(new LocalDataSource()).catch(() => undefined);
    }
    // `hydrated` intentionally excluded: the boot effect already loaded local data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loadWith, toast]);

  const setPrefs = useCallback((patch: Partial<AppPrefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      writeJson(PREFS_KEY, next);
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    const source = getSource();
    sourceRef.current = source;
    const data = await source.load();
    applySnapshot(data);
    setDataReady(true);
  }, [applySnapshot, getSource]);

  const saveDiary = useCallback(
    async (input: {
      moment: DiaryMoment;
      mood: MoodId;
      intensity: number;
      energy?: number;
      sessionLabel?: string;
      text: string;
    }) => {
      const source = getSource();
      const entry = await source.addDiary({
        date: dateKey(),
        moment: input.moment,
        mood: input.mood,
        intensity: input.intensity,
        energy: input.energy,
        sessionLabel: input.sessionLabel,
        text: input.text.trim(),
      });
      setSnapshot((prev) => ({ ...prev, diaries: [entry, ...prev.diaries] }));
      return entry;
    },
    [getSource],
  );

  const removeDiary = useCallback(
    async (id: string) => {
      const source = getSource();
      await source.deleteDiary(id);
      setSnapshot((prev) => ({
        ...prev,
        diaries: prev.diaries.filter((d) => d.id !== id),
      }));
    },
    [getSource],
  );

  const recordPlay = useCallback(
    async (courseId: string, minutes: number, seconds?: number) => {
      try {
        const play = await getSource().addPlay(courseId, minutes, seconds);
        setSnapshot((prev) => ({ ...prev, plays: [play, ...prev.plays] }));
      } catch {
        /* a lost play record must never block finishing a meditation */
      }
    },
    [getSource],
  );

  const setSlotStatus = useCallback(
    async (
      slot: Pick<Slot, "id" | "dateKey" | "time" | "minutes">,
      status: SlotStatus,
    ) => {
      const source = getSource();
      await source.setSlotStatus(slot, status);
      setSnapshot((prev) => {
        const exists = prev.slots.some((s) => s.id === slot.id);
        const slots = exists
          ? prev.slots.map((s) => (s.id === slot.id ? { ...s, status } : s))
          : [...prev.slots, { ...slot, status }];
        return { ...prev, slots };
      });
      if (mode === "supabase") void refresh().catch(() => undefined);
    },
    [getSource, mode, refresh],
  );

  const createBooking = useCallback(
    async (input: {
      dateKey: string;
      time: string;
      minutes: number;
      consentListening: boolean;
      consentBriefing: boolean;
    }) => {
      if (!input.consentListening) {
        throw new Error("리스닝 서비스 안내에 동의해 주세요");
      }
      const source = getSource();
      const slot =
        snapshot.slots.find(
          (s) => s.dateKey === input.dateKey && s.time === input.time,
        ) ?? null;

      const booking = await source.createBooking({
        slotId: slot?.id ?? `${input.dateKey}|${input.time}`,
        dateKey: input.dateKey,
        time: input.time,
        minutes: input.minutes,
        price: priceForMinutes(input.minutes),
        clientName: user?.name ?? "이용자",
        status: "pending",
        paymentStatus: "pending",
        consentListening: input.consentListening,
        consentBriefing: input.consentBriefing,
        orderId: newOrderId(),
        paymentKey: null,
      });
      setSnapshot((prev) => ({ ...prev, bookings: [...prev.bookings, booking] }));
      return booking;
    },
    [getSource, snapshot.slots, user?.name],
  );

  const updateBooking = useCallback(
    async (id: string, patch: Partial<Booking>) => {
      const source = getSource();
      await source.updateBooking(id, patch);
      setSnapshot((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      }));
    },
    [getSource],
  );

  const saveNote = useCallback(
    async (input: {
      bookingId: string;
      line1: string;
      line2: string;
      line3: string;
      nextStep: string;
    }) => {
      const source = getSource();
      const note = await source.saveNote(input);
      setSnapshot((prev) => ({
        ...prev,
        notes: [
          ...prev.notes.filter((n) => n.bookingId !== input.bookingId),
          note,
        ],
      }));
    },
    [getSource],
  );

  const signOut = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      dataReady,
      configured,
      mode,
      user,
      authLoading,
      diaries: snapshot.diaries,
      plays: snapshot.plays,
      slots: snapshot.slots,
      bookings: snapshot.bookings,
      notes: snapshot.notes,
      prefs,
      toastMessage: toastState,
      toast,
      setPrefs,
      saveDiary,
      removeDiary,
      recordPlay,
      setSlotStatus,
      createBooking,
      updateBooking,
      saveNote,
      refresh,
      signOut,
    }),
    [
      hydrated,
      dataReady,
      configured,
      mode,
      user,
      authLoading,
      snapshot,
      prefs,
      toastState,
      toast,
      setPrefs,
      saveDiary,
      removeDiary,
      recordPlay,
      setSlotStatus,
      createBooking,
      updateBooking,
      saveNote,
      refresh,
      signOut,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside <AppProvider>");
  }
  return context;
}

export { newOrderId };
