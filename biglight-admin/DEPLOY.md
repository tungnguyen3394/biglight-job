# BIGLIGHT Job Admin — Hướng dẫn triển khai (VPS + Docker + Google OAuth + CI/CD)

> Bản này đã **sửa các lỗi** trong guide gốc và khớp với code thực tế trong `biglight-admin`.
> Stack: Next.js + Prisma + PostgreSQL (Docker) + Google OAuth + GitHub Actions.

## ⚠️ Cảnh báo bảo mật (đọc trước)
1. **Mật khẩu Supabase đã lộ** (`...:0989256894Nhuong@db.ctnhyiioxlsffsijlqtr...`) khi dán vào chat/file. **Đổi ngay** trong Supabase → Settings → Database → Reset password.
2. **Không bao giờ commit `.env`** (đã có trong `.gitignore`). Đặt secret thật trong file `.env` trên máy/VPS và trong **GitHub Secrets**, không nhét vào code.
3. `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, mật khẩu DB phải là chuỗi thật, ngẫu nhiên, khác môi trường dev/prod.

---

## BƯỚC 0 — Yêu cầu
- VPS (Ubuntu 22.04+), đã cài **Docker** + **Docker Compose plugin**.
- Domain trỏ về VPS (vd `biglight-job.biglight.jp`).
- Tài khoản GitHub + repo trống.

---

## BƯỚC 1 — Đẩy code lên GitHub (chạy trên máy LOCAL)

> Lỗi trong guide gốc: URL bị lặp `https://github.com/https://github.com/...`. URL đúng:

```bash
cd biglight-admin
git init
git add .
git commit -m "feat: BIGLIGHT admin (auth, RBAC, jobs MVP, Google OAuth, docker, CI/CD)"
git branch -M main
git remote add origin https://github.com/tungnguyen3394/biglight-job.git
git push -u origin main
```
> Nếu remote `origin` đã tồn tại:
> ```bash
> git remote set-url origin https://github.com/tungnguyen3394/biglight-job.git
> ```

---

## BƯỚC 2 — File `.env`

Tạo `.env` từ mẫu rồi điền giá trị thật (xem `.env.example`):

```env
DATABASE_URL=postgresql://biglight_job_user:biglight_job_2026@localhost:5432/biglight_job_db?schema=public
JWT_SECRET=<chuỗi ngẫu nhiên dài>          # node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
SESSION_HOURS=12
GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<client-secret>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
```
> Lưu ý: code dùng **`JWT_SECRET`** (không phải `AUTH_SECRET`). Biến `NEXT_PUBLIC_GOOGLE_CLIENT_ID` bắt buộc để nút Google hiện ở trình duyệt.

---

## BƯỚC 3 — Postgres bằng Docker

```bash
# chạy riêng database (đúng tên container như guide)
docker compose up -d db
docker ps        # thấy postgres_biglight_job đang chạy
```
`docker-compose.yml` đã cấu hình: user `biglight_job_user`, pass `biglight_job_2026`, db `biglight_job_db`, cổng `5432`.

(Tuỳ chọn) tạo extension nếu cần:
```bash
docker exec -i postgres_biglight_job psql -U biglight_job_user -d biglight_job_db \
  -c 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";'
```
> Schema của project **không cần** `uuid-ossp` (Prisma dùng `cuid()` sinh ID ở app), nên có thể bỏ qua extension đó.

---

## BƯỚC 4 — Tạo bảng + dữ liệu mẫu

**Cách A — Prisma `db push` (KHUYẾN NGHỊ, đơn giản & an toàn nhất cho người mới):**

Dự án dùng `db push` (tạo bảng thẳng từ `schema.prisma`, KHÔNG cần thư mục `prisma/migrations/`).

Chạy qua Docker bằng service `migrate` (có sẵn prisma CLI + tsx; image `app` production đã lược bỏ):
```bash
docker compose run --rm --build migrate     # tạo bảng (db push) + seed 5 user mẫu, mật khẩu password123
```
> Luôn dùng `--build` để migrate dùng schema mới nhất (service này nằm trong profile `tools` nên `up --build` KHÔNG build nó).
> Lệnh này chạy lại nhiều lần vẫn an toàn: `db push` chỉ đồng bộ bảng, seed dùng upsert nên không ghi đè dữ liệu.
> Chỉ tạo bảng (không seed): `docker compose run --rm --entrypoint "npx prisma db push" migrate`

**Cách B — Chạy SQL tay (qua psql trong container):**
```bash
docker cp prisma/schema.sql postgres_biglight_job:/tmp/schema.sql
docker exec -i postgres_biglight_job psql -U biglight_job_user -d biglight_job_db -f /tmp/schema.sql
docker compose run --rm --no-deps --entrypoint "npm run db:seed" app
```
> Chọn **một** trong hai cách. Khuyến nghị Cách A.

---

## BƯỚC 5 (tuỳ chọn) — Migrate dữ liệu từ Supabase

> Chỉ làm nếu bạn có dữ liệu cũ trong Supabase **và** schema tương thích. Nếu không, bỏ qua (dùng DB mới ở Bước 4).
> ⚠️ Schema của Supabase cũ có thể **khác** schema mới này — import thẳng dễ xung đột. An toàn nhất là export rồi map dữ liệu thủ công.

```bash
sudo apt update && sudo apt install -y postgresql-client

# Export (đổi mật khẩu trước vì mật khẩu cũ đã lộ!)
pg_dump "postgresql://postgres:<MẬT_KHẨU_MỚI>@db.ctnhyiioxlsffsijlqtr.supabase.co:5432/postgres" \
  --schema=public --no-owner --no-privileges -f ~/supabase_backup.sql

# Sửa namespace extension nếu cần
sed -i 's/extensions\.uuid_generate_v4/public.uuid_generate_v4/g' ~/supabase_backup.sql

# Import vào Postgres mới
docker cp ~/supabase_backup.sql postgres_biglight_job:/tmp/supabase_backup.sql
docker exec -i postgres_biglight_job psql -U biglight_job_user -d biglight_job_db \
  -f /tmp/supabase_backup.sql > ~/import_log.txt 2>&1
grep -i "ERROR" ~/import_log.txt        # kiểm tra lỗi
```

---

## BƯỚC 6 — Cấu hình Google OAuth

### Google Cloud Console
[APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) → tạo/sửa **OAuth 2.0 Client ID** (loại *Web application*):

**Authorized JavaScript origins:**
- `http://localhost:3000`
- `https://biglight-job.biglight.jp`

**Authorized redirect URIs:** *(để trống — dự án dùng Google Identity Services dạng nút/One-Tap, không cần redirect URI)*

Lấy **Client ID** + **Client Secret** → điền vào `.env` (cả `NEXT_PUBLIC_GOOGLE_CLIENT_ID`).

### Cách hoạt động (đã code sẵn)
- Trang `/login` hiện **nút Google** + form email/mật khẩu.
- Nút Google trả `id_token` → `POST /api/auth/google` → server **verify token** với `google-auth-library` → tìm user theo email.
- **Chỉ user đã được admin tạo sẵn mới đăng nhập được** (không tự tạo tài khoản admin). Email lạ → **403**.

---

## BƯỚC 7 — Build & chạy app

**Local (dev):**
```bash
docker compose up -d db
npm run dev            # http://localhost:3000
```

**VPS (production, qua Docker):**
```bash
docker compose up -d --build        # build app + chạy cùng db
docker compose logs -f app
```
App chạy ở cổng `3000`.

---

## BƯỚC 8 — CI/CD với GitHub Actions

File `.github/workflows/deploy.yml` đã có: **build check** → **deploy SSH** vào VPS (`git pull` + `docker compose up -d --build` + `prisma db push`).

### Chuẩn bị VPS
```bash
# tạo user deploy + thư mục app
sudo adduser deploy_biglight_job
sudo mkdir -p /home/deploy_biglight_job/app
cd /home/deploy_biglight_job/app
git clone https://github.com/tungnguyen3394/biglight-job.git .
cp .env.example .env && nano .env      # điền secret thật trên VPS
```

### GitHub Secrets (repo → Settings → Secrets and variables → Actions)
| Secret | Giá trị |
|---|---|
| `VPS_HOST` | IP/domain VPS |
| `VPS_USER` | `deploy_biglight_job` |
| `VPS_PORT` | `22` (hoặc cổng SSH của bạn) |
| `VPS_SSH_KEY` | **private key** SSH có quyền vào VPS |

Tạo SSH key cho deploy:
```bash
ssh-keygen -t ed25519 -C "github-actions" -f deploy_key
# copy deploy_key.pub vào ~/.ssh/authorized_keys của user deploy trên VPS
# dán nội dung deploy_key (private) vào secret VPS_SSH_KEY
```
Mỗi lần `git push` lên `main` → tự build + deploy.

---

## BƯỚC 9 — Nginx + HTTPS (domain)

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/biglight-job
```
```nginx
server {
  server_name biglight-job.biglight.jp;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/biglight-job /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
# HTTPS miễn phí:
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d biglight-job.biglight.jp
```
> Nhớ thêm `https://biglight-job.biglight.jp` vào **Authorized JavaScript origins** ở Google Console.

---

## Lệnh hữu ích
```bash
docker compose ps                 # trạng thái container
docker compose logs -f app        # log app
docker compose restart app        # restart
docker exec -it postgres_biglight_job psql -U biglight_job_user -d biglight_job_db   # vào DB
docker compose run --rm --no-deps --entrypoint "npx prisma db push" app              # tạo/đồng bộ bảng
```

## Tài khoản test (sau khi seed, mật khẩu `password123`)
`admin@biglight.jp` (Super Admin) · `staff@…` · `ctv@…` · `company@…` · `candidate@…`
> Để đăng nhập bằng **Google**, email tài khoản trong DB phải trùng email Google của bạn (admin tạo user với email đó trước).
