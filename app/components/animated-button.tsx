"use client";

import Link from "next/link";
import "./animated-button.css";

interface AnimatedButtonProps {
  text: string;
  href?: string;
  variant?: "default" | "white" | "transparent";
  onClick?: () => void;
}

export default function AnimatedButton({
  text,
  href = "#",
  variant = "default",
  onClick,
}: AnimatedButtonProps) {
  const variantClass = variant === "default" ? "" : variant;
  const className = `valorant-button ${variantClass}`.trim();

  const content = (
    <p>
      <span className="bg"></span>
      <span className="base"></span>
      <span className="text">{text}</span>
    </p>
  );

  if (href === "#" && onClick) {
    return (
      <button onClick={onClick} type="button" className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
