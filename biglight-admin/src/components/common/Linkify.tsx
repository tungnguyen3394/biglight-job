// Biến URL (http/https) trong văn bản thành link bấm được. Giữ nguyên xuống dòng (whitespace-pre-wrap ở thẻ cha).
const URL_RE = /(https?:\/\/[^\s<>"'）)、。]+)/g;

export default function Linkify({ text, linkClassName }: { text: string; linkClassName?: string }) {
  if (!text) return null;
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName || "font-semibold underline underline-offset-2 break-all hover:opacity-80"}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
