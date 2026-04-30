import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { uploadImage } from "@/lib/upload";

interface Props {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  className?: string;
  label?: string;
  /** aspect like "square" | "video" | "wide" */
  aspect?: "square" | "video" | "wide";
}

export function ImageUploader({ value, onChange, className = "", label = "Upload image", aspect = "square" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectClass = aspect === "video" ? "aspect-video" : aspect === "wide" ? "aspect-[3/1]" : "aspect-square";

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0] ?? undefined)}
      />
      <div
        onClick={() => ref.current?.click()}
        className={`relative ${aspectClass} w-full rounded-xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/60 cursor-pointer overflow-hidden flex items-center justify-center transition-colors`}
      >
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute top-2 end-2 size-7 rounded-full bg-foreground/70 text-background flex items-center justify-center hover:bg-foreground"
              aria-label="Remove"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <div className="text-center text-muted-foreground p-4">
            {busy ? <Loader2 className="size-6 mx-auto animate-spin" /> : <Upload className="size-6 mx-auto" />}
            <p className="text-xs font-medium mt-2">{busy ? "Uploading…" : label}</p>
            <p className="text-[10px] mt-1">JPG, PNG, WEBP · max 5 MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}
