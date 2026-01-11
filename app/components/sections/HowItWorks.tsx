'use client';

import { motion } from 'framer-motion';

export default function HowItWorks() {
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
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const steps = [
    {
      number: '01',
      title: 'Pilih Layanan',
      description: 'Pilih platform atau layanan yang membutuhkan verifikasi OTP dari daftar yang tersedia',
    },
    {
      number: '02',
      title: 'Pesan OTP',
      description: 'Lakukan pemesanan OTP melalui Bot Telegram RajaOTP dengan perintah sederhana',
    },
    {
      number: '03',
      title: 'Terima Kode',
      description: 'Dapatkan kode OTP instan di pesan Telegram Anda dalam hitungan detik',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black border-t border-slate-800">
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
            Cara Kerja <span className="text-yellow-400">RajaOTP</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Proses sederhana dalam 3 langkah mudah
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 mx-auto rounded-full mt-4"></div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex gap-6 md:gap-8 items-start"
            >
              {/* Step Number Circle */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center"
              >
                <span className="text-2xl md:text-3xl font-bold text-black">
                  {step.number}
                </span>
              </motion.div>

              {/* Content */}
              <div className="flex-grow pt-2 md:pt-3">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector Line (hidden on last item) */}
              {index < steps.length - 1 && (
                <motion.div
                  className="hidden md:block absolute left-40 w-1 h-16 bg-gradient-to-b from-yellow-400/50 to-transparent"
                  style={{ marginLeft: '-140px', marginTop: '120px' }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          variants={itemVariants}
          className="mt-16 text-center flex justify-center"
        >
          <motion.a
            href="https://t.me/rajaotpoffc_bot"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-lg text-base sm:text-lg shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            Mulai Sekarang →
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
}
