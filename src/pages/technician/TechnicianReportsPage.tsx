import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { psbActivationApi } from '@/services/psbActivationApi';
import { PSBActivation } from '@/types/psb';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';
import { ENV } from '@/config/environment';

export default function TechnicianReportsPage() {
  const { user } = useAuth();
  const [activations, setActivations] = useState<PSBActivation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchReadyActivations = async () => {
    setLoading(true);
    try {
      const response = await psbActivationApi.getActivations();
      const readyActivations = response.data.filter(activation => {
        const isTechnicianActivation = activation.technician?.toLowerCase().includes(user?.name?.toLowerCase() || '');
        const hasSignatures = 
          activation.installationReport?.signatures?.technician &&
          activation.installationReport?.signatures?.customer;
        const notGenerated = !activation.reportGenerated;
        return isTechnicianActivation && hasSignatures && notGenerated;
      });
      setActivations(readyActivations);
      setLastRefresh(new Date());
    } catch (error) {
      logger.error('Failed to fetch activations', error, 'TechnicianReportsPage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadyActivations();
    const interval = setInterval(() => {
      fetchReadyActivations();
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleGeneratePDF = async (activation: PSBActivation) => {
    if (!activation.installationReport) {
      toast.error('Data laporan tidak lengkap');
      return;
    }

    setIsGenerating(activation._id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${ENV.API_BASE_URL}/api/psb-activations/${activation._id}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          formData: {
            downloadSpeed: activation.installationReport.speedTest?.download?.toString() || '',
            uploadSpeed: activation.installationReport.speedTest?.upload?.toString() || '',
            ping: activation.installationReport.speedTest?.ping?.toString() || '',
            serviceType: activation.installationReport.serviceType || '',
            packageSpeed: activation.installationReport.packageSpeed?.toString() || '',
            fastelNumber: activation.installationReport.fastelNumber || '',
            contactPerson: activation.installationReport.contactPerson || '',
            ontType: activation.installationReport.device?.ontType || '',
            ontSerial: activation.installationReport.device?.ontSerial || '',
            routerType: activation.installationReport.device?.routerType || '',
            routerSerial: activation.installationReport.device?.routerSerial || '',
            stbId: activation.installationReport.device?.stbId || '',
            area: activation.installationReport.datek?.area || '',
            odc: activation.installationReport.datek?.odc || '',
            odp: activation.installationReport.datek?.odp || '',
            port: activation.installationReport.datek?.port || '',
            dc: activation.installationReport.datek?.dc || '',
            soc: activation.installationReport.datek?.soc || '',
          },
          signatures: {
            technician: activation.installationReport.signatures?.technician || '',
            customer: activation.installationReport.signatures?.customer || '',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Berita_Acara_${activation.serviceNumber}_${format(new Date(), 'ddMMyyyy')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      await psbActivationApi.updateActivation(activation._id, {
        reportGenerated: true,
        reportGeneratedAt: new Date().toISOString(),
      } as any);
      
      toast.success('Berita acara berhasil dibuat dan didownload');
      await fetchReadyActivations();
    } catch (error) {
      logger.error('Failed to generate PDF report', error, 'TechnicianReportsPage');
      toast.error('Gagal membuat berita acara');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Generate Berita Acara
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Buat berita acara instalasi untuk pekerjaan yang telah selesai
            </p>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <Button onClick={fetchReadyActivations} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="flex items-center gap-2 w-fit">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{activations.length} Siap Generate</span>
            </Badge>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString('id-ID')}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Laporan Siap Generate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activations.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                {loading ? (
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-12 w-12 text-muted-foreground animate-spin" />
                    <p className="text-sm md:text-base text-muted-foreground">Memuat data...</p>
                  </div>
                ) : (
                  <>
                    <AlertCircle className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm md:text-base text-muted-foreground">Belum ada laporan yang siap di-generate</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">Laporan akan muncul di sini setelah aktivasi selesai dengan tanda tangan lengkap</p>
                    <p className="text-xs text-muted-foreground mt-2">Data akan otomatis refresh setiap 30 detik</p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">No. Layanan</th>
                      <th className="text-left p-3 font-semibold">Nama Pelanggan</th>
                      <th className="text-left p-3 font-semibold">Tanggal Aktivasi</th>
                      <th className="text-left p-3 font-semibold">Cluster</th>
                      <th className="text-left p-3 font-semibold">Paket</th>
                      <th className="text-left p-3 font-semibold">Status Data</th>
                      <th className="text-left p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activations.map((activation) => {
                      const hasCompleteData = 
                        activation.installationReport?.speedTest &&
                        activation.installationReport?.device &&
                        activation.installationReport?.datek;
                      return (
                        <tr key={activation._id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3"><Badge variant="outline" className="font-mono">{activation.serviceNumber}</Badge></td>
                          <td className="p-3"><div className="font-medium">{activation.customerName}</div></td>
                          <td className="p-3"><div className="text-sm">{activation.activationDate ? format(new Date(activation.activationDate), 'dd MMM yyyy') : '-'}</div></td>
                          <td className="p-3"><Badge className="bg-blue-500 text-white">{activation.cluster}</Badge></td>
                          <td className="p-3"><div className="text-sm">{activation.installationReport?.packageSpeed ? `${activation.installationReport.packageSpeed} Mbps` : '-'}</div></td>
                          <td className="p-3">
                            {hasCompleteData ? (
                              <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Complete</Badge>
                            ) : (
                              <Badge className="bg-yellow-500 text-white"><AlertCircle className="h-3 w-3 mr-1" />Partial</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Button onClick={() => handleGeneratePDF(activation)} size="sm" disabled={isGenerating === activation._id} className="bg-primary hover:bg-primary/90">
                              <Download className="h-4 w-4 mr-2" />
                              {isGenerating === activation._id ? 'Generating...' : 'Generate PDF'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
