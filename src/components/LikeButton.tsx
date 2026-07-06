"use client";
import { useEffect, useState } from "react";
import { Heart } from "./icons";

/**
 * 좋아요 버튼. 백엔드에 유저용 좋아요 API 가 없어 localStorage 로컬 상태로만 동작한다.
 * (디자인 재현용 인터랙션)
 */
export default function LikeButton({
  postId,
  variant = "card",
}: {
  postId: number;
  variant?: "card" | "lg";
}) {
  const key = `stdout:like:${postId}`;
  const [liked, setLiked] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLiked(localStorage.getItem(key) === "1");
    setReady(true);
  }, [key]);

  const toggle = () => {
    setLiked((prev) => {
      const next = !prev;
      localStorage.setItem(key, next ? "1" : "0");
      return next;
    });
  };

  const count = liked ? 1 : 0;

  if (variant === "lg") {
    return (
      <button
        className={`like-lg${liked ? " on" : ""}`}
        onClick={toggle}
        aria-pressed={liked}
        suppressHydrationWarning
      >
        <Heart filled={ready && liked} />
        <span>좋아요 {count}</span>
      </button>
    );
  }

  return (
    <button
      className={`likebtn${liked ? " on" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      aria-pressed={liked}
      aria-label="좋아요"
      suppressHydrationWarning
    >
      <Heart filled={ready && liked} />
      <span>{count}</span>
    </button>
  );
}
