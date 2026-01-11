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
    <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black border-t border-slate-800">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative z-10 max-w-4xl mx-auto"
      >
        {/* Background Decoration - MUST NOT CAPTURE CLICKS */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 rounded-2xl sm:rounded-3xl blur-3xl -z-10 pointer-events-none"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Main Headline */}
          <motion.h2
            variants={itemVariants}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6"
          >
            Siap untuk Mengubah Cara Anda{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500">
              Verifikasi OTP?
            </span>
          </motion.h2>

          {/* Supporting Text */}
          <motion.p
            variants={itemVariants}
            className="text-sm sm:text-base md:text-lg text-slate-300 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Jangan tunda lagi. Dapatkan akses instant ke RajaOTP dan nikmati kemudahan verifikasi tanpa batas.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            variants={itemVariants}
            className="relative z-20 flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-center w-full sm:items-center"
          >
            <motion.a
              href="https://t.me/rajaotpoffc_bot"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-20 w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-lg text-sm sm:text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl text-center cursor-pointer"
            >
              Mulai Gunakan RajaOTP
            </motion.a>
          </motion.div>

          {/* Confidence Badge */}
          <motion.p
            variants={itemVariants}
            className="text-xs sm:text-sm text-slate-400 mt-6 sm:mt-8"
          >
            ✓ Murah • ✓ Cepat • ✓ Aman
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
