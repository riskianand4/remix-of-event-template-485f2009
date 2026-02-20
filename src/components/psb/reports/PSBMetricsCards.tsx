import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, CheckCircle, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface PSBMetricsCardsProps {
  overallEfficiency: string;
  installationEfficiency: string;
  activationEfficiency: string;
  avgSignalLevel: string;
}

const statCards = [
  { key: 'overall', label: 'Overall Efficiency', icon: Target, suffix: '%', accentBar: 'border-l-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { key: 'installation', label: 'Installation Rate', icon: CheckCircle, suffix: '%', accentBar: 'border-l-blue-500', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
  { key: 'activation', label: 'Activation Rate', icon: Zap, suffix: '%', accentBar: 'border-l-green-500', iconBg: 'bg-green-500/10', iconColor: 'text-green-500' },
  { key: 'signal', label: 'Avg Signal Level', icon: Activity, suffix: ' dBm', accentBar: 'border-l-orange-500', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-500' },
] as const;

export const PSBMetricsCards: React.FC<PSBMetricsCardsProps> = ({
  overallEfficiency, installationEfficiency, activationEfficiency, avgSignalLevel
}) => {
  const values: Record<string, string> = {
    overall: overallEfficiency,
    installation: installationEfficiency,
    activation: activationEfficiency,
    signal: avgSignalLevel,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, i) => {
        const IconEl = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`border-l-4 ${card.accentBar} border-border/50 hover:shadow-md transition-shadow relative overflow-hidden`}>
              <div className="absolute top-0 right-0 opacity-[0.05]">
                <IconEl className="w-20 h-20 -mt-2 -mr-2" />
              </div>
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{card.label}</p>
                <p className="text-2xl sm:text-3xl font-bold">{values[card.key]}{card.suffix}</p>
                <div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center mt-2`}>
                  <IconEl className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
