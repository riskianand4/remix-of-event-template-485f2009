import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PSBOrder } from '@/types/psb';
import { format } from 'date-fns';
import { MapPin, Phone, Package, User, Calendar, Clock } from 'lucide-react';
import { getTechnicianName } from '@/utils/psbHelpers';
interface PSBDistributionDetailDialogProps {
  order: PSBOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export const PSBDistributionDetailDialog: React.FC<PSBDistributionDetailDialogProps> = ({
  order,
  open,
  onOpenChange
}) => {
  if (!order) return null;
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-yellow-500 text-white">Menunggu Assignment</Badge>;
      case 'Assigned':
        return <Badge className="bg-blue-500 text-white">Sudah Assigned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-md max-w-[360px] md:max-w-xl sm:max-w-2xl  mx-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detail Order - {order.orderNo}
            {getStatusBadge(order.status)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <User className="w-5 h-5" />
              Informasi Customer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nama Customer</label>
                  <p className="bg-background rounded px-2 py-1 border">{order.customerName}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Telepon</label>
                  <p className="bg-background rounded px-2 py-1 border">{order.customerPhone}</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alamat</label>
                <p className="bg-background rounded px-3 py-2 border min-h-[4rem] flex items-start text-sm">{order.address}</p>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5" />
              Informasi Lokasi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cluster</label>
                <div className="bg-background rounded px-2 py-1 border">
                  <Badge>{order.cluster}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">STO</label>
                <p className="bg-background rounded px-2 py-1 border">{order.sto}</p>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <Package className="w-5 h-5" />
              Informasi Layanan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paket</label>
                <p className="bg-background rounded px-2 py-1 border">{order.package}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tanggal</label>
                <p className="font-mono text-sm bg-background rounded px-2 py-1 border">
                  {format(new Date(order.date), 'dd MMMM yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Assignment Information */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" />
              Informasi Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Teknisi</label>
                <p className="bg-background rounded px-2 py-1 border">{getTechnicianName(order) || 'Belum ditugaskan'}</p>
              </div>
              {order.assignedAt && <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ditugaskan pada</label>
                  <p className="font-mono text-sm bg-background rounded px-2 py-1 border">
                    {format(new Date(order.assignedAt), 'dd MMMM yyyy, HH:mm:ss')}
                  </p>
                </div>}
            </div>
          </div>

          {/* Additional Details */}
          {(order.notes || order.priority) && <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-blue-500 rounded-sm flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                Detail Tambahan
              </h3>
              <div className="space-y-4">
                {order.priority && <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prioritas</label>
                    <div className="bg-background rounded px-2 py-1 border">
                      <Badge variant={order.priority === 'high' || order.priority === 'urgent' ? 'destructive' : 'secondary'}>
                        {order.priority}
                      </Badge>
                    </div>
                  </div>}
                {order.notes && <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Catatan</label>
                    <p className="text-sm bg-background rounded px-3 py-2 border min-h-[2.5rem] flex items-start">{order.notes}</p>
                  </div>}
              </div>
            </div>}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};