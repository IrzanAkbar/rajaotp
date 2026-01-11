'use client';

import { motion } from 'framer-motion';
import { Zap, Lock, Target, CheckCircle, Globe, Headphones } from 'lucide-react';

export default function Features() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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

  const features = [
    {
      icon: Zap,
      title: 'Respon Cepat',
      description: 'Kode OTP dikirim dalam waktu kurang dari 1 detik. Sistem kami dioptimalkan untuk kecepatan maksimal.',
    },
    {
      icon: Lock,
      title: 'Aman & Terenkripsi',
      description: 'Data dilindungi dengan enkripsi tingkat tinggi. Keamanan adalah prioritas utama kami.',
    },
    {
      icon: Target,
      title: 'Tanpa Registrasi',
      description: 'Mulai gunakan langsung melalui Bot Telegram tanpa proses pendaftaran yang rumit.',
    },
    {
      icon: CheckCircle,
      title: 'Terpercaya & Stabil',
      description: 'Uptime 99.9% dengan sistem monitoring 24/7 untuk layanan yang selalu reliable.',
    },
    {
      icon: Globe,
      title: 'Jangkauan Global',
      description: 'Layanan kami tersedia untuk berbagai negara dan platform internasional.',
    },
    {
      icon: Headphones,
      title: 'Support 24/7',
      description: 'Tim dukungan siap membantu Anda kapan saja diperlukan',
    },
  ];

  return (
    <section
      id="features"
      className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-black border-t border-slate-800"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="max-w-6xl mx-auto"
      >
        {/* Section Title */}
        <motion.div variants={itemVariants} className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Fitur Unggulan <span className="text-yellow-400">RajaOTP</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Semua yang Anda butuhkan untuk mengelola OTP dengan mudah dan aman
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 mx-auto rounded-full mt-4"></div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-yellow-600/30 transition-all duration-300 group"
            >
              <feature.icon className="w-6 sm:w-8 h-6 sm:h-8 text-yellow-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
