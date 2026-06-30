import { useEffect } from "react";

// Đóng MỌI <details> đang mở khi bấm ra ngoài nó (hoặc nhấn Esc).
// Dùng cho các dropdown lọc/sắp xếp/hiển thị (絞り込み・並び替え・表示項目) ở các bảng admin.
export function useAutoCloseDetails() {
  useEffect(() => {
    const closeOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      document.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((d) => {
        if (!d.contains(t)) d.open = false;
      });
    };
    const closeOnEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") document.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((d) => (d.open = false));
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEsc);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEsc);
    };
  }, []);
}
