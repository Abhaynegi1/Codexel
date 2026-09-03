import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codexel — Understand any codebase visually",
  description:
    "Visualize architecture, explore components, and uncover the design system behind any repository.",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "64x64", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.png" type="image/png" sizes="64x64" />
        <link rel="shortcut icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
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
