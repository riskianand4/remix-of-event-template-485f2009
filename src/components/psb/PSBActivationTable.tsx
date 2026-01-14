import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Edit, Trash2, Wifi, Signal, Shield, User, Search, EyeOff, FileText } from 'lucide-react';
import { PSBActivation } from '@/types/psb';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
interface PSBActivationTableProps {
  activations: PSBActivation[];
  onView: (activation: PSBActivation) => void;
  onEdit: (activation: PSBActivation) => void;
  onDelete: (activation: PSBActivation) => void;
  onEditInstallationReport: (activation: PSBActivation) => void;
  loading?: boolean;
}
const getStatusColor = (status: string) => {
  switch (status) {
    case 'configured':
      return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
    case 'failed':
      return 'bg-red-500/10 text-red-700 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  }
};
const getSignalColor = (signalLevel: number) => {
  if (signalLevel >= -15) return 'text-green-600';
  if (signalLevel >= -20) return 'text-yellow-600';
  return 'text-red-600';
};
export const PSBActivationTable: React.FC<PSBActivationTableProps> = ({
  activations,
  onView,
  onEdit,
  onDelete,
  onEditInstallationReport
}) => {
  const [selectedActivation, setSelectedActivation] = useState<PSBActivation | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (activationId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [activationId]: !prev[activationId],
    }));
  };
  const filteredActivations = useMemo(() => {
    if (!searchTerm) return activations;
    return activations.filter(activation => activation.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || activation.serviceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || activation.pppoeUsername?.toLowerCase().includes(searchTerm.toLowerCase()) || activation.oltName?.toLowerCase().includes(searchTerm.toLowerCase()) || activation.cluster?.toLowerCase().includes(searchTerm.toLowerCase()) || activation.technician?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [activations, searchTerm]);
  return <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari berdasarkan nama, service number, user PPPoE, OLT, cluster, atau teknisi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        {searchTerm && <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
            Clear
          </Button>}
      </div>

      {/* Results count */}
      {searchTerm && <div className="text-sm text-muted-foreground">
          Menampilkan {filteredActivations.length} dari {activations.length} aktivasi
        </div>}

      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[1800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[60px]">No</TableHead>
            <TableHead className="min-w-[180px]">Nama Pelanggan</TableHead>
            <TableHead className="min-w-[140px]">Nomor Layanan</TableHead>
            <TableHead className="min-w-[180px]">User PPPoE</TableHead>
            <TableHead className="min-w-[120px]">Password PPPoE</TableHead>
            <TableHead className="min-w-[100px]">OLT</TableHead>
            <TableHead className="min-w-[120px]">PON/ONU</TableHead>
            <TableHead className="min-w-[100px]">Redaman</TableHead>
            <TableHead className="min-w-[120px]">Tanggal</TableHead>
            <TableHead className="min-w-[100px]">Cluster</TableHead>
            <TableHead className="min-w-[110px]">ONT Status</TableHead>
            <TableHead className="min-w-[120px]">Teknisi</TableHead>
            <TableHead className="text-right min-w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredActivations.map((activation, index) => <TableRow key={activation._id}>
              <TableCell className="font-medium text-center">
                {index + 1}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 max-w-[160px]">
                  <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <div className="truncate font-medium" title={activation.customerName || 'N/A'}>
                    {activation.customerName || 'N/A'}
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div className="truncate max-w-[120px]" title={activation.serviceNumber}>
                  {activation.serviceNumber}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 max-w-[160px]">
                  <Wifi className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <div className="truncate font-mono text-sm" title={activation.pppoeUsername}>
                    {activation.pppoeUsername}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span className="font-mono text-sm">
                    {visiblePasswords[activation._id] 
                      ? activation.pppoePassword 
                      : '••••••••'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePasswordVisibility(activation._id)}
                    className="h-6 w-6 p-0"
                  >
                    {visiblePasswords[activation._id] ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-sm truncate max-w-[80px]" title={activation.oltName}>
                  {activation.oltName}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm max-w-[100px]">
                  <div className="text-muted-foreground font-mono" title={`PON:${activation.ponPort}/ONU:${activation.onuNumber}`}>
                    PON:{activation.ponPort}
                  </div>
                  <div className="text-muted-foreground font-mono">
                    ONU:{activation.onuNumber}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className={`flex items-center gap-2 ${getSignalColor(activation.signalLevel)} whitespace-nowrap`}>
                  <Signal className="h-4 w-4 flex-shrink-0" />
                  <span className="font-mono text-sm">{activation.signalLevel} dBm</span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {new Date(activation.activationDate).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
              </TableCell>
              <TableCell>
                <div className="truncate max-w-[80px] font-medium" title={activation.cluster}>
                  {activation.cluster}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(activation.ontStatus)} whitespace-nowrap`}>
                  {activation.ontStatus === 'configured' ? 'Configured' : activation.ontStatus === 'pending' ? 'Pending' : 'Failed'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="truncate max-w-[100px] font-medium" title={activation.technician}>
                  {activation.technician}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onView(activation)} title="Lihat Detail">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditInstallationReport(activation)} title="Isi Data Laporan">
                    <FileText className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(activation)} title="Edit Aktivasi">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedActivation(activation)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-md max-w-[360px] md:max-w-lg sm:max-w-xl  mx-0">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus Aktivasi</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus data aktivasi untuk <strong>{selectedActivation?.customerName}</strong> dengan service number <strong>{selectedActivation?.serviceNumber}</strong>?
                          <br /><br />
                          Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data konfigurasi terkait.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                        if (selectedActivation) {
                          onDelete(selectedActivation);
                          setIsDeleteDialogOpen(false);
                        }
                      }} className="bg-red-600 hover:bg-red-700">
                          Ya, Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
        </Table>
      </div>
    </div>;
};