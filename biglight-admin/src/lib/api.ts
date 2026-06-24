// Helpers for API route handlers: auth gate, 403 responses, and the
// row-level scoping + field sanitizing that enforce RBAC on the BACKEND.

import { NextResponse } from "next/server";
import type { Prisma, Role } from "@prisma/client";
import { getSessionUser } from "./auth";
import {
  type SessionUser,
  type Action,
  type Resource,
  can,
  canSeeCommissionForCtv,
  canSeeInternalMemo,
  JOB_INTERNAL_FIELDS,
} from "./permissions";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** Returns the session user, or null. Use in route handlers. */
export async function currentUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

/** Throwable guard: returns user or a Response you should return early. */
export async function requireUser(): Promise<
  { user: SessionUser } | { res: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { res: unauthorized() };
  return { user };
}

export function requireCan(user: SessionUser, action: Action, resource: Resource) {
  return can(user.role, action, resource);
}

// ---------------------------------------------------------------------------
// Row-level scoping: build the Prisma `where` clause for the current user so
// they only ever read rows they are allowed to see.
// ---------------------------------------------------------------------------
export function jobScopeWhere(user: SessionUser): Prisma.JobWhereInput {
  switch (user.role) {
    case "SUPER_ADMIN":
    case "BIGLIGHT_STAFF":
      return {};
    case "CTV":
      return { ctvId: user.ctvId ?? "__none__" };
    case "COMPANY":
      return { companyId: user.companyId ?? "__none__" };
    case "CANDIDATE":
      return { publicStatus: "PUBLIC" };
    default:
      return { id: "__none__" };
  }
}

export function candidateScopeWhere(user: SessionUser): Prisma.CandidateWhereInput {
  switch (user.role) {
    case "SUPER_ADMIN":
    case "BIGLIGHT_STAFF":
      return {};
    case "CTV":
      return { referralCtvId: user.ctvId ?? "__none__" };
    case "CANDIDATE":
      return { id: "__none__" }; // candidates use a dedicated /me endpoint
    default:
      return { id: "__none__" };
  }
}

export function commissionScopeWhere(
  user: SessionUser
): Prisma.CandidateCommissionWhereInput | null {
  switch (user.role) {
    case "SUPER_ADMIN":
    case "BIGLIGHT_STAFF":
      return {};
    case "CTV":
      return { ctvId: user.ctvId ?? "__none__" };
    default:
      // Company & Candidate: NEVER. Caller should 403 before querying.
      return null;
  }
}

// ---------------------------------------------------------------------------
// Field sanitizing: strip sensitive fields from a Job depending on the viewer.
// Defence in depth — even if the UI leaks, the API never returns these.
// ---------------------------------------------------------------------------
type AnyJob = Record<string, unknown> & { ctvId?: string | null };

export function sanitizeJob(user: SessionUser, job: AnyJob): AnyJob {
  const out: AnyJob = { ...job };

  // internal memos: BIGLIGHT only
  if (!canSeeInternalMemo(user.role)) {
    for (const f of JOB_INTERNAL_FIELDS) delete out[f];
  }
  // commission relation: company/candidate never; CTV only own
  if (!canSeeCommissionForCtv(user, (job.ctvId as string) ?? null)) {
    delete out["jobCommissions"];
    delete out["candidateCommissions"];
  }
  return out;
}

export function sanitizeJobs(user: SessionUser, jobs: AnyJob[]): AnyJob[] {
  return jobs.map((j) => sanitizeJob(user, j));
}

export const isBiglight = (role: Role) =>
  role === "SUPER_ADMIN" || role === "BIGLIGHT_STAFF";
