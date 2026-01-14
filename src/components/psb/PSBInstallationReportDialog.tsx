import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { PSBActivation } from '@/types/psb';

const installationReportSchema = z.object({
  // Speed Test
  downloadSpeed: z.number().min(0).optional(),
  uploadSpeed: z.number().min(0).optional(),
  ping: z.number().min(0).optional(),
  
  // Device Info
  ontType: z.string().optional(),
  ontSerial: z.string().optional(),
  routerType: z.string().optional(),
  routerSerial: z.string().optional(),
  stbId: z.string().optional(),
  
  // DATEK Info
  area: z.string().optional(),
  odc: z.string().optional(),
  odp: z.string().optional(),
  port: z.string().optional(),
  dc: z.string().optional(),
  soc: z.string().optional(),
  
  // Service Info
  serviceType: z.enum(['pasang_baru', 'cabut', 'upgrade', 'downgrade', 'pda']).optional(),
  packageSpeed: z.number().min(20).max(100).optional(),
  fastelNumber: z.string().optional(),
  contactPerson: z.string().optional(),
});

type InstallationReportFormData = z.infer<typeof installationReportSchema>;

interface PSBInstallationReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activation: PSBActivation | null;
  onSave: (data: any) => Promise<void>;
}

export function PSBInstallationReportDialog({
  open,
  onOpenChange,
  activation,
  onSave,
}: PSBInstallationReportDialogProps) {
  const form = useForm<InstallationReportFormData>({
    resolver: zodResolver(installationReportSchema),
    defaultValues: {
      downloadSpeed: 0,
      uploadSpeed: 0,
      ping: 0,
      ontType: '',
      ontSerial: '',
      routerType: '',
      routerSerial: '',
      stbId: '',
      area: '',
      odc: '',
      odp: '',
      port: '',
      dc: '',
      soc: '',
      serviceType: 'pasang_baru',
      packageSpeed: 20,
      fastelNumber: '',
      contactPerson: '',
    },
  });

  useEffect(() => {
    if (activation?.installationReport) {
      const report = activation.installationReport;
      form.reset({
        downloadSpeed: report.speedTest?.download || 0,
        uploadSpeed: report.speedTest?.upload || 0,
        ping: report.speedTest?.ping || 0,
        ontType: report.device?.ontType || '',
        ontSerial: report.device?.ontSerial || activation.serviceNumber || '',
        routerType: report.device?.routerType || '',
        routerSerial: report.device?.routerSerial || '',
        stbId: report.device?.stbId || '',
        area: report.datek?.area || '',
        odc: report.datek?.odc || '',
        odp: report.datek?.odp || '',
        port: report.datek?.port || '',
        dc: report.datek?.dc || '',
        soc: report.datek?.soc || '',
        serviceType: report.serviceType || 'pasang_baru',
        packageSpeed: report.packageSpeed || 20,
        fastelNumber: report.fastelNumber || '',
        contactPerson: report.contactPerson || '',
      });
    } else if (activation) {
      // Pre-fill with activation data if no report exists
      form.setValue('ontSerial', activation.serviceNumber || '');
    }
  }, [activation, form]);

  const handleSubmit = async (data: InstallationReportFormData) => {
    const payload = {
      speedTest: {
        download: data.downloadSpeed,
        upload: data.uploadSpeed,
        ping: data.ping,
      },
      device: {
        ontType: data.ontType,
        ontSerial: data.ontSerial,
        routerType: data.routerType,
        routerSerial: data.routerSerial,
        stbId: data.stbId,
      },
      datek: {
        area: data.area,
        odc: data.odc,
        odp: data.odp,
        port: data.port,
        dc: data.dc,
        soc: data.soc,
      },
      serviceType: data.serviceType,
      packageSpeed: data.packageSpeed,
      fastelNumber: data.fastelNumber,
      contactPerson: data.contactPerson,
    };

    await onSave(payload);
    onOpenChange(false);
  };

  if (!activation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Data Laporan Instalasi</DialogTitle>
          <DialogDescription>
            Lengkapi detail instalasi untuk aktivasi {activation.customerName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Customer Info (Read-only) */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Nama Pelanggan</Label>
                <p className="font-semibold">{activation.customerName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">No. Telepon</Label>
                <p className="font-semibold">{activation.pppoeUsername || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-muted-foreground">Alamat Instalasi</Label>
                <p className="font-semibold">{activation.cluster}</p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Service Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Informasi Layanan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fastelNumber">Nomor Fastel (opsional)</Label>
                <Input
                  id="fastelNumber"
                  {...form.register('fastelNumber')}
                  placeholder="Masukkan nomor fastel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceType">Jenis Layanan *</Label>
                <Select
                  value={form.watch('serviceType')}
                  onValueChange={(value: any) => form.setValue('serviceType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis layanan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pasang_baru">Pasang Baru</SelectItem>
                    <SelectItem value="cabut">Cabut</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                    <SelectItem value="downgrade">Downgrade</SelectItem>
                    <SelectItem value="pda">PDA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageSpeed">Paket Layanan (Mbps) *</Label>
                <Select
                  value={form.watch('packageSpeed')?.toString()}
                  onValueChange={(value) => form.setValue('packageSpeed', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20 Mbps</SelectItem>
                    <SelectItem value="30">30 Mbps</SelectItem>
                    <SelectItem value="40">40 Mbps</SelectItem>
                    <SelectItem value="50">50 Mbps</SelectItem>
                    <SelectItem value="100">100 Mbps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  {...form.register('contactPerson')}
                  placeholder="Nama kontak person"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Speed Test */}
          <div className="space-y-4">
            <h3 className="font-semibold">Hasil Speed Test</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="downloadSpeed">Download (Mbps)</Label>
                <Input
                  id="downloadSpeed"
                  type="number"
                  step="0.01"
                  {...form.register('downloadSpeed', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uploadSpeed">Upload (Mbps)</Label>
                <Input
                  id="uploadSpeed"
                  type="number"
                  step="0.01"
                  {...form.register('uploadSpeed', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ping">Ping (ms)</Label>
                <Input
                  id="ping"
                  type="number"
                  {...form.register('ping', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Device Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Informasi Perangkat</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ontType">Tipe ONT</Label>
                <Input
                  id="ontType"
                  {...form.register('ontType')}
                  placeholder="Masukkan tipe ONT"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ontSerial">Serial ONT</Label>
                <Input
                  id="ontSerial"
                  {...form.register('ontSerial')}
                  placeholder="Auto-filled dari activation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="routerType">Tipe Router</Label>
                <Input
                  id="routerType"
                  {...form.register('routerType')}
                  placeholder="Masukkan tipe router"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="routerSerial">Serial Router</Label>
                <Input
                  id="routerSerial"
                  {...form.register('routerSerial')}
                  placeholder="Masukkan serial router"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="stbId">STB ID (opsional)</Label>
                <Input
                  id="stbId"
                  {...form.register('stbId')}
                  placeholder="Masukkan STB ID jika ada"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* DATEK Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Data Teknis (DATEK)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  {...form.register('area')}
                  placeholder="Area"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odc">ODC</Label>
                <Input
                  id="odc"
                  {...form.register('odc')}
                  placeholder="ODC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odp">ODP</Label>
                <Input
                  id="odp"
                  {...form.register('odp')}
                  placeholder="ODP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  {...form.register('port')}
                  placeholder="Port"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dc">DC</Label>
                <Input
                  id="dc"
                  {...form.register('dc')}
                  placeholder="DC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soc">SOC</Label>
                <Input
                  id="soc"
                  {...form.register('soc')}
                  placeholder="SOC"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data Laporan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
