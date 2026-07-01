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

function buildFile(meta: { name: string; type: string; version: string; updatedAt: string; status: string }, body: string): string {
  return `---\nname: ${meta.name}\ntype: ${meta.type}\nversion: ${meta.version}\nupdatedAt: ${meta.updatedAt}\nstatus: ${meta.status}\n---\n${body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")}`;
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
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

export async function saveDoc(input: { file: string; name: string; type: string; version: string; content: string; status?: "ON" | "OFF" }): Promise<KnowledgeMeta> {
  await ensureDir();
  const file = safeName(input.file);
  const meta = { name: input.name || file.replace(/\.(md|txt)$/i, ""), type: input.type || "Other", version: input.version || "1.0", updatedAt: today(), status: input.status || "ON" };
  await fs.writeFile(path.join(KNOWLEDGE_DIR, file), buildFile(meta, input.content ?? ""), "utf8");
  const stat = await fs.stat(path.join(KNOWLEDGE_DIR, file));
  return { file, ...meta, status: meta.status as "ON" | "OFF", size: stat.size };
}

export async function setStatus(file: string, status: "ON" | "OFF"): Promise<void> {
  const safe = safeName(file);
  const full = path.join(KNOWLEDGE_DIR, safe);
  const raw = await fs.readFile(full, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  await fs.writeFile(full, buildFile({ name: meta.name || safe, type: meta.type || "Other", version: meta.version || "1.0", updatedAt: meta.updatedAt || today(), status }, body), "utf8");
}

export async function removeDoc(file: string): Promise<void> {
  await fs.unlink(path.join(KNOWLEDGE_DIR, safeName(file)));
}

export async function readRaw(file: string): Promise<string> {
  return fs.readFile(path.join(KNOWLEDGE_DIR, safeName(file)), "utf8");
}
