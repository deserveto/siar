import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const offbit = localFont({
  src: "./fonts/OffBit-DotBold.ttf",
  variable: "--font-offbit",
});

export const metadata: Metadata = {
  title: {
    default: "SIAR - Sistem Informasi Asuransi Ramayana",
    template: "%s | SIAR",
  },
  description: "Portal karyawan Asuransi Ramayana untuk manajemen operasional internal",
  keywords: ["SIAR", "Asuransi Ramayana", "Insurance", "Dashboard", "Portal Karyawan"],
  authors: [{ name: "PT Asuransi Ramayana Tbk" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${offbit.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
