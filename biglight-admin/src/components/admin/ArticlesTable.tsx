"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { SearchIcon, FilterIcon, SortIcon, ColumnsIcon, ExportBar, Dropdown } from "@/components/admin/toolbar";
import { requestDelete } from "@/lib/adminDelete";
import { useAutoCloseDetails } from "@/lib/useAutoCloseDetails";

const TrashIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" /></svg>;

export type ArticleRow = {
  id: string; title: string; slug: string | null; status: string; category: string | null;
  author: string | null; focusKeyword: string | null; seoScore: number; publishAt: string | null;
  createdAt: string; updatedAt: string;
};

const STATUS: Record<string, { jp: string; tone: string }> = {
  DRAFT: { jp: "下書き", tone: "amber" }, PUBLISHED: { jp: "公開", tone: "green" }, SCHEDULED: { jp: "予約", tone: "blue" },
};
const stLabel = (s: string) => STATUS[s]?.jp ?? s;
const uniq = (a: (string | null)[]) => [...new Set(a.filter((v): v is string => !!v))].sort((x, y) => x.localeCompare(y, "ja"));

type ColKey = "title" | "slug" | "category" | "focusKeyword" | "author" | "seoScore" | "status" | "publishAt" | "createdAt" | "updatedAt";
const COLUMNS: { key: ColKey; label: string; w: number; value: (r: ArticleRow) => string }[] = [
  { key: "title", label: "タイトル", w: 240, value: (r) => r.title },
  { key: "slug", label: "スラッグ", w: 160, value: (r) => r.slug || "" },
  { key: "category", label: "カテゴリ", w: 130, value: (r) => r.category || "" },
  { key: "focusKeyword", label: "キーワード", w: 150, value: (r) => r.focusKeyword || "" },
  { key: "author", label: "著者", w: 120, value: (r) => r.author || "" },
  { key: "seoScore", label: "SEO", w: 70, value: (r) => String(r.seoScore) },
  { key: "status", label: "ステータス", w: 100, value: (r) => stLabel(r.status) },
  { key: "publishAt", label: "公開予定", w: 110, value: (r) => (r.publishAt ? r.publishAt.slice(0, 10) : "") },
  { key: "createdAt", label: "作成日", w: 110, value: (r) => r.createdAt.slice(0, 10) },
  { key: "updatedAt", label: "更新日", w: 110, value: (r) => r.updatedAt.slice(0, 10) },
];
const DEFAULT_COLS: ColKey[] = ["title", "category", "focusKeyword", "seoScore", "status", "updatedAt"];

type SortField = "title" | "category" | "seoScore" | "status" | "publishAt" | "createdAt" | "updatedAt";
const jcmp = (x?: string | null, y?: string | null) => (x || "").localeCompare(y || "", "ja");
const SORT_FIELDS: { key: SortField; label: string; cmp: (a: ArticleRow, b: ArticleRow) => number }[] = [
  { key: "updatedAt", label: "更新日", cmp: (a, b) => jcmp(a.updatedAt, b.updatedAt) },
  { key: "createdAt", label: "作成日", cmp: (a, b) => jcmp(a.createdAt, b.createdAt) },
  { key: "title", label: "タイトル", cmp: (a, b) => jcmp(a.title, b.title) },
  { key: "category", label: "カテゴリ", cmp: (a, b) => jcmp(a.category, b.category) },
  { key: "seoScore", label: "SEO", cmp: (a, b) => a.seoScore - b.seoScore },
  { key: "status", label: "ステータス", cmp: (a, b) => jcmp(a.status, b.status) },
  { key: "publishAt", label: "公開予定", cmp: (a, b) => jcmp(a.publishAt, b.publishAt) },
];

export function ArticlesTable({ rows, canWrite, canRowDelete = false, canBulkDelete = false }: { rows: ArticleRow[]; canWrite: boolean; canRowDelete?: boolean; canBulkDelete?: boolean }) {
  const router = useRouter();
  useAutoCloseDetails();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [delBusy, setDelBusy] = useState(false);
  const toggleSel = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  async function delRows(ids: string[], label: string) {
    if (!ids.length || delBusy) return;
    if (!window.confirm(`${label}を削除します。元に戻せません。よろしいですか？`)) return;
    setDelBusy(true);
    const r = await requestDelete("article", ids);
    setDelBusy(false);
    if (r.ok) { setSel(new Set()); router.refresh(); } else alert(r.error);
  }
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [sort, setSort] = useState<{ key: SortField; dir: "asc" | "desc" }>({ key: "updatedAt", dir: "desc" });
  const [cols, setCols] = useState<Set<ColKey>>(() => new Set(DEFAULT_COLS));
  const visCols = COLUMNS.filter((c) => cols.has(c.key));
  const toggleCol = (k: ColKey) => setCols((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const selectAllCols = () => setCols(new Set(COLUMNS.map((c) => c.key)));
  const clearCols = () => setCols(new Set(["title"]));

  const cats = useMemo(() => uniq(rows.map((r) => r.category)), [rows]);
  const activeFilters = [fCat, fStatus].filter(Boolean).length;

  const filtered = useMemo(() => {
    const out = rows.filter((r) => {
      if (fCat && r.category !== fCat) return false;
      if (fStatus && r.status !== fStatus) return false;
      if (q && !`${r.title}${r.slug ?? ""}${r.category ?? ""}${r.focusKeyword ?? ""}${r.author ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    const cmp = SORT_FIELDS.find((s) => s.key === sort.key)!.cmp;
    out.sort((a, b) => { const r = cmp(a, b); return sort.dir === "desc" ? -r : r; });
    return out;
  }, [rows, q, fCat, fStatus, sort]);

  const getData = () => ({ headers: visCols.map((c) => c.label), rows: filtered.map((r) => visCols.map((c) => c.value(r))) });
  const allSel = filtered.length > 0 && filtered.every((r) => sel.has(r.id));
  const toggleAll = () => setSel(allSel ? new Set() : new Set(filtered.map((r) => r.id)));

  return (
    <div className="card overflow-hidden p-0">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <SearchIcon />
          <input className="input pl-9" placeholder="タイトル・カテゴリ・キーワードで検索" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <Dropdown icon={<FilterIcon />} label="絞り込み" badge={activeFilters}>
          <div><div className="mb-1 text-xs font-bold text-slate-500">カテゴリ</div><select className="input w-full" value={fCat} onChange={(e) => setFCat(e.target.value)}><option value="">すべて</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><div className="mb-1 text-xs font-bold text-slate-500">ステータス</div><select className="input w-full" value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="">すべて</option>{Object.keys(STATUS).map((s) => <option key={s} value={s}>{STATUS[s].jp}</option>)}</select></div>
          {activeFilters > 0 && <button onClick={() => { setFCat(""); setFStatus(""); }} className="text-xs font-semibold text-bl-red hover:underline">フィルターをクリア</button>}
        </Dropdown>

        <Dropdown icon={<SortIcon />} label="並び替え" width="w-56">
          <select className="input w-full" value={sort.key} onChange={(e) => setSort((p) => ({ ...p, key: e.target.value as SortField }))}>
            {SORT_FIELDS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button onClick={() => setSort((p) => ({ ...p, dir: p.dir === "asc" ? "desc" : "asc" }))} className="w-full rounded-lg bg-slate-50 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">{sort.dir === "asc" ? "昇順 ↑" : "降順 ↓"}</button>
          <button onClick={() => setSort({ key: "updatedAt", dir: "desc" })} className="mt-1 w-full text-xs font-semibold text-bl-red hover:underline">リセット</button>
        </Dropdown>

        <Dropdown icon={<ColumnsIcon />} label="表示項目" align="right" width="w-72">
          <div className="mb-1.5 flex gap-3 border-b border-slate-100 pb-1.5">
            <button onClick={selectAllCols} className="text-xs font-semibold text-bl-red hover:underline">すべて選択</button>
            <button onClick={clearCols} className="text-xs font-semibold text-slate-500 hover:underline">クリア</button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {COLUMNS.map((c) => (
              <label key={c.key} className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                <input type="checkbox" checked={cols.has(c.key)} disabled={c.key === "title"} onChange={() => toggleCol(c.key)} />{c.label}
              </label>
            ))}
          </div>
        </Dropdown>

        <div className="ml-auto flex items-center gap-1.5">
          {canBulkDelete && sel.size > 0 && <button onClick={() => delRows([...sel], `選択した${sel.size}件`)} disabled={delBusy} className="btn btn-sm gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40"><TrashIcon />選択削除（{sel.size}）</button>}
          <ExportBar compact filename="記事一覧" title="記事一覧" getData={getData} />
          <span className="text-sm text-slate-500">{filtered.length} 件</span>
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">該当する記事がありません。</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold text-slate-500">
                {canBulkDelete && <th className="w-10 px-3 py-2.5"><input type="checkbox" checked={allSel} onChange={toggleAll} title="全選択" /></th>}
                {visCols.map((c) => <th key={c.key} className="px-3 py-2.5" style={{ minWidth: c.w }}>{c.label}</th>)}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  {canBulkDelete && <td className="px-3 py-2.5"><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggleSel(r.id)} /></td>}
                  {visCols.map((c) => (
                    <td key={c.key} className="px-3 py-2.5 align-top">
                      {c.key === "title" ? (
                        <div><Link href={`/admin/articles/${r.id}`} className="font-semibold text-navy hover:underline">{r.title}</Link>{r.slug && <div className="text-xs text-slate-400">/{r.slug}</div>}</div>
                      ) : c.key === "status" ? (
                        <Badge tone={(STATUS[r.status]?.tone ?? "amber") as never}>{stLabel(r.status)}</Badge>
                      ) : c.key === "seoScore" ? (
                        <span className={`font-bold ${r.seoScore >= 80 ? "text-emerald-600" : r.seoScore >= 50 ? "text-amber-600" : "text-red-600"}`}>{r.seoScore}</span>
                      ) : (
                        <span className="block max-w-[260px] truncate text-slate-600" title={c.value(r)}>{c.value(r) || <span className="text-slate-300">—</span>}</span>
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link href={`/admin/articles/${r.id}`} className="text-xs font-semibold text-brand-blue hover:underline">{canWrite ? "編集" : "表示"}</Link>
                      {canRowDelete && <button onClick={() => delRows([r.id], `「${r.title}」`)} disabled={delBusy} title="削除" className="rounded-lg border border-red-200 p-1 text-red-600 hover:bg-red-50 disabled:opacity-40"><TrashIcon /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
