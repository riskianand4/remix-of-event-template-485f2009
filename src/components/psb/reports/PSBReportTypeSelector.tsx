import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, PieChart, Users, Package } from 'lucide-react';

const reportTypes = [
  {
    id: 'summary',
    title: 'Laporan Summary',
    description: 'Ringkasan performa PSB secara keseluruhan',
    icon: BarChart3,
    color: 'bg-primary'
  },
  {
    id: 'cluster',
    title: 'Laporan per Cluster',
    description: 'Analisis performa berdasarkan cluster',
    icon: PieChart,
    color: 'bg-green-500'
  },
  {
    id: 'technician',
    title: 'Laporan Teknisi',
    description: 'Evaluasi performa teknisi lapangan',
    icon: Users,
    color: 'bg-purple-500'
  },
  {
    id: 'package',
    title: 'Laporan Paket',
    description: 'Analisis berdasarkan jenis paket layanan',
    icon: Package,
    color: 'bg-orange-500'
  }
];

interface PSBReportTypeSelectorProps {
  selectedReport: string;
  onReportChange: (reportId: string) => void;
}

export const PSBReportTypeSelector: React.FC<PSBReportTypeSelectorProps> = ({
  selectedReport,
  onReportChange
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {reportTypes.map((report, index) => {
        const Icon = report.icon;
        const isSelected = selectedReport === report.id;
        
        return (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'ring-2 ring-primary shadow-md' 
                  : 'hover:ring-1 hover:ring-primary/50'
              }`}
              onClick={() => onReportChange(report.id)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${report.color} bg-opacity-10 flex items-center justify-center`}>
                    <Icon className="h-6 w-6" style={{ color: report.color.includes('primary') ? 'hsl(var(--primary))' : undefined }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{report.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {report.description}
                    </p>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};