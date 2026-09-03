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
  const fullDimensions = {
    sm: { width: 78, height: 24 },
    md: { width: 98, height: 30 },
    lg: { width: 124, height: 38 },
    xl: { width: 156, height: 48 },
  }[size];

  const iconDimensions = {
    sm: 20,
    md: 26,
    lg: 34,
    xl: 48,
  }[size];

  const content = (
    <div className={`inline-flex items-center shrink-0 ${className}`}>
      {showWordmark ? (
        <Image
          src="/logo-full.png"
          alt="Codexel Logo"
          width={fullDimensions.width}
          height={fullDimensions.height}
          className="object-contain"
          style={{ imageRendering: "pixelated" }}
          priority
        />
      ) : (
        <Image
          src="/logo.png"
          alt="Codexel Cube Icon"
          width={iconDimensions}
          height={iconDimensions}
          className="object-contain"
          style={{ imageRendering: "pixelated" }}
          priority
        />
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center hover:opacity-90 transition-opacity focus:outline-none"
      >
        {content}
      </Link>
    );
  }

  return content;
}
