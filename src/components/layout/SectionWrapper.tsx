'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeInUp } from '@/lib/animations';

interface SectionWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  alt?: boolean;
  dark?: boolean;
}

export function SectionWrapper({ id, children, className, alt = false, dark = false }: SectionWrapperProps) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeInUp}
      className={cn(
        'py-16 md:py-24 px-4',
        alt && 'bg-bg-subtle',
        dark && 'bg-navy-deep text-white',
        className
      )}
    >
      <div className="max-w-6xl mx-auto">{children}</div>
    </motion.section>
  );
}
