const TONES: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-slate-100 text-slate-600",
  navy: "bg-navy/10 text-navy",
};

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
}) {
  return <span className={`badge ${TONES[tone]}`}>{children}</span>;
}

// map common statuses to a tone
export function publicStatusTone(s: string) {
  return (
    { PUBLIC: "green", PRIVATE: "gray", DRAFT: "amber", SUSPENDED: "red", PENDING_APPROVAL: "blue" } as Record<string, keyof typeof TONES>
  )[s] || "gray";
}
export function paymentStatusTone(s: string) {
  return (
    { PAID: "green", SCHEDULED: "blue", ACCRUED: "amber", NOT_YET: "gray", ON_HOLD: "amber", CANCELLED: "red", REFUND: "red" } as Record<string, keyof typeof TONES>
  )[s] || "gray";
}
