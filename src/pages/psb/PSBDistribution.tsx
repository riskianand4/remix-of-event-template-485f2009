import React, { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Clock,
  AlertCircle,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  MapPin,
  Phone,
  Edit,
} from "lucide-react";
import { getTechnicianName } from '@/utils/psbHelpers';
import { usePSBData } from "@/hooks/usePSBData";
import { logger } from "@/utils/logger";
import { PSBOrder } from "@/types/psb";
import { format } from "date-fns";
import { getAllTechnicians } from "@/services/technicianApi";
import { getAllUsers } from "@/services/userApi";
import { PSBDistributionDetailDialog } from "@/components/psb/PSBDistributionDetailDialog";
import { PSBAssignConfirmDialog } from "@/components/psb/PSBAssignConfirmDialog";
import { PSBBulkAssignConfirmDialog } from "@/components/psb/PSBBulkAssignConfirmDialog";
import { TechnicianStatusDialog } from "@/components/psb/TechnicianStatusDialog";
import { psbApi } from "@/services/psbApi";
import { toast } from "sonner";

export const PSBDistribution: React.FC = () => {
  const { orders, fetchOrders, fetchAllOrders, updateOrder, loading } = usePSBData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [availableTechnicians, setAvailableTechnicians] = useState<string[]>(
    []
  );
  const [totalTechnicians, setTotalTechnicians] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<PSBOrder | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState<PSBOrder | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bulkConfirmDialogOpen, setBulkConfirmDialogOpen] = useState(false);
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [technicianStatusDialogOpen, setTechnicianStatusDialogOpen] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<PSBOrder | null>(null);

  // Fetch orders on component mount - Get ALL orders for distribution
  useEffect(() => {
    // Use fetchAllOrders to get all orders without pagination limit
    fetchAllOrders();
  }, [fetchAllOrders]);

  // Filter orders that need assignment (Pending status OR no technician assigned)
  const unassignedOrders =
    orders?.filter((order) => {
      const techName = getTechnicianName(order).trim();
      const hasNoTechnician = !techName;
      return order.status === "Pending" || hasNoTechnician;
    }) || [];

  // Debug logging
  console.log("Distribution Debug:", {
    totalOrders: orders?.length || 0,
    unassignedOrders: unassignedOrders.length,
    ordersWithoutTech:
      orders?.filter((o) => !getTechnicianName(o))
        .length || 0,
    pendingOrders: orders?.filter((o) => o.status === "Pending").length || 0,
    sampleOrder: orders?.[0] || null,
  });

  // Fetch available technicians from API
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        // Get users with teknisi role
        const users = await getAllUsers();
        const technicianUsers = users.filter((user) => user.role === "teknisi");

        setAvailableTechnicians(technicianUsers.map((user) => user.name));
        setTotalTechnicians(technicianUsers.length);
      } catch (error) {
        logger.error("Failed to fetch technicians", error, "PSBDistribution");
        // Fallback data
        const fallbackTechnicians = [
          "Ahmad Hidayat",
          "Budi Santoso",
          "Citra Dewi",
          "Doni Prakasa",
          "Eko Wijaya",
          "Fajar Rahman",
          "Gita Sari",
        ];
        setAvailableTechnicians(fallbackTechnicians);
        setTotalTechnicians(fallbackTechnicians.length);
      }
    };

    fetchTechnicians();
  }, []);

  // Get unique clusters from orders
  const clusters = Array.from(
    new Set(orders?.map((order) => order.cluster) || [])
  );

  // Filter pending orders based on search and cluster
  const filteredOrders = unassignedOrders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCluster =
      selectedCluster === "all" || order.cluster === selectedCluster;

    return matchesSearch && matchesCluster;
  });

  const handleAssignTechnician = async (orderId: string) => {
    if (!selectedTechnician) {
      alert("Pilih teknisi terlebih dahulu");
      return;
    }

    const order = orders?.find(o => o._id === orderId);
    if (!order) return;

    setConfirmOrder(order);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!confirmOrder || !selectedTechnician) return;

    setIsAssigning(confirmOrder._id);
    try {
      await updateOrder(confirmOrder._id, {
        status: "Assigned",
        technician: selectedTechnician,
        assignedAt: new Date().toISOString(),
      });

      setSelectedTechnician("");
      setConfirmDialogOpen(false);
      setConfirmOrder(null);
      await fetchOrders({ limit: 1000 });
    } catch (error) {
      logger.error("Failed to assign technician", error, "PSBDistribution");
    } finally {
      setIsAssigning(null);
    }
  };

  const handleBulkAssign = () => {
    if (!selectedTechnician) {
      alert("Pilih teknisi terlebih dahulu");
      return;
    }

    if (filteredOrders.length === 0) {
      alert("Tidak ada order yang akan di-assign");
      return;
    }

    setBulkConfirmDialogOpen(true);
  };

  const handleConfirmBulkAssign = async () => {
    if (!selectedTechnician || filteredOrders.length === 0) return;

    setIsBulkAssigning(true);
    try {
      await Promise.all(
        filteredOrders.map(order =>
          updateOrder(order._id, {
            status: "Assigned",
            technician: selectedTechnician,
            assignedAt: new Date().toISOString(),
          })
        )
      );

      setSelectedTechnician("");
      setBulkConfirmDialogOpen(false);
      await fetchOrders({ limit: 1000 });
    } catch (error) {
      logger.error("Failed to bulk assign technician", error, "PSBDistribution");
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
    } catch (error) {
      logger.error("Failed to update technician status", error, "PSBDistribution");
      toast.error("Gagal mengupdate status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge className="bg-yellow-500 text-white">
            Menunggu Assignment
          </Badge>
        );
      case "Assigned":
        return <Badge className="bg-blue-500 text-white">Sudah Assigned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTechnicianStatusBadge = (order: PSBOrder) => {
    if (!order.technicianStatus) {
      return <Badge variant="outline" className="text-xs">Not Set</Badge>;
    }

    switch (order.technicianStatus) {
      case "complete":
        return (
          <Badge className="bg-green-500 text-white text-xs">
            Complete
          </Badge>
        );
      case "pending":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-yellow-500 text-white text-xs">
                  Pending
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{order.technicianStatusReason || "No reason provided"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case "failed":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-red-500 text-white text-xs">
                  Failed
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{order.technicianStatusReason || "No reason provided"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-0 sm:w-full w-[360px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="sm:text-2xl text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Distribution Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Assign teknisi ke order yang belum ditangani
          </p>
        </div>
        <Button onClick={fetchAllOrders} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Orders Butuh Teknisi
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {loading ? "..." : unassignedOrders.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {loading ? "..." : orders?.length || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Available Technicians
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {totalTechnicians}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, order, alamat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cluster</label>
              <Select
                value={selectedCluster}
                onValueChange={setSelectedCluster}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih cluster" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cluster</SelectItem>
                  {clusters.map((cluster) => (
                    <SelectItem key={cluster} value={cluster}>
                      {cluster}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Technician</label>
              <Select
                value={selectedTechnician}
                onValueChange={setSelectedTechnician}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih teknisi" />
                </SelectTrigger>
                <SelectContent>
                  {availableTechnicians.map((tech) => (
                    <SelectItem key={tech} value={tech}>
                      {tech}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Action</label>
              <Button
                className="w-full"
                disabled={!selectedTechnician || isBulkAssigning}
                onClick={handleBulkAssign}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {isBulkAssigning ? 'Assigning...' : 'Assign Selected'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Order Butuh Assignment ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {unassignedOrders.length === 0
                  ? "Semua order sudah punya teknisi"
                  : "Tidak ada order yang sesuai dengan filter"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tech Status</TableHead>
                  <TableHead>Teknisi</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedOrder(order);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <TableCell>
                      <Badge variant="outline">{order.orderNo}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {order.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{order.customerPhone}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-500 text-white">
                        {order.cluster}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        {getTechnicianName(order) ? (
                          <Badge className="bg-orange-500 text-white text-xs">
                            Re-assign
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500 text-white text-xs">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTechnicianStatusBadge(order)}
                        {getTechnicianName(order) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(order);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTechnicianName(order) ? (
                        <span className="text-sm font-medium">
                          {getTechnicianName(order)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignTechnician(order._id);
                        }}
                        disabled={
                          !selectedTechnician || isAssigning === order._id
                        }
                      >
                        {isAssigning === order._id ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Assign
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <PSBDistributionDetailDialog
        order={selectedOrder}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Assign Confirmation Dialog */}
      <PSBAssignConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        order={confirmOrder}
        technician={selectedTechnician}
        onConfirm={handleConfirmAssign}
        isAssigning={isAssigning === confirmOrder?._id}
      />

      {/* Bulk Assign Confirmation Dialog */}
      <PSBBulkAssignConfirmDialog
        open={bulkConfirmDialogOpen}
        onOpenChange={setBulkConfirmDialogOpen}
        technician={selectedTechnician}
        orderCount={filteredOrders.length}
        onConfirm={handleConfirmBulkAssign}
        isAssigning={isBulkAssigning}
      />

      {/* Technician Status Dialog */}
      <TechnicianStatusDialog
        open={technicianStatusDialogOpen}
        onOpenChange={setTechnicianStatusDialogOpen}
        order={selectedOrderForStatus}
        onSave={handleSaveStatus}
      />

      {/* Assigned Orders Preview */}
      {orders?.filter((order) => order.status === "Assigned").length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-base sm:text-lg">
              Recently Assigned Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="space-y-2 sm:space-y-3">
              {orders
                ?.filter((order) => order.status === "Assigned")
                .slice(0, 5)
                .map((order) => (
                  <div
                    key={order._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 border rounded-lg gap-2 sm:gap-3 min-w-0"
                  >
                    {/* Mobile Layout - Stacked */}
                    <div className="flex flex-col sm:hidden gap-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {order.orderNo}
                        </Badge>
                        <Badge className="bg-blue-500 text-white text-xs shrink-0">
                          {order.cluster}
                        </Badge>
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-sm truncate block">
                          {order.customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium text-muted-foreground truncate">
                          {getTechnicianName(order)}
                        </span>
                      </div>
                    </div>

                    {/* Desktop Layout - Horizontal */}
                    <div className="hidden sm:flex sm:items-center sm:gap-3 min-w-0 flex-1">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {order.orderNo}
                      </Badge>
                      <span className="font-medium text-sm truncate min-w-0">
                        {order.customerName}
                      </span>
                      <Badge className="bg-blue-500 text-white text-xs shrink-0">
                        {order.cluster}
                      </Badge>
                    </div>

                    <div className="hidden sm:flex sm:items-center sm:gap-2 shrink-0">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span
                        className="text-sm font-medium truncate max-w-[120px]"
                        title={getTechnicianName(order)}
                      >
                        {getTechnicianName(order)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
