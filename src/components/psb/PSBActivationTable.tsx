import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Edit, Trash2, Wifi, Signal, Shield, User, Search, EyeOff, FileText, MoreVertical, Hash, MapPin, Calendar } from 'lucide-react';
import { PSBActivation } from '@/types/psb';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

interface PSBActivationTableProps {
  activations: PSBActivation[];
  onView: (activation: PSBActivation) => void;
  onEdit: (activation: PSBActivation) => void;
  onDelete: (activation: PSBActivation) => void;
  onEditInstallationReport: (activation: PSBActivation) => void;
  loading?: boolean;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'configured':
      return { label: 'Configured', dotColor: 'bg-emerald-500', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-700 dark:text-emerald-400' };
    case 'pending':
      return { label: 'Pending', dotColor: 'bg-amber-500', bgColor: 'bg-amber-500/10', textColor: 'text-amber-700 dark:text-amber-400' };
    case 'failed':
      return { label: 'Failed', dotColor: 'bg-red-500', bgColor: 'bg-red-500/10', textColor: 'text-red-700 dark:text-red-400' };
    default:
      return { label: status, dotColor: 'bg-muted-foreground', bgColor: 'bg-muted/50', textColor: 'text-muted-foreground' };
  }
};

const getSignalConfig = (signalLevel: number) => {
  if (signalLevel >= -15) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' };
  if (signalLevel >= -20) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' };
  return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' };
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
    return activations.filter(activation =>
      activation.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activation.serviceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activation.pppoeUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activation.oltName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activation.cluster?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activation.technician?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activations, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, service number, user PPPoE, OLT, cluster, teknisi..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-muted/30 border-border/50 focus:bg-background transition-colors"
          />
        </div>
        {searchTerm && (
          <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="text-muted-foreground hover:text-foreground">
            Clear
          </Button>
        )}
      </div>

      {/* Results count */}
      {searchTerm && (
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          Menampilkan {filteredActivations.length} dari {activations.length} aktivasi
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <Table className="min-w-[1800px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/50">
              <TableHead className="min-w-[50px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">No</TableHead>
              <TableHead className="min-w-[180px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">Nama Pelanggan</TableHead>
              <TableHead className="min-w-[140px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">No Layanan</TableHead>
              <TableHead className="min-w-[180px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">User PPPoE</TableHead>
              <TableHead className="min-w-[120px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">Password PPPoE</TableHead>
              <TableHead className="min-w-[100px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">OLT</TableHead>
              <TableHead className="min-w-[120px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">PON/ONU</TableHead>
              <TableHead className="min-w-[100px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">Redaman</TableHead>
              <TableHead className="min-w-[120px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">Tanggal</TableHead>
              <TableHead className="min-w-[100px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">Cluster</TableHead>
              <TableHead className="min-w-[110px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">ONT Status</TableHead>
              <TableHead className="min-w-[120px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">Teknisi</TableHead>
              <TableHead className="text-right min-w-[100px] text-xs uppercase tracking-wide font-semibold text-muted-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredActivations.map((activation, index) => {
                const statusConfig = getStatusConfig(activation.ontStatus);
                const signalConfig = getSignalConfig(activation.signalLevel);

                return (
                  <motion.tr
                    key={activation._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="group border-b border-border/30 hover:bg-accent/30 transition-all duration-200"
                  >
                    <TableCell className="font-medium text-center text-muted-foreground text-sm">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5 max-w-[160px]">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="truncate font-medium text-sm" title={activation.customerName || 'N/A'}>
                          {activation.customerName || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-muted-foreground truncate block max-w-[120px]" title={activation.serviceNumber}>
                        {activation.serviceNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[160px]">
                        <Wifi className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="truncate font-mono text-sm" title={activation.pppoeUsername}>
                          {activation.pppoeUsername}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        <span className="font-mono text-sm">
                          {visiblePasswords[activation._id]
                            ? activation.pppoePassword
                            : '••••••••'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePasswordVisibility(activation._id)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      <span className="font-medium text-sm truncate block max-w-[80px]" title={activation.oltName}>
                        {activation.oltName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="font-mono text-muted-foreground">PON:{activation.ponPort}</div>
                        <div className="font-mono text-muted-foreground">ONU:{activation.onuNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${signalConfig.bg}`}>
                        <Signal className={`h-3.5 w-3.5 ${signalConfig.color}`} />
                        <span className={`font-mono text-xs font-medium ${signalConfig.color}`}>{activation.signalLevel} dBm</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(activation.activationDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate text-sm font-medium max-w-[80px]" title={activation.cluster}>
                          {activation.cluster}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor}`} />
                        {statusConfig.label}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="truncate block max-w-[100px] text-sm font-medium" title={activation.technician}>
                        {activation.technician}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => onView(activation)} className="gap-2">
                            <Eye className="h-4 w-4 text-primary" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditInstallationReport(activation)} className="gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            Isi Laporan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(activation)} className="gap-2">
                            <Edit className="h-4 w-4 text-amber-500" />
                            Edit Aktivasi
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedActivation(activation);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {filteredActivations.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <Search className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium">Tidak ada data aktivasi</p>
                    <p className="text-xs">Coba ubah kata kunci pencarian</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        <AnimatePresence>
          {filteredActivations.map((activation, index) => {
            const statusConfig = getStatusConfig(activation.ontStatus);
            const signalConfig = getSignalConfig(activation.signalLevel);

            return (
              <motion.div
                key={activation._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border border-border/50 rounded-xl p-4 bg-card hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{activation.customerName || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground font-mono">{activation.serviceNumber}</div>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor}`} />
                    {statusConfig.label}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Wifi className="h-3 w-3 text-emerald-500" />
                    <span className="truncate font-mono">{activation.pppoeUsername}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{activation.cluster}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${signalConfig.color}`}>
                    <Signal className="h-3 w-3" />
                    <span className="font-mono">{activation.signalLevel} dBm</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(activation.activationDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    <span className="font-mono">OLT: {activation.oltName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{activation.technician}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/30">
                  <Button variant="ghost" size="sm" onClick={() => onView(activation)} className="h-8 gap-1.5 text-xs">
                    <Eye className="h-3.5 w-3.5" /> Detail
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditInstallationReport(activation)} className="h-8 gap-1.5 text-xs text-blue-500">
                    <FileText className="h-3.5 w-3.5" /> Laporan
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(activation)} className="h-8 gap-1.5 text-xs">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedActivation(activation);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredActivations.length === 0 && (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Search className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">Tidak ada data aktivasi</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl max-w-[360px] md:max-w-lg">
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
            <AlertDialogAction
              onClick={() => {
                if (selectedActivation) {
                  onDelete(selectedActivation);
                  setIsDeleteDialogOpen(false);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
