import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Convert — Birim ve Koordinat Çevirici",
  description:
    "Hassas birim dönüşümleri ile WGS 84, MGRS, UTM/UPS, GARS, GEOREF ve EPSG araçları.",
  applicationName: "Convert",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
