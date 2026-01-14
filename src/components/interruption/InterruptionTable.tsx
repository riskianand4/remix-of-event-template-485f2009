import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { lookupServiceNumber, getTechnicians, getInterruptionTypes } from '@/services/interruptionApi';
import { InterruptionReport } from '@/types/interruption';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InterruptionTableProps {
  reports: InterruptionReport[];
  onUpdate: (id: string, data: Partial<InterruptionReport>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  loading?: boolean;
}

interface EditingCell {
  rowId: string;
  field: keyof InterruptionReport;
  value: any;
}

export const InterruptionTable: React.FC<InterruptionTableProps> = ({
  reports,
  onUpdate,
  onDelete,
  loading = false
}) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [technicians, setTechnicians] = useState<Array<{ _id: string; name: string }>>([]);
  const [interruptionTypes, setInterruptionTypes] = useState<string[]>([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [techList, typesList] = await Promise.all([
        getTechnicians(),
        getInterruptionTypes()
      ]);
      setTechnicians(techList);
      setInterruptionTypes(typesList);
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  const handleCellDoubleClick = (rowId: string, field: keyof InterruptionReport, currentValue: any) => {
    // Don't allow editing of read-only fields
    if (['no', '_id', 'createdAt', 'updatedAt', 'handlingDuration', 'performance'].includes(field)) {
      return;
    }

    setEditingCell({ rowId, field, value: currentValue });
  };

  const handleDeleteClick = (reportId: string) => {
    setReportToDelete(reportId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (reportToDelete && onDelete) {
      await onDelete(reportToDelete);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handleServiceNumberBlur = async (rowId: string, serviceNumber: string) => {
    if (!serviceNumber || serviceNumber.length < 3) return;

    setLookingUp(true);
    try {
      const customerData = await lookupServiceNumber(serviceNumber);
      
      if (customerData) {
        toast.success('Data pelanggan ditemukan!');
        
        // Update the report with customer data
        const report = reports.find(r => r._id === rowId);
        if (report) {
          await onUpdate(rowId, {
            serviceNumber: customerData.serviceNumber,
            customerName: customerData.customerName,
            address: customerData.address,
            contactNumber: customerData.contactNumber
          });
        }
      }
    } catch (error) {
      toast.error('Nomor layanan tidak ditemukan di database PSB');
    } finally {
      setLookingUp(false);
    }
  };

  const handleSave = async () => {
    if (!editingCell) return;

    const { rowId, field, value } = editingCell;

    // Validation
    if (field === 'closeTime' || field === 'openTime') {
      const report = reports.find(r => r._id === rowId);
      if (!report) return;

      if (field === 'closeTime' && value) {
        const openTime = new Date(report.openTime);
        const closeTime = new Date(value);
        
        if (closeTime <= openTime) {
          toast.error('Waktu selesai harus lebih besar dari waktu open');
          return;
        }
      }
    }

    try {
      // Special handling for service number
      if (field === 'serviceNumber') {
        await handleServiceNumberBlur(rowId, value);
      } else {
        await onUpdate(rowId, { [field]: value });
      }

      toast.success('Data berhasil diperbarui');
      setEditingCell(null);
    } catch (error) {
      toast.error('Gagal memperbarui data');
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
  };

  const renderCell = (report: InterruptionReport, field: keyof InterruptionReport) => {
    const isEditing = editingCell?.rowId === report._id && editingCell?.field === field;
    const value = report[field];

    // Read-only fields
    if (['no', '_id', 'createdAt', 'updatedAt'].includes(field)) {
      if (field === 'createdAt' || field === 'updatedAt') {
        return <span>{format(new Date(value as string), 'dd/MM/yyyy HH:mm')}</span>;
      }
      return <span>{value as string}</span>;
    }

    if (isEditing) {
      // Technician dropdown
      if (field === 'technician') {
        return (
          <div className="flex items-center gap-1">
            <Select
              value={editingCell.value}
              onValueChange={(val) => setEditingCell({ ...editingCell, value: val })}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {technicians.map(tech => (
                  <SelectItem key={tech._id} value={tech._id}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 w-7 p-0">
              <Check className="h-3 w-3 text-green-500" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0">
              <X className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        );
      }

      // Ticket status dropdown
      if (field === 'ticketStatus') {
        return (
          <div className="flex items-center gap-1">
            <Select
              value={editingCell.value}
              onValueChange={(val) => setEditingCell({ ...editingCell, value: val })}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 w-7 p-0">
              <Check className="h-3 w-3 text-green-500" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0">
              <X className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        );
      }

      // Interruption type with autocomplete
      if (field === 'interruptionType') {
        return (
          <div className="flex items-center gap-1">
            <Input
              value={editingCell.value || ''}
              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
              className="h-7 text-xs"
              list="interruption-types"
              placeholder="Ketik jenis gangguan"
              autoFocus
            />
            <datalist id="interruption-types">
              {interruptionTypes.map(type => (
                <option key={type} value={type} />
              ))}
            </datalist>
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 w-7 p-0">
              <Check className="h-3 w-3 text-green-500" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0">
              <X className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        );
      }

      // Date/time fields
      if (field === 'openTime' || field === 'closeTime') {
        return (
          <div className="flex items-center gap-1">
            <Input
              type="datetime-local"
              value={editingCell.value ? new Date(editingCell.value).toISOString().slice(0, 16) : ''}
              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
              className="h-7 text-xs"
            />
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 w-7 p-0">
              <Check className="h-3 w-3 text-green-500" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0">
              <X className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        );
      }

      // TTR field - number input
      if (field === 'ttr') {
        return (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="1"
              value={editingCell.value || ''}
              onChange={(e) => setEditingCell({ ...editingCell, value: parseInt(e.target.value) || 1 })}
              className="h-7 w-16 text-xs"
            />
            <span className="text-xs text-muted-foreground">jam</span>
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 w-7 p-0">
              <Check className="h-3 w-3 text-green-500" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0">
              <X className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        );
      }

      // Default text input
      return (
        <div className="flex items-center gap-1">
          {field === 'serviceNumber' && lookingUp && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          <Input
            value={editingCell.value || ''}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onBlur={() => {
              if (field === 'serviceNumber') {
                handleServiceNumberBlur(report._id, editingCell.value);
              }
            }}
            className="h-7 text-xs"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 w-7 p-0">
            <Check className="h-3 w-3 text-green-500" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0">
            <X className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      );
    }

    // Display mode
    if (field === 'technician') {
      const techName = typeof value === 'object' && value !== null ? (value as any).name : (value as string);
      return <span className="text-sm">{techName}</span>;
    }

    if (field === 'openTime' || field === 'closeTime') {
      return <span>{value ? format(new Date(value as string), 'dd/MM/yyyy HH:mm') : '-'}</span>;
    }

    if (field === 'handlingDuration') {
      return <span className="text-sm">{value ? String(value) : '0'} jam</span>;
    }

    if (field === 'ttr') {
      return <span className="text-sm">{value ? String(value) : '8'} jam</span>;
    }

    if (field === 'performance') {
      const colors = {
        'Baik': 'bg-success/10 text-success border-success/20',
        'Cukup': 'bg-warning/10 text-warning border-warning/20',
        'Buruk': 'bg-destructive/10 text-destructive border-destructive/20'
      };
      return (
        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[value as keyof typeof colors]}`}>
          {String(value)}
        </span>
      );
    }

    if (field === 'ticketStatus') {
      const statusColors = {
        'Open': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        'In Progress': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        'Resolved': 'bg-green-500/10 text-green-600 border-green-500/20',
        'Closed': 'bg-gray-500/10 text-gray-600 border-gray-500/20'
      };
      return (
        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${statusColors[value as keyof typeof statusColors]}`}>
          {String(value)}
        </span>
      );
    }

    return <span className="text-xs">{value ? String(value) : '-'}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Table className="mobile-table-wrapper">
        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <TableRow>
            <TableHead className="w-[60px]">No</TableHead>
            <TableHead className="w-[140px]">No Layanan</TableHead>
            <TableHead className="w-[180px]">Nama Pelanggan</TableHead>
            <TableHead className="w-[200px]">Alamat</TableHead>
            <TableHead className="w-[120px]">No Kontak</TableHead>
            <TableHead className="w-[150px]">Jenis Gangguan</TableHead>
            <TableHead className="w-[120px]">Status Tiket</TableHead>
            <TableHead className="w-[140px]">Teknisi</TableHead>
            <TableHead className="w-[160px]">Penyebab</TableHead>
            <TableHead className="w-[160px]">Tindakan</TableHead>
            <TableHead className="w-[150px]">Jam Open</TableHead>
            <TableHead className="w-[150px]">Jam Selesai</TableHead>
            <TableHead className="w-[120px]">Lama Penanganan</TableHead>
            <TableHead className="w-[100px]">TTR</TableHead>
            <TableHead className="w-[120px]">Performance</TableHead>
            {onDelete && <TableHead className="w-[80px] text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow 
              key={report._id}
              className="cursor-pointer hover:bg-muted/50 transition-colors h-[70px]"
            >
              <TableCell className="w-[60px]">
                <span className="text-sm font-medium">{report.no}</span>
              </TableCell>
              <TableCell 
                className="w-[140px] cursor-pointer hover:bg-muted/30"
                onDoubleClick={() => handleCellDoubleClick(report._id, 'serviceNumber', report.serviceNumber)}
              >
                <div className="text-xs truncate">{renderCell(report, 'serviceNumber')}</div>
              </TableCell>
              <TableCell 
                className="w-[180px] cursor-pointer hover:bg-muted/30"
                onDoubleClick={() => handleCellDoubleClick(report._id, 'customerName', report.customerName)}
              >
                <div className="text-sm font-medium truncate">{renderCell(report, 'customerName')}</div>
              </TableCell>
              <TableCell 
                className="w-[200px] cursor-pointer hover:bg-muted/30"
                onDoubleClick={() => handleCellDoubleClick(report._id, 'address', report.address)}
              >
                <div className="text-xs text-muted-foreground truncate">{renderCell(report, 'address')}</div>
              </TableCell>
              <TableCell 
                className="w-[120px] cursor-pointer hover:bg-muted/30"
                onDoubleClick={() => handleCellDoubleClick(report._id, 'contactNumber', report.contactNumber)}
              >
                <div className="text-xs truncate">{renderCell(report, 'contactNumber')}</div>
              </TableCell>
              <TableCell 
                className="w-[150px] cursor-pointer hover:bg-muted/30"
                onDoubleClick={() => handleCellDoubleClick(report._id, 'interruptionType', report.interruptionType)}
              >
                <div className="text-xs truncate">{renderCell(report, 'interruptionType')}</div>
              </TableCell>
              <TableCell 
                className="w-[120px] cursor-pointer hover:bg-muted/30"
                onDoubleClick={() => handleCellDoubleClick(report._id, 'ticketStatus', report.ticketStatus)}
              >
                {renderCell(report, 'ticketStatus')}
              </TableCell>
              <TableCell 
                className="w-[140px] cursor-pointer hover:bg-muted/30"
                onDoubleClick={() => handleCellDoubleClick(report._id, 'technician', typeof report.technician === 'object' ? report.technician._id : report.technician)}
              >
                <div className="text-xs truncate">{renderCell(report, 'technician')}</div>
              </TableCell>
              <TableCell 
                className="w-[160px] cursor-pointer hover:bg-muted/30"
                onDoubleClick={() => handleCellDoubleClick(report._id, 'interruptionCause', report.interruptionCause)}
              >
                <div className="text-xs truncate">{renderCell(report, 'interruptionCause')}</div>
              </TableCell>
              <TableCell 
                className="w-[160px] cursor-pointer hover:bg-muted/30"
                onDoubleClick={() => handleCellDoubleClick(report._id, 'interruptionAction', report.interruptionAction)}
              >
                <div className="text-xs truncate">{renderCell(report, 'interruptionAction')}</div>
              </TableCell>
              <TableCell 
                className="w-[150px] cursor-pointer hover:bg-muted/30"
                onDoubleClick={() => handleCellDoubleClick(report._id, 'openTime', report.openTime)}
              >
                <div className="text-xs truncate whitespace-nowrap">{renderCell(report, 'openTime')}</div>
              </TableCell>
              <TableCell 
                className="w-[150px] cursor-pointer hover:bg-muted/30"
                onDoubleClick={() => handleCellDoubleClick(report._id, 'closeTime', report.closeTime)}
              >
                <div className="text-xs truncate whitespace-nowrap">{renderCell(report, 'closeTime')}</div>
              </TableCell>
              <TableCell className="w-[120px]">
                <div className="text-xs">{renderCell(report, 'handlingDuration')}</div>
              </TableCell>
              <TableCell 
                className="w-[100px] cursor-pointer hover:bg-muted/30"
                onDoubleClick={() => handleCellDoubleClick(report._id, 'ttr', report.ttr)}
              >
                <div className="text-xs">{renderCell(report, 'ttr')}</div>
              </TableCell>
              <TableCell className="w-[120px]">{renderCell(report, 'performance')}</TableCell>
              {onDelete && (
                <TableCell className="w-[80px] text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(report._id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus tiket gangguan ini? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
