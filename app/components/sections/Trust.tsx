'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle, Lock } from 'lucide-react';

export default function Trust() {
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

  const trustPoints = [
    {
      icon: ShieldCheck,
      title: 'Transparan',
      description: 'Praktik operasional yang jelas dan dokumentasi yang mudah diakses',
    },
    {
      icon: CheckCircle,
      title: 'Keandalan',
      description: 'Pemantauan operasional dan pemeliharaan untuk menjaga kestabilan layanan',
    },
    {
      icon: Lock,
      title: 'Perlindungan Data',
      description: 'Pendekatan hemat data dengan perlindungan dan enkripsi sesuai praktik industri',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-slate-950 border-t border-slate-800">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-5xl mx-auto"
      >
        {/* Section Title */}
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Mengapa Memilih <span className="text-yellow-400">RajaOTP</span>?
          </h2>
          <p className="text-slate-400 text-lg">
            Kepercayaan adalah fondasi dari setiap layanan kami
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 mx-auto rounded-full mt-4"></div>
        </motion.div>

        {/* Trust Points Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {trustPoints.map((point, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-yellow-600/30 transition-all duration-300 text-center"
            >
              <point.icon className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">{point.title}</h3>
              <p className="text-slate-400 leading-relaxed">{point.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Trust Message */}
        <motion.div
          variants={itemVariants}
          className="bg-yellow-500/5 border border-yellow-600/20 rounded-2xl p-8 md:p-12 text-center"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Dirancang untuk Keandalan
          </h3>
          <p className="text-slate-300 text-lg leading-relaxed max-w-3xl mx-auto">
            RajaOTP dirancang untuk memberikan pengalaman verifikasi yang tenang dan dapat diandalkan, didukung oleh pemantauan dan praktik operasional yang matang.
          </p>

          {/* Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10">
            <motion.div variants={itemVariants}>
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">Pemantauan</div>
              <p className="text-slate-400">Pemantauan operasional</p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">Respons</div>
              <p className="text-slate-400">Pengiriman otomatis yang andal</p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">Dukungan</div>
              <p className="text-slate-400">Saluran bantuan melalui Bot</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
