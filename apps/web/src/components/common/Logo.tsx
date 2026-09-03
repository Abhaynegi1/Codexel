import React from "react";
import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  href?: string;
  className?: string;
}

export function Logo({
  size = "md",
  showWordmark = true,
  href,
  className = "",
}: LogoProps) {
  const dimensions = {
    sm: { icon: 20, text: "text-sm", gap: "gap-1.5" },
    md: { icon: 26, text: "text-lg", gap: "gap-2" },
    lg: { icon: 34, text: "text-2xl", gap: "gap-2.5" },
    xl: { icon: 48, text: "text-3xl", gap: "gap-3" },
  }[size];

  const content = (
    <div className={`inline-flex items-center ${dimensions.gap} ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="Codexel Cube Logo"
          width={dimensions.icon}
          height={dimensions.icon}
          className="object-contain"
          style={{ imageRendering: "pixelated" }}
          priority
        />
      </div>

      {showWordmark && (
        <span
          className={`font-semibold tracking-tight text-foreground ${dimensions.text} select-none`}
        >
          code<span className="text-orange-500 font-bold">x</span>el
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="hover:opacity-90 transition-opacity focus:outline-none"
      >
        {content}
      </Link>
    );
  }

  return content;
}
