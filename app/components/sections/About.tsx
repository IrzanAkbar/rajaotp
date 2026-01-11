'use client';

import { motion } from 'framer-motion';
import { Zap, Lock, Check, Target, Shield } from 'lucide-react';

export default function About() {
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

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 border-t border-slate-800">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-4xl mx-auto"
      >
        {/* Section Title */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Tentang <span className="text-yellow-400">RajaOTP</span>
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 mx-auto rounded-full"></div>
        </motion.div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <motion.div variants={itemVariants} className="space-y-6">
            <p className="text-slate-300 text-lg leading-relaxed">
                  RajaOTP dirancang untuk kebutuhan OTP yang mengutamakan kestabilan dan kerapihan sistem.
            </p>

            <p className="text-slate-300 text-lg leading-relaxed">
                  Layanan ini dibangun agar proses verifikasi menjadi sederhana, dapat dipercaya, dan mudah diintegrasikan. Fokus utama adalah menjaga keandalan operasional dan perlindungan data secara profesional.
            </p>

            <div className="space-y-4 pt-4">
              <motion.div
                variants={itemVariants}
                className="flex items-start gap-3"
              >
                <Zap className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Kecepatan Instan</h4>
                  <p className="text-slate-400 text-sm">Dapatkan OTP dalam hitungan detik tanpa penundaan</p>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex items-start gap-3"
              >
                <Lock className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Sistem Aman</h4>
                  <p className="text-slate-400 text-sm">Enkripsi tingkat tinggi untuk melindungi data Anda</p>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex items-start gap-3"
              >
                <Check className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Mudah Digunakan</h4>
                  <p className="text-slate-400 text-sm">Interface intuitif yang dapat diakses siapa saja</p>
                </div>
              </motion.div>
                  <motion.div
                    variants={itemVariants}
                    className="flex items-start gap-3"
                  >
                    <Target className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">Pendekatan Profesional</h4>
                      <p className="text-slate-400 text-sm">Praktik operasional yang rapi dan terukur, bukan solusi sementara</p>
                    </div>
                  </motion.div>
            </div>
          </motion.div>

          {/* Right Visual - Brand Pillar Card */}
          <motion.div
            variants={itemVariants}
            className="hidden md:flex items-center justify-center"
          >
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-72 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-yellow-600/20 rounded-3xl p-8 text-center backdrop-blur-sm"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Shield className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-3">
                Keamanan & Keandalan
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Pendekatan sistem yang rapi dan profesional untuk operasional OTP jangka panjang.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
