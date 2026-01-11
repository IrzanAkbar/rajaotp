'use client';

import { motion } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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
    <section className="relative flex items-center justify-center pt-20 pb-16 sm:pt-28 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-slate-900 to-slate-950">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl mx-auto text-center w-full"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-8">
          <span className="inline-block px-4 py-2 bg-yellow-900/20 text-yellow-400 rounded-full text-sm font-medium border border-yellow-700/30 flex items-center gap-2 w-fit mx-auto">
            <Sparkles className="w-4 h-4" />
            Layanan OTP Terpercaya
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight"
        >
          RajaOTP — Layanan OTP Profesional
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          RajaOTP dirancang untuk kebutuhan OTP dengan sistem yang rapi dan aman.
        </motion.p>

        {/* Trust Micro-Text */}
        <motion.div
          variants={itemVariants}
          className="mb-10 flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap"
        >
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Check className="w-4 h-4 text-yellow-400" />
            <span>Tanpa registrasi</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-slate-600 rounded-full"></div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Check className="w-4 h-4 text-yellow-400" />
            <span>Sistem otomatis</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-slate-600 rounded-full"></div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Check className="w-4 h-4 text-yellow-400" />
            <span>Pendekatan profesional</span>
          </div>
        </motion.div>

        {/* CTA Button - Z-Index Fix */}
        <div className="relative z-20 mt-6 sm:mt-8 w-full">
          <div className="mx-auto flex w-full flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-center sm:max-w-md">
            <a
              href="https://t.me/rajaotpoffc_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-20 block w-full rounded-lg bg-yellow-400 px-5 py-3 sm:px-6 sm:py-3 text-center font-semibold text-black text-sm sm:text-base transition-all duration-300 hover:bg-yellow-500 cursor-pointer sm:w-auto"
            >
              Buka Bot Telegram
            </a>

            <a
              href="#features"
              className="relative z-20 block w-full rounded-lg border border-yellow-400/40 px-5 py-3 sm:px-6 sm:py-3 text-center font-semibold text-yellow-400 text-sm sm:text-base transition-all duration-300 hover:border-yellow-400 hover:bg-yellow-400/5 cursor-pointer sm:w-auto"
            >
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
