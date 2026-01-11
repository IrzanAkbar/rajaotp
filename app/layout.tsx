import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://rajaotpweb.com'),
  title: "RajaOTP - Layanan OTP Profesional & Stabil",
  description: "RajaOTP dirancang untuk kebutuhan OTP dengan sistem yang rapi dan aman. Akses instan melalui Bot Telegram.",
  keywords: ["OTP", "verifikasi", "otomasi", "keamanan", "OTP service", "telegram bot", "SMS verification", "two-factor authentication"],
  authors: [{ name: "RajaOTP" }],
  creator: "RajaOTP",
  publisher: "RajaOTP",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  icons: {
    icon: [
      { url: '/logo/logo.svg', type: 'image/svg+xml' },
      { url: '/logo/logo.png', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "RajaOTP - Layanan OTP Profesional & Stabil",
    description: "RajaOTP dirancang untuk kebutuhan OTP yang mengutamakan stabilitas, kerapihan sistem, dan kepercayaan.",
    type: "website",
    locale: "id_ID",
    url: "https://rajaotpweb.com",
    siteName: "RajaOTP",
    images: [
      {
        url: "/og/og.png",
        width: 1200,
        height: 630,
        alt: "RajaOTP - Layanan OTP Cepat & Terpercaya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RajaOTP - Layanan OTP Profesional & Stabil",
    description: "RajaOTP dirancang untuk kebutuhan OTP yang mengutamakan stabilitas, kerapihan sistem, dan kepercayaan.",
    creator: "@rajaotpoffc_bot",
    images: ["/og/og.png"],
  },
  alternates: {
    canonical: "https://rajaotpweb.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}
