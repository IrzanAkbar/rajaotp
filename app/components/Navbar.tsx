'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-shrink-0"
          >
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo/logo.png"
                alt="RajaOTP Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
                priority
              />
              <span className="text-lg font-bold">Raja<span className="text-yellow-400">OTP</span></span>
            </Link>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-slate-300 hover:text-yellow-400 transition-colors text-sm font-medium">
              Fitur
            </Link>
            <Link href="/#how-it-works" className="text-slate-300 hover:text-yellow-400 transition-colors text-sm font-medium">
              Cara Kerja
            </Link>
            <Link href="/resources" className="text-slate-300 hover:text-yellow-400 transition-colors text-sm font-medium">
              Resources
            </Link>
            <Link href="/#faq" className="text-slate-300 hover:text-yellow-400 transition-colors text-sm font-medium">
              FAQ
            </Link>
            <motion.a
              href="https://t.me/rajaotpoffc_bot"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg text-sm transition-colors"
            >
              Bot Telegram →
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2"
            whileTap={{ scale: 0.95 }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-slate-800 py-4 space-y-3"
          >
            <Link
              href="/#features"
              className="block text-slate-300 hover:text-yellow-400 transition-colors text-sm font-medium px-2 py-2"
              onClick={() => setIsOpen(false)}
            >
              Fitur
            </Link>
            <Link
              href="/#how-it-works"
              className="block text-slate-300 hover:text-yellow-400 transition-colors text-sm font-medium px-2 py-2"
              onClick={() => setIsOpen(false)}
            >
              Cara Kerja
            </Link>
            <Link
              href="/resources"
              className="block text-slate-300 hover:text-yellow-400 transition-colors text-sm font-medium px-2 py-2"
              onClick={() => setIsOpen(false)}
            >
              Resources
            </Link>
            <Link
              href="/#faq"
              className="block text-slate-300 hover:text-yellow-400 transition-colors text-sm font-medium px-2 py-2"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </Link>
            <a
              href="https://t.me/rajaotpoffc_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg text-center text-sm transition-colors"
            >
              Bot Telegram →
            </a>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
