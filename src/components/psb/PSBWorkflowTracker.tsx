import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  UserCheck, 
  Search, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  User,
  MapPin,
  Wrench
} from 'lucide-react';
import { PSBOrder } from '@/types/psb';
import { format } from 'date-fns';
import { getTechnicianName } from '@/utils/psbHelpers';

interface PSBWorkflowTrackerProps {
  order: PSBOrder;
  onUpdateStatus: (orderId: string, newStatus: PSBOrder['status'], data?: any) => void;
  isUpdating?: boolean;
}

const workflowSteps = [
  { 
    key: 'Pending', 
    label: 'Order Masuk', 
    icon: Clock, 
    color: 'bg-gray-500',
    description: 'Order pelanggan baru tercatat'
  },
  { 
    key: 'Assigned', 
    label: 'Teknisi Assigned', 
    icon: UserCheck, 
    color: 'bg-blue-500',
    description: 'Teknisi telah ditugaskan'
  },
  { 
    key: 'Survey', 
    label: 'Survey Lapangan', 
    icon: Search, 
    color: 'bg-yellow-500',
    description: 'Pengecekan kondisi lapangan'
  },
  { 
    key: 'Installation', 
    label: 'Pemasangan', 
    icon: Settings, 
    color: 'bg-orange-500',
    description: 'Instalasi kabel & ONT'
  },
  { 
    key: 'Completed', 
    label: 'Selesai', 
    icon: CheckCircle, 
    color: 'bg-green-500',
    description: 'Pekerjaan lapangan selesai'
  }
];

export const PSBWorkflowTracker: React.FC<PSBWorkflowTrackerProps> = ({
  order,
  onUpdateStatus,
  isUpdating = false
}) => {
  const currentStepIndex = workflowSteps.findIndex(step => step.key === order.status);
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-gray-500';
      case 'Assigned': return 'bg-blue-500';
      case 'Survey': return 'bg-yellow-500';
      case 'Installation': return 'bg-orange-500';
      case 'Completed': return 'bg-green-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const canAdvanceToNextStep = () => {
    if (order.status === 'Completed' || order.status === 'Cancelled') return false;
    return currentStepIndex < workflowSteps.length - 1;
  };

  const getNextStepAction = () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex >= workflowSteps.length) return null;
    return workflowSteps[nextStepIndex];
  };

  const handleNextStep = () => {
    const nextStep = getNextStepAction();
    if (nextStep) {
      const updateData: any = {};
      
      // Add specific data based on the step
      if (nextStep.key === 'Assigned') {
        updateData.assignedAt = new Date().toISOString();
      } else if (nextStep.key === 'Installation') {
        updateData.installationDetails = {
          installedAt: new Date().toISOString()
        };
      }
      
      onUpdateStatus(order._id, nextStep.key as PSBOrder['status'], updateData);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Workflow Progress</CardTitle>
          <Badge className={`text-white ${getStatusBadgeColor(order.status)}`}>
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span className="font-medium">{order.customerName}</span>
            <span className="text-muted-foreground">({order.customerPhone})</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{order.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Paket:</span>
            <Badge variant="outline">{order.package}</Badge>
          </div>
          {getTechnicianName(order) && (
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4" />
              <span className="font-medium">Teknisi:</span>
              <span>{getTechnicianName(order)}</span>
            </div>
          )}
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4">
          {workflowSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;
            
            return (
              <div 
                key={step.key}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                  isCurrent ? 'bg-primary/10 border border-primary/20' : 
                  isCompleted ? 'border border-green-600' : 
                  'bg-muted/30'
                }`}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-white
                  ${isCompleted ? 'bg-green-500' : 
                    isCurrent ? step.color : 
                    'bg-gray-700/25'}
                `}>
                  <step.icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold ${isCurrent ? 'text-primary' : ''}`}>
                      {step.label}
                    </h4>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  
                  {/* Show timestamp for completed steps */}
                  {isCompleted && (
                    <p className="text-xs text-green-600 mt-1">
                      Completed: {format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                  )}
                </div>

                {isCurrent && !isPending && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        {canAdvanceToNextStep() && (
          <div className="pt-4 border-t">
            <Button 
              onClick={handleNextStep}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Lanjut ke: {getNextStepAction()?.label}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Field Readiness Info */}
        {order.fieldReadiness && (
          <div className="pt-4 border-t">
            <h5 className="font-semibold mb-3">Kondisi Lapangan</h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">ODP Status:</span>
                <Badge 
                  variant={order.fieldReadiness.odpStatus === 'available' ? 'default' : 'destructive'}
                  className="ml-2"
                >
                  {order.fieldReadiness.odpStatus}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Material Check:</span>
                <Badge 
                  variant={order.fieldReadiness.materialCheck === 'complete' ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {order.fieldReadiness.materialCheck}
                </Badge>
              </div>
              {order.fieldReadiness.towerDistance && (
                <div>
                  <span className="text-muted-foreground">Jarak Tiang:</span>
                  <span className="ml-2 font-medium">{order.fieldReadiness.towerDistance}m</span>
                </div>
              )}
              {order.fieldReadiness.signalStrength && (
                <div>
                  <span className="text-muted-foreground">Signal:</span>
                  <span className="ml-2 font-medium">{order.fieldReadiness.signalStrength} dBm</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Installation Details */}
        {order.installationDetails && (
          <div className="pt-4 border-t">
            <h5 className="font-semibold mb-3">Detail Instalasi</h5>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {order.installationDetails.ontSerialNumber && (
                <div>
                  <span className="text-muted-foreground">ONT Serial:</span>
                  <span className="ml-2 font-mono">{order.installationDetails.ontSerialNumber}</span>
                </div>
              )}
              {order.installationDetails.cableLength && (
                <div>
                  <span className="text-muted-foreground">Panjang Kabel:</span>
                  <span className="ml-2">{order.installationDetails.cableLength}m</span>
                </div>
              )}
              {order.installationDetails.installationType && (
                <div>
                  <span className="text-muted-foreground">Tipe Instalasi:</span>
                  <Badge variant="outline" className="ml-2">
                    {order.installationDetails.installationType}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};