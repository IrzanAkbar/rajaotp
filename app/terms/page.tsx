import { Metadata } from 'next';
import Terms from './Terms';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan - RajaOTP',
  description: 'Syarat & Ketentuan penggunaan layanan RajaOTP. Baca kebijakan penggunaan dan tanggung jawab hukum kami.',
  openGraph: {
    title: 'Syarat & Ketentuan - RajaOTP',
    description: 'Syarat & Ketentuan RajaOTP',
    type: 'website',
    locale: 'id_ID',
  },
};

export default function TermsPage() {
  return <Terms />;
}
