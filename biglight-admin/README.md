# BIGLIGHT Job — Admin

Hệ thống quản trị cho BIGLIGHT Job (特定技能 / 育成就労 / 外国人材).
Stack: **Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL + Tailwind**.
Auth: JWT gọn nhẹ (`jose` + `bcryptjs`) lưu trong cookie httpOnly — dễ đọc, dễ bàn giao.

> Phân quyền được **kiểm tra ở backend** (API trả `403`), không chỉ ẩn bằng frontend.

## 1. Yêu cầu
- Node.js 18+ (khuyến nghị 20)
- PostgreSQL 14+ (local hoặc cloud: Supabase/Neon/Railway…)

## 2. Cài đặt
```bash
cd biglight-admin
npm install
cp .env.example .env          # rồi sửa DATABASE_URL và JWT_SECRET
npx prisma generate
npx prisma db push            # tạo bảng (không cần migration files)
npm run db:seed               # tạo dữ liệu mẫu + 5 user theo role
npm run dev                   # http://localhost:3000
```

### Tài khoản mẫu (mật khẩu: `password123`)
| Email | Role |
|---|---|
| admin@biglight.jp | Super Admin |
| staff@biglight.jp | BIGLIGHT Staff |
| ctv@biglight.jp | CTV / Partner |
| company@biglight.jp | Company |
| candidate@biglight.jp | Candidate |

## 3. Mở bằng Visual Studio
Đây là dự án dạng **folder (JavaScript/TypeScript)**. Mở thư mục `biglight-admin` bằng
*Visual Studio → Open → Folder*. (Khuyến nghị **VS Code** cho Next.js, nhưng Visual Studio
mở folder vẫn chạy được; terminal dùng `npm run dev`.)

## 4. Cấu trúc
```
prisma/schema.prisma     # data model đầy đủ (users, companies, ctvs, jobs,
                         #   candidates, applications, job_commissions,
                         #   candidate_commissions, status_histories)
prisma/seed.ts           # dữ liệu mẫu

src/lib/permissions.ts   # ★ RBAC — nguồn chân lý duy nhất (ai xem/sửa gì)
src/lib/auth.ts          # hash mật khẩu + ký/verify JWT + cookie session
src/lib/api.ts           # guard 403 + row-level scoping + strip field nhạy cảm
src/middleware.ts        # chặn /admin (redirect) và /api (401)

src/app/api/...          # API kiểm quyền ở backend
  auth/login, auth/logout
  jobs/  jobs/[id]        # CRUD 求人 (scope + sanitize)
  commissions/           # 報酬: Company/Candidate -> 403

src/app/admin/...        # giao diện admin (sidebar trái + header)
  page.tsx               # Dashboard (chỉ số; hoa hồng gate theo quyền)
  jobs/                  # 求人管理 (bảng + filter + form 8 tab)  ← MVP
  (candidates, pipeline, companies, partners, commissions, users, settings = stub)
```

## 5. Mô hình phân quyền (RBAC)
5 role: `SUPER_ADMIN`, `BIGLIGHT_STAFF`, `CTV`, `COMPANY`, `CANDIDATE`.

Cơ chế 3 lớp ở backend (xem `src/lib/`):
1. **Capability** (`can(role, action, resource)`): role có được phép thao tác không.
2. **Row-level scope** (`jobScopeWhere`, `candidateScopeWhere`, `commissionScopeWhere`):
   chỉ trả về dữ liệu user được phép thấy (CTV chỉ case của mình, Company chỉ công ty
   mình, Candidate chỉ 求人 公開…).
3. **Field sanitize** (`sanitizeJob`): cắt `internalMemo / companyHistory / riskNotes`
   và dữ liệu hoa hồng trước khi trả về cho Company/Candidate.

Quy tắc bảo mật quan trọng:
- Candidate & Company **không bao giờ** nhận commission / internal memo qua API.
- CTV chỉ nhận dữ liệu liên quan đến mình; **không** xóa dữ liệu gốc.
- Company sửa 求人 → tự chuyển `承認待ち (PENDING_APPROVAL)`, BIGLIGHT duyệt mới công khai.
- Không đủ quyền → **403 Forbidden**.

## 6. Đã làm (MVP) & tiếp theo
**Xong:** Auth + RBAC + data model + admin layout + Dashboard + **求人管理** (list/filter/CRUD/form 8 tab, cột 紹介報酬 gate theo quyền, modal xác nhận xóa).

**Tiếp theo (theo thứ tự ưu tiên):** 応募者管理 → 応募・進捗(Kanban) → 報酬管理 (bảng đầy đủ) → Company portal → CTV portal → User management.

## 7. Đưa lên GitHub
```bash
git init
git add .
git commit -m "feat: BIGLIGHT admin scaffold (auth, RBAC, jobs MVP)"
git branch -M main
git remote add origin https://github.com/<bạn>/<repo>.git
git push -u origin main
```
> `.gitignore` đã loại `node_modules`, `.env`, `.next`. **Không commit file `.env`.**
