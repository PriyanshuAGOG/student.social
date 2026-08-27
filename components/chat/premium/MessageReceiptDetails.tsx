"use client"

import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { StandardizedMessage } from "@/lib/message-normalizer"

type MemberProfile = {
  userId: string
  name: string
  username?: string
  avatar?: string
}

function PersonRow({ profile }: { profile: MemberProfile }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#76556d]/12 text-xs font-semibold text-[#76556d] dark:text-[#d8b7cf]">
        {profile.avatar ? <Image src={profile.avatar} alt="" fill sizes="36px" unoptimized className="object-cover" /> : profile.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{profile.name}</p>
        {profile.username ? <p className="truncate text-[11px] text-muted-foreground">@{profile.username.replace(/^@/, '')}</p> : null}
      </div>
    </div>
  )
}

export function MessageReceiptDetails({
  open,
  onOpenChange,
  message,
  members,
  currentUserId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: StandardizedMessage | null
  members: MemberProfile[]
  currentUserId: string
}) {
  const recipients = members.filter((member) => member.userId !== currentUserId)
  const read = new Set(message?.readBy || [])
  const delivered = new Set(message?.deliveredBy || [])
  const seenBy = recipients.filter((member) => read.has(member.userId))
  const reached = recipients.filter((member) => !read.has(member.userId) && delivered.has(member.userId))
  const waiting = recipients.filter((member) => !read.has(member.userId) && !delivered.has(member.userId))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[1.6rem] border-border/60 bg-[#f6f0e7] p-0 dark:bg-[#262522]">
        <DialogHeader className="border-b border-border/50 px-5 py-5 text-left">
          <DialogTitle>Message journey</DialogTitle>
          <DialogDescription>Who has received and opened this message.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-5 pb-5">
          {[
            { label: 'Seen', tone: 'bg-[#76556d]', people: seenBy },
            { label: 'Reached', tone: 'bg-[#6f6a4f]', people: reached },
            { label: 'Waiting', tone: 'bg-[#a29a8e]', people: waiting },
          ].map((section) => (
            <section key={section.label} className="pt-4">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${section.tone}`} />
                <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{section.label} · {section.people.length}</h3>
              </div>
              {section.people.length > 0 ? (
                <div className="mt-1 divide-y divide-border/45">{section.people.map((profile) => <PersonRow key={profile.userId} profile={profile} />)}</div>
              ) : (
                <p className="py-3 text-xs text-muted-foreground">No one here yet.</p>
              )}
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
