import type { Metadata } from "next";
import { Inter, Koulen, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/SmoothScroll";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const koulen = Koulen({
  weight: "400",
  variable: "--font-koulen",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://haetae.studio"),
  title: {
    template: "%s | Studio HaeTae",
    default: "Studio HaeTae | Guardians of Innovation",
  },
  description: "비즈니스의 수호자, 기술의 완성. 프리미엄 비즈니스 빌더 스튜디오 해태입니다.",
  keywords: ["웹 개발", "스타트업", "B2B SaaS", "앱 개발", "에이전시", "Studio HaeTae", "Vercel", "Next.js"],
  authors: [{ name: "Studio HaeTae" }],
  creator: "Studio HaeTae",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://haetae.studio",
    title: "Studio HaeTae | Premium Web Agency",
    description: "비즈니스의 수호자, 기술의 완성. 12년차 CTO 출신 풀스택 파트너.",
    siteName: "Studio HaeTae",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Studio HaeTae Official",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio HaeTae",
    description: "Guardians of Innovation. Architects of Scale.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${koulen.variable} ${robotoMono.variable} antialiased dark scroll-smooth`}>
      <body className="flex flex-col font-sans bg-background text-foreground relative">
        {/* Global Noise Overlay */}
        <div className="noise-overlay" />
        <SmoothScroll />

        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
