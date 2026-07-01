"use client";

import { useState } from "react";

// Avatar bo tròn: có ảnh → dùng ảnh (lỗi thì fallback chữ cái đầu); không có → chữ cái đầu.
export function Avatar({ name, src, size = 32, className = "" }: { name?: string; src?: string; size?: number; className?: string }) {
  const [err, setErr] = useState(false);
  const letter = (name?.trim()?.[0] ?? "?").toUpperCase();
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  if (src && !err) {
    return <img src={src} alt={name ?? ""} onError={() => setErr(true)} style={{ width: size, height: size }} className={`flex-none rounded-full object-cover ring-1 ring-black/5 ${className}`} />;
  }
  return <span style={style} className={`flex flex-none items-center justify-center rounded-full bg-bl-redsoft font-black text-bl-red ${className}`}>{letter}</span>;
}

export const BIGU_KUN_SRC = "/bigu-kun-1024.png";
