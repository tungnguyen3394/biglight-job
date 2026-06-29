# HƯỚNG DẪN SỬ DỤNG — BIGLIGHT JOB (job.biglight.jp)

Tài liệu hướng dẫn từng phần cho **quản trị (admin)** và **ứng viên (user)**, kèm phần vận hành/deploy.

---

## A. TỔNG QUAN

- **Trang ứng viên** (công khai): tìm 求人, xem 特定技能ガイド, đăng nhập Google/Facebook, hoàn thiện hồ sơ, ứng tuyển, theo dõi tiến trình, nhắn tin.
- **Trang quản trị** `/admin` (chỉ nhân viên BIGLIGHT, email `@biglight.jp`): quản lý 求人, ứng viên, công ty, tiến trình tuyển dụng, bài viết, người dùng, gửi mail.
- **Phân quyền nội bộ**: ADMIN (toàn quyền) · STAFF (thao tác) · VIEW (chỉ xem). Cấp ở **ユーザー管理**.

---

## B. HƯỚNG DẪN — TRANG ỨNG VIÊN

### 1. Đăng ký / Đăng nhập
- Vào trang chủ → nút **30秒で無料登録** (góc phải header) hoặc bấm **応募** ở một求人.
- Đăng nhập bằng **Google** hoặc **Facebook**. (Email `@biglight.jp` KHÔNG đăng nhập được cổng ứng viên — đó là cổng nhân viên.)
- Sau khi đăng nhập, header hiện **マイページ**.

### 2. Hoàn thiện hồ sơ (bắt buộc trước khi ứng tuyển)
- マイページ → **プロフィール入力**.
- Các mục **必須**: 氏名 · 生年月日 · 性別 · 国籍 · 在留資格 · SNSアカウント (Facebook/Instagram/TikTok) · メール.
- Nếu thiếu, mypage hiện **banner đỏ** liệt kê đúng mục còn thiếu. Nhập đủ → banner chuyển **xanh "応募できます"**.

### 3. Ứng tuyển
- Mở 1求人 → **応募する** → xác nhận → hệ thống tạo đơn.
- Nếu hồ sơ chưa đủ → hiện đúng mục thiếu, dẫn về プロフィール入力.
- Sau khi ứng tuyển: vào **応募状況・進捗** xem tiến trình **6 bước**: 応募 → 面談 → 面接 → 内定 → ビザ申請 → 入社. Mỗi bước có ghi chú từ 担当者.

### 4. Tin nhắn
- マイページ → **メッセージ**: nhắn với 担当者 BIGLIGHT. Có dịch tự động (gõ tiếng Việt → 担当者 đọc tiếng Nhật và ngược lại).

### 5. Công cụ tính lương 手取り計算ツール
- Chọn **都道府県** (健康保険料率 theo tỉnh) → nhập 月給/交通費/残業/扶養/年齢/住民税 → xem **手取り** + **実質受取額**.
- Thứ tự: 1 収入を入力 → 2 生活費（任意）→ 3 計算結果. Nút **Messengerで相談** để liên hệ.

### 6. 特定技能ガイド
- Trang chủ → 特定技能ガイド: đọc bài viết theo カテゴリ (特定技能/ビザ/求人/面接/履歴書/日本語/生活/給料・税金/ニュース). Có tìm kiếm.

---

## C. HƯỚNG DẪN — TRANG QUẢN TRỊ (/admin)

> Mọi bảng danh sách dùng chung bộ nút: **絞り込み** (lọc) · **並び替え** (sắp xếp) · **表示項目** (bật/tắt cột, có すべて選択/クリア) · **CSV** · **PDF出力** · **印刷**.

### 1. ダッシュボード
- Tổng quan: số liệu nhanh + lối tắt.

### 2. 求人管理 (Quản lý tin tuyển dụng)
- **新規求人**: tạo求人 (求人作成). Điền 求人コード/募集状況/職種/勤務地/給与/寮… + ảnh + nội dung.
- Bấm 1求人 đã tạo → mở ở **chế độ 閲覧 (read-only)** + nút **編集**. Bấm 編集 mới sửa được + hiện **変更を保存**. (Người quyền VIEW không thấy nút 編集.)
- **リスト/カード**, lọc/sắp/表示項目, CSV/PDF/印刷.

### 3. 応募者管理 (Quản lý ứng viên)
- Bảng đầy đủ trường ứng viên (đồng bộ form マイページ). Bật/tắt cột qua 表示項目.
- Mỗi hàng: **詳細** (xem hồ sơ đầy đủ) + **メッセージ** (nhắn thẳng vào hộp thư ứng viên).
- **Gửi mail hàng loạt (Mail Merge)**: tick checkbox ứng viên → **メール送信** → xem mục E.

### 4. 企業管理 (Quản lý công ty)
- Dạng bảng (リスト) đầy đủ trường + dạng カード (kèm求人 mỗi công ty).
- Bấm tên công ty / **詳細** → trang chi tiết: xem/sửa (住所/担当者/連絡先/支払い情報/契約内容/契約日/備考) + **応募者数** → bấm ra danh sách ứng viên đã ứng tuyển.
- Gửi mail hàng loạt cho công ty (Mail Merge) như ứng viên.

### 5. 応募進捗 (Tiến trình tuyển dụng)
- Danh sách full-width. **Click 1 dòng → modal chi tiết**: thanh 6 bước + đổi ステータス/担当者 + ngày 面接/内定/ビザ/入社 + **進捗メモ（応募者に表示）** + **社内メモ（社内のみ）** + nhắn tin + timeline.
- **進捗メモ** hiện cho ứng viên ở マイページ; **社内メモ** chỉ nội bộ.
- Lọc/sắp/表示項目/CSV/PDF/印刷.

### 6. 記事管理 (CMS bài viết)
- **記事を作成**: nhập タイトル/カテゴリ/SEO + アイキャッチ (ảnh bìa — **upload thật**, không dùng link tạm) + 本文.
- **本文 hợp AI**: dán thẳng Markdown từ ChatGPT (kể cả **bảng**, heading, list, đậm/nghiêng, link, code) → tự thành HTML.
- Giữ nguyên **SEOスコア + チェックリスト + アナリティクス**. Danh sách bài dạng bảng (lọc/sắp/表示項目/CSV/PDF/印刷).

### 7. ユーザー管理 (Người dùng nội bộ)
- Tạo tài khoản nhân viên (`@biglight.jp`), cấp quyền **ADMIN/STAFF/VIEW**, khóa/mở, sửa 氏名 tại chỗ.
- **メール送信権限**: bật/tắt cho từng người (cột メール送信).
- **操作ログ** (audit log) 100 thao tác gần nhất.

### 8. メール設定 (Cấu hình gửi mail GAS — MỖI nhân viên tự làm 1 lần)
- Mỗi nhân viên gửi mail từ **Gmail của chính mình** qua Google Apps Script:
  1. メール設定 → copy đoạn **GASスクリプト**.
  2. Vào script.google.com → New project → dán → Deploy → **ウェブアプリ** → 実行者「自分」/ アクセス「**全員**」→ Deploy.
  3. Copy URL `/exec` → dán vào ô **自分のGAS デプロイURL** → 保存.
- Admin phải bật **メール送信権限** cho người đó ở ユーザー管理.

### 9. 設定 (Master data)
- Quản lý dropdown/tag: 国籍 · 在留資格 · 日本語レベル · 業種 (3 tầng 業種→業務区分→従事する主な業務) · タグ · ガイドカテゴリ. Sửa ở đây → toàn site cập nhật.

---

## D. PHÂN QUYỀN

| Quyền | Làm được |
|---|---|
| **ADMIN** | Toàn bộ + ユーザー管理 + 設定 + cấp quyền + xóa |
| **STAFF** | Tạo/sửa求人, ứng viên, công ty, tiến trình, bài viết, gửi mail (nếu được bật) |
| **VIEW** | Chỉ xem (nút 編集/保存 bị ẩn/chặn) |

- Ứng viên (CANDIDATE) **không vào được** `/admin` (bị đẩy về マイページ).

---

## E. MAIL MERGE (Gửi mail chèn dữ liệu)

Dùng ở **応募者管理** và **企業管理** (tick checkbox → **メール送信**).

- **件名 / 本文**: gõ nội dung, chèn **差し込みフィールド** (merge tag) → bấm nút **差し込みフィールド** chọn trường → chèn `{{tag}}` tại con trỏ. Danh sách trường **tự lấy từ DB** (thêm cột DB → tự có tag; không hiện trường nhạy cảm/nội bộ).
- **宛先**: tự loại trùng email, bỏ người không có mail.
- **プレビュー**: chọn từng người xem nội dung sau khi chèn.
- **空欄の扱い**: trường trống → để trống hoặc hiện "未入力".
- **テンプレート**: lưu / chọn mẫu.
- **テスト送信**: gửi thử về email của mình.
- **送信する** → xác nhận → gửi cá nhân hoá từng người → xem **送信履歴**.

> ⚠ **Lưu ý quan trọng**: do cơ chế gửi qua GAS, hệ thống báo **"đã gửi yêu cầu"** chứ KHÔNG xác nhận chắc chắn mail đã tới. **Luôn kiểm tra「送信済み」trong Gmail của chính mình** để chắc chắn.

---

## F. VẬN HÀNH / DEPLOY (VPS)

```bash
cd ~/biglight-job && git pull
cd biglight-admin

# Nếu commit có ĐỔI SCHEMA (thêm bảng/cột):
docker compose run --rm --build migrate npx prisma db push

# Luôn chạy để cập nhật app:
docker compose up -d --build
```

- **Khi nào cần db push?** Khi commit ghi rõ "có đổi schema" (vd thêm Mail Template/Log, cột công ty…). Commit chỉ sửa giao diện/logic → chỉ `up -d --build`.
- **Biến môi trường quan trọng** (đặt trên server, KHÔNG hardcode):
  - `JWT_SECRET` / `AUTH_SECRET` — bí mật phiên đăng nhập (BẮT BUỘC đặt ở production).
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` — đăng nhập ứng viên.
  - `NEXT_PUBLIC_FACEBOOK_PAGE_USERNAME` — link Messenger ở header (vd Page ID `771246202740166`).
  - `DATABASE_URL` — PostgreSQL.

---

## G. XỬ LÝ SỰ CỐ NHANH

| Hiện tượng | Nguyên nhân / cách xử lý |
|---|---|
| Gửi mail báo "đã gửi" nhưng không tới | Kiểm 送信済み trong Gmail; kiểm GAS access = 全員, secret đúng, đã bật メール送信権限 |
| Ảnh bìa bài viết hỏng | Phải **upload** ở アイキャッチ (không dán link tạm/blob) |
| Trang chủ hiện マイページ khi chưa đăng ký | Đã xử lý — chỉ phiên CANDIDATE mới thấy マイページ |
| Ứng viên không ứng tuyển được | Kiểm hồ sơ đủ 必須 chưa; 求人 phải đang công khai |
| Đăng nhập Google/FB lỗi | Kiểm redirect URI trên Console + biến môi trường |
