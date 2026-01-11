import { Metadata } from 'next';
import Resources from './Resources';

export const metadata: Metadata = {
  title: 'Resources - RajaOTP',
  description: 'Akses Bot Telegram, Dokumentasi, dan Support RajaOTP. Dapatkan bantuan lengkap untuk menggunakan layanan OTP kami.',
  openGraph: {
    title: 'Resources - RajaOTP',
    description: 'Akses Bot Telegram, Dokumentasi, dan Support RajaOTP',
    type: 'website',
    locale: 'id_ID',
  },
};

export default function ResourcesPage() {
  return <Resources />;
}
