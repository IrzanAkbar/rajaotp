'use client';

import { motion } from 'framer-motion';
import { Zap, Lock, Wind, CheckCircle } from 'lucide-react';

export default function TrustFoundation() {
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

  const trustPoints = [
    {
      icon: Zap,
      title: 'Sistem Otomatis',
      description: 'Proses verifikasi otomatis yang dirancang untuk konsistensi dan stabilitas',
    },
    {
      icon: Lock,
      title: 'Privasi Terjaga',
      description: 'OTP bersifat sementara dan tidak disimpan secara permanen',
    },
    {
      icon: Wind,
      title: 'Pendekatan Profesional',
      description: 'Pendekatan operasional yang menekankan keandalan dan kerapihan sistem',
    },
    {
      icon: CheckCircle,
      title: 'Tanpa Registrasi',
      description: 'Gunakan layanan langsung tanpa proses pendaftaran yang rumit',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-black border-t border-slate-800">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-6xl mx-auto"
      >
        {/* Grid of Trust Points */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trustPoints.map((point, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group bg-slate-900/40 border border-slate-800 hover:border-yellow-600/20 rounded-xl p-5 transition-all duration-300"
            >
              <point.icon className="w-6 h-6 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-sm font-bold text-white mb-2">{point.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
