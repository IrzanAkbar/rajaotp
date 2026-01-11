'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <footer className="bg-black border-t border-slate-800">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Main Footer Content - 5 Column Enterprise Layout */}
        <div className="grid md:grid-cols-5 gap-8 py-16 border-b border-slate-800">
          {/* Brand Section */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/logo/logo.png"
                alt="RajaOTP Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <h3 className="text-2xl font-bold text-white">
                Raja<span className="text-yellow-400">OTP</span>
              </h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Layanan OTP otomatis yang cepat, aman, dan terpercaya.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://t.me/rajaotpoffc_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Telegram"
              >
                <MessageSquare className="w-5 h-5" />
              </a>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Dikelola oleh <a href="https://t.me/nKobalt" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300 transition-colors">@nKobalt</a>
            </p>
          </motion.div>

          {/* Product */}
          <motion.div variants={itemVariants}>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">
              Produk
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#faq" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/resources" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">
                  Resources
                </a>
              </li>
              <li>
                <a href="https://t.me/rajaotpoffc_bot" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">
                  Bot Telegram
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div variants={itemVariants}>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">
              Perusahaan
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">
                  Tentang
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">
                  Blog
                </a>
              </li>
              <li>
                <a href="https://t.me/rajaotpoffc_bot" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">
                  Hubungi Kami
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div variants={itemVariants}>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/privacy" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">
                  Privasi
                </a>
              </li>
              <li>
                <a href="/terms" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">
                  Syarat & Ketentuan
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">
                  Lisensi
                </a>
              </li>
            </ul>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">
                Mulai Sekarang
              </h4>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Akses instan ke layanan OTP kami melalui Bot Telegram.
              </p>
            </div>
            <motion.a
              href="https://t.me/rajaotpoffc_bot"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors text-sm text-center"
            >
              Bot Telegram →
            </motion.a>
          </motion.div>
        </div>

        {/* Bottom Footer */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm text-center md:text-left">
            &copy; {currentYear} RajaOTP. Semua hak dilindungi.
          </p>

          <ul className="flex gap-6 flex-wrap justify-center md:justify-end">
            <li>
              <a href="/privacy" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">
                Kebijakan Privasi
              </a>
            </li>
            <li>
              <a href="/terms" className="text-slate-400 hover:text-yellow-400 transition-colors text-sm">
                Syarat & Ketentuan
              </a>
            </li>
          </ul>
        </div>

        {/* Disclaimer */}
        <motion.div
          variants={itemVariants}
          className="border-t border-slate-800 pt-8 pb-8"
        >
          <motion.p className="text-slate-500 text-xs text-center">
            RajaOTP adalah layanan otomasi OTP yang aman dan transparan. Kami berkomitmen untuk memberikan kualitas terbaik dalam setiap layanan.
          </motion.p>
        </motion.div>
      </motion.div>
    </footer>
  );
}
