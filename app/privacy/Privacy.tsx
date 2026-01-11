'use client';

import { motion } from 'framer-motion';
import Breadcrumb from '@/app/components/Breadcrumb';

const sections = [
  {
    title: "1. Pengumpulan Data",
    content: "RajaOTP hanya mengumpulkan data minimum yang diperlukan untuk operasional layanan. Data yang dikumpulkan meliputi identifikasi pengguna yang diperlukan untuk memberikan layanan OTP secara akurat.",
  },
  {
    title: "2. Penggunaan Data",
    content: "Data digunakan semata untuk keperluan operasional OTP: verifikasi, autentikasi, dan peningkatan layanan. Penggunaan untuk tujuan lain hanya dilakukan dengan persetujuan yang jelas.",
  },
  {
    title: "3. Penyimpanan OTP",
    content: "Kode OTP bersifat sementara dan tidak disimpan secara permanen dalam sistem. Setiap OTP dirancang untuk digunakan sekali dan otomatis dihapus setelah waktu kadaluarsa.",
  },
  {
    title: "4. Keamanan Data",
    content: "Sistem menerapkan enkripsi dan praktik keamanan yang sesuai dengan standar industri untuk melindungi data dari akses tidak sah. Pengawasan rutin dilakukan untuk menjaga integritas layanan.",
  },
  {
    title: "5. Pembagian Data",
    content: "RajaOTP tidak membagikan data pengguna kepada pihak ketiga tanpa persetujuan. Data hanya diakses oleh tim yang berwenang untuk keperluan operasional dan pemeliharaan layanan.",
  },
  {
    title: "6. Hak Pengguna",
    content: "Anda memiliki hak untuk mengakses, memodifikasi, atau menghapus data pribadi Anda. Untuk memproses permintaan ini, silakan hubungi tim support melalui Bot Telegram.",
  },
  {
    title: "7. Perubahan Kebijakan",
    content: "RajaOTP dapat memperbarui kebijakan privasi dari waktu ke waktu. Perubahan penting akan diumumkan melalui saluran resmi; penggunaan layanan setelah pembaruan dianggap sebagai penerimaan terhadap perubahan tersebut.",
  },
  {
    title: "8. Kontak",
    content: "Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi tim support melalui Bot Telegram RajaOTP.",
  },
];

export default function Privacy() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <main className="min-h-screen bg-black pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Kebijakan Privasi' },
          ]}
        />

        <motion.div variants={itemVariants} className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Kebijakan <span className="text-yellow-400">Privasi</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full mt-4"></div>
        </motion.div>

        <motion.p variants={itemVariants} className="text-lg text-slate-300 mb-12 leading-relaxed">
          RajaOTP dirancang untuk menjaga privasi dengan prinsip minimal data dan transparansi. Dokumen ini menjelaskan bagaimana data ditangani dan dilindungi dalam operasional layanan.
        </motion.p>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.section
              key={index}
              variants={itemVariants}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:border-yellow-600/30 transition-all duration-300"
            >
              <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
              <p className="text-slate-300 leading-relaxed">{section.content}</p>
            </motion.section>
          ))}
        </div>

        <motion.div
          variants={itemVariants}
          className="mt-12 bg-yellow-500/5 border border-yellow-600/20 rounded-2xl p-6 text-center"
        >
          <p className="text-slate-300">
            Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi tim support melalui{' '}
            <a
              href="https://t.me/rajaotpoffc_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:text-yellow-300 font-semibold"
            >
              Bot Telegram
            </a>
            .
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
