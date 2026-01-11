'use client';

import { motion } from 'framer-motion';

export default function CTA() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black border-t border-slate-800">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-4xl mx-auto"
      >
        {/* Background Decoration */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 rounded-3xl blur-3xl"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Content */}
        <div className="relative text-center">
          {/* Main Headline */}
          <motion.h2
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Siap untuk Mengubah Cara Anda{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500">
              Verifikasi OTP?
            </span>
          </motion.h2>

          {/* Supporting Text */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Jangan tunda lagi. Dapatkan akses instant ke RajaOTP dan nikmati kemudahan verifikasi tanpa batas.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center w-full"
          >
            <motion.a
              href="https://t.me/rajaotpoffc_bot"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.08, boxShadow: '0 25px 50px rgba(234, 179, 8, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-lg text-base sm:text-xl transition-all duration-300 shadow-xl hover:shadow-2xl text-center"
            >
              Mulai Gunakan RajaOTP
            </motion.a>
          </motion.div>

          {/* Confidence Badge */}
          <motion.p
            variants={itemVariants}
            className="text-sm text-slate-400 mt-8"
          >
            ✓ Gratis • ✓ Cepat • ✓ Aman
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
