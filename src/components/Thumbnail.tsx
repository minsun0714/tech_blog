/**
 * 그래프 모티프 썸네일 (seed 결정적 → 서버/클라 동일 렌더).
 * 목업의 thumb() 로직을 그대로 옮김.
 */
function makeRng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export default function Thumbnail({ seed, label }: { seed: number; label?: string | null }) {
  const r = makeRng(seed * 7 + 3);
  const W = 400,
    H = 250,
    pad = 44;
  const N = 5 + Math.floor(r() * 2);
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) pts.push([pad + r() * (W - 2 * pad), pad + r() * (H - 2 * pad)]);
  const acc = Math.floor(r() * N);

  const dots: { x: number; y: number }[] = [];
  for (let x = 20; x < W; x += 26) for (let y = 20; y < H; y += 26) dots.push({ x, y });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={W} height={H} fill="#1C1E24" />
      {dots.map((d, i) => (
        <circle key={`d${i}`} cx={d.x} cy={d.y} r={0.8} fill="rgba(255,255,255,.05)" />
      ))}
      {pts.slice(1).map((p, i) => {
        const [x1, y1] = pts[i];
        const [x2, y2] = p;
        return (
          <line
            key={`e${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,.16)"
            strokeWidth={1}
          />
        );
      })}
      {pts.map((p, i) => {
        const on = i === acc;
        return (
          <circle
            key={`n${i}`}
            cx={p[0]}
            cy={p[1]}
            r={on ? 6 : 4}
            fill={on ? "#2438E8" : "#3A3D45"}
            stroke="rgba(255,255,255,.28)"
            strokeWidth={1}
          />
        );
      })}
      <text
        x={20}
        y={30}
        fontFamily="IBM Plex Mono,monospace"
        fontSize={11}
        letterSpacing={1.5}
        fill="rgba(255,255,255,.55)"
      >
        {(label || "").toUpperCase()}
      </text>
    </svg>
  );
}
