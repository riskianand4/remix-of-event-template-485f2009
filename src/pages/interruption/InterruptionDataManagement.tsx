import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
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
      console.log("✅ Raw technician response:", techList);

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
      console.log("📡 API response from getAllInterruptionReports:", data);
      console.log("📊 Total count:", totalCount);
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
      // Convert technician object to string if needed
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-destructive to-destructive/70 bg-clip-text text-transparent">
            Data Management Gangguan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola semua tiket gangguan dengan inline editing
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="flex-1 sm:flex-none text-xs sm:text-sm bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="ml-1 sm:ml-2">Tambah Tiket</span>
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
                        setNewReport({
                          ...newReport,
                          serviceNumber: e.target.value,
                        })
                      }
                      placeholder="Masukkan nomor layanan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Pelanggan *</Label>
                    <Input
                      value={newReport.customerName}
                      onChange={(e) =>
                        setNewReport({
                          ...newReport,
                          customerName: e.target.value,
                        })
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
                        setNewReport({
                          ...newReport,
                          contactNumber: e.target.value,
                        })
                      }
                      placeholder="Nomor telepon"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Gangguan *</Label>
                    <Input
                      value={newReport.interruptionType}
                      onChange={(e) =>
                        setNewReport({
                          ...newReport,
                          interruptionType: e.target.value,
                        })
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
                        setNewReport({
                          ...newReport,
                          ticketStatus: e.target.value,
                        })
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
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                >
                  Batal
                </Button>
                <Button onClick={handleCreate}>Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari nomor layanan, nama, atau kontak..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 lg:gap-3">
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(val) =>
                    setStatusFilter(val === "all" ? "" : val)
                  }
                >
                  <SelectTrigger className="w-full lg:w-48 text-sm">
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
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Results info */}
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Total: {total} tiket gangguan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {loading ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="text-xs sm:text-sm"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page * 50 >= total}
            onClick={() => setPage(page + 1)}
            className="text-xs sm:text-sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default InterruptionDataManagement;
