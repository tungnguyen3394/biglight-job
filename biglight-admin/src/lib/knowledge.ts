import { promises as fs } from "fs";
import path from "path";

// AI Knowledge — quản lý tài liệu .md/.txt (frontmatter tự mô tả). KHÔNG dùng DB, KHÔNG đụng AI hiện tại.
// Lưu ở thư mục KNOWLEDGE_DIR (mặc định <cwd>/knowledge). ⚠ Để giữ qua rebuild, mount volume vào path này.
export const KNOWLEDGE_DIR = process.env.KNOWLEDGE_DIR || path.join(process.cwd(), "knowledge");

export const DOC_TYPES = ["Handbook", "Tokutei", "Visa", "FAQ", "Company", "Job", "Sales", "Interview", "Magazine", "Blog", "Rule", "Other"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export type KnowledgeMeta = {
  file: string;      // tên file trên đĩa (định danh)
  name: string;
  type: string;
  version: string;
  updatedAt: string; // YYYY-MM-DD
  status: "ON" | "OFF";
  size: number;      // bytes
  order: number;     // thứ tự hiển thị trong cùng 種類 (nhỏ = trước)
};

// Chặn path traversal: chỉ nhận tên file thuần .md/.txt trong KNOWLEDGE_DIR.
export function safeName(input: string): string {
  const base = path.basename(input || "").replace(/[^\w.\-一-龯ぁ-んァ-ヶー]/g, "_").slice(0, 100);
  if (!/\.(md|txt)$/i.test(base)) return `${base}.md`;
  return base;
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) { const i = line.indexOf(":"); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  return { meta, body: m[2] };
}

function buildFile(meta: { name: string; type: string; version: string; order: number | string; updatedAt: string; status: string }, body: string): string {
  return `---\nname: ${meta.name}\ntype: ${meta.type}\nversion: ${meta.version}\norder: ${meta.order}\nupdatedAt: ${meta.updatedAt}\nstatus: ${meta.status}\n---\n${body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")}`;
}

async function ensureDir() { await fs.mkdir(KNOWLEDGE_DIR, { recursive: true }); }
const today = () => new Date().toISOString().slice(0, 10);

export async function listDocs(): Promise<KnowledgeMeta[]> {
  await ensureDir();
  const files = (await fs.readdir(KNOWLEDGE_DIR)).filter((f) => /\.(md|txt)$/i.test(f));
  const out: KnowledgeMeta[] = [];
  for (const file of files) {
    const full = path.join(KNOWLEDGE_DIR, file);
    const [stat, raw] = await Promise.all([fs.stat(full), fs.readFile(full, "utf8")]);
    const { meta } = parseFrontmatter(raw);
    out.push({
      file,
      name: meta.name || file.replace(/\.(md|txt)$/i, ""),
      type: meta.type || "Other",
      version: meta.version || "1.0",
      updatedAt: meta.updatedAt || stat.mtime.toISOString().slice(0, 10),
      status: meta.status === "OFF" ? "OFF" : "ON",
      size: stat.size,
      order: Number(meta.order) || 9999,
    });
  }
  return out.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "ja"));
}

export async function saveDoc(input: { file: string; name: string; type: string; version: string; content: string; status?: "ON" | "OFF"; order?: number }): Promise<KnowledgeMeta> {
  await ensureDir();
  const file = safeName(input.file);
  const meta = { name: input.name || file.replace(/\.(md|txt)$/i, ""), type: input.type || "Other", version: input.version || "1.0", order: input.order ?? 9999, updatedAt: today(), status: input.status || "ON" };
  await fs.writeFile(path.join(KNOWLEDGE_DIR, file), buildFile(meta, input.content ?? ""), "utf8");
  const stat = await fs.stat(path.join(KNOWLEDGE_DIR, file));
  return { file, ...meta, status: meta.status as "ON" | "OFF", size: stat.size };
}

// Cập nhật metadata (giữ nguyên các trường khác + nội dung).
async function updateMeta(file: string, patch: Partial<{ name: string; type: string; version: string; order: number; updatedAt: string; status: string }>): Promise<void> {
  const full = path.join(KNOWLEDGE_DIR, safeName(file));
  const { meta, body } = parseFrontmatter(await fs.readFile(full, "utf8"));
  const merged = {
    name: patch.name ?? meta.name ?? safeName(file),
    type: patch.type ?? meta.type ?? "Other",
    version: patch.version ?? meta.version ?? "1.0",
    order: patch.order ?? (Number(meta.order) || 9999),
    updatedAt: patch.updatedAt ?? meta.updatedAt ?? today(),
    status: patch.status ?? (meta.status === "OFF" ? "OFF" : "ON"),
  };
  await fs.writeFile(full, buildFile(merged, body), "utf8");
}

export async function setStatus(file: string, status: "ON" | "OFF"): Promise<void> { await updateMeta(file, { status }); }
export async function setOrder(file: string, order: number): Promise<void> { await updateMeta(file, { order }); }

export async function removeDoc(file: string): Promise<void> {
  await fs.unlink(path.join(KNOWLEDGE_DIR, safeName(file)));
}

export async function readRaw(file: string): Promise<string> {
  return fs.readFile(path.join(KNOWLEDGE_DIR, safeName(file)), "utf8");
}

// Ghép nội dung các tài liệu ĐANG ON để AI tham chiếu. Có giới hạn ký tự (tránh vỡ token).
const KNOWLEDGE_MAX = Number(process.env.KNOWLEDGE_MAX_CHARS || 24000);
export async function buildKnowledgeContext(maxChars = KNOWLEDGE_MAX): Promise<string> {
  try {
    const docs = (await listDocs()).filter((d) => d.status === "ON");
    if (!docs.length) return "";
    const parts: string[] = [];
    let used = 0;
    for (const d of docs) {
      const raw = await readRaw(d.file).catch(() => "");
      const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim(); // bỏ frontmatter
      if (!body) continue;
      let chunk = `【${d.type}】${d.name}（v${d.version}）\n${body}`;
      if (used + chunk.length > maxChars) {
        const remain = maxChars - used;
        if (remain < 300) break;
        chunk = chunk.slice(0, remain) + "\n…(省略)";
        parts.push(chunk);
        break;
      }
      parts.push(chunk); used += chunk.length;
    }
    if (!parts.length) return "";
    return "BIGLIGHT 参考資料（社内ナレッジ）:\n"
      + "※求人・給与・条件は必ず「DANH SÁCH求人」を優先。下記は制度・手続き・会社情報などの一般説明に使う。資料にない事実は作らない。\n\n"
      + parts.join("\n\n---\n\n");
  } catch { return ""; }
}
