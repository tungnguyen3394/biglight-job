// Logo mặt cười BIGLIGHT (khôi phục từ thiết kế gốc worker.html).
export default function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`rounded-[26%] border border-bl-line bg-white ${className}`}
      role="img"
      aria-label="BIGLIGHT JOB"
    >
      <circle cx="47" cy="52" r="5" fill="#D02E26" />
      <path d="M66 52 A8 6 0 0 1 80 52" fill="none" stroke="#D02E26" strokeWidth="6" strokeLinecap="round" />
      <path d="M42 66 A22 22 0 0 0 78 66" fill="none" stroke="#D02E26" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
