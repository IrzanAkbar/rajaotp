'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <motion.nav
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mb-8"
      aria-label="Breadcrumb"
    >
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.href ? (
              <>
                <Link
                  href={item.href}
                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  {item.label}
                </Link>
                {index < items.length - 1 && (
                  <span className="text-slate-500">/</span>
                )}
              </>
            ) : (
              <>
                <span className="text-slate-300">{item.label}</span>
                {index < items.length - 1 && (
                  <span className="text-slate-500">/</span>
                )}
              </>
            )}
          </li>
        ))}
      </ol>
    </motion.nav>
  );
}
