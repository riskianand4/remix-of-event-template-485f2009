import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { ModernInterruptionTable } from "@/components/interruption/ModernInterruptionTable";
import {
  getAllInterruptionReports,
  createInterruptionReport,
  updateInterruptionReport,
  deleteInterruptionReport,
} from "@/services/interruptionApi";
import {
  InterruptionReport,
  CreateInterruptionReport,
} from "@/types/interruption";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getTechnicians } from "@/services/interruptionApi";

export const InterruptionDataManagement: React.FC = () => {
  const [reports, setReports] = useState<InterruptionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [technicians, setTechnicians] = useState<
    Array<{ _id: string; name: string }>
  >([]);

  const [newReport, setNewReport] = useState<CreateInterruptionReport>({
    serviceNumber: "",
    customerName: "",
    address: "",
    contactNumber: "",
    interruptionType: "",
    ticketStatus: "Open",
    technician: "",
    openTime: new Date().toISOString(),
  });

  useEffect(() => {
    loadReports();
    loadTechnicians();
  }, [page, searchQuery, statusFilter]);

  const loadTechnicians = async () => {
    try {
      const techList = await getTechnicians();
      const formatted = techList.map((t: any) => ({
        _id: t._id || t.id,
        name: t.name,
      }));
      setTechnicians(formatted);
    } catch (error) {
      console.error("❌ Error loading technicians:", error);
      toast.error("Gagal memuat daftar teknisi");
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const { reports: data, total: totalCount } =
        await getAllInterruptionReports({
          page,
          limit: 50,
          search: searchQuery,
          status: statusFilter || undefined,
        });
      setReports(data);
      setTotal(totalCount);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Gagal memuat data gangguan");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (
    id: string,
    data: Partial<InterruptionReport>
  ) => {
    try {
      const updateData: any = { ...data };
      if (updateData.technician && typeof updateData.technician === "object") {
        updateData.technician = updateData.technician._id;
      }
      await updateInterruptionReport(id, updateData);
      await loadReports();
      toast.success("Data berhasil diperbarui");
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("Gagal memperbarui data");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInterruptionReport(id);
      await loadReports();
      toast.success("Tiket berhasil dihapus");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Gagal menghapus tiket");
    }
  };

  const handleCreate = async () => {
    try {
      if (!newReport.serviceNumber || !newReport.technician) {
        toast.error("Nomor layanan dan teknisi harus diisi");
        return;
      }
      await createInterruptionReport(newReport);
      await loadReports();
      setShowAddDialog(false);
      setNewReport({
        serviceNumber: "",
        customerName: "",
        address: "",
        contactNumber: "",
        interruptionType: "",
        ticketStatus: "Open",
        technician: "",
        openTime: new Date().toISOString(),
      });
      toast.success("Tiket gangguan berhasil dibuat");
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error("Gagal membuat tiket gangguan");
    }
  };

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-destructive/10 via-destructive/5 to-background border border-border/50 p-5 sm:p-6"
      >
        <div className="absolute top-0 right-0 opacity-[0.07]">
          <AlertTriangle className="w-32 h-32 sm:w-40 sm:h-40 -mt-4 -mr-4" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Data Management Gangguan
              </h1>
              <Badge variant="secondary" className="text-xs">
                {total} tiket
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Kelola semua tiket gangguan dengan inline editing
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah Tiket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Tiket Gangguan Baru</DialogTitle>
                <DialogDescription>
                  Masukkan informasi tiket gangguan baru
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nomor Layanan *</Label>
                    <Input
                      value={newReport.serviceNumber}
                      onChange={(e) =>
                        setNewReport({ ...newReport, serviceNumber: e.target.value })
                      }
                      placeholder="Masukkan nomor layanan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Pelanggan *</Label>
                    <Input
                      value={newReport.customerName}
                      onChange={(e) =>
                        setNewReport({ ...newReport, customerName: e.target.value })
                      }
                      placeholder="Nama pelanggan"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Alamat *</Label>
                  <Input
                    value={newReport.address}
                    onChange={(e) =>
                      setNewReport({ ...newReport, address: e.target.value })
                    }
                    placeholder="Alamat lengkap"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>No Kontak *</Label>
                    <Input
                      value={newReport.contactNumber}
                      onChange={(e) =>
                        setNewReport({ ...newReport, contactNumber: e.target.value })
                      }
                      placeholder="Nomor telepon"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Gangguan *</Label>
                    <Input
                      value={newReport.interruptionType}
                      onChange={(e) =>
                        setNewReport({ ...newReport, interruptionType: e.target.value })
                      }
                      placeholder="Jenis gangguan"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teknisi *</Label>
                    <Select
                      value={newReport.technician}
                      onValueChange={(val) =>
                        setNewReport({ ...newReport, technician: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih teknisi" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background">
                        {technicians.map((tech) => (
                          <SelectItem key={tech._id} value={tech._id}>
                            {tech.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status Tiket</Label>
                    <Input
                      list="ticket-status-options"
                      value={newReport.ticketStatus}
                      onChange={(e) =>
                        setNewReport({ ...newReport, ticketStatus: e.target.value })
                      }
                      placeholder="Pilih dari daftar atau ketik manual"
                    />
                    <datalist id="ticket-status-options">
                      <option value="Open" />
                      <option value="In Progress" />
                      <option value="Resolved" />
                      <option value="Closed" />
                      <option value="Pending" />
                      <option value="Cancelled" />
                    </datalist>
                    <p className="text-xs text-muted-foreground">
                      Pilih dari daftar atau ketik status custom
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreate}>Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Cari nomor layanan, nama, atau kontak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/50 border-border/50"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter || "all"}
            onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-full sm:w-44 bg-card/50 border-border/50">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background">
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={loadReports}
            size="icon"
            className="shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {loading ? (
          <Card className="border-border/50">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">
                  Memuat data gangguan...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-[500px] sm:h-[600px] lg:h-[700px] overflow-auto border border-border/50 rounded-lg bg-card/50 backdrop-blur-sm">
            <ModernInterruptionTable
              reports={reports}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              loading={loading}
            />
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {total > 50 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center px-3 text-sm text-muted-foreground">
            Halaman {page} dari {Math.ceil(total / 50)}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page * 50 >= total}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default InterruptionDataManagement;
