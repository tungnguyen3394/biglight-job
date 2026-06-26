// 403 — không đủ quyền truy cập (chỉ admin mới vào được).
export function Forbidden() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card max-w-sm p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-lg font-black text-navy">403 Forbidden</h1>
        <p className="mt-1 text-sm text-slate-500">このページにアクセスする権限がありません。</p>
      </div>
    </div>
  );
}
