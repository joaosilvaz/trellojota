import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/lib/toast";
import { AppShell } from "@/components/layout/AppShell";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "JOTA Boards",
  description: "O espaço de trabalho do Jota para organizar ideias e executar projetos com estilo.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${manrope.variable}`}>
      <body>
        <div className="app-bg" aria-hidden />
        <ToastProvider>
          <StoreProvider>
            <AppShell>{children}</AppShell>
          </StoreProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
