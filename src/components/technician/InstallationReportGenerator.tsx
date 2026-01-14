import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Printer, Eye } from 'lucide-react';
import { PSBOrder } from '@/types/psb';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DigitalSignaturePad } from './DigitalSignaturePad';

interface InstallationReportData {
  psbOrder: PSBOrder;
  technician: {
    name: string;
    employeeId: string;
    certification?: string;
  };
  installation: {
    date: string;
    startTime: string;
    endTime: string;
    ontSerialNumber?: string;
    cableLength?: number;
    installationType: 'aerial' | 'underground' | 'indoor';
    signalStrength?: number;
  };
  service: {
    type: string[];
    package: string;
    speedTest: {
      download?: number;
      upload?: number;
      ping?: number;
    };
  };
  device: {
    ontType?: string;
    serialNumber?: string;
    routerType?: string;
    routerSerial?: string;
  };
  signatures: {
    technician?: string;
    customer?: string;
  };
  notes?: string;
}

interface Props {
  order: PSBOrder;
  onReportGenerated?: (reportData: InstallationReportData) => void;
}

export const InstallationReportGenerator: React.FC<Props> = ({ order, onReportGenerated }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<InstallationReportData>({
    psbOrder: order,
    technician: {
      name: user?.name || '',
      employeeId: user?.id || '',
      certification: ''
    },
    installation: {
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      installationType: 'aerial'
    },
    service: {
      type: ['TELNET_FIBER'],
      package: order.package || '',
      speedTest: {}
    },
    device: {},
    signatures: {},
    notes: ''
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleInputChange = (section: keyof InstallationReportData, field: string, value: any) => {
    setReportData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value
      }
    }));
  };

  const handleServiceTypeChange = (type: string, checked: boolean) => {
    setReportData(prev => ({
      ...prev,
      service: {
        ...prev.service,
        type: checked 
          ? [...prev.service.type, type]
          : prev.service.type.filter(t => t !== type)
      }
    }));
  };

  const generatePDFReport = async () => {
    setIsGenerating(true);
    try {
      // Send request to backend to generate PDF
      const response = await fetch('/api/reports/installation-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reportData })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get PDF blob from response
      const pdfBlob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `berita-acara-${reportData.psbOrder.orderNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Laporan PDF berhasil dibuat dan diunduh');
      onReportGenerated?.(reportData);
      setIsOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Fallback to browser print if backend fails
      try {
        const htmlContent = createInstallationReportHTML(reportData);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          throw new Error('Could not open print window');
        }

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        };

        toast.success('Laporan berhasil dibuat (mode print)');
        onReportGenerated?.(reportData);
        setIsOpen(false);
      } catch (fallbackError) {
        toast.error('Gagal membuat laporan PDF');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const createInstallationReportHTML = (data: InstallationReportData): string => {
    const { psbOrder, technician, installation, service, device, signatures, notes } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Berita Acara Instalasi - ${psbOrder.orderNo}</title>
        <style>
            @page {
                size: A4;
                margin: 20mm;
            }
            
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #000;
            }
            
            .header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #000;
            }
            
            .logo {
                font-size: 18px;
                font-weight: bold;
                color: #2196F3;
                margin-bottom: 5px;
            }
            
            .title {
                font-size: 16px;
                font-weight: bold;
                margin-top: 10px;
            }
            
            .form-section {
                margin-bottom: 20px;
            }
            
            .form-row {
                display: flex;
                margin-bottom: 5px;
                align-items: center;
            }
            
            .form-label {
                width: 200px;
                display: inline-block;
            }
            
            .form-value {
                font-weight: bold;
            }
            
            .checkbox-group {
                display: flex;
                gap: 15px;
                margin-bottom: 10px;
                flex-wrap: wrap;
            }
            
            .checkbox-item {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .checkbox {
                width: 12px;
                height: 12px;
                border: 1px solid #000;
                display: inline-block;
                position: relative;
            }
            
            .checkbox.checked::after {
                content: '✓';
                position: absolute;
                top: -2px;
                left: 1px;
                font-size: 10px;
            }
            
            .signature-section {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
            }
            
            .signature-box {
                width: 200px;
                text-align: center;
            }
            
            .signature-line {
                width: 100%;
                height: 60px;
                border: 1px solid #000;
                margin: 10px 0;
                position: relative;
            }
            
            .signature-image {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            }
            
            .disclaimer {
                margin-top: 30px;
                font-size: 10px;
                line-height: 1.3;
            }
        </style>
    </head>
    <body>
        <!-- Header -->
        <div class="header">
            <div class="logo">TelNet Fiber</div>
            <div class="title">BERITA ACARA INSTALASI</div>
        </div>

        <!-- Service Type Section -->
        <div class="form-section">
            <strong>LAYANAN:</strong>
            <div class="checkbox-group">
                <div class="checkbox-item">
                    <span class="checkbox ${service.type.includes('TELNET_FIBER') ? 'checked' : ''}"></span>
                    <span>TELNET FIBER</span>
                </div>
                <div class="checkbox-item">
                    <span class="checkbox ${service.type.includes('TELNET_DEDICATED') ? 'checked' : ''}"></span>
                    <span>TELNET DEDICATED</span>
                </div>
                <div class="checkbox-item">
                    <span class="checkbox ${service.type.includes('VPN_IP') ? 'checked' : ''}"></span>
                    <span>VPN IP</span>
                </div>
                <div class="checkbox-item">
                    <span class="checkbox ${service.type.includes('GPON') ? 'checked' : ''}"></span>
                    <span>GPON</span>
                </div>
                <div class="checkbox-item">
                    <span class="checkbox ${service.type.includes('IPTV') ? 'checked' : ''}"></span>
                    <span>IPTV</span>
                </div>
                <div class="checkbox-item">
                    <span class="checkbox ${service.type.includes('EPON') ? 'checked' : ''}"></span>
                    <span>EPON</span>
                </div>
            </div>

            <!-- Installation Date and Info -->
            <div class="form-row">
                <span class="form-label">Pada hari ini, tanggal</span>
                <span class="form-value">${new Date(installation.date).toLocaleDateString('id-ID')}</span>
            </div>
            
            <div class="form-row">
                <span class="form-label">Waktu Mulai:</span>
                <span class="form-value">${installation.startTime || '..................'}</span>
                <span style="margin-left: 20px;">Waktu Selesai:</span>
                <span class="form-value">${installation.endTime || '..................'}</span>
            </div>

            <!-- Customer Details -->
            <div class="form-row">
                <span class="form-label">Nama Pelanggan:</span>
                <span class="form-value">${psbOrder.customerName}</span>
            </div>
            <div class="form-row">
                <span class="form-label">Alamat Instalasi:</span>
                <span class="form-value">${psbOrder.address}</span>
            </div>
            <div class="form-row">
                <span class="form-label">No. Telepon:</span>
                <span class="form-value">${psbOrder.customerPhone}</span>
            </div>
            <div class="form-row">
                <span class="form-label">Paket Layanan:</span>
                <span class="form-value">${service.package}</span>
            </div>
        </div>

        <!-- Speed Test Results -->
        <div class="form-section">
            <strong>HASIL SPEED TEST:</strong>
            <div class="form-row">
                <span class="form-label">Download Speed:</span>
                <span class="form-value">${service.speedTest.download || '..................'} Mbps</span>
            </div>
            <div class="form-row">
                <span class="form-label">Upload Speed:</span>
                <span class="form-value">${service.speedTest.upload || '..................'} Mbps</span>
            </div>
            <div class="form-row">
                <span class="form-label">Ping:</span>
                <span class="form-value">${service.speedTest.ping || '..................'} ms</span>
            </div>
        </div>

        <!-- Device Information -->
        <div class="form-section">
            <strong>PERANGKAT:</strong>
            <div class="form-row">
                <span class="form-label">Tipe ONT:</span>
                <span class="form-value">${device.ontType || '..................................................................................'}</span>
            </div>
            <div class="form-row">
                <span class="form-label">Serial Number ONT:</span>
                <span class="form-value">${device.serialNumber || installation.ontSerialNumber || '..................................................................................'}</span>
            </div>
            <div class="form-row">
                <span class="form-label">Tipe Router:</span>
                <span class="form-value">${device.routerType || '..................................................................................'}</span>
            </div>
            <div class="form-row">
                <span class="form-label">Serial Number Router:</span>
                <span class="form-value">${device.routerSerial || '..................................................................................'}</span>
            </div>
            <div class="form-row">
                <span class="form-label">Jenis Instalasi:</span>
                <span class="form-value">${installation.installationType === 'aerial' ? 'Aerial' : installation.installationType === 'underground' ? 'Underground' : 'Indoor'}</span>
            </div>
            ${installation.cableLength ? `
            <div class="form-row">
                <span class="form-label">Panjang Kabel:</span>
                <span class="form-value">${installation.cableLength} meter</span>
            </div>
            ` : ''}
            ${installation.signalStrength ? `
            <div class="form-row">
                <span class="form-label">Kekuatan Sinyal:</span>
                <span class="form-value">${installation.signalStrength} dBm</span>
            </div>
            ` : ''}
        </div>

        <!-- Technician Information -->
        <div class="form-section">
            <strong>TEKNISI:</strong>
            <div class="form-row">
                <span class="form-label">Nama Teknisi:</span>
                <span class="form-value">${technician.name}</span>
            </div>
            <div class="form-row">
                <span class="form-label">ID Karyawan:</span>
                <span class="form-value">${technician.employeeId}</span>
            </div>
            ${technician.certification ? `
            <div class="form-row">
                <span class="form-label">Sertifikasi:</span>
                <span class="form-value">${technician.certification}</span>
            </div>
            ` : ''}
        </div>

        ${notes ? `
        <div class="form-section">
            <strong>CATATAN TAMBAHAN:</strong>
            <p>${notes}</p>
        </div>
        ` : ''}

        <!-- Disclaimer -->
        <div class="form-section">
            <strong>DISCLAIMER:</strong>
            <div class="disclaimer">
                <p>1. Perangkat (ONT/Router/STB) yang dipasang di rumah pelanggan adalah milik Telnet Indonesia yang dipinjamkan selama menjadi pelanggan Telnet Indonesia.</p>
                <p>2. Telnet Indonesia dapat menggantikan Perangkat bila tidak melakukan pembayaran selama 3 bulan berturut-turut.</p>
            </div>
        </div>

        <div class="form-row">
            <span>Demikian Berita Acara ini dibuat untuk dapat dipergunakan seperlunya</span>
        </div>

        <!-- Signatures -->
        <div class="signature-section">
            <div class="signature-box">
                <p>Pelanggan,</p>
                <div class="signature-line">
                    ${signatures.customer ? `<img src="${signatures.customer}" class="signature-image" alt="Customer Signature" />` : ''}
                </div>
                <p>(.............................)</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <p>${new Date(installation.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <p>Petugas Telnet Indonesia,</p>
            </div>
            
            <div class="signature-box">
                <div class="signature-line">
                    ${signatures.technician ? `<img src="${signatures.technician}" class="signature-image" alt="Technician Signature" />` : ''}
                </div>
                <p>(.............................)</p>
            </div>
        </div>
    </body>
    </html>
    `;
  };

  const serviceTypes = [
    { id: 'TELNET_FIBER', label: 'TELNET FIBER' },
    { id: 'TELNET_DEDICATED', label: 'TELNET DEDICATED' },
    { id: 'VPN_IP', label: 'VPN IP' },
    { id: 'GPON', label: 'GPON' },
    { id: 'IPTV', label: 'IPTV' },
    { id: 'EPON', label: 'EPON' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Buat Laporan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Berita Acara Instalasi</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Installation Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Instalasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tanggal Instalasi</Label>
                  <Input
                    type="date"
                    value={reportData.installation.date}
                    onChange={(e) => handleInputChange('installation', 'date', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Jenis Instalasi</Label>
                  <Select 
                    value={reportData.installation.installationType} 
                    onValueChange={(value) => handleInputChange('installation', 'installationType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aerial">Aerial</SelectItem>
                      <SelectItem value="underground">Underground</SelectItem>
                      <SelectItem value="indoor">Indoor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Waktu Mulai</Label>
                  <Input
                    type="time"
                    value={reportData.installation.startTime}
                    onChange={(e) => handleInputChange('installation', 'startTime', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Waktu Selesai</Label>
                  <Input
                    type="time"
                    value={reportData.installation.endTime}
                    onChange={(e) => handleInputChange('installation', 'endTime', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Serial Number ONT</Label>
                  <Input
                    value={reportData.installation.ontSerialNumber || ''}
                    onChange={(e) => handleInputChange('installation', 'ontSerialNumber', e.target.value)}
                    placeholder="Masukkan serial number ONT"
                  />
                </div>
                <div>
                  <Label>Panjang Kabel (meter)</Label>
                  <Input
                    type="number"
                    value={reportData.installation.cableLength || ''}
                    onChange={(e) => handleInputChange('installation', 'cableLength', parseInt(e.target.value))}
                    placeholder="Panjang kabel dalam meter"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Layanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Jenis Layanan</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {serviceTypes.map(type => (
                    <label key={type.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={reportData.service.type.includes(type.id)}
                        onChange={(e) => handleServiceTypeChange(type.id, e.target.checked)}
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Speed Test Results</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label className="text-sm">Download (Mbps)</Label>
                    <Input
                      type="number"
                      value={reportData.service.speedTest.download || ''}
                      onChange={(e) => handleInputChange('service', 'speedTest', {
                        ...reportData.service.speedTest,
                        download: parseFloat(e.target.value)
                      })}
                      placeholder="Download speed"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Upload (Mbps)</Label>
                    <Input
                      type="number"
                      value={reportData.service.speedTest.upload || ''}
                      onChange={(e) => handleInputChange('service', 'speedTest', {
                        ...reportData.service.speedTest,
                        upload: parseFloat(e.target.value)
                      })}
                      placeholder="Upload speed"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Ping (ms)</Label>
                    <Input
                      type="number"
                      value={reportData.service.speedTest.ping || ''}
                      onChange={(e) => handleInputChange('service', 'speedTest', {
                        ...reportData.service.speedTest,
                        ping: parseFloat(e.target.value)
                      })}
                      placeholder="Ping"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Perangkat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipe ONT</Label>
                  <Input
                    value={reportData.device.ontType || ''}
                    onChange={(e) => handleInputChange('device', 'ontType', e.target.value)}
                    placeholder="Tipe ONT"
                  />
                </div>
                <div>
                  <Label>Serial Number ONT</Label>
                  <Input
                    value={reportData.device.serialNumber || ''}
                    onChange={(e) => handleInputChange('device', 'serialNumber', e.target.value)}
                    placeholder="Serial number ONT"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipe Router</Label>
                  <Input
                    value={reportData.device.routerType || ''}
                    onChange={(e) => handleInputChange('device', 'routerType', e.target.value)}
                    placeholder="Tipe router"
                  />
                </div>
                <div>
                  <Label>Serial Number Router</Label>
                  <Input
                    value={reportData.device.routerSerial || ''}
                    onChange={(e) => handleInputChange('device', 'routerSerial', e.target.value)}
                    placeholder="Serial number router"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Digital Signatures */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tanda Tangan Digital</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tanda Tangan Teknisi</Label>
                  <DigitalSignaturePad
                    onSignatureChange={(signature) => handleInputChange('signatures', 'technician', signature)}
                  />
                </div>
                <div>
                  <Label>Tanda Tangan Pelanggan</Label>
                  <DigitalSignaturePad
                    onSignatureChange={(signature) => handleInputChange('signatures', 'customer', signature)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catatan Tambahan</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={reportData.notes || ''}
                onChange={(e) => setReportData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Tambahkan catatan khusus mengenai instalasi..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => setPreviewMode(true)}
              variant="outline"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={generatePDFReport}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-transparent border-t-current" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};