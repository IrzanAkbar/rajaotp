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
      title: 'Support & Bantuan',
      description: 'Hubungi tim support kami melalui Bot Telegram untuk pertanyaan, kendala, atau feedback mengenai layanan.',
      link: 'https://t.me/rajaotpoffc_bot',
      label: 'Hubungi Support',
      external: true,
    },
  ];

  return (
    <main className="min-h-screen bg-black pt-32 pb-20 px-4 sm:px-6 lg:px-8">
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
        <motion.div variants={itemVariants} className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Resources <span className="text-yellow-400">RajaOTP</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Akses semua alat dan panduan yang Anda butuhkan untuk memaksimalkan penggunaan layanan RajaOTP.
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full mt-4"></div>
        </motion.div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-16">
          {resources.map((resource, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group p-6 sm:p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-yellow-600/30 transition-all duration-300"
            >
              {/* Icon */}
              <resource.icon className="w-10 h-10 text-yellow-400 mb-6 group-hover:scale-110 transition-transform duration-300" />

              {/* Content */}
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{resource.title}</h3>
              <p className="text-slate-400 mb-6 leading-relaxed text-sm sm:text-base">
                {resource.description}
              </p>

              {/* Link */}
              <a
                href={resource.link}
                target={resource.external ? '_blank' : undefined}
                rel={resource.external ? 'noopener noreferrer' : undefined}
                className="inline-block w-full sm:w-auto px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-all duration-300 group-hover:shadow-lg text-center text-sm sm:text-base"
              >
                {resource.label} →
              </a>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          variants={itemVariants}
          className="bg-yellow-500/5 border border-yellow-600/20 rounded-2xl p-6 sm:p-8 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Butuh Bantuan Lebih Lanjut?</h2>
          <p className="text-slate-300 mb-6 text-sm sm:text-base">
            Jangan ragu untuk menghubungi tim support kami melalui Bot Telegram. Kami siap membantu 24/7.
          </p>
          <motion.a
            href="https://t.me/rajaotpoffc_bot"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
          >
            Chat dengan Support Kami
          </motion.a>
        </motion.div>
      </motion.div>
    </main>
  );
}
