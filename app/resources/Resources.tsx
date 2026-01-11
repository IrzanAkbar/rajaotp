'use client';

import { motion } from 'framer-motion';
import Breadcrumb from '@/app/components/Breadcrumb';
import { MessageSquare, Book, Users } from 'lucide-react';

export default function Resources() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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

  const resources = [
    {
      icon: MessageSquare,
      title: 'Bot Telegram RajaOTP',
      description: 'Akses langsung ke bot Telegram resmi untuk pemesanan OTP instan dan dukungan real-time.',
      link: 'https://t.me/rajaotpoffc_bot',
      label: 'Buka Bot',
      external: true,
    },
    {
      icon: Book,
      title: 'Dokumentasi',
      description: 'Panduan lengkap penggunaan layanan RajaOTP, fitur-fitur, dan best practices.',
      link: '#',
      label: 'Baca Dokumentasi',
      external: false,
    },
    {
      icon: Users,
      title: 'Customer Service (@nKobalt)',
      description: 'Hubungi admin resmi kami untuk pertanyaan, kendala, atau feedback mengenai layanan RajaOTP.',
      link: 'https://t.me/nKobalt',
      label: 'Chat dengan @nKobalt',
      external: true,
    },
  ];

  return (
    <main className="bg-black pt-20 pb-12 sm:pt-24 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Resources' },
          ]}
        />

        {/* Header */}
        <motion.div variants={itemVariants} className="mb-12 sm:mb-14 md:mb-16">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Resources <span className="text-yellow-400">RajaOTP</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl">
            Akses semua alat dan panduan yang Anda butuhkan untuk memaksimalkan penggunaan layanan RajaOTP.
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full mt-3 sm:mt-4"></div>
        </motion.div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-14 md:mb-16">
          {resources.map((resource, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-yellow-600/30 transition-all duration-300"
            >
              {/* Icon */}
              <resource.icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-400 mb-4 sm:mb-5 md:mb-6 group-hover:scale-110 transition-transform duration-300" />

              {/* Content */}
              <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3">{resource.title}</h3>
              <p className="text-slate-400 mb-4 sm:mb-5 md:mb-6 leading-relaxed text-xs sm:text-sm md:text-base">
                {resource.description}
              </p>

              {/* Link */}
              <a
                href={resource.link}
                target={resource.external ? '_blank' : undefined}
                rel={resource.external ? 'noopener noreferrer' : undefined}
                className="inline-block w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-all duration-300 group-hover:shadow-lg text-center text-xs sm:text-sm md:text-base"
              >
                {resource.label} →
              </a>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          variants={itemVariants}
          className="bg-yellow-500/5 border border-yellow-600/20 rounded-lg sm:rounded-2xl p-5 sm:p-6 md:p-8 text-center"
        >
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">Butuh Bantuan Lebih Lanjut?</h2>
          <p className="text-slate-300 mb-4 sm:mb-5 md:mb-6 text-xs sm:text-sm md:text-base">
            Jangan ragu untuk menghubungi tim support kami melalui Bot Telegram atau langsung chat dengan admin resmi kami. Kami siap membantu 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <motion.a
              href="https://t.me/rajaotpoffc_bot"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm md:text-base"
            >
              Chat Bot RajaOTP
            </motion.a>
            <motion.a
              href="https://t.me/nKobalt"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 transition-all text-xs sm:text-sm md:text-base"
            >
              Chat @nKobalt (Admin)
            </motion.a>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
