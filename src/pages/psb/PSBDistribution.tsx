import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Clock,
  UserCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  MapPin,
  Phone,
  Edit,
  GitBranch,
  SendHorizontal,
  AlertCircle,
  ListFilter,
  Inbox,
} from "lucide-react";
import { getTechnicianName } from "@/utils/psbHelpers";
import { usePSBData } from "@/hooks/usePSBData";
import { logger } from "@/utils/logger";
import { PSBOrder } from "@/types/psb";
import { format } from "date-fns";
import { getAllUsers } from "@/services/userApi";
import { PSBDistributionDetailDialog } from "@/components/psb/PSBDistributionDetailDialog";
import { PSBAssignConfirmDialog } from "@/components/psb/PSBAssignConfirmDialog";
import { PSBBulkAssignConfirmDialog } from "@/components/psb/PSBBulkAssignConfirmDialog";
import { TechnicianStatusDialog } from "@/components/psb/TechnicianStatusDialog";
import { psbApi } from "@/services/psbApi";
import { toast } from "sonner";

/* ─────────────────────────── helpers ─────────────────────────── */

const techStatusConfig = {
  complete: { label: "Complete", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
  pending:  { label: "Pending",  cls: "bg-amber-500/10  text-amber-600  border-amber-200",  dot: "bg-amber-500"  },
  failed:   { label: "Failed",   cls: "bg-red-500/10    text-red-600    border-red-200",    dot: "bg-red-500"    },
} as const;

type TechStatus = keyof typeof techStatusConfig;

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
  accentBar: string;
  iconBg: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label, value, icon: Icon, accentBar, iconBg, iconColor,
}) => (
  <Card className="relative overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow">
    <div className={`absolute left-0 inset-y-0 w-1 ${accentBar}`} />
    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none">
      <Icon className="h-16 w-16" />
    </div>
    <CardContent className="pl-6 pr-4 py-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <div className={`mt-2 flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
      </div>
    </CardContent>
  </Card>
);

/* ─────────────────────────── main ─────────────────────────── */

export const PSBDistribution: React.FC = () => {
  const { orders, fetchOrders, fetchAllOrders, updateOrder, loading } = usePSBData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [availableTechnicians, setAvailableTechnicians] = useState<string[]>([]);
  const [totalTechnicians, setTotalTechnicians] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<PSBOrder | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState<PSBOrder | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bulkConfirmDialogOpen, setBulkConfirmDialogOpen] = useState(false);
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [technicianStatusDialogOpen, setTechnicianStatusDialogOpen] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<PSBOrder | null>(null);

  useEffect(() => { fetchAllOrders(); }, [fetchAllOrders]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const users = await getAllUsers();
        const techUsers = users.filter((u) => u.role === "teknisi");
        setAvailableTechnicians(techUsers.map((u) => u.name));
        setTotalTechnicians(techUsers.length);
      } catch {
        const fallback = ["Ahmad Hidayat","Budi Santoso","Citra Dewi","Doni Prakasa","Eko Wijaya","Fajar Rahman","Gita Sari"];
        setAvailableTechnicians(fallback);
        setTotalTechnicians(fallback.length);
      }
    };
    fetchTechnicians();
  }, []);

  const unassignedOrders =
    orders?.filter((o) => {
      const techName = getTechnicianName(o).trim();
      return o.status === "Pending" || !techName;
    }) ?? [];

  const clusters = Array.from(new Set(orders?.map((o) => o.cluster) ?? []));

  const filteredOrders = unassignedOrders.filter((o) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      o.customerName.toLowerCase().includes(q) ||
      o.orderNo.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q);
    return matchSearch && (selectedCluster === "all" || o.cluster === selectedCluster);
  });

  const handleAssignTechnician = (orderId: string) => {
    if (!selectedTechnician) { toast.warning("Pilih teknisi terlebih dahulu"); return; }
    const order = orders?.find((o) => o._id === orderId);
    if (!order) return;
    setConfirmOrder(order);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!confirmOrder || !selectedTechnician) return;
    setIsAssigning(confirmOrder._id);
    try {
      await updateOrder(confirmOrder._id, { status: "Assigned", technician: selectedTechnician, assignedAt: new Date().toISOString() });
      setSelectedTechnician("");
      setConfirmDialogOpen(false);
      setConfirmOrder(null);
      await fetchOrders({ limit: 1000 });
    } catch (e) {
      logger.error("Failed to assign technician", e, "PSBDistribution");
    } finally {
      setIsAssigning(null);
    }
  };

  const handleBulkAssign = () => {
    if (!selectedTechnician) { toast.warning("Pilih teknisi terlebih dahulu"); return; }
    if (filteredOrders.length === 0) { toast.warning("Tidak ada order yang akan di-assign"); return; }
    setBulkConfirmDialogOpen(true);
  };

  const handleConfirmBulkAssign = async () => {
    if (!selectedTechnician || filteredOrders.length === 0) return;
    setIsBulkAssigning(true);
    try {
      await Promise.all(filteredOrders.map((o) =>
        updateOrder(o._id, { status: "Assigned", technician: selectedTechnician, assignedAt: new Date().toISOString() })
      ));
      setSelectedTechnician("");
      setBulkConfirmDialogOpen(false);
      await fetchOrders({ limit: 1000 });
    } catch (e) {
      logger.error("Failed to bulk assign", e, "PSBDistribution");
    } finally {
      setIsBulkAssigning(false);
    }
  };

  const handleUpdateStatus = (order: PSBOrder) => {
    setSelectedOrderForStatus(order);
    setTechnicianStatusDialogOpen(true);
  };

  const handleSaveStatus = async (orderId: string, status: "pending" | "failed" | "complete", reason?: string) => {
    try {
      await psbApi.updateTechnicianStatus(orderId, status, reason);
      toast.success("Status teknisi berhasil diupdate");
      await fetchOrders({ limit: 1000 });
    } catch {
      toast.error("Gagal mengupdate status");
    }
  };

  const getOrderStatusBadge = (status: string) => {
    if (status === "Pending")
      return <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Pending</span>;
    if (status === "Assigned")
      return <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Assigned</span>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const getTechStatusBadge = (order: PSBOrder) => {
    if (!order.technicianStatus) return <span className="text-xs text-muted-foreground">—</span>;
    const cfg = techStatusConfig[order.technicianStatus as TechStatus];
    if (!cfg) return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </TooltipTrigger>
          {order.technicianStatusReason && (
            <TooltipContent>
              <p className="max-w-xs">{order.technicianStatusReason}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  const assignedOrders = orders?.filter((o) => o.status === "Assigned") ?? [];

  /* ─── render ─── */
  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 sm:p-8"
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
          <GitBranch className="h-36 w-36" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <GitBranch className="h-3 w-3" />
              Assignment Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Distribution Center
            </h1>
            <p className="text-sm text-muted-foreground">
              Assign teknisi ke order yang belum ditangani secara cepat dan efisien
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchAllOrders}
            className="sm:shrink-0 gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* ── Stat Cards ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        <StatCard
          label="Butuh Teknisi"
          value={loading ? "…" : unassignedOrders.length}
          icon={Clock}
          accentBar="bg-amber-500"
          iconBg="bg-amber-500/15"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Total Orders"
          value={loading ? "…" : orders?.length ?? 0}
          icon={Users}
          accentBar="bg-blue-500"
          iconBg="bg-blue-500/15"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Teknisi Tersedia"
          value={totalTechnicians}
          icon={UserCheck}
          accentBar="bg-emerald-500"
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-600"
        />
      </motion.div>

      {/* ── Filter & Assignment ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
      >
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <ListFilter className="h-4 w-4 text-primary" />
              </div>
              Filter &amp; Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Cari Order
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nama, order, alamat…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              {/* Cluster */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Cluster
                </label>
                <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Semua cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cluster</SelectItem>
                    {clusters.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Teknisi */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pilih Teknisi
                </label>
                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Pilih teknisi…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTechnicians.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk assign */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground invisible">
                  Aksi
                </label>
                <Button
                  className="w-full h-10 gap-2"
                  disabled={!selectedTechnician || isBulkAssigning}
                  onClick={handleBulkAssign}
                >
                  {isBulkAssigning ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-4 w-4" />
                  )}
                  {isBulkAssigning ? "Assigning…" : `Assign ${filteredOrders.length > 0 ? `(${filteredOrders.length})` : "Semua"}`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Orders Table ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <Inbox className="h-4 w-4 text-amber-600" />
                </div>
                Order Butuh Assignment
              </CardTitle>
              <Badge variant="secondary" className="rounded-full px-3 text-xs font-semibold">
                {filteredOrders.length} order
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Loading */}
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-border/50 p-4">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              /* Empty */
              <div className="py-16 flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="font-medium text-foreground/70">
                    {unassignedOrders.length === 0 ? "Semua order sudah punya teknisi 🎉" : "Tidak ada order sesuai filter"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {unassignedOrders.length === 0
                      ? "Semua order telah berhasil di-assign"
                      : "Coba ubah filter pencarian"}
                  </p>
                </div>
              </div>
            ) : (
              /* Desktop table */
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-b border-border/50 bg-muted/30">
                        {["Order No", "Customer", "Telepon", "Cluster", "Status", "Tech Status", "Teknisi", "Aksi"].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      <AnimatePresence>
                        {filteredOrders.map((order, i) => (
                          <motion.tr
                            key={order._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="group hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => { setSelectedOrder(order); setDetailDialogOpen(true); }}
                          >
                            <td className="px-5 py-4">
                              <Badge variant="outline" className="font-mono text-xs">
                                {order.orderNo}
                              </Badge>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-medium text-sm">{order.customerName}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
                                {order.address}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 shrink-0" />
                                {order.customerPhone}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                                <MapPin className="h-2.5 w-2.5" />
                                {order.cluster}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1">
                                {getOrderStatusBadge(order.status)}
                                {getTechnicianName(order) ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-600">Re-assign</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">Unassigned</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                {getTechStatusBadge(order)}
                                {getTechnicianName(order) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order); }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm font-medium">
                              {getTechnicianName(order) || <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="px-5 py-4">
                              <Button
                                size="sm"
                                className="gap-1.5 h-8"
                                disabled={!selectedTechnician || isAssigning === order._id}
                                onClick={(e) => { e.stopPropagation(); handleAssignTechnician(order._id); }}
                              >
                                {isAssigning === order._id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UserCheck className="h-3 w-3" />
                                )}
                                Assign
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="lg:hidden divide-y divide-border/40">
                  {filteredOrders.map((order, i) => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => { setSelectedOrder(order); setDetailDialogOpen(true); }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className="font-mono text-xs shrink-0">
                              {order.orderNo}
                            </Badge>
                            {getOrderStatusBadge(order.status)}
                          </div>
                          <p className="font-medium text-sm truncate">{order.customerName}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5" />{order.cluster}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" />{order.customerPhone}
                            </span>
                          </div>
                          {getTechnicianName(order) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Teknisi: <span className="font-medium text-foreground">{getTechnicianName(order)}</span>
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0 h-8 gap-1 text-xs"
                          disabled={!selectedTechnician || isAssigning === order._id}
                          onClick={(e) => { e.stopPropagation(); handleAssignTechnician(order._id); }}
                        >
                          {isAssigning === order._id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserCheck className="h-3 w-3" />
                          )}
                          Assign
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Recently Assigned ───────────────────── */}
      <AnimatePresence>
        {assignedOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  Recently Assigned
                  <Badge variant="secondary" className="rounded-full px-3 text-xs ml-auto font-semibold">
                    {assignedOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {assignedOrders.slice(0, 5).map((order, i) => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs shrink-0">{order.orderNo}</Badge>
                          <span className="font-medium text-sm truncate">{order.customerName}</span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 shrink-0">
                            {order.cluster}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground text-xs max-w-[110px] truncate">
                          {getTechnicianName(order)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dialogs ─────────────────────────────── */}
      <PSBDistributionDetailDialog
        order={selectedOrder}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
      <PSBAssignConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        order={confirmOrder}
        technician={selectedTechnician}
        onConfirm={handleConfirmAssign}
        isAssigning={isAssigning === confirmOrder?._id}
      />
      <PSBBulkAssignConfirmDialog
        open={bulkConfirmDialogOpen}
        onOpenChange={setBulkConfirmDialogOpen}
        technician={selectedTechnician}
        orderCount={filteredOrders.length}
        onConfirm={handleConfirmBulkAssign}
        isAssigning={isBulkAssigning}
      />
      <TechnicianStatusDialog
        open={technicianStatusDialogOpen}
        onOpenChange={setTechnicianStatusDialogOpen}
        order={selectedOrderForStatus}
        onSave={handleSaveStatus}
      />
    </div>
  );
};
