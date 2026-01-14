import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Clock,
  User,
  Phone,
  Package,
  CheckCircle,
  AlertCircle,
  Navigation,
  Wrench,
  FileText,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePSBData } from "@/hooks/usePSBData";
import { PSBOrder } from "@/types/psb";
import { format } from "date-fns";
import { toast } from "sonner";
import { TechnicianLayout } from "@/components/layout/TechnicianLayout";
import { getTechnicianName, isTechnicianMatch } from "@/utils/psbHelpers";

interface ProgressUpdate {
  orderId: string;
  status: string;
  notes: string;
  timestamp: string;
}

const TechnicianPage: React.FC = () => {
  const { user } = useAuth();
  const { orders, fetchOrders, updateTechnicianStatus } = usePSBData();
  const [selectedOrder, setSelectedOrder] = useState<PSBOrder | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  type TechnicianStatus = "pending" | "failed" | "complete";
  const [selectedStatus, setSelectedStatus] = useState<TechnicianStatus | "">(
    ""
  );

  // Filter orders assigned to current technician (exclude completed/cancelled)
  const myOrders =
    orders?.filter((order) => {
      const userName = user?.name || "";
      const userEmail = user?.email || "";
      const techName = getTechnicianName(order);
      const matchesUser =
        isTechnicianMatch(order, userName) ||
        isTechnicianMatch(order, userEmail);
      const isUnassigned = order.status === "Assigned" && !techName;
      const isNotCompleted = !["Completed", "Failed"].includes(order.status);
      return (matchesUser || isUnassigned) && isNotCompleted;
    }) || [];

  const isTechnicianStatus = (value: string): value is TechnicianStatus => {
    return value === "pending" || value === "failed" || value === "complete";
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTechnicianStatusChange = async (
    orderId: string,
    techStatus: "pending" | "failed" | "complete",
    reason: string
  ) => {
    try {
      setIsUpdating(true);

      await updateTechnicianStatus(orderId, techStatus, reason);

      toast.success("Status berhasil diperbarui");
      await fetchOrders();
    } catch (error) {
      toast.error("Gagal mengupdate status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Assigned":
        return "bg-blue-500 text-white";
      case "Pending":
        return "bg-yellow-500 text-white";
      case "Completed":
        return "bg-green-500 text-white";
      case "Failed":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const OrderDetailDialog = ({ order }: { order: PSBOrder }) => (
    <DialogContent className="rounded-md max-w-[360px] md:max-w-xl sm:max-w-2xl mx-0 max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl">
          Detail Order #{order.orderNo}
        </DialogTitle>
        <DialogDescription className="text-sm sm:text-base">
          Informasi lengkap dan tracking progress pekerjaan
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 sm:space-y-6">
        {/* Customer Info */}
        <div className="grid grid-cols-1 gap-4">
          <div className="border rounded-lg p-3 sm:p-4 bg-card">
            <h4 className="font-semibold mb-3 text-primary text-sm sm:text-base">
              Informasi Pelanggan
            </h4>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-muted gap-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Nama:
                </span>
                <span className="font-medium text-sm sm:text-base">
                  {order.customerName}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-muted gap-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  No. HP:
                </span>
                <span className="font-medium text-sm sm:text-base">
                  {order.customerPhone}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-muted gap-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Alamat:
                </span>
                <span className="font-medium text-right text-sm sm:text-base">
                  {order.address}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Cluster:
                </span>
                <span className="font-medium text-sm sm:text-base">
                  {order.cluster}
                </span>
              </div>
            </div>
          </div>
          <div className="border rounded-lg p-3 sm:p-4 bg-card">
            <h4 className="font-semibold mb-3 text-primary text-sm sm:text-base">
              Detail Order
            </h4>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-muted gap-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Paket:
                </span>
                <span className="font-medium text-sm sm:text-base">
                  {order.package}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-muted gap-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Tanggal:
                </span>
                <span className="font-medium text-sm sm:text-base">
                  {format(new Date(order.date), "dd/MM/yyyy")}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Status:
                </span>
                <Badge
                  className={`${getStatusColor(
                    order.status
                  )} text-xs sm:text-sm`}
                >
                  {order.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <TechnicianLayout>
      <div className="min-h-screen bg-background p-3 sm:p-6 w-full">
        <div className="w-full space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Dashboard Teknisi
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Selamat datang, {user?.name}! Kelola tugas lapangan Anda di
                  sini.
                </p>
              </div>
              <Badge variant="outline" className="w-fit text-xs sm:text-sm">
                Role: Teknisi
              </Badge>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid sm:grid-cols-4 grid-cols-2 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Total Tugas
                    </p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {myOrders.length}
                    </p>
                  </div>
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Sedang Dikerjakan
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">
                      {
                        myOrders.filter((o) =>
                          ["Accepted", "Survey", "Installation"].includes(
                            o.status
                          )
                        ).length
                      }
                    </p>
                  </div>
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Selesai
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {myOrders.filter((o) => o.status === "Completed").length}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Pending
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                      {myOrders.filter((o) => o.status === "Assigned").length}
                    </p>
                  </div>
                  <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                Daftar Tugas Anda ({myOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {myOrders.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Belum ada tugas yang ditugaskan kepada Anda
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-[1200px] px-4 sm:px-0">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                        <TableRow>
                          <TableHead className="w-[120px]">
                            Nomor Order
                          </TableHead>
                          <TableHead className="w-[150px]">Tempat</TableHead>
                          <TableHead className="w-[180px]">
                            Nama Customer
                          </TableHead>
                          <TableHead className="w-[140px]">Nomor HP</TableHead>
                          <TableHead className="min-w-[200px]">
                            Alamat
                          </TableHead>
                          <TableHead className="w-[100px]">Paket</TableHead>
                          <TableHead className="w-[180px]">
                            Status Pekerjaan
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myOrders.map((order) => (
                          <TableRow
                            key={order._id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors h-[60px]"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDialogOpen(true);
                            }}
                          >
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                {order.orderNo}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">
                                  {order.cluster}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(order.date), "dd/MM/yyyy")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">
                                  {order.customerName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm">
                                  {order.customerPhone}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="text-sm">{order.address}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{order.package}</span>
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={(order as any).technicianStatus ?? ""}
                                onValueChange={(value) => {
                                  if (!isTechnicianStatus(value)) return;

                                  setSelectedOrder(order);
                                  setSelectedStatus(value);
                                  setShowStatusDialog(true);
                                }}
                              >
                                <SelectTrigger className="w-[100px] h-8 text-xs">
                                  <SelectValue placeholder="Assigned" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">
                                    Pending
                                  </SelectItem>
                                  <SelectItem value="failed">Gagal</SelectItem>
                                  <SelectItem value="complete">
                                    Selesai
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {(order as any).technicianStatusReason && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {(order as any).technicianStatusReason}
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Update Dialog with Reason */}
          <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
            <DialogContent className="rounded-md max-w-[360px] md:max-w-xl sm:max-w-2xl mx-0">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  Update Status Pekerjaan
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Masukkan keterangan untuk status ini
                </DialogDescription>
              </DialogHeader>

              {selectedOrder && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-transparent border shadow">
                    <p className="font-medium text-sm">
                      {selectedOrder.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Order: {selectedOrder.orderNo}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Status:{" "}
                      {selectedStatus === "pending"
                        ? "Pending"
                        : selectedStatus === "failed"
                        ? "Gagal"
                        : "Selesai"}
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Keterangan{" "}
                      {selectedStatus === "pending"
                        ? "Pending"
                        : selectedStatus === "failed"
                        ? "Gagal"
                        : "Selesai"}
                    </Label>
                    <Textarea
                      placeholder={`Jelaskan alasan ${
                        selectedStatus === "pending"
                          ? "pending"
                          : selectedStatus === "failed"
                          ? "gagal"
                          : "selesai"
                      }...`}
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      className="min-h-[100px] text-sm"
                    />
                  </div>

                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => {
                        if (!selectedStatus) {
                          toast.error("Pilih status dulu");
                          return;
                        }

                        if (
                          (selectedStatus === "pending" ||
                            selectedStatus === "failed") &&
                          !statusReason.trim()
                        ) {
                          toast.error(
                            "Keterangan harus diisi untuk Pending/Gagal"
                          );
                          return;
                        }

                        handleTechnicianStatusChange(
                          selectedOrder._id,
                          selectedStatus,
                          statusReason
                        );

                        setShowStatusDialog(false);
                        setStatusReason("");
                        setSelectedStatus("");
                      }}
                    >
                      Simpan
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowStatusDialog(false);
                        setStatusReason("");
                        setSelectedStatus("");
                      }}
                      className="flex-1 text-sm"
                    >
                      Batal
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {selectedOrder && <OrderDetailDialog order={selectedOrder} />}
          </Dialog>
        </div>
      </div>
    </TechnicianLayout>
  );
};

export default TechnicianPage;
