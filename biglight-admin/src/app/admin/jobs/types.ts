// Kiểu dữ liệu + helper dùng chung cho trang 求人管理 (admin jobs).

export type JobRow = {
  id: string;
  code: string;
  title: string;
  jobType: string | null;
  company: string | null;
  location: string;
  city: string | null;
  recruitCount: number;
  recruitMale: number;
  recruitFemale: number;
  salaryMin: number | null;
  salaryMax: number | null;
  dormitory: boolean;
  nightShift: boolean;
  shiftWork: boolean;
  publicStatus: string;
  opStatus: string;
  industry: string;
  staff: string | null;
  commission: number | null;
  updatedAt: string; // ISO
};

export type SortKey = "code" | "title" | "company" | "location" | "recruitCount" | "salary" | "updatedAt";
export type SortDir = "asc" | "desc";

export type Filters = {
  industry: string;
  publicStatus: string;
  dorm: string; // "" | "1" | "0"
  night: string; // "" | "1" | "0"
  location: string;
  staff: string;
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_FILTERS: Filters = {
  industry: "", publicStatus: "", dorm: "", night: "", location: "", staff: "", dateFrom: "", dateTo: "",
};

export function activeFilterCount(f: Filters): number {
  return Object.values(f).filter((v) => v !== "").length;
}

export function formatSalary(min: number | null, max: number | null): string {
  const y = (n: number) => "¥" + n.toLocaleString("ja-JP");
  if (min && max) return `${y(min)}〜${y(max)}`;
  if (min) return `${y(min)}〜`;
  if (max) return `〜${y(max)}`;
  return "—";
}

export function salaryValue(r: JobRow): number {
  return r.salaryMin ?? r.salaryMax ?? 0;
}
