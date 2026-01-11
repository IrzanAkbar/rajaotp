'use client';

import { motion } from 'framer-motion';
import Breadcrumb from '@/app/components/Breadcrumb';

const sections = [
  {
    title: "1. Penerimaan Syarat",
    content: "Dengan mengakses dan menggunakan layanan RajaOTP, Anda menyetujui untuk mematuhi semua syarat dan ketentuan yang diuraikan dalam dokumen ini. Penggunaan layanan menandakan persetujuan.",
  },
  {
    title: "2. Penggunaan Layanan",
    content: "Layanan RajaOTP harus digunakan untuk tujuan yang sah dan sesuai hukum. Pengguna bertanggung jawab atas tindakan yang dilakukan melalui layanan.",
  },
  {
    title: "3. Larangan Aktivitas Ilegal",
    content: "Pengguna dilarang menggunakan layanan RajaOTP untuk aktivitas ilegal, termasuk penipuan, pencurian identitas, pencucian uang, spam, phishing, atau aktivitas merugikan lainnya.",
  },
  {
    title: "4. Tanggung Jawab Pengguna",
    content: "Pengguna bertanggung jawab atas semua aktivitas di akun mereka. Pengguna harus menjaga kerahasiaan kredensial dan segera memberi tahu tentang penggunaan tidak sah.",
  },
  {
    title: "5. Penyalahgunaan Layanan",
    content: "Jika terdeteksi penyalahgunaan layanan, RajaOTP dapat menangguhkan atau menghentikan akses untuk melindungi integritas sistem. Penanganan dilakukan sesuai prosedur internal.",
  },
  {
    title: "6. Layanan Apa Adanya",
    content: "Layanan disediakan sesuai kondisi operasional. RajaOTP berupaya menjaga kualitas, namun pengguna memahami bahwa tidak ada layanan yang sepenuhnya bebas risiko teknis.",
  },
  {
    title: "7. Pembatasan Tanggung Jawab",
    content: "RajaOTP tidak bertanggung jawab atas kerugian langsung, tidak langsung, insidental, khusus, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan.",
  },
  {
    title: "8. Perubahan Layanan",
    content: "RajaOTP dapat melakukan perubahan terhadap layanan untuk perbaikan atau pemeliharaan. Perubahan akan diumumkan bila perlu; penggunaan layanan setelah perubahan menunjukkan penerimaan.",
  },
  {
    title: "9. Konten Pengguna",
    content: "Pengguna memiliki tanggung jawab penuh atas konten atau informasi yang diberikan kepada kami. Pengguna menjamin bahwa konten tidak melanggar hak kekayaan intelektual atau privasi.",
  },
  {
    title: "10. Penghentian Akun",
    content: "RajaOTP dapat menangguhkan atau menghapus akun jika terdeteksi pelanggaran syarat atau aktivitas mencurigakan. Akun yang dihapus tidak dapat dipulihkan.",
  },
  {
    title: "11. Pembaruan Syarat",
    content: "Syarat dan ketentuan dapat diperbarui dari waktu ke waktu. Pembaruan akan dipublikasikan secara jelas; penggunaan berkelanjutan dianggap sebagai penerimaan terhadap pembaruan.",
  },
  {
    title: "12. Hukum yang Berlaku",
    content: "Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum yang berlaku di Indonesia. Setiap sengketa akan diselesaikan di pengadilan yang berwenang.",
  },
];

export default function Terms() {
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
            { label: 'Syarat & Ketentuan' },
          ]}
        />

        <motion.div variants={itemVariants} className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Syarat & <span className="text-yellow-400">Ketentuan</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full mt-4"></div>
        </motion.div>

        <motion.p variants={itemVariants} className="text-lg text-slate-300 mb-12 leading-relaxed">
          Syarat dan ketentuan ini mengatur penggunaan layanan RajaOTP. Bacalah dengan cermat; penggunaan layanan menandakan persetujuan terhadap ketentuan yang berlaku.
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
          <p className="text-slate-300 mb-4">
            Dengan menggunakan layanan RajaOTP, Anda secara tegas menyetujui semua syarat dan ketentuan yang tercantum di atas.
          </p>
          <p className="text-slate-400 text-sm">
            Jika Anda memiliki pertanyaan, silakan hubungi tim support melalui{' '}
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
