'use client';

import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'chart' | 'detail';
  count?: number;
}

export default function SkeletonLoader({ type = 'card', count = 1 }: SkeletonLoaderProps) {
  const items = Array.from({ length: count });

  const pulse = {
    animate: {
      opacity: [0.4, 0.7, 0.4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  if (type === 'card') {
    return (
      <div className="grid md:grid-cols-2 gap-5 w-full">
        {items.map((_, idx) => (
          <motion.div
            key={idx}
            variants={pulse}
            animate="animate"
            className="bg-card/60 border border-border/60 rounded-2xl p-5 space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="w-16 h-4 bg-border/80 rounded-md"></div>
              <div className="w-20 h-4 bg-border/80 rounded-md"></div>
            </div>
            <div className="h-6 bg-border/80 rounded-md w-3/4"></div>
            <div className="h-4 bg-border/80 rounded-md w-full"></div>
            <div className="h-4 bg-border/80 rounded-md w-5/6"></div>
            <div className="h-10 bg-border/80 rounded-xl w-full mt-3"></div>
            <div className="flex justify-between items-center pt-2">
              <div className="w-24 h-4 bg-border/60 rounded-md"></div>
              <div className="w-16 h-4 bg-border/60 rounded-md"></div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3 w-full">
        {items.map((_, idx) => (
          <motion.div
            key={idx}
            variants={pulse}
            animate="animate"
            className="p-3 bg-card/40 border border-border/50 rounded-xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center space-x-3 w-2/3">
              <div className="w-8 h-8 rounded-full bg-border/80"></div>
              <div className="space-y-1.5 w-full">
                <div className="w-1/3 h-3 bg-border/80 rounded-md"></div>
                <div className="w-2/3 h-2.5 bg-border/60 rounded-md"></div>
              </div>
            </div>
            <div className="w-12 h-4 bg-border/80 rounded-md text-right"></div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <motion.div
        variants={pulse}
        animate="animate"
        className="bg-card border border-border/80 rounded-2xl p-6 space-y-4 w-full"
      >
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="w-32 h-4 bg-border/80 rounded-md"></div>
            <div className="w-20 h-3 bg-border/60 rounded-md"></div>
          </div>
          <div className="w-24 h-8 bg-border/80 rounded-lg"></div>
        </div>
        <div className="h-64 bg-border/40 rounded-xl w-full flex items-end justify-between p-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-border/60 rounded-t-sm w-full"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            ></div>
          ))}
        </div>
      </motion.div>
    );
  }

  return null;
}
