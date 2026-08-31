import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codexel — Codebase Intelligence & Visual Architecture Explorer",
  description:
    "Turn any codebase into an explorable visual representation of its architecture, components, and design system without reading thousands of lines of code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-purple-500/30 selection:text-purple-200">
        {children}
      </body>
    </html>
  );
}
