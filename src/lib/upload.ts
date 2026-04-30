// Image uploader: posts multipart to PHP /api/upload/image, falls back to base64 data URL in mock mode.
import { getAuthToken, getTenantId, useMockApi } from "./api/client";

const API_BASE = (import.meta.env.VITE_PHP_API_BASE as string | undefined)?.replace(/\/$/, "") || "";

export interface UploadResult {
  url: string;
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

/** Compress an image client-side (max 1280px wide, 0.85 jpeg) before upload. */
async function compress(file: File, maxW = 1280): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxW / bitmap.width);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.85),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!file) throw new Error("No file");
  if (file.size > 8 * 1024 * 1024) throw new Error("Image too large (max 8 MB)");

  const blob = await compress(file);

  // Mock mode: store as data URL — works in preview without backend.
  if (useMockApi()) {
    const tmp = new File([blob], file.name, { type: blob.type || file.type });
    return { url: await fileToDataUrl(tmp) };
  }

  const fd = new FormData();
  fd.append("file", blob, file.name);
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  const tenant = getTenantId();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (tenant) headers["X-Tenant-Id"] = tenant;

  const res = await fetch(`${API_BASE}/api/upload/image`, { method: "POST", headers, body: fd });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${msg}`);
  }
  const data = (await res.json()) as { url: string };
  // Make returned relative URL absolute when API_BASE is set
  const url = data.url.startsWith("http") ? data.url : `${API_BASE}${data.url}`;
  return { url };
}
