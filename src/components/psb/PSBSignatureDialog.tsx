import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DigitalSignaturePad } from '@/components/technician/DigitalSignaturePad';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, User, Users } from 'lucide-react';
import type { PSBActivation } from '@/types/psb';

interface PSBSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activation: PSBActivation | null;
  onSubmit: (technicianSignature: string, customerSignature: string) => Promise<void>;
  isSubmitting: boolean;
}

export function PSBSignatureDialog({
  open,
  onOpenChange,
  activation,
  onSubmit,
  isSubmitting,
}: PSBSignatureDialogProps) {
  const [technicianSignature, setTechnicianSignature] = useState<string | null>(null);
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!technicianSignature || !customerSignature) {
      return;
    }

    await onSubmit(technicianSignature, customerSignature);
  };

  const canSubmit = technicianSignature && customerSignature && !isSubmitting;

  if (!activation) return null;

  // Check if installation report is complete
  const hasInstallationReport = activation.installationReport?.speedTest;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tanda Tangan Aktivasi
          </DialogTitle>
          <DialogDescription>
            Lengkapi tanda tangan teknisi dan pelanggan untuk menyelesaikan aktivasi
          </DialogDescription>
        </DialogHeader>

        {/* Validation Warning */}
        {!hasInstallationReport && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-400">
              Data laporan instalasi belum lengkap. Silakan hubungi CS untuk melengkapi data terlebih dahulu.
            </p>
          </div>
        )}

        {/* Activation Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Pelanggan</p>
                <p className="font-semibold">{activation.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nomor Layanan</p>
                <Badge variant="outline" className="font-mono">
                  {activation.serviceNumber}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cluster</p>
                <Badge className="bg-blue-500">{activation.cluster}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teknisi</p>
                <p className="font-semibold">{activation.technician}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Report Summary (Read-only) */}
        {hasInstallationReport && (
          <>
            <Separator />
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Detail Instalasi (Read-only)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Jenis Layanan</p>
                    <p className="font-medium">{activation.installationReport.serviceType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Paket Layanan</p>
                    <p className="font-medium">{activation.installationReport.packageSpeed ? `${activation.installationReport.packageSpeed} Mbps` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Download Speed</p>
                    <p className="font-medium">{activation.installationReport.speedTest?.download || 0} Mbps</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Upload Speed</p>
                    <p className="font-medium">{activation.installationReport.speedTest?.upload || 0} Mbps</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ping</p>
                    <p className="font-medium">{activation.installationReport.speedTest?.ping || 0} ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipe ONT</p>
                    <p className="font-medium">{activation.installationReport.device?.ontType || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Separator />

        {/* Technician Signature */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Tanda Tangan Teknisi</h3>
            {technicianSignature && (
              <Badge variant="secondary" className="ml-auto">
                <CheckCircle className="h-3 w-3 mr-1" />
                Selesai
              </Badge>
            )}
          </div>
          <DigitalSignaturePad
            onSignatureChange={setTechnicianSignature}
            title="Teknisi"
          />
        </div>

        <Separator />

        {/* Customer Signature */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Tanda Tangan Pelanggan</h3>
            {customerSignature && (
              <Badge variant="secondary" className="ml-auto">
                <CheckCircle className="h-3 w-3 mr-1" />
                Selesai
              </Badge>
            )}
          </div>
          <DigitalSignaturePad
            onSignatureChange={setCustomerSignature}
            title="Pelanggan"
          />
        </div>

        {/* Status Warning */}
        {(!technicianSignature || !customerSignature) && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-400">
              Kedua tanda tangan (teknisi dan pelanggan) harus dilengkapi sebelum dapat menyimpan
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || !hasInstallationReport}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Simpan Tanda Tangan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
