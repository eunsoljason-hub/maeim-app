/**
 * 마음기록의 멀티미디어 저장소.
 *
 * - 사진·영상·음성 원본은 IndexedDB(`inyou-media`)에 Blob으로 넣는다.
 * - localStorage에는 메타데이터와 작은 썸네일(수십 KB)만 넣어 용량 초과를 피한다.
 * - IndexedDB를 쓸 수 없는 브라우저에서는 작은 파일만 data URL로 대신 보관한다.
 */
export interface DiaryLink {
  id: string;
  url: string;
  label: string;
}

export interface DiaryMediaMeta {
  id: string;
  kind: "image" | "video" | "audio";
  name: string;
  mime: string;
  size: number;
  /** 목록에 보여줄 작은 미리보기 (JPEG data URL). */
  thumb?: string;
  /** 음성·영상 길이(초). */
  duration?: number;
  /** IndexedDB를 못 쓸 때만 채워지는 작은 원본. */
  dataUrl?: string;
}

export interface DiaryExtras {
  links: DiaryLink[];
  media: DiaryMediaMeta[];
}

export const EMPTY_EXTRAS: DiaryExtras = { links: [], media: [] };

const EXTRAS_KEY = "maeum.diary.extras.v1";
const DB_NAME = "inyou-media";
const STORE = "blobs";
const DB_VERSION = 1;

export const MAX_MEDIA_PER_ENTRY = 6;
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
/** IndexedDB를 못 쓰는 환경에서 localStorage에 직접 넣을 수 있는 최대 크기. */
const INLINE_LIMIT = 320 * 1024;

export function newLocalId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------- IndexedDB ------------------------------- */

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

export async function putMediaBlob(id: string, blob: Blob): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function getMediaBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(id);
      request.onsuccess = () => resolve((request.result as Blob) ?? null);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function deleteMediaBlob(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
  } catch {
    /* ignore */
  }
}

/* ------------------------------ 썸네일 만들기 ------------------------------ */

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("파일을 읽지 못했어요"));
    reader.readAsDataURL(file);
  });
}

async function imageThumb(blob: Blob): Promise<string | undefined> {
  try {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("이미지를 열지 못했어요"));
    });
    const max = 360;
    const scale = Math.min(1, max / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.62);
    URL.revokeObjectURL(url);
    return dataUrl;
  } catch {
    return undefined;
  }
}

async function videoMeta(
  blob: Blob,
): Promise<{ thumb?: string; duration?: number }> {
  try {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("영상을 열지 못했어요"));
      window.setTimeout(() => reject(new Error("시간 초과")), 8000);
    });
    const duration = Number.isFinite(video.duration) ? video.duration : undefined;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      try {
        video.currentTime = Math.min(0.2, (duration ?? 1) / 2);
      } catch {
        resolve();
      }
      window.setTimeout(resolve, 2500);
    });
    const max = 360;
    const scale = Math.min(1, max / Math.max(video.videoWidth || max, video.videoHeight || max));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((video.videoWidth || max) * scale));
    canvas.height = Math.max(1, Math.round((video.videoHeight || max) * scale));
    const ctx = canvas.getContext("2d");
    let thumb: string | undefined;
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      thumb = canvas.toDataURL("image/jpeg", 0.6);
    }
    URL.revokeObjectURL(url);
    return { thumb, duration };
  } catch {
    return {};
  }
}

/* ----------------------------- 파일 → 메타데이터 ----------------------------- */

export async function prepareMediaFile(
  file: File,
): Promise<{ meta: DiaryMediaMeta; blob: Blob | null }> {
  const kind: DiaryMediaMeta["kind"] = file.type.startsWith("video/")
    ? "video"
    : file.type.startsWith("audio/")
      ? "audio"
      : "image";
  const limit =
    kind === "video" ? MAX_VIDEO_BYTES : kind === "image" ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  if (file.size > limit) {
    throw new Error(
      kind === "video"
        ? "영상은 60MB까지 붙일 수 있어요. 조금 짧게 잘라서 다시 시도해 주세요."
        : "파일이 너무 커요. 12MB 이하로 다시 시도해 주세요.",
    );
  }

  const id = newLocalId("media");
  const meta: DiaryMediaMeta = {
    id,
    kind,
    name: file.name || (kind === "image" ? "사진" : "영상"),
    mime: file.type || "application/octet-stream",
    size: file.size,
  };

  if (kind === "image") {
    meta.thumb = await imageThumb(file);
  } else if (kind === "video") {
    const extra = await videoMeta(file);
    meta.thumb = extra.thumb;
    meta.duration = extra.duration;
  } else {
    meta.duration = await audioDuration(file);
  }

  const stored = await putMediaBlob(id, file);
  if (stored) return { meta, blob: null };

  /* IndexedDB가 막힌 브라우저: 아주 작은 파일만 data URL로 보관한다. */
  if (file.size <= INLINE_LIMIT) {
    meta.dataUrl = await readAsDataUrl(file);
    return { meta, blob: null };
  }
  throw new Error("이 브라우저에서는 첨부 파일을 저장할 수 없어요. 사진은 작은 파일로 시도해 주세요.");
}

export async function prepareAudioBlob(
  blob: Blob,
  duration: number,
): Promise<DiaryMediaMeta> {
  const id = newLocalId("voice");
  const meta: DiaryMediaMeta = {
    id,
    kind: "audio",
    name: `음성 기록 ${Math.round(duration)}초`,
    mime: blob.type || "audio/webm",
    size: blob.size,
    duration,
  };
  const stored = await putMediaBlob(id, blob);
  if (!stored) {
    if (blob.size <= INLINE_LIMIT) meta.dataUrl = await readAsDataUrl(blob);
    else throw new Error("이 브라우저에서는 녹음을 저장할 수 없어요.");
  }
  return meta;
}

function audioDuration(blob: Blob): Promise<number | undefined> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(blob);
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.src = url;
      audio.onloadedmetadata = () => {
        const value = Number.isFinite(audio.duration) ? audio.duration : undefined;
        URL.revokeObjectURL(url);
        resolve(value);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };
      window.setTimeout(() => resolve(undefined), 4000);
    } catch {
      resolve(undefined);
    }
  });
}

/** 저장된 원본을 재생·다운로드용 URL로 돌려준다. */
export async function mediaObjectUrl(meta: DiaryMediaMeta): Promise<string | null> {
  if (meta.dataUrl) return meta.dataUrl;
  const blob = await getMediaBlob(meta.id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/* --------------------------- 마음기록 부가 정보 저장 --------------------------- */

type ExtrasMap = Record<string, DiaryExtras>;

function readMap(): ExtrasMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(EXTRAS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ExtrasMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function loadExtrasMap(): ExtrasMap {
  return readMap();
}

export function loadDiaryExtras(id: string): DiaryExtras {
  const found = readMap()[id];
  if (!found) return { links: [], media: [] };
  return {
    links: Array.isArray(found.links) ? found.links : [],
    media: Array.isArray(found.media) ? found.media : [],
  };
}

export function saveDiaryExtras(id: string, extras: DiaryExtras): boolean {
  if (typeof window === "undefined") return false;
  const map = readMap();
  if (!extras.links.length && !extras.media.length) {
    delete map[id];
  } else {
    map[id] = extras;
  }
  try {
    window.localStorage.setItem(EXTRAS_KEY, JSON.stringify(map));
    return true;
  } catch {
    /* 용량 초과: 썸네일을 먼저 버려서 본문·링크는 반드시 남긴다. */
    try {
      const lean: ExtrasMap = {};
      for (const [key, value] of Object.entries(map)) {
        lean[key] = {
          links: value.links,
          media: value.media.map((item) => ({ ...item, thumb: undefined })),
        };
      }
      window.localStorage.setItem(EXTRAS_KEY, JSON.stringify(lean));
      return false;
    } catch {
      return false;
    }
  }
}

export function removeDiaryExtras(id: string): void {
  if (typeof window === "undefined") return;
  const map = readMap();
  const extras = map[id];
  if (extras) {
    for (const item of extras.media) void deleteMediaBlob(item.id);
  }
  if (!(id in map)) return;
  delete map[id];
  try {
    window.localStorage.setItem(EXTRAS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
