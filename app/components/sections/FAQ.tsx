'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'Apakah RajaOTP aman digunakan?',
      answer:
        'RajaOTP dirancang dengan perlindungan data sebagai prioritas. Enkripsi dan praktik minimal data memastikan keamanan yang tenang dan profesional.',
    },
    {
      question: 'Apakah OTP dikirim secara real-time?',
      answer:
        'OTP dikirim melalui mekanisme otomatis yang dioptimalkan untuk keandalan; tujuan operasionalnya adalah pengiriman cepat dalam kondisi normal.',
    },
    {
      question: 'Apa fokus utama RajaOTP?',
      answer: 'Fokus utama RajaOTP adalah stabilitas operasi, kerapihan sistem, dan perlindungan data untuk pengalaman verifikasi yang dapat dipercaya.',
    },
    {
      question: 'Apakah data saya disimpan?',
      answer:
        'Hanya data minimal yang diperlukan disimpan. OTP bersifat sementara dan tidak disimpan secara permanen. Baca Kebijakan Privasi untuk detail lengkap.',
    },
    {
      question: 'Apakah perlu registrasi atau login?',
      answer:
        'Tidak perlu registrasi. Layanan dapat diakses langsung melalui Bot Telegram untuk alur yang sederhana dan tanpa hambatan.',
    },
    {
      question: 'Jika OTP gagal, apa solusinya?',
      answer:
        'Permintaan ulang OTP dapat dilakukan melalui Bot Telegram. Jika masalah berlanjut, hubungi support melalui Bot untuk bantuan cepat.',
    },
  ];

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

  return (
    <section id="faq" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black border-t border-slate-800">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="max-w-3xl mx-auto"
      >
        {/* Section Title */}
        <motion.div variants={itemVariants} className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Pertanyaan <span className="text-yellow-400">Umum</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base md:text-lg">
            Jawaban atas pertanyaan yang paling sering ditanyakan
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full mt-4 mx-auto"></div>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-slate-900/50 border border-slate-800 rounded-lg sm:rounded-2xl overflow-hidden hover:border-yellow-600/30 transition-all duration-300"
            >
              {/* Question Button */}
              <motion.button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                whileHover={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
                className="w-full text-left p-4 sm:p-5 md:p-6 flex items-center justify-between gap-3 sm:gap-4"
              >
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white">{faq.question}</h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </motion.div>
              </motion.button>

              {/* Answer Content */}
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden border-t border-slate-700"
                  >
                    <p className="p-4 sm:p-5 md:p-6 text-slate-300 text-sm sm:text-base leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div variants={itemVariants} className="mt-10 sm:mt-12 text-center">
          <p className="text-slate-400 text-sm sm:text-base mb-4 sm:mb-6">
            Masih ada pertanyaan? Hubungi tim support kami.
          </p>
          <motion.a
            href="https://t.me/rajaotpoffc_bot"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-lg text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Chat dengan Support →
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
}
