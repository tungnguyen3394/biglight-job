// Cấu hình gửi mail qua Google Apps Script — mỗi nhân viên gửi từ Gmail của mình.
// Secret được nhúng vào script (ở dưới) + gửi kèm payload để chống POST lạ.
export const MAIL_GAS_SECRET = "BIGLIGHT_JOB_MAIL_2026";

// Đoạn script để nhân viên copy vào Google Apps Script của họ (deploy là chính mình → gửi từ Gmail của họ).
export const MAIL_GAS_SCRIPT = `// BIGLIGHT JOB — メール送信 GAS（各自のGmailから送信）
// 1. script.google.com → 新規プロジェクト → このコードを貼り付け
// 2. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」→ 実行者「自分」/ アクセス「全員」→ デプロイ
// 3. デプロイURL（末尾 /exec）を「メール設定」の入力欄に貼り付け
function doPost(e) {
  try {
    var p = JSON.parse(e.postData.contents);
    if (p.secret !== '${MAIL_GAS_SECRET}') {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var sent = 0;
    (p.to || []).forEach(function (addr) {
      MailApp.sendEmail({
        to: addr,
        subject: p.subject,
        body: p.body,
        name: p.name || 'BIGLIGHT JOB',
        replyTo: p.replyTo || ''
      });
      sent++;
    });
    return ContentService.createTextOutput(JSON.stringify({ ok: true, sent: sent }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
