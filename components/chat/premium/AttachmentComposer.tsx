"use client";

import { useEffect, useState } from "react";
import { Crop, FileText, RotateCw, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CropMode = "original" | "square" | "portrait" | "landscape";

interface AttachmentComposerProps {
  file: File;
  isSending?: boolean;
  onCancel: () => void;
  onSend: (file: File, caption: string) => Promise<boolean | void>;
}

const CROP_OPTIONS: Array<{ value: CropMode; label: string; ratio?: number }> = [
  { value: "original", label: "Original" },
  { value: "square", label: "Square", ratio: 1 },
  { value: "portrait", label: "4:5", ratio: 4 / 5 },
  { value: "landscape", label: "16:9", ratio: 16 / 9 },
];

function fileExtension(name: string): string {
  const match = name.match(/(\.[a-z0-9]{1,8})$/i);
  return match?.[1] || "";
}

function safeFileName(input: string, original: string): string {
  const extension = fileExtension(original);
  const clean = input.replace(/[\r\n\\/]/g, "-").trim().slice(0, 170);
  if (!clean) return original;
  return fileExtension(clean) || !extension ? clean : `${clean}${extension}`;
}

async function renderImageEdit(file: File, name: string, cropMode: CropMode, rotation: number): Promise<File> {
  if (!file.type.startsWith("image/") || (cropMode === "original" && rotation % 360 === 0)) {
    return new File([file], name, { type: file.type, lastModified: file.lastModified });
  }

  const bitmap = await createImageBitmap(file);
  const crop = CROP_OPTIONS.find((option) => option.value === cropMode);
  let sourceWidth = bitmap.width;
  let sourceHeight = bitmap.height;
  let sourceX = 0;
  let sourceY = 0;

  if (crop?.ratio) {
    const sourceRatio = bitmap.width / bitmap.height;
    if (sourceRatio > crop.ratio) {
      sourceWidth = bitmap.height * crop.ratio;
      sourceX = (bitmap.width - sourceWidth) / 2;
    } else {
      sourceHeight = bitmap.width / crop.ratio;
      sourceY = (bitmap.height - sourceHeight) / 2;
    }
  }

  const maxSide = 2048;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
  const drawHeight = Math.max(1, Math.round(sourceHeight * scale));
  const sideways = Math.abs(rotation % 180) === 90;
  const canvas = document.createElement("canvas");
  canvas.width = sideways ? drawHeight : drawWidth;
  canvas.height = sideways ? drawWidth : drawHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image editing is unavailable in this browser");

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  bitmap.close();

  const outputType = ["image/jpeg", "image/png", "image/webp"].includes(file.type) ? file.type : "image/png";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not prepare the edited image")), outputType, 0.9);
  });
  return new File([blob], name, { type: outputType, lastModified: Date.now() });
}

export function AttachmentComposer({ file, isSending = false, onCancel, onSend }: AttachmentComposerProps) {
  const [caption, setCaption] = useState("");
  const [name, setName] = useState(file.name);
  const [cropMode, setCropMode] = useState<CropMode>("original");
  const [rotation, setRotation] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  const submit = async () => {
    setIsPreparing(true);
    setError("");
    try {
      const finalName = safeFileName(name, file.name);
      const prepared = await renderImageEdit(file, finalName, cropMode, rotation);
      await onSend(prepared, caption.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not prepare this attachment");
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Prepare attachment">
      <div className="w-full max-w-xl overflow-hidden rounded-t-[30px] border border-border/60 bg-card shadow-2xl sm:rounded-[30px]">
        <header className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em]">Prepare attachment</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Review what the conversation will receive.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={isSending || isPreparing} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50" aria-label="Cancel attachment"><X className="h-4 w-4" /></button>
        </header>

        <div className="max-h-[72dvh] overflow-y-auto p-4 sm:p-5">
          {isImage ? (
            <div className={cn("grid min-h-64 place-items-center overflow-hidden rounded-2xl bg-[#1f211f]", cropMode === "square" && "aspect-square", cropMode === "portrait" && "aspect-[4/5]", cropMode === "landscape" && "aspect-video")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Attachment preview" className="max-h-[48dvh] max-w-full object-contain transition-transform duration-200" style={{ transform: `rotate(${rotation}deg)` }} />
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/35 px-6 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-background text-primary shadow-sm"><FileText className="h-6 w-6" /></span>
              <p className="mt-4 max-w-full truncate text-sm font-medium">{file.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{file.type || "File"} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}

          {isImage ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><Crop className="h-3.5 w-3.5" /> Crop</span>
              {CROP_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => setCropMode(option.value)} className={cn("rounded-full border px-3 py-1.5 text-xs transition", cropMode === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted")}>{option.label}</button>
              ))}
              <button type="button" onClick={() => setRotation((value) => (value + 90) % 360)} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"><RotateCw className="h-3.5 w-3.5" /> Rotate</button>
            </div>
          ) : null}

          <label className="mt-4 block text-xs font-medium text-muted-foreground">
            File name
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={180} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10" />
          </label>
          <label className="mt-3 block text-xs font-medium text-muted-foreground">
            Caption <span className="font-normal opacity-70">(optional)</span>
            <textarea value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 1000))} placeholder="Add context for this attachment…" rows={3} className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10" />
          </label>
          {error ? <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">{error}</p> : null}
        </div>

        <footer className="flex items-center justify-between border-t border-border/50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-4">
          <span className="text-xs text-muted-foreground">{caption.length}/1000</span>
          <button type="button" onClick={submit} disabled={isSending || isPreparing || !name.trim()} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"><Send className="h-4 w-4" /> {isSending || isPreparing ? "Preparing…" : "Send"}</button>
        </footer>
      </div>
    </div>
  );
}
