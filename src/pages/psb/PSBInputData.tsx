import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PSBInputDialog } from '@/components/psb/PSBInputDialog';
import { RecentPSBOrders } from '@/components/psb/RecentPSBOrders';
import { ClipboardList, Sparkles } from 'lucide-react';

export const PSBInputData: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOrderCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-8 p-0">
      {/* Modern Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 sm:p-8"
      >
        {/* Decorative background icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
          <ClipboardList className="h-36 w-36" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-2">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              PSB Management
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Input Data PSB
            </h1>
            <p className="text-sm text-muted-foreground max-w-md">
              Kelola data order Pasang Baru dengan mudah. Tambahkan order baru dan pantau status terkini dalam satu tampilan.
            </p>
          </div>

          <div className="sm:shrink-0">
            <PSBInputDialog onOrderCreated={handleOrderCreated} />
          </div>
        </div>
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
        className="w-full"
      >
        <RecentPSBOrders refreshTrigger={refreshTrigger} />
      </motion.div>
    </div>
  );
};
