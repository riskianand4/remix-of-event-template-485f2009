import React, { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Check, X, Loader2, Trash2, AlertCircle, CalendarIcon, Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  lookupServiceNumber, getTechnicians, getInterruptionTypes,
} from "@/services/interruptionApi";
import { InterruptionReport } from "@/types/interruption";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ModernInterruptionTableProps {
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

const getStatusConfig = (status: string) => {
  switch (status) {
    case "Open":
      return { dotColor: "bg-red-500", bgColor: "bg-red-500/10", textColor: "text-red-700 dark:text-red-400" };
    case "In Progress":
      return { dotColor: "bg-blue-500", bgColor: "bg-blue-500/10", textColor: "text-blue-700 dark:text-blue-400" };
    case "Resolved":
      return { dotColor: "bg-emerald-500", bgColor: "bg-emerald-500/10", textColor: "text-emerald-700 dark:text-emerald-400" };
    case "Closed":
      return { dotColor: "bg-muted-foreground", bgColor: "bg-muted/50", textColor: "text-muted-foreground" };
    default:
      return { dotColor: "bg-amber-500", bgColor: "bg-amber-500/10", textColor: "text-amber-700 dark:text-amber-400" };
  }
};

const getPerformanceConfig = (performance: string) => {
  switch (performance) {
    case "Baik":
      return { dotColor: "bg-emerald-500", bgColor: "bg-emerald-500/10", textColor: "text-emerald-700 dark:text-emerald-400" };
    case "Cukup":
      return { dotColor: "bg-amber-500", bgColor: "bg-amber-500/10", textColor: "text-amber-700 dark:text-amber-400" };
    case "Buruk":
      return { dotColor: "bg-red-500", bgColor: "bg-red-500/10", textColor: "text-red-700 dark:text-red-400" };
    default:
      return { dotColor: "bg-muted-foreground", bgColor: "bg-muted/50", textColor: "text-muted-foreground" };
  }
};

export const ModernInterruptionTable: React.FC<ModernInterruptionTableProps> = ({
  reports, onUpdate, onDelete, loading = false,
}) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [technicians, setTechnicians] = useState<Array<{ _id: string; name: string }>>([]);
  const [interruptionTypes, setInterruptionTypes] = useState<string[]>([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeValue, setTimeValue] = useState("00:00");

  useEffect(() => { loadMetadata(); }, []);

  const loadMetadata = async () => {
    try {
      const [techList, typesList] = await Promise.all([getTechnicians(), getInterruptionTypes()]);
      setTechnicians(techList);
      setInterruptionTypes(typesList);
    } catch (error) {
      console.error("Error loading metadata:", error);
    }
  };

  const handleCellDoubleClick = (rowId: string, field: keyof InterruptionReport, currentValue: any) => {
    if (["no", "_id", "createdAt", "updatedAt", "handlingDuration"].includes(field)) return;
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
        toast.success("Data pelanggan ditemukan!");
        const report = reports.find((r) => r._id === rowId);
        if (report) {
          await onUpdate(rowId, {
            serviceNumber: customerData.serviceNumber,
            customerName: customerData.customerName,
            address: customerData.address,
            contactNumber: customerData.contactNumber,
          });
        }
      } else {
        toast.info("Nomor layanan tidak ditemukan di database PSB");
      }
    } catch (error) {
      console.error("Error looking up service number:", error);
    } finally {
      setLookingUp(false);
    }
  };

  const handleSave = async () => {
    if (!editingCell) return;
    try {
      const updateData: any = { [editingCell.field]: editingCell.value };
      if (editingCell.field === "openTime" || editingCell.field === "closeTime") {
        const report = reports.find((r) => r._id === editingCell.rowId);
        if (report) {
          const newOpenTime = editingCell.field === "openTime" ? new Date(editingCell.value) : new Date(report.openTime);
          const newCloseTime = editingCell.field === "closeTime" ? new Date(editingCell.value) : report.closeTime ? new Date(report.closeTime) : null;
          if (newOpenTime && newCloseTime && newCloseTime > newOpenTime) {
            const diff = newCloseTime.getTime() - newOpenTime.getTime();
            updateData.handlingDuration = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
          }
        }
      }
      await onUpdate(editingCell.rowId, updateData);
      setEditingCell(null);
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleCancel = () => { setEditingCell(null); };

  const renderCell = (report: InterruptionReport, field: keyof InterruptionReport) => {
    const value = report[field];
    if (field === "technician") return typeof value === "object" && value ? (value as any).name : "N/A";
    if (field === "ticketStatus") {
      const cfg = getStatusConfig(value as string);
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bgColor} ${cfg.textColor}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotColor}`} />
          {value as string}
        </div>
      );
    }
    if (field === "performance") {
      const cfg = getPerformanceConfig(value as string);
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bgColor} ${cfg.textColor}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotColor}`} />
          {value as string}
        </div>
      );
    }
    if (field === "openTime" || field === "closeTime") return value ? format(new Date(value as string), "dd/MM/yyyy HH:mm") : "-";
    if (field === "handlingDuration" || field === "ttr") return value ? `${value} jam` : "-";
    return value?.toString() || "-";
  };

  const renderEditableCell = (report: InterruptionReport, field: keyof InterruptionReport) => {
    const isEditing = editingCell?.rowId === report._id && editingCell?.field === field;
    if (!isEditing) {
      return (
        <div className="cursor-pointer hover:bg-accent/40 p-1.5 rounded-md transition-colors">
          {renderCell(report, field)}
        </div>
      );
    }

    // Save/Cancel buttons helper
    const SaveCancelBtns = () => (
      <>
        <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 w-7 p-0">
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0">
          <X className="h-3.5 w-3.5 text-red-500" />
        </Button>
      </>
    );

    if (field === "serviceNumber") {
      return (
        <div className="flex items-center gap-1 min-w-[200px]">
          <Input value={editingCell.value || ""} onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })} onBlur={(e) => handleServiceNumberBlur(report._id, e.target.value)} className="h-8 text-xs flex-1 bg-muted/30" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }} />
          {lookingUp && <Loader2 className="h-3 w-3 animate-spin" />}
          <SaveCancelBtns />
        </div>
      );
    }

    if (field === "ticketStatus") {
      return (
        <div className="flex items-center gap-1 min-w-[200px]">
          <Input list="inline-ticket-status-list" value={editingCell.value || ""} onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })} className="h-8 text-sm flex-1 bg-muted/30" placeholder="Ketik atau pilih status" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }} />
          <datalist id="inline-ticket-status-list">
            <option value="Open" /><option value="In Progress" /><option value="Resolved" /><option value="Closed" /><option value="Pending" /><option value="Cancelled" />
          </datalist>
          <SaveCancelBtns />
        </div>
      );
    }

    if (field === "technician") {
      const techId = typeof report.technician === "object" ? report.technician._id : report.technician;
      return (
        <div className="flex items-center gap-1 min-w-[200px]">
          <Select value={editingCell.value || techId} onValueChange={(val) => setEditingCell({ ...editingCell, value: val })}>
            <SelectTrigger className="h-8 text-xs flex-1 bg-muted/30"><SelectValue /></SelectTrigger>
            <SelectContent className="z-50 bg-background border shadow-lg">
              {technicians.map((tech) => (<SelectItem key={tech._id} value={tech._id}>{tech.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <SaveCancelBtns />
        </div>
      );
    }

    if (field === "interruptionType") {
      return (
        <div className="flex items-center gap-1 min-w-[200px]">
          <Input value={editingCell.value || ""} onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })} className="h-8 text-xs flex-1 bg-muted/30" list="interruption-types" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }} />
          <datalist id="interruption-types">{interruptionTypes.map((type) => (<option key={type} value={type} />))}</datalist>
          <SaveCancelBtns />
        </div>
      );
    }

    if (field === "openTime" || field === "closeTime") {
      const currentValue = editingCell.value ? new Date(editingCell.value) : new Date();
      const handleDateTimeConfirm = async () => {
        if (!selectedDate || !editingCell) return;
        const [hours, minutes] = timeValue.split(":");
        const newDateTime = new Date(selectedDate);
        newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const isoValue = newDateTime.toISOString();
        try {
          const updateData: any = { [editingCell.field]: isoValue };
          if (editingCell.field === "closeTime" || editingCell.field === "openTime") {
            const report = reports.find((r) => r._id === editingCell.rowId);
            if (report) {
              const newOpenTime = editingCell.field === "openTime" ? newDateTime : new Date(report.openTime);
              const newCloseTime = editingCell.field === "closeTime" ? newDateTime : report.closeTime ? new Date(report.closeTime) : null;
              if (newOpenTime && newCloseTime && newCloseTime > newOpenTime) {
                const diff = newCloseTime.getTime() - newOpenTime.getTime();
                updateData.handlingDuration = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
              }
            }
          }
          await onUpdate(editingCell.rowId, updateData);
          setEditingCell(null);
          setDatePickerOpen(false);
        } catch (error) {
          console.error("Error saving datetime:", error);
        }
      };

      return (
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("h-8 text-xs justify-start text-left font-normal w-full bg-muted/30", !editingCell.value && "text-muted-foreground")}
              onClick={() => { setSelectedDate(currentValue); setTimeValue(format(currentValue, "HH:mm")); setDatePickerOpen(true); }}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {editingCell.value ? format(new Date(editingCell.value), "dd/MM/yyyy HH:mm") : <span>Pilih tanggal</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-3">
              <Calendar mode="single" selected={selectedDate ?? currentValue} onSelect={(date) => date && setSelectedDate(date)} initialFocus />
              <div className="flex items-center gap-2 pt-2 border-t">
                <label className="text-xs font-medium">Jam:</label>
                <Input type="time" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} className="h-8 text-xs flex-1" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleDateTimeConfirm} className="flex-1"><Check className="h-3 w-3 mr-1" /> Simpan</Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1"><X className="h-3 w-3 mr-1" /> Batal</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    if (field === "ttr") {
      return (
        <div className="flex items-center gap-1 min-w-[150px]">
          <Input type="number" value={editingCell.value || ""} onChange={(e) => setEditingCell({ ...editingCell, value: parseFloat(e.target.value) })} className="h-8 text-xs flex-1 bg-muted/30" min="0" step="0.5" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }} />
          <SaveCancelBtns />
        </div>
      );
    }

    if (field === "performance") {
      return (
        <div className="flex items-center gap-1 min-w-[200px]">
          <Input list="inline-performance-list" value={editingCell.value || ""} onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })} className="h-8 text-sm flex-1 bg-muted/30" placeholder="Ketik atau pilih" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }} />
          <datalist id="inline-performance-list"><option value="Baik" /><option value="Cukup" /><option value="Buruk" /></datalist>
          <SaveCancelBtns />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 min-w-[200px]">
        <Input value={editingCell.value || ""} onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })} className="h-8 text-xs flex-1 bg-muted/30" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }} />
        <SaveCancelBtns />
      </div>
    );
  };

  return (
    <>
      <div className="w-full border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/50">
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">No</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[120px]">No Layanan</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[150px]">Nama Pelanggan</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[200px]">Alamat</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[120px]">No Kontak</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[150px]">Jenis Gangguan</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[120px]">Status Tiket</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[120px]">Teknisi</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[150px]">Penyebab</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[150px]">Tindakan</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[130px]">Jam Open</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[130px]">Jam Selesai</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[100px]">Lama (Jam)</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[80px]">TTR</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[100px]">Performance</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground min-w-[80px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {reports.map((report, index) => {
                const isEditingRow = editingCell?.rowId === report._id;
                return (
                  <motion.tr
                    key={report._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      "group border-b border-border/30 hover:bg-accent/30 transition-all duration-200",
                      isEditingRow && "bg-accent/20 ring-1 ring-primary/20"
                    )}
                  >
                    <TableCell className="text-xs font-medium text-muted-foreground text-center">{report.no}</TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "serviceNumber", report.serviceNumber)} className="text-xs">{renderEditableCell(report, "serviceNumber")}</TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "customerName", report.customerName)} className="text-xs font-medium">{renderEditableCell(report, "customerName")}</TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "address", report.address)} className="text-xs">{renderEditableCell(report, "address")}</TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "contactNumber", report.contactNumber)} className="text-xs">{renderEditableCell(report, "contactNumber")}</TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "interruptionType", report.interruptionType)} className="text-xs">{renderEditableCell(report, "interruptionType")}</TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "ticketStatus", report.ticketStatus)} className="text-xs">{renderEditableCell(report, "ticketStatus")}</TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "technician", report.technician)} className="text-xs">{renderEditableCell(report, "technician")}</TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "interruptionCause", report.interruptionCause)} className="text-xs">{renderEditableCell(report, "interruptionCause")}</TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "interruptionAction", report.interruptionAction)} className="text-xs">{renderEditableCell(report, "interruptionAction")}</TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "openTime", report.openTime)} className="text-xs">{renderEditableCell(report, "openTime")}</TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "closeTime", report.closeTime)} className="text-xs">{renderEditableCell(report, "closeTime")}</TableCell>
                    <TableCell className="text-xs"><div className="p-1.5">{renderCell(report, "handlingDuration")}</div></TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "ttr", report.ttr)} className="text-xs">{renderEditableCell(report, "ttr")}</TableCell>
                    <TableCell onDoubleClick={() => handleCellDoubleClick(report._id, "performance", report.performance)} className="text-xs">{renderEditableCell(report, "performance")}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-0.5">
                        <Button size="sm" variant="ghost" onClick={() => { toast.info("Fitur view detail akan segera hadir"); }} className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10">
                          <Eye className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(report._id)} className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {reports.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={16} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium">Tidak ada data gangguan</p>
                    <p className="text-xs">Double-click pada cell untuk edit</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tiket Gangguan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus tiket gangguan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ModernInterruptionTable;
