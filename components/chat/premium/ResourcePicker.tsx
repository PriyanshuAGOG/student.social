"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, FileText, FolderSearch2, Search, Send, X } from "lucide-react";
import { resourceService } from "@/lib/appwrite";

export interface ShareableResource {
  $id: string;
  title?: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  description?: string;
  tags?: string[];
  visibility?: string;
}

interface ResourcePickerProps {
  onClose: () => void;
  onSelect: (resource: ShareableResource) => Promise<void>;
}

export function ResourcePicker({ onClose, onSelect }: ResourcePickerProps) {
  const [resources, setResources] = useState<ShareableResource[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState("");

  useEffect(() => {
    let active = true;
    resourceService.getResources({}, 100).then((result) => {
      if (active) setResources(Array.isArray(result.documents) ? result.documents : []);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return resources;
    return resources.filter((resource) => [resource.title, resource.fileName, resource.description, ...(resource.tags || [])].some((value) => String(value || "").toLowerCase().includes(normalized)));
  }, [query, resources]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Share from Resource Vault">
      <div className="w-full max-w-xl overflow-hidden rounded-t-[30px] border border-border/60 bg-card shadow-2xl sm:rounded-[30px]">
        <header className="flex items-start justify-between border-b border-border/50 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em]">Share from Vault</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">The recipient receives the same permission-aware resource, not a duplicate upload.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close Resource Vault"><X className="h-4 w-4" /></button>
        </header>
        <div className="p-4 sm:p-5">
          <label className="flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 focus-within:border-primary/45 focus-within:ring-2 focus-within:ring-primary/10">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes, files, tags…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </label>
          <div className="mt-3 max-h-[56dvh] space-y-1 overflow-y-auto rounded-2xl border border-border/50 bg-background p-1.5 sm:max-h-96">
            {loading ? (
              <div className="grid min-h-48 place-items-center text-sm text-muted-foreground">Opening your Vault…</div>
            ) : filtered.length === 0 ? (
              <div className="grid min-h-48 place-items-center px-8 text-center">
                <span><FolderSearch2 className="mx-auto h-7 w-7 text-muted-foreground" /><span className="mt-3 block text-sm font-medium">No matching resources</span><span className="mt-1 block text-xs text-muted-foreground">Upload it to the Vault first, then call it into any conversation.</span></span>
              </div>
            ) : filtered.map((resource) => {
              const title = resource.title || resource.fileName || "Untitled resource";
              return (
                <button
                  key={resource.$id}
                  type="button"
                  disabled={Boolean(sharingId)}
                  onClick={async () => {
                    setSharingId(resource.$id);
                    try { await onSelect(resource); } finally { setSharingId(""); }
                  }}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-muted disabled:opacity-50"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#6f6a4f]/12 text-[#6f6a4f] dark:text-[#c9c39e]">{resource.fileType?.includes("pdf") ? <BookOpen className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{resource.fileType || "Resource"} · {resource.visibility || "shared"}</span></span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground"><Send className="h-3.5 w-3.5" /></span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
