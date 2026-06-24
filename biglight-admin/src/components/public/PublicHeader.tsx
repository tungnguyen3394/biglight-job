import Link from "next/link";

// Header dùng chung cho các trang công khai (không cần đăng nhập).
export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-lg font-black text-white">
            B
          </span>
          <span className="text-lg font-black text-navy">BIGLIGHT Job</span>
        </Link>
        <Link href="/login" className="btn btn-ghost">
          管理ログイン
        </Link>
      </div>
    </header>
  );
}
