// ----------------------------------------------------------------------------
// RBAC — the single source of truth for "who can do/see what".
// Backend (API routes) MUST call these helpers. Never rely on the UI alone.
// ----------------------------------------------------------------------------

import type { Role } from "@prisma/client";

export type Resource =
  | "job"
  | "candidate"
  | "application"
  | "company"
  | "ctv"
  | "commission"
  | "user"
  | "dashboard"
  | "settings";

export type Action = "view" | "create" | "update" | "delete";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string | null;
  ctvId: string | null;
}

// Coarse-grained capability matrix. Returns whether a role *may* perform an
// action on a resource type at all (row-level scoping is applied separately).
const MATRIX: Record<Role, Partial<Record<Resource, Action[]>>> = {
  SUPER_ADMIN: {
    job: ["view", "create", "update", "delete"],
    candidate: ["view", "create", "update", "delete"],
    application: ["view", "create", "update", "delete"],
    company: ["view", "create", "update", "delete"],
    ctv: ["view", "create", "update", "delete"],
    commission: ["view", "create", "update", "delete"],
    user: ["view", "create", "update", "delete"],
    dashboard: ["view"],
    settings: ["view", "update"],
  },
  // Manager: quản lý 求人 (job)・ứng viên (candidate)・bài viết・tin nhắn — không quản lý User/設定 ở mức cao.
  MANAGER: {
    job: ["view", "create", "update", "delete"],
    candidate: ["view", "create", "update", "delete"],
    application: ["view", "create", "update", "delete"],
    company: ["view", "create", "update"],
    ctv: ["view", "create", "update"],
    commission: ["view", "create", "update"],
    user: [],
    dashboard: ["view"],
    settings: ["view"],
  },
  BIGLIGHT_STAFF: {
    job: ["view", "create", "update", "delete"],
    candidate: ["view", "create", "update", "delete"],
    application: ["view", "create", "update", "delete"],
    company: ["view", "create", "update"],
    ctv: ["view", "create", "update"],
    commission: ["view", "create", "update"],
    user: [],
    dashboard: ["view"],
    settings: ["view"],
  },
  CTV: {
    job: ["view"], // only assigned jobs (scoped)
    candidate: ["view", "create", "update"], // only own referrals (scoped); no delete
    application: ["view"], // only own referrals
    company: [],
    ctv: ["view"], // only self
    commission: ["view"], // only own cases
    dashboard: ["view"],
  },
  COMPANY: {
    job: ["view", "update"], // own jobs; edits go to 承認待ち
    candidate: [], // can see counts/pipeline, not full PII (handled by scope+sanitize)
    application: ["view"], // own jobs' applications
    company: ["view", "update"], // own company
    dashboard: ["view"],
  },
  CANDIDATE: {
    job: ["view"], // public only
    candidate: ["view", "update"], // own profile
    application: ["view", "create"], // own applications
    dashboard: ["view"],
  },
};

export function can(role: Role, action: Action, resource: Resource): boolean {
  return MATRIX[role]?.[resource]?.includes(action) ?? false;
}

// ---- Field-level visibility ----
// Commission data is sensitive. Company & Candidate must NEVER receive it.
export function canSeeCommission(role: Role): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGER" || role === "BIGLIGHT_STAFF" || role === "CTV";
}

// CTV only sees commission for cases assigned to them (own).
export function canSeeCommissionForCtv(user: SessionUser, jobCtvId: string | null): boolean {
  if (user.role === "SUPER_ADMIN" || user.role === "MANAGER" || user.role === "BIGLIGHT_STAFF") return true;
  if (user.role === "CTV") return !!jobCtvId && jobCtvId === user.ctvId;
  return false;
}

// Internal memos / company-negotiation / risk notes are BIGLIGHT-only.
export function canSeeInternalMemo(role: Role): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGER" || role === "BIGLIGHT_STAFF";
}

export function canManageUsers(role: Role): boolean {
  return role === "SUPER_ADMIN";
}

// Sensitive field names that must be stripped from a Job before sending to a
// Company or Candidate (defence in depth — backend strips, not just the UI).
export const JOB_INTERNAL_FIELDS = ["internalMemo", "companyHistory", "riskNotes"] as const;
