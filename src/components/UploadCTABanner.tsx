'use client';

import React from 'react';
import { UploadCloud, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function UploadCTABanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card overflow-hidden relative group"
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors duration-500"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-colors duration-500"></div>

      <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex flex-center shadow-[0_0_20px_rgba(99,102,241,0.4)] shrink-0">
            <Gift className="w-8 h-8 text-white" />
          </div>
          
          <div className="flex flex-col">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Share Your Notes, <span className="text-gradient">Earn Rewards!</span>
            </h2>
            <p className="text-[var(--clr-text-2)] max-w-lg text-sm md:text-base">
              Help your fellow students by uploading your study materials. Earn points for every approved note and redeem them for exclusive benefits and premium access.
            </p>
          </div>
        </div>

        <Link href="/upload" className="w-full md:w-auto">
          <button className="btn btn-primary btn-lg w-full md:w-auto group/btn flex items-center justify-center gap-2">
            <UploadCloud className="w-5 h-5" />
            <span>Upload Notes Now</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
