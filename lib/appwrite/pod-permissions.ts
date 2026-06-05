import type { PodRole } from "./pod-types"

const roleRank: Record<PodRole, number> = {
  guest: 0,
  member: 1,
  moderator: 2,
  mentor: 3,
  owner: 4,
}

export function canManagePod(role?: PodRole | string) {
  return role === "owner"
}

export function canManageLearning(role?: PodRole | string) {
  return role === "owner" || role === "mentor" || role === "moderator"
}

export function canModerateChat(role?: PodRole | string) {
  return role === "owner" || role === "mentor" || role === "moderator"
}

export function canPostAnnouncement(role?: PodRole | string) {
  return role === "owner" || role === "mentor" || role === "moderator"
}

export function canInviteMembers(role?: PodRole | string) {
  return role === "owner" || role === "mentor" || role === "moderator"
}

export function assertPodRole(role: PodRole | string | undefined, allowedRoles: PodRole[]) {
  if (!role || !allowedRoles.includes(role as PodRole)) {
    throw new Error("You do not have permission to perform this action.")
  }
}

export function canChangeRole(actorRole: PodRole, targetRole: PodRole) {
  return roleRank[actorRole] > roleRank[targetRole] && actorRole === "owner"
}
