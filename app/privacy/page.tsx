import { Metadata } from 'next';
import Privacy from './Privacy';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi - RajaOTP',
  description: 'Kebijakan Privasi RajaOTP menjelaskan bagaimana kami menangani dan melindungi data pribadi Anda.',
  openGraph: {
    title: 'Kebijakan Privasi - RajaOTP',
    description: 'Kebijakan Privasi RajaOTP',
    type: 'website',
    locale: 'id_ID',
  },
};

export default function PrivacyPage() {
  return <Privacy />;
}
