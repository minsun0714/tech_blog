/** 디자인 목업의 하트/말풍선 SVG 아이콘 */
export function Heart({ filled }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        d="M12 21s-7.5-4.9-10-9.3C.5 8.5 2 5 5.3 5c2 0 3.3 1.2 3.7 2.3C9.4 6.2 10.7 5 12.7 5 16 5 17.5 8.5 16 11.7 13.5 16.1 12 21 12 21z"
        transform="translate(-0.3,0)"
      />
    </svg>
  );
}

export function Bubble() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />
    </svg>
  );
}
