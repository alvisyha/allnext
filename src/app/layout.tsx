import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Allnext — Personal Productivity Dashboard",
  description: "Dashboard personal clean minimalis untuk mengelola tugas, keuangan, kebiasaan, dan jadwal kerja.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${poppins.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
