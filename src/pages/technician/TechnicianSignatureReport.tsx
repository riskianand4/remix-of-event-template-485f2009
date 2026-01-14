import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { psbActivationApi } from '@/services/psbActivationApi';
import { PSBActivation } from '@/types/psb';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { DigitalSignaturePad } from '@/components/technician/DigitalSignaturePad';
import { generateInstallationReportPDF } from '@/utils/psbActivationPdfGenerator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TechnicianSignatureReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activation, setActivation] = useState<PSBActivation | null>(null);
  const [technicianSignature, setTechnicianSignature] = useState('');
  const [customerSignature, setCustomerSignature] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    downloadSpeed: '',
    uploadSpeed: '',
    ping: '',
    serviceType: '',
    packageSpeed: '',
    fastelNumber: '',
    contactPerson: '',
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
    soc: ''
  });

  useEffect(() => {
    if (id) {
      loadActivation();
    }
  }, [id]);

  const loadActivation = async () => {
    try {
      setLoading(true);
      const response = await psbActivationApi.getActivationById(id!);
      if (response.success && response.data) {
        setActivation(response.data);
        
        // Pre-fill form if data exists
        if (response.data.installationReport) {
          const report = response.data.installationReport;
          setFormData({
            downloadSpeed: report.speedTest?.download?.toString() || '',
            uploadSpeed: report.speedTest?.upload?.toString() || '',
            ping: report.speedTest?.ping?.toString() || '',
            serviceType: report.serviceType || '',
            packageSpeed: report.packageSpeed?.toString() || '',
            fastelNumber: report.fastelNumber || '',
            contactPerson: report.contactPerson || '',
            ontType: report.device?.ontType || '',
            ontSerial: report.device?.ontSerial || response.data.serviceNumber,
            routerType: report.device?.routerType || '',
            routerSerial: report.device?.routerSerial || '',
            stbId: report.device?.stbId || '',
            area: report.datek?.area || '',
            odc: report.datek?.odc || '',
            odp: report.datek?.odp || '',
            port: report.datek?.port || '',
            dc: report.datek?.dc || '',
            soc: report.datek?.soc || ''
          });

          // Load signatures if exist
          if (report.signatures?.technician) {
            setTechnicianSignature(report.signatures.technician);
          }
          if (report.signatures?.customer) {
            setCustomerSignature(report.signatures.customer);
          }
        }
      }
    } catch (error) {
      console.error('Error loading activation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data aktivasi'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignatures = async () => {
    if (!technicianSignature || !customerSignature) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Kedua tanda tangan harus diisi'
      });
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        installationReport: {
          speedTest: {
            download: parseFloat(formData.downloadSpeed) || undefined,
            upload: parseFloat(formData.uploadSpeed) || undefined,
            ping: parseFloat(formData.ping) || undefined
          },
          device: {
            ontType: formData.ontType || undefined,
            ontSerial: formData.ontSerial || undefined,
            routerType: formData.routerType || undefined,
            routerSerial: formData.routerSerial || undefined,
            stbId: formData.stbId || undefined
          },
          datek: {
            area: formData.area || undefined,
            odc: formData.odc || undefined,
            odp: formData.odp || undefined,
            port: formData.port || undefined,
            dc: formData.dc || undefined,
            soc: formData.soc || undefined
          },
          serviceType: (formData.serviceType as 'pasang_baru' | 'cabut' | 'upgrade' | 'downgrade' | 'pda') || undefined,
          packageSpeed: formData.packageSpeed ? parseInt(formData.packageSpeed) as (20 | 30 | 40 | 50 | 100) : undefined,
          fastelNumber: formData.fastelNumber || undefined,
          contactPerson: formData.contactPerson || undefined,
          signatures: {
            technician: technicianSignature,
            customer: customerSignature,
            signedAt: new Date().toISOString()
          }
        }
      };

      await psbActivationApi.updateActivation(id!, updateData);
      
      toast({
        title: 'Berhasil',
        description: 'Tanda tangan berhasil disimpan'
      });

      // Reload to get updated data
      await loadActivation();
    } catch (error) {
      console.error('Error saving signatures:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menyimpan tanda tangan'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!activation) return;

    if (!technicianSignature || !customerSignature) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Tanda tangan harus disimpan terlebih dahulu'
      });
      return;
    }

    try {
      setGenerating(true);
      
      await generateInstallationReportPDF(
        activation,
        technicianSignature,
        customerSignature
      );

      // Update status to report generated
      await psbActivationApi.updateActivation(id!, {
        installationReport: {
          ...activation.installationReport,
          reportGenerated: true,
          reportGeneratedAt: new Date().toISOString()
        }
      });

      toast({
        title: 'Berhasil',
        description: 'Berita acara berhasil di-generate'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal generate berita acara'
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!activation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p>Data aktivasi tidak ditemukan</p>
        <Button onClick={() => navigate('/technician/activation')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/technician/activation')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali
      </Button>

      <div className="space-y-6">
        {/* Data Aktivasi */}
        <Card>
          <CardHeader>
            <CardTitle>Data Aktivasi</CardTitle>
            <CardDescription>Informasi pelanggan dan aktivasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Nama Pelanggan</Label>
                <p className="font-medium">{activation.customerName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nomor Layanan</Label>
                <p className="font-medium">{activation.serviceNumber}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">PPPoE Username</Label>
                <p className="font-medium">{activation.pppoeUsername}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">PPPoE Password</Label>
                <p className="font-medium">{activation.pppoePassword}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">OLT Name</Label>
                <p className="font-medium">{activation.oltName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">PON Port / ONU</Label>
                <p className="font-medium">{activation.ponPort} / {activation.onuNumber}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Redaman Signal</Label>
                <p className="font-medium">{activation.signalLevel} dBm</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Cluster</Label>
                <p className="font-medium">{activation.cluster}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Data Tambahan */}
        <Card>
          <CardHeader>
            <CardTitle>Data Instalasi</CardTitle>
            <CardDescription>Lengkapi data untuk berita acara</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service Type & Package */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jenis Layanan</Label>
                <Select value={formData.serviceType} onValueChange={(value) => setFormData({...formData, serviceType: value})}>
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
              <div>
                <Label>Paket Kecepatan</Label>
                <Select value={formData.packageSpeed} onValueChange={(value) => setFormData({...formData, packageSpeed: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kecepatan" />
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
            </div>

            {/* Speed Test */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Download Speed (Mbps)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.downloadSpeed}
                  onChange={(e) => setFormData({...formData, downloadSpeed: e.target.value})}
                />
              </div>
              <div>
                <Label>Upload Speed (Mbps)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.uploadSpeed}
                  onChange={(e) => setFormData({...formData, uploadSpeed: e.target.value})}
                />
              </div>
              <div>
                <Label>Ping (ms)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.ping}
                  onChange={(e) => setFormData({...formData, ping: e.target.value})}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nomor FASTEL</Label>
                <Input
                  placeholder="Nomor FASTEL"
                  value={formData.fastelNumber}
                  onChange={(e) => setFormData({...formData, fastelNumber: e.target.value})}
                />
              </div>
              <div>
                <Label>Kontak Person</Label>
                <Input
                  placeholder="Nama - No Telepon"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                />
              </div>
            </div>

            {/* DATEK */}
            <div>
              <Label className="text-lg font-semibold">DATEK</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <Input placeholder="Area" value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} />
                <Input placeholder="ODC" value={formData.odc} onChange={(e) => setFormData({...formData, odc: e.target.value})} />
                <Input placeholder="ODP" value={formData.odp} onChange={(e) => setFormData({...formData, odp: e.target.value})} />
                <Input placeholder="Port" value={formData.port} onChange={(e) => setFormData({...formData, port: e.target.value})} />
                <Input placeholder="DC" value={formData.dc} onChange={(e) => setFormData({...formData, dc: e.target.value})} />
                <Input placeholder="SOC" value={formData.soc} onChange={(e) => setFormData({...formData, soc: e.target.value})} />
              </div>
            </div>

            {/* Device */}
            <div>
              <Label className="text-lg font-semibold">Device</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input placeholder="Type ONT" value={formData.ontType} onChange={(e) => setFormData({...formData, ontType: e.target.value})} />
                <Input placeholder="SN ONT" value={formData.ontSerial} onChange={(e) => setFormData({...formData, ontSerial: e.target.value})} />
                <Input placeholder="Type Router" value={formData.routerType} onChange={(e) => setFormData({...formData, routerType: e.target.value})} />
                <Input placeholder="SN Router" value={formData.routerSerial} onChange={(e) => setFormData({...formData, routerSerial: e.target.value})} />
                <Input placeholder="STB ID" value={formData.stbId} onChange={(e) => setFormData({...formData, stbId: e.target.value})} className="col-span-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tanda Tangan */}
        <Card>
          <CardHeader>
            <CardTitle>Tanda Tangan</CardTitle>
            <CardDescription>Tanda tangan teknisi dan pelanggan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Tanda Tangan Teknisi</Label>
                <DigitalSignaturePad
                  onSignatureChange={setTechnicianSignature}
                  title="Tanda Tangan Teknisi"
                />
              </div>
              <div>
                <Label>Tanda Tangan Pelanggan</Label>
                <DigitalSignaturePad
                  onSignatureChange={setCustomerSignature}
                  title="Tanda Tangan Pelanggan"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSaveSignatures}
                disabled={saving || !technicianSignature || !customerSignature}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan Tanda Tangan
              </Button>

              <Button
                onClick={handleGeneratePDF}
                disabled={generating || !technicianSignature || !customerSignature}
                variant="default"
              >
                {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Download className="w-4 h-4 mr-2" />
                Generate Berita Acara PDF
              </Button>
            </div>

            {activation.installationReport?.reportGenerated && (
              <p className="text-sm text-muted-foreground">
                Berita acara terakhir di-generate pada:{' '}
                {new Date(activation.installationReport.reportGeneratedAt!).toLocaleString('id-ID')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
