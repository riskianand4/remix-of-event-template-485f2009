import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { PSBSignatureDialog } from '@/components/psb/PSBSignatureDialog';
import { useAuth } from '@/contexts/AuthContext';
import { psbActivationApi } from '@/services/psbActivationApi';
import type { PSBActivation } from '@/types/psb';
import { Zap, CheckCircle, Clock, RefreshCw, Activity, Search, Eye, EyeOff, PenTool, FileText, Phone, MapPin, Package, Calendar, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { format } from 'date-fns';

const TechnicianActivationPage: React.FC = () => {
  const { user } = useAuth();
  const [activations, setActivations] = useState<PSBActivation[]>([]);
  const [activationsLoading, setActivationsLoading] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedActivation, setSelectedActivation] = useState<PSBActivation | null>(null);
  const [isSubmittingSignature, setIsSubmittingSignature] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activationSearchTerm, setActivationSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Filter activations assigned to current technician
  const myActivations = activations?.filter(
    activation => activation.technician === user?.name
  ) || [];

  // Apply search filters
  const filteredActivations = myActivations.filter(
    activation =>
      (activation.customerName || '').toLowerCase().includes(activationSearchTerm.toLowerCase()) ||
      (activation.serviceNumber || '').toLowerCase().includes(activationSearchTerm.toLowerCase()) ||
      (activation.pppoeUsername || '').toLowerCase().includes(activationSearchTerm.toLowerCase()) ||
      (activation.oltName || '').toLowerCase().includes(activationSearchTerm.toLowerCase()) ||
      (activation.cluster || '').toLowerCase().includes(activationSearchTerm.toLowerCase())
  );

  // Separate activations by signature status
  const unsignedActivations = filteredActivations.filter(
    activation => !activation.installationReport?.signatures?.technician
  );
  const signedActivations = filteredActivations.filter(
    activation => activation.installationReport?.signatures?.technician
  );

  const fetchActivations = async () => {
    setActivationsLoading(true);
    try {
      const response = await psbActivationApi.getActivations({ limit: 10000 });
      setActivations(response.data);
    } catch (error) {
      logger.error('Failed to fetch activations', error, 'TechnicianActivationPage');
      toast.error('Gagal memuat data aktivasi');
    } finally {
      setActivationsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivations();
  }, []);

  const handleRefresh = async () => {
    await fetchActivations();
    setLastRefresh(new Date());
  };

  const handleSignActivation = (activation: PSBActivation) => {
    setSelectedActivation(activation);
    setIsSignatureDialogOpen(true);
  };

  const handleSubmitSignature = async (technicianSignature: string, customerSignature: string) => {
    if (!selectedActivation) return;

    setIsSubmittingSignature(true);
    try {
      await psbActivationApi.submitSignature(selectedActivation._id, {
        technicianSignature,
        customerSignature,
      });
      toast.success('Tanda tangan berhasil disimpan');
      setIsSignatureDialogOpen(false);
      setSelectedActivation(null);
      await fetchActivations();
    } catch (error: any) {
      logger.error('Failed to submit signature', error, 'TechnicianActivationPage');
      toast.error(error.message || 'Gagal menyimpan tanda tangan');
    } finally {
      setIsSubmittingSignature(false);
    }
  };

  const togglePasswordVisibility = (activationId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [activationId]: !prev[activationId],
    }));
  };

  const handleViewDetail = (activation: PSBActivation) => {
    setSelectedActivation(activation);
    setIsDetailDialogOpen(true);
  };

  const getOntStatusColor = (status: string) => {
    switch (status) {
      case 'configured':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'failed':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSignalColor = (level: number) => {
    if (level >= -20) return 'bg-success text-success-foreground';
    if (level >= -25) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  // Calculate stats for current technician
  const activationStats = {
    totalActivations: myActivations.length,
    configuredONT: myActivations.filter(a => a.ontStatus === 'configured').length,
    pendingSignature: unsignedActivations.length,
    completedSignature: signedActivations.length,
    averageSignal:
      myActivations.length > 0
        ? (myActivations.reduce((sum, a) => sum + a.signalLevel, 0) / myActivations.length).toFixed(1)
        : '0',
  };

  const ActivationDetailDialog = ({ activation }: { activation: PSBActivation }) => (
    <DialogContent className="sm:max-w-3xl max-w-[360px] md:max-w-2xl mx-0 rounded-md">
      <DialogHeader className="pb-4 border-b border-border">
        <DialogTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span>Detail Aktivasi</span>
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{activation.serviceNumber}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(activation.activationDate), 'dd MMMM yyyy')}
            </p>
          </div>
          <Badge className={`${getOntStatusColor(activation.ontStatus)} ml-4 text-sm px-3 py-1`}>
            {activation.ontStatus}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer & Service Information */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
              <Phone className="w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
              Informasi Pelanggan
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nama Pelanggan</label>
                <p className="text-sm font-semibold bg-background rounded px-3 py-2 border border-border">{activation.customerName}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nomor Layanan</label>
                <p className="text-sm font-mono font-medium bg-background rounded px-3 py-2 border border-border">{activation.serviceNumber}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cluster</label>
                <div className="flex items-center space-x-2 bg-background rounded px-3 py-2 border border-border">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{activation.cluster}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PPPoE Credentials */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
              <Wifi className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
              Kredensial PPPoE
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Username</label>
                <p className="text-sm font-mono font-medium bg-background rounded px-3 py-2 border border-border">{activation.pppoeUsername}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
                <div className="flex items-center justify-between bg-background rounded px-3 py-2 border border-border">
                  <span className="text-sm font-mono font-medium">
                    {visiblePasswords[activation._id] ? activation.pppoePassword : '••••••••'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePasswordVisibility(activation._id)}
                    className="h-6 w-6 p-0"
                  >
                    {visiblePasswords[activation._id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* OLT Configuration */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
              Konfigurasi OLT
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nama OLT</label>
                <p className="text-sm font-semibold bg-background rounded px-3 py-2 border border-border">{activation.oltName}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">PON Port</label>
                <p className="text-sm font-mono font-medium bg-background rounded px-3 py-2 border border-border">{activation.ponPort}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ONU Number</label>
                <p className="text-sm font-mono font-medium bg-background rounded px-3 py-2 border border-border">{activation.onuNumber}</p>
              </div>
            </div>
          </div>

          {/* Signal & Status */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
              Signal & Status
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Level Redaman</label>
                <Badge className={`${getSignalColor(activation.signalLevel)} text-base px-3 py-2 w-fit`}>
                  {activation.signalLevel} dBm
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status ONT</label>
                <Badge className={`${getOntStatusColor(activation.ontStatus)} px-3 py-2 w-fit`}>
                  {activation.ontStatus}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Teknisi</label>
                <p className="text-sm font-medium bg-background rounded px-3 py-2 border border-border">{activation.technician}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Installation Report */}
        {activation.installationReport && (
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Data Instalasi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activation.installationReport.speedTest && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Speed Test</label>
                  <div className="bg-background rounded px-3 py-2 border border-border text-sm space-y-1">
                    <div>↓ Download: {activation.installationReport.speedTest.download} Mbps</div>
                    <div>↑ Upload: {activation.installationReport.speedTest.upload} Mbps</div>
                    <div>⚡ Ping: {activation.installationReport.speedTest.ping} ms</div>
                  </div>
                </div>
              )}
              {activation.installationReport.device && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Perangkat</label>
                  <div className="bg-background rounded px-3 py-2 border border-border text-sm space-y-1">
                    {activation.installationReport.device.ontType && <div>ONT: {activation.installationReport.device.ontType}</div>}
                    {activation.installationReport.device.routerType && <div>Router: {activation.installationReport.device.routerType}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {activation.notes && (
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Catatan</h3>
            <p className="text-sm text-muted-foreground bg-background rounded px-3 py-2 border border-border">{activation.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Tanggal Aktivasi: {format(new Date(activation.activationDate), 'dd MMMM yyyy')}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            ID: {activation._id}
          </Badge>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <div className="space-y-4 p-4 pb-20 md:pb-6 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Data Aktivasi Saya
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lihat aktivasi yang ditugaskan kepada Anda dan lengkapi tanda tangan
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={activationsLoading}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${activationsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Aktivasi</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                  {activationStats.totalActivations}
                </p>
              </div>
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Belum Ditandatangani</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-600">
                  {activationStats.pendingSignature}
                </p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Sudah Ditandatangani</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {activationStats.completedSignature}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Signal</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                  {activationStats.averageSignal} dBm
                </p>
              </div>
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activations List */}
      <Card>
        <CardHeader className="space-y-3 pb-4">
          <CardTitle className="text-base sm:text-lg">Data Aktivasi Saya</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama pelanggan, nomor layanan, username..."
              value={activationSearchTerm}
              onChange={e => setActivationSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {filteredActivations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {activationSearchTerm
                  ? 'Tidak ada data aktivasi yang sesuai pencarian'
                  : 'Belum ada data aktivasi yang ditugaskan kepada Anda'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto    -mx-4 sm:mx-0">
              <div className="min-w-[1200px] overflow-x-auto px-4 sm:px-0">
                <Table className=''>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ">
                    <TableRow>
                      <TableHead className="w-[50px]">No</TableHead>
                      <TableHead className="w-[200px]">Nama Pelanggan</TableHead>
                      <TableHead className="w-[160px]">Nomor Layanan</TableHead>
                      <TableHead className="w-[160px]">User PPPoE</TableHead>
                      <TableHead className="w-[160px]">Password PPPoE</TableHead>
                      <TableHead className="w-[120px]">OLT</TableHead>
                      <TableHead className="w-[120px]">PON/ONU</TableHead>
                      <TableHead className="w-[100px]">Redaman</TableHead>
                      <TableHead className="w-[120px]">Tanggal</TableHead>
                      <TableHead className="w-[100px]">Cluster</TableHead>
                      <TableHead className="w-[100px]">ONT Status</TableHead>
                      <TableHead className="w-[120px]">Status TT</TableHead>
                      <TableHead className="w-[120px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivations.map((activation, index) => {
                      const hasSigned = !!activation.installationReport?.signatures?.technician;
                      return (
                        <TableRow 
                          key={activation._id} 
                          className="hover:bg-muted/50 transition-colors h-[60px] cursor-pointer"
                          onClick={() => handleViewDetail(activation)}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium text-xs  truncate max-w-[100px] sm:max-w-[120px]">{activation.customerName || 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[11px]  truncate max-w-[100px] sm:max-w-[120px]">
                              {activation.serviceNumber}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-[11px]  truncate max-w-[100px] sm:max-w-[120px]">{activation.pppoeUsername}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px]  truncate max-w-[100px] sm:max-w-[120px]">
                                {visiblePasswords[activation._id]
                                  ? activation.pppoePassword
                                  : '••••••••'}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => togglePasswordVisibility(activation._id)}
                                className="h-6 w-6 p-0 hover:bg-muted"
                              >
                                {visiblePasswords[activation._id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className='text-[11px]  truncate max-w-[100px] sm:max-w-[120px]'>{activation.oltName}</TableCell>
                          <TableCell className="font-mono text-[11px]  truncate max-w-[100px] sm:max-w-[120px]">
                            {activation.ponPort} <span className='text-[11px]  '>|</span> {activation.onuNumber}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                activation.signalLevel >= -20
                                  ? 'default'
                                  : activation.signalLevel >= -25
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className="text-[11px]"
                            >
                              {activation.signalLevel} 
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[11px]">
                            {new Date(activation.activationDate).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-500 text-white text-[11px]  truncate max-w-[100px] sm:max-w-[120px]">
                              {activation.cluster}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                activation.ontStatus === 'configured'
                                  ? 'default'
                                  : activation.ontStatus === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className="text-[11px]  truncate max-w-[100px] sm:max-w-[120px]"
                            >
                              {activation.ontStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {hasSigned ? (
                              <Badge variant="default" className="text-xs bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Selesai
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[11px]">
                                <Clock className="h-3 w-3 mr-1" />
                                Belum
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!hasSigned && activation.installationReport?.speedTest ? (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSignActivation(activation);
                                }}
                                className="bg-primary hover:bg-primary/90"
                              >
                                <PenTool className="h-3 w-3 mr-1" />
                                Tanda Tangan
                              </Button>
                            ) : hasSigned ? (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Lengkap
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Menunggu Data CS
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedActivation && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <ActivationDetailDialog activation={selectedActivation} />
        </Dialog>
      )}

      {/* Signature Dialog */}
      <PSBSignatureDialog
        open={isSignatureDialogOpen}
        onOpenChange={setIsSignatureDialogOpen}
        activation={selectedActivation}
        onSubmit={handleSubmitSignature}
        isSubmitting={isSubmittingSignature}
      />
    </div>
  );
};

export default TechnicianActivationPage;
