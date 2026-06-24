export function Stub({ jp, en, note }: { jp: string; en: string; note?: string }) {
  return (
    <div>
      <h1 className="text-xl font-black text-navy">{jp}</h1>
      <p className="text-sm text-slate-500">{en}</p>
      <div className="card mt-6 p-10 text-center text-slate-400">
        <p className="font-semibold">この画面は次のフェーズで実装します。</p>
        {note && <p className="mt-2 text-sm">{note}</p>}
        <p className="mt-4 text-xs">
          MVP 完了済み：認証・RBAC・データモデル・求人管理
        </p>
      </div>
    </div>
  );
}
