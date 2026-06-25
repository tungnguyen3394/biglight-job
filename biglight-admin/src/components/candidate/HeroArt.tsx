// Minh hoạ phẳng (flat illustration) thân thiện: người lao động đội mũ bảo hộ vẫy tay,
// có mặt trời, mây, nhà máy + chuyển động nhẹ (xem keyframes trong globals.css).
export default function HeroArt({ className }: { className?: string }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const r1 = 30, r2 = 40, cx = 390, cy = 72;
    return <line key={i} x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)} />;
  });

  return (
    <svg viewBox="0 0 460 360" className={className} role="img" aria-label="日本で働く仲間たち">
      {/* ground shadow */}
      <ellipse cx="225" cy="322" rx="180" ry="22" fill="#F0B9AE" opacity="0.45" />

      {/* sun */}
      <g className="bl-spin" style={{ transformOrigin: "390px 72px" }}>
        <circle cx="390" cy="72" r="24" fill="#FFC24B" />
        <g stroke="#FFC24B" strokeWidth="4" strokeLinecap="round">{rays}</g>
      </g>

      {/* clouds */}
      <g className="bl-float" fill="#ffffff">
        <ellipse cx="92" cy="64" rx="34" ry="17" />
        <ellipse cx="122" cy="56" rx="22" ry="15" />
      </g>
      <g className="bl-float" fill="#ffffff" opacity="0.9" style={{ animationDelay: "1.6s" }}>
        <ellipse cx="318" cy="128" rx="26" ry="13" />
        <ellipse cx="336" cy="122" rx="16" ry="11" />
      </g>

      {/* factory */}
      <g fill="#13335C" opacity="0.12">
        <rect x="36" y="206" width="68" height="92" rx="4" />
        <polygon points="36,206 70,184 104,206" />
        <rect x="116" y="236" width="40" height="62" rx="4" />
        <rect x="60" y="160" width="10" height="48" />
      </g>

      {/* worker */}
      <g className="bl-bob">
        {/* legs */}
        <rect x="190" y="252" width="18" height="48" rx="9" fill="#2B4C7E" />
        <rect x="220" y="252" width="18" height="48" rx="9" fill="#2B4C7E" />
        <ellipse cx="199" cy="302" rx="14" ry="8" fill="#16181D" />
        <ellipse cx="229" cy="302" rx="14" ry="8" fill="#16181D" />
        {/* shirt */}
        <rect x="190" y="172" width="48" height="44" rx="18" fill="#F4A93C" />
        {/* overalls body */}
        <rect x="180" y="184" width="68" height="82" rx="24" fill="#3B6CB0" />
        <rect x="200" y="184" width="28" height="40" rx="10" fill="#F4A93C" />
        {/* left arm down */}
        <rect x="166" y="194" width="18" height="56" rx="9" fill="#F4A93C" />
        <circle cx="175" cy="252" r="10" fill="#F6C9A0" />
        {/* right arm waving */}
        <g className="bl-wave" style={{ transformOrigin: "240px 200px" }}>
          <rect x="236" y="150" width="18" height="54" rx="9" fill="#F4A93C" />
          <circle cx="245" cy="148" r="11" fill="#F6C9A0" />
        </g>
        {/* head */}
        <circle cx="214" cy="152" r="30" fill="#F6C9A0" />
        <circle cx="199" cy="155" r="4.5" fill="#F4A98A" opacity="0.7" />
        <circle cx="229" cy="155" r="4.5" fill="#F4A98A" opacity="0.7" />
        <circle cx="205" cy="148" r="3" fill="#16181D" />
        <circle cx="223" cy="148" r="3" fill="#16181D" />
        <path d="M202 158 Q214 170 226 158" stroke="#A8231C" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* hard hat */}
        <path d="M182 140 a32 27 0 0 1 64 0 z" fill="#D02E26" />
        <rect x="176" y="136" width="76" height="9" rx="4" fill="#A8231C" />
        <rect x="210" y="114" width="8" height="16" rx="2" fill="#A8231C" />
      </g>

      {/* sparkles */}
      <g fill="#FFC24B" className="bl-float" style={{ animationDelay: "0.7s" }}>
        <path d="M322 206 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3z" />
      </g>
      <g fill="#D02E26" className="bl-float" opacity="0.8" style={{ animationDelay: "1.2s" }}>
        <path d="M120 300 l2.5 7 7 2.5 -7 2.5 -2.5 7 -2.5 -7 -7 -2.5 7 -2.5z" />
      </g>
    </svg>
  );
}
