import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, CheckCircle, Zap, Activity } from 'lucide-react';

interface PSBMetricsCardsProps {
  overallEfficiency: string;
  installationEfficiency: string;
  activationEfficiency: string;
  avgSignalLevel: string;
}

export const PSBMetricsCards: React.FC<PSBMetricsCardsProps> = ({
  overallEfficiency,
  installationEfficiency,
  activationEfficiency,
  avgSignalLevel
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overall Efficiency</p>
              <p className="text-2xl font-bold text-primary">{overallEfficiency}%</p>
            </div>
            <Target className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Installation Rate</p>
              <p className="text-2xl font-bold text-blue-600">{installationEfficiency}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Activation Rate</p>
              <p className="text-2xl font-bold text-green-600">{activationEfficiency}%</p>
            </div>
            <Zap className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Signal Level</p>
              <p className="text-2xl font-bold text-orange-600">{avgSignalLevel} dBm</p>
            </div>
            <Activity className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};