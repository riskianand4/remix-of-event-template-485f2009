import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, Download } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';

interface PSBReportsHeaderProps {
  dateRange: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  onRefresh: () => void;
  onExport: () => void;
}

export const PSBReportsHeader: React.FC<PSBReportsHeaderProps> = ({
  dateRange,
  onDateChange,
  onRefresh,
  onExport
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-[360px] sm:w-full "
    >
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Laporan PSB
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Monitoring performa pemasangan dan aktivasi layanan PSB
        </p>
      </div>
      <div className="flex flex-row sm:flex-row gap-2 sm:gap-3">
        <Button variant="outline" className='w-full' size="sm" onClick={onRefresh}>
          <Calendar className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button size="sm" className="w-full sm:w-auto" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          <span className="hidden xs:inline">Export Laporan</span>
          <span className="xs:hidden">Export</span>
        </Button>
      </div>
    </motion.div>
  );
};