import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codexel — Understand any codebase visually",
  description:
    "Visualize architecture, explore components, and uncover the design system behind any repository.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground selection:bg-primary-soft selection:text-primary-dark">
        {children}
      </body>
    </html>
  );
}
