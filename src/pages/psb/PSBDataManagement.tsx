import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Skeleton,
  StatsCardSkeleton,
  TableSkeleton,
} from "@/components/ui/loading-skeleton";
import {
  Database, Upload, Download, Search, Filter, Edit, Trash2, Eye, Plus,
  RefreshCw, FileSpreadsheet, CheckCircle, AlertTriangle, Info, MoreVertical,
  Layers, Clock, Package, MapPin, User, Phone,
} from "lucide-react";
import { getTechnicianName } from '@/utils/psbHelpers';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { psbApi } from "@/services/psbApi";
import { PSBOrder, CreatePSBOrderRequest } from "@/types/psb";
import { toast } from "sonner";
import { PSBViewDialog } from "@/components/psb/PSBViewDialog";
import { PSBEditDialog } from "@/components/psb/PSBEditDialog";
import { PSBAddDialog } from "@/components/psb/PSBAddDialog";
import { PSBDeleteDialog } from "@/components/psb/PSBDeleteDialog";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import * as XLSX from "xlsx";

// ─── Status Helpers ──────────────────────────────────────────────────────────
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'Completed':
      return { dotColor: 'bg-emerald-500', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-700 dark:text-emerald-400' };
    case 'In Progress':
      return { dotColor: 'bg-blue-500', bgColor: 'bg-blue-500/10', textColor: 'text-blue-700 dark:text-blue-400' };
    case 'Pending':
      return { dotColor: 'bg-amber-500', bgColor: 'bg-amber-500/10', textColor: 'text-amber-700 dark:text-amber-400' };
    case 'Cancelled':
      return { dotColor: 'bg-red-500', bgColor: 'bg-red-500/10', textColor: 'text-red-700 dark:text-red-400' };
    default:
      return { dotColor: 'bg-muted-foreground', bgColor: 'bg-muted/50', textColor: 'text-muted-foreground' };
  }
};

export const PSBDataManagement: React.FC = () => {
  const [orders, setOrders] = useState<PSBOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog states
  const [viewDialog, setViewDialog] = useState<{ open: boolean; order: PSBOrder | null }>({ open: false, order: null });
  const [editDialog, setEditDialog] = useState<{ open: boolean; order: PSBOrder | null }>({ open: false, order: null });
  const [addDialog, setAddDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; order: PSBOrder | null }>({ open: false, order: null });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await psbApi.getOrders({
        search,
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: displayLimit,
      });
      if (response && response.success) {
        setOrders(response.data || []);
        if (response.pagination && response.pagination.total !== undefined) {
          setTotalRecords(response.pagination.total);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Gagal memuat data orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [search, statusFilter, displayLimit]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel") {
        setSelectedFile(file);
        toast.success(`File ${file.name} siap untuk diimport`);
      } else {
        toast.error("Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls)");
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) { toast.error("Pilih file Excel terlebih dahulu"); return; }
    try {
      setImporting(true);
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const orders = jsonData.map((row: any, index) => ({
            cluster: row["Cluster"] || row["cluster"] || row["CLUSTER"] || "",
            sto: row["STO"] || row["sto"] || "",
            orderNo: row["Order No"] || row["orderNo"] || row["ORDER NO"] || row["No Order"] || `ORDER-${Date.now()}-${index}`,
            customerName: row["Customer Name"] || row["customerName"] || row["Nama Pelanggan"] || row["NAMA PELANGGAN"] || "",
            customerPhone: row["Phone"] || row["customerPhone"] || row["No HP"] || row["NO HP"] || row["Telepon"] || "",
            address: row["Address"] || row["address"] || row["Alamat"] || row["ALAMAT"] || "",
            package: row["Package"] || row["package"] || row["Paket"] || row["PAKET"] || "",
            status: row["Status"] || row["status"] || "Pending",
            priority: row["Priority"] || row["priority"] || row["Prioritas"] || "normal",
            notes: row["Notes"] || row["notes"] || row["Catatan"] || "",
          }));

          const validOrders = orders.filter(order => order.cluster && order.sto && order.customerName && order.address && order.package);
          if (validOrders.length === 0) { toast.error("Tidak ada data valid. Pastikan field wajib terisi: Cluster, STO, Customer Name, Address, Package"); return; }

          let successCount = 0;
          let failCount = 0;
          for (const order of validOrders) {
            try { await psbApi.createOrder(order); successCount++; } catch { failCount++; }
          }
          if (successCount > 0) toast.success(`Berhasil mengimport ${successCount} dari ${orders.length} data`);
          if (failCount > 0) toast.warning(`${failCount} data gagal diimport`);
        } catch { toast.error("Format Excel tidak valid"); }
      };
      fileReader.readAsBinaryString(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => fetchOrders(), 1500);
    } catch { toast.error("Gagal mengimport data"); } finally { setImporting(false); }
  };

  const downloadPSBTemplate = () => {
    const templateData = [
      { 'Cluster': 'CLUSTER-01', 'STO': 'STO-JAKARTA', 'Order No': 'PSB-2024-001', 'Customer Name': 'John Doe', 'Phone': '081234567890', 'Address': 'Jl. Contoh No. 123, Jakarta', 'Package': '20 Mbps', 'Priority': 'normal', 'Notes': 'Instalasi lantai 2' },
      { 'Cluster': 'CLUSTER-02', 'STO': 'STO-BANDUNG', 'Order No': 'PSB-2024-002', 'Customer Name': 'Jane Smith', 'Phone': '081234567891', 'Address': 'Jl. Sample No. 456, Bandung', 'Package': '50 Mbps', 'Priority': 'high', 'Notes': '' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 35 }, { wch: 12 }, { wch: 10 }, { wch: 25 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template PSB");
    XLSX.writeFile(wb, "template_import_psb.xlsx");
  };

  const handleExport = () => {
    try {
      const exportData = orders.map((order) => ({
        No: order.no, "Order No": order.orderNo, Date: new Date(order.date).toLocaleDateString("id-ID"),
        Cluster: order.cluster, STO: order.sto, "Customer Name": order.customerName, Phone: order.customerPhone,
        Address: order.address, Package: order.package, Status: order.status,
        Technician: getTechnicianName(order) || "", Notes: order.notes || "",
        "Created At": new Date(order.createdAt).toLocaleString("id-ID"), "Created By": order.createdBy.name,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PSB Orders");
      ws["!cols"] = [{ wch: 8 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 15 }];
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      XLSX.writeFile(wb, `PSB_Orders_Export_${timestamp}.xlsx`);
      toast.success("Data berhasil diekspor");
    } catch { toast.error("Gagal mengekspor data"); }
  };

  const handleViewOrder = (order: PSBOrder) => setViewDialog({ open: true, order });
  const handleEditOrder = (order: PSBOrder) => setEditDialog({ open: true, order });
  const handleDeleteOrder = (order: PSBOrder) => setDeleteDialog({ open: true, order });
  const handleAddOrder = () => setAddDialog(true);

  const handleSaveEdit = async (id: string, data: Partial<CreatePSBOrderRequest>) => {
    try { await psbApi.updateOrder(id, data); toast.success("Data berhasil diupdate"); fetchOrders(); }
    catch (error) { toast.error("Gagal mengupdate data"); throw error; }
  };
  const handleSaveAdd = async (data: CreatePSBOrderRequest) => {
    try { await psbApi.createOrder(data); toast.success("Data berhasil ditambahkan"); setAddDialog(false); fetchOrders(); }
    catch (error) { toast.error("Gagal menambahkan data"); throw error; }
  };
  const handleConfirmDelete = async (id: string) => {
    try { await psbApi.deleteOrder(id); toast.success("Data berhasil dihapus"); fetchOrders(); }
    catch (error) { toast.error("Gagal menghapus data"); throw error; }
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const completedCount = orders.filter((o) => o.status === "Completed").length;
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const clusterCount = new Set(orders.map((o) => o.cluster)).size;

  const statCards = [
    { label: 'Total Records', value: orders.length, icon: Database, accentBar: 'border-l-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary', watermark: Database },
    { label: 'Completed', value: completedCount, icon: CheckCircle, accentBar: 'border-l-emerald-500', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', watermark: CheckCircle },
    { label: 'Pending', value: pendingCount, icon: Clock, accentBar: 'border-l-amber-500', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500', watermark: Clock },
    { label: 'Clusters', value: clusterCount, icon: Layers, accentBar: 'border-l-purple-500', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-500', watermark: Layers },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-96 max-w-full" /></div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3"><Skeleton className="h-9 w-full sm:w-24" /><Skeleton className="h-9 w-full sm:w-32" /><Skeleton className="h-9 w-full sm:w-36" /></div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}</div>
        <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><div className="flex flex-col sm:flex-row gap-4"><Skeleton className="h-10 flex-1 min-w-0" /><Skeleton className="h-10 w-full sm:w-[180px]" /></div></CardContent></Card>
        <Card><CardHeader><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-6 w-24 rounded-full" /></div></CardHeader><CardContent><TableSkeleton rows={10} /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-0 sm:p-0 sm:w-full w-[360px]">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            PSB Data Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola data pelanggan dan order PSB secara menyeluruh
          </p>
        </div>
        <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button onClick={fetchOrders} variant="outline" size="sm" className="w-full sm:w-auto gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm" className="w-full sm:w-auto gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import Excel</span>
                <span className="sm:hidden">Import</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-auto rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base">Import Data dari Excel</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">Upload file Excel (.xlsx atau .xls) untuk mengimport data PSB secara batch</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Button variant="outline" onClick={downloadPSBTemplate} className="text-xs sm:text-sm gap-2" size="sm">
                    <Download className="h-4 w-4" /> Download Template Excel
                  </Button>
                </div>
                <div className="border-2 border-dashed border-border/50 rounded-xl p-4 sm:p-6 text-center bg-muted/20">
                  <FileSpreadsheet className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-2 sm:mb-4" />
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mb-2 text-xs sm:text-sm gap-2" size="sm">
                    <Upload className="h-4 w-4" /> Pilih File Excel
                  </Button>
                  {selectedFile && <p className="text-xs sm:text-sm text-muted-foreground break-all">File: {selectedFile.name}</p>}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button onClick={handleImport} disabled={!selectedFile || importing} className="flex-1 text-xs sm:text-sm" size="sm">
                    {importing ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />Mengimport...</>) : (<><Upload className="h-4 w-4 mr-2" />Import Data</>)}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedFile(null)} size="sm" className="text-xs sm:text-sm">Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const IconEl = card.icon;
          const WatermarkEl = card.watermark;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Card className={`relative overflow-hidden border-l-4 ${card.accentBar} hover:shadow-md transition-all duration-200 group`}>
                <div className="absolute -bottom-3 -right-3 opacity-[0.05]">
                  <WatermarkEl className="h-20 w-20" />
                </div>
                <CardContent className="relative p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                      <p className="text-3xl font-bold text-foreground leading-none">
                        <AnimatedCounter value={card.value} />
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${card.iconBg} group-hover:scale-110 transition-transform`}>
                      <IconEl className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
      >
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, order ID, atau nomor telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-muted/30 border-border/50 focus:bg-background transition-colors"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddOrder} size="sm" className="gap-2 h-10">
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </motion.div>

      {/* ── Data Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Table Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Data PSB</span>
            <Badge variant="outline" className="text-xs">
              {orders.length} / {totalRecords}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Tampilkan:</span>
            <Select value={displayLimit.toString()} onValueChange={(value) => setDisplayLimit(parseInt(value))}>
              <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="250">250</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block border border-border/50 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/50">
                  <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground w-12">No</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Order ID</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Customer</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Cluster</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground hidden lg:table-cell">STO</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground hidden lg:table-cell">Package</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground hidden xl:table-cell">Address</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground hidden lg:table-cell">Teknisi</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground hidden md:table-cell">Dibuat</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground w-16">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {orders.map((order, index) => {
                    const sc = getStatusConfig(order.status);
                    return (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.015 }}
                        className="group border-b border-border/30 hover:bg-accent/30 transition-all duration-200"
                      >
                        <TableCell className="text-sm text-muted-foreground font-medium">{order.no}</TableCell>
                        <TableCell>
                          <code className="bg-muted/50 px-2 py-0.5 rounded text-xs font-mono truncate block max-w-[120px]">{order.orderNo}</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[140px]">{order.customerName}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[140px]">{order.customerPhone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium">{order.cluster}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{order.sto}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[100px]">{order.package}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <span className="text-xs text-muted-foreground truncate block max-w-[150px]" title={order.address}>{order.address}</span>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bgColor} ${sc.textColor}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dotColor}`} />
                            {order.status}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{getTechnicianName(order) || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("id-ID")}</span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => handleViewOrder(order)} className="gap-2">
                                <Eye className="h-4 w-4 text-primary" /> Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditOrder(order)} className="gap-2">
                                <Edit className="h-4 w-4 text-amber-500" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteOrder(order)} className="gap-2 text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-16">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold">Tidak ada data</h3>
                <p className="text-xs">Import data Excel atau tambah data manual</p>
                <Button size="sm" onClick={handleAddOrder} className="mt-2 gap-2">
                  <Plus className="h-4 w-4" /> Tambah Data
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          <AnimatePresence>
            {orders.map((order, index) => {
              const sc = getStatusConfig(order.status);
              return (
                <motion.div
                  key={order._id}
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
                        <div className="font-semibold text-sm">{order.customerName}</div>
                        <code className="text-xs text-muted-foreground font-mono">{order.orderNo}</code>
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bgColor} ${sc.textColor}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sc.dotColor}`} />
                      {order.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3 w-3" />{order.cluster}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Package className="h-3 w-3" />{order.package}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3 w-3" />{order.customerPhone}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="h-3 w-3" />{getTechnicianName(order) || "-"}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/30">
                    <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)} className="h-8 gap-1.5 text-xs">
                      <Eye className="h-3.5 w-3.5" /> Detail
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order)} className="h-8 gap-1.5 text-xs">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteOrder(order)} className="h-8 w-8 p-0 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {orders.length === 0 && (
            <div className="text-center py-16">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <Database className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold">Tidak ada data</p>
                <Button size="sm" onClick={handleAddOrder} className="mt-2 gap-2">
                  <Plus className="h-4 w-4" /> Tambah Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Dialogs */}
      <PSBViewDialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, order: null })} order={viewDialog.order} />
      <PSBEditDialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, order: null })} order={editDialog.order} onSave={handleSaveEdit} />
      <PSBAddDialog open={addDialog} onOpenChange={setAddDialog} onSave={handleSaveAdd} />
      <PSBDeleteDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, order: null })} order={deleteDialog.order} onConfirm={handleConfirmDelete} />
    </div>
  );
};
