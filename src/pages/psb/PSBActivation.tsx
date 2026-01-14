import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PSBActivationTable } from "@/components/psb/PSBActivationTable";
import { PSBActivationDialog } from "@/components/psb/PSBActivationDialog";
import { PSBInstallationReportDialog } from "@/components/psb/PSBInstallationReportDialog";
import { usePSBData } from "@/hooks/usePSBData";
import { psbActivationApi } from "@/services/psbActivationApi";
import type { PSBActivation, CreatePSBActivationRequest } from "@/types/psb";
import { getTechnicianName } from "@/utils/psbHelpers";
import {
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Activity,
  Server,
  Wifi,
  Search,
  Timer,
  Bug,
  Info,
} from "lucide-react";
import { logger } from "@/utils/logger";
import { toast } from "sonner";
export const PSBActivationPage: React.FC = () => {
  const { orders, fetchOrders, loading } = usePSBData();
  const [activations, setActivations] = useState<PSBActivation[]>([]);
  const [activationsLoading, setActivationsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isActivationDialogOpen, setIsActivationDialogOpen] = useState(false);
  const [editingActivation, setEditingActivation] = useState<
    PSBActivation | Partial<PSBActivation> | null
  >(null);
  const [viewingActivation, setViewingActivation] =
    useState<PSBActivation | null>(null);
  const [installationReportDialogOpen, setInstallationReportDialogOpen] = useState(false);
  const [editingInstallationReport, setEditingInstallationReport] = useState<PSBActivation | null>(null);
  
  // Dialog for viewing technician status reason
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState<{ status: string; reason: string } | null>(null);
  
  // 🎯 Last credentials for hybrid auto-generate
  const [lastCredentials, setLastCredentials] = useState<{
    serviceNumber: string;
    email: string;
    password: string;
  } | null>(null);
  
  // 🎯 Fetch last credentials from most recent activation
  const fetchLastCredentials = async () => {
    try {
      const response = await psbActivationApi.getLastCredentials();
      if (response.success && response.data) {
        setLastCredentials(response.data);
      }
    } catch (error) {
      logger.error("Failed to fetch last credentials", error, "PSBActivation");
    }
  };
  
  const fetchActivations = async () => {
    setActivationsLoading(true);
    try {
      const response = await psbActivationApi.getActivations();
      setActivations(response.data);
    } catch (error) {
      logger.error("Failed to fetch activations", error, "PSBActivation");
    } finally {
      setActivationsLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      await fetchActivations();
      await fetchOrders();
      await fetchLastCredentials(); // ✅ Fetch last credentials
      setLastRefresh(new Date());
    };
    initialLoad();

    // Auto-refresh every 30 seconds to get latest completed orders from technicians
    const interval = setInterval(async () => {
      await fetchOrders();
      await fetchActivations();
      await fetchLastCredentials(); // ✅ Also refresh last credentials
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Helper function to check if order sudah diaktivasi
  const getOrderActivationStatus = (order: any): 'activated' | 'ready' => {
    const hasActivation = activations?.some(
      activation => {
        const psbOrderId = activation?.psbOrderId;
        if (!psbOrderId) return false;
        
        // Handle both object and string format for psbOrderId
        const orderIdFromActivation = typeof psbOrderId === 'object' 
          ? (psbOrderId as any)?._id 
          : psbOrderId;
        return orderIdFromActivation === order._id;
      }
    );
    return hasActivation ? 'activated' : 'ready';
  };

  // Filter orders ready for activation (orders with technicianStatus = "complete")
  const completedOrders =
    orders?.filter(
      (order) =>
        ["Installation", "Completed"].includes(order.status) &&
        order.technicianStatus === "complete" // ✅ Only show orders marked complete by technician
    ) || [];

  // Filter completed orders based on search term
  const filteredCompletedOrders = completedOrders.filter(
    (order) =>
      order.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cluster?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.package?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTechnicianName(order).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort orders: yang ready di atas, yang sudah activated di bawah
  const sortedCompletedOrders = React.useMemo(() => {
    return [...filteredCompletedOrders].sort((a, b) => {
      const statusA = getOrderActivationStatus(a);
      const statusB = getOrderActivationStatus(b);
      
      if (statusA === 'ready' && statusB === 'activated') return -1;
      if (statusA === 'activated' && statusB === 'ready') return 1;
      return 0;
    });
  }, [filteredCompletedOrders, activations]);

  // Calculate activation stats
  const activationStats = {
    readyForActivation: completedOrders.filter(order => 
      getOrderActivationStatus(order) === 'ready'
    ).length,
    totalActivations: activations?.length || 0,
    configuredONT:
      activations?.filter((a) => a.ontStatus === "configured").length || 0,
    pendingONT:
      activations?.filter((a) => a.ontStatus === "pending").length || 0,
    failedONT: activations?.filter((a) => a.ontStatus === "failed").length || 0,
    averageSignal:
      activations?.length > 0
        ? (
            activations.reduce((sum, a) => sum + a.signalLevel, 0) /
            activations.length
          ).toFixed(1)
        : "0",
  };
  const handleRefresh = async () => {
    await Promise.all([fetchOrders(), fetchActivations()]);
    setLastRefresh(new Date());
  };
  const handleDeleteActivation = async (activation: PSBActivation) => {
    try {
      await psbActivationApi.deleteActivation(activation._id);
      toast.success("Aktivasi berhasil dihapus");
      await fetchActivations();
    } catch (error: any) {
      logger.error("Failed to delete activation", error, "PSBActivation");
      toast.error(error.message || "Gagal menghapus aktivasi");
    }
  };

  const handleSaveActivation = async (
    id: string | undefined,
    data: CreatePSBActivationRequest
  ) => {
    try {
      let newActivation;
      if (id) {
        await psbActivationApi.updateActivation(id, data);
        toast.success("Aktivasi berhasil diupdate");
      } else {
        // Create new activation and get the response
        const response = await psbActivationApi.createActivation(data);
        newActivation = {
          ...response.data,
          psbOrderId: data.psbOrderId || selectedOrder?._id // ✅ Ensure psbOrderId exists
        };
        
        // 🔥 OPTIMISTIC UPDATE - Langsung tambahkan ke state tanpa tunggu fetch
        setActivations(prev => [...(prev || []), newActivation]);
        
        // 🎯 Fetch fresh last credentials
        await fetchLastCredentials();
        
        toast.success("Aktivasi berhasil dibuat");
      }
      
      // Tutup dialog dan reset state
      setIsActivationDialogOpen(false);
      setEditingActivation(null);
      setSelectedOrder(null);
      
      // Background refresh untuk sinkronisasi data
      fetchActivations();
      
      // Force re-render dengan update lastRefresh
      setLastRefresh(new Date());
    } catch (error: any) {
      logger.error("Failed to save activation", error, "PSBActivation");
      throw error; // Let dialog handle the error
    }
  };

  const handleViewActivation = (activation: PSBActivation) => {
    setViewingActivation(activation);
  };

  const handleEditActivation = (activation: PSBActivation) => {
    setEditingActivation(activation);
    setIsActivationDialogOpen(true);
  };

  const handleEditInstallationReport = (activation: PSBActivation) => {
    setEditingInstallationReport(activation);
    setInstallationReportDialogOpen(true);
  };

  const handleSaveInstallationReport = async (data: any) => {
    if (!editingInstallationReport) return;
    
    try {
      await psbActivationApi.updateInstallationReport(editingInstallationReport._id, data);
      toast.success('Data laporan berhasil disimpan');
      await fetchActivations();
      setInstallationReportDialogOpen(false);
      setEditingInstallationReport(null);
    } catch (error: any) {
      logger.error('Failed to save installation report', error, 'PSBActivation');
      toast.error('Gagal menyimpan data laporan');
    }
  };

  const handleActivateOrder = (order: any) => {
    setSelectedOrder(order);
    setEditingActivation(null); // NEW activation
    setIsActivationDialogOpen(true);
  };
  const handleActivateService = async (order: any) => {
    try {
      // Generate service credentials
      const serviceNumber = `1500${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;
      const username =
        order.orderNo.toLowerCase() + Math.floor(Math.random() * 100);
      const password = Math.random().toString(36).substring(2, 10);

      // Create activation record
      const activationData = {
        psbOrderId: order._id,
        customerName: order.customerName,
        serviceNumber: serviceNumber,
        pppoeUsername: username,
        pppoePassword: password,
        oltName: `OLT-${order.cluster}`,
        ponPort: `1/1/${Math.floor(Math.random() * 8) + 1}`,
        onuNumber: (Math.floor(Math.random() * 128) + 1).toString(),
        ontStatus: "configured" as const,
        signalLevel: Math.floor(Math.random() * 10) - 20,
        // Random signal between -10 to -20 dBm
        activationDate: new Date().toISOString(),
        cluster: order.cluster,
        technician: getTechnicianName(order) || "System",
        notes: `Activated from order ${order.orderNo}`,
      };
      await psbActivationApi.createActivation(activationData);
      await fetchActivations();
      await fetchOrders(); // Refresh to remove from ready list

      // Service activated successfully
    } catch (error) {
      logger.error("Failed to activate service", error, "PSBActivation");
    }
  };
  return (
    <div className="space-y-6 p-0 w-[360px] sm:w-full ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Activation Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Setting ONT dan aktivasi layanan pelanggan
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={loading || activationsLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                loading || activationsLoading ? "animate-spin" : ""
              }`}
            />
            {loading || activationsLoading ? "Refreshing..." : "Refresh All"}
          </Button>
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString("id-ID")}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ready for Activation
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {activationStats.readyForActivation}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Activations
                </p>
                <p className="text-2xl font-bold text-primary">
                  {activationStats.totalActivations}
                </p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Configured ONT
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {activationStats.configuredONT}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Signal Level
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {activationStats.averageSignal}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ONT Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Configured
                </p>
                <p className="text-xl font-bold text-green-600">
                  {activationStats.configuredONT}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activationStats.totalActivations > 0
                    ? (
                        (activationStats.configuredONT /
                          activationStats.totalActivations) *
                        100
                      ).toFixed(1)
                    : 0}
                  % success rate
                </p>
              </div>
              <Server className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-xl font-bold text-yellow-600">
                  {activationStats.pendingONT}
                </p>
                <p className="text-xs text-muted-foreground">
                  Menunggu konfigurasi
                </p>
              </div>
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Failed
                </p>
                <p className="text-xl font-bold text-red-600">
                  {activationStats.failedONT}
                </p>
                <p className="text-xs text-muted-foreground">
                  Perlu troubleshooting
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="ready" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ready">Ready for Activation</TabsTrigger>
          <TabsTrigger value="activations">All Activations</TabsTrigger>
        </TabsList>
        <TabsContent value="ready" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle>Orders Ready for Activation</CardTitle>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari order, pelanggan, cluster..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCompletedOrders.length === 0 ? (
                searchTerm ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Tidak ada order yang ditemukan untuk "{searchTerm}"
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSearchTerm("")}
                      className="mt-2"
                    >
                      Hapus Filter
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Belum ada order yang siap untuk aktivasi
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Order akan muncul di sini setelah instalasi lapangan
                      selesai
                    </p>
                  </div>
                )
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold min-w-[120px]">
                          Order No.
                        </th>
                        <th className="text-left p-3 font-semibold min-w-[180px]">
                          Pelanggan
                        </th>
                        <th className="text-left p-3 font-semibold min-w-[130px]">
                          No. HP
                        </th>
                        <th className="text-left p-3 font-semibold min-w-[200px]">
                          Alamat
                        </th>
                        <th className="text-left p-3 font-semibold min-w-[100px]">
                          Cluster
                        </th>
                        <th className="text-left p-3 font-semibold min-w-[120px]">
                          Paket
                        </th>
                        <th className="text-left p-3 font-semibold min-w-[120px]">
                          Teknisi
                        </th>
                        <th className="text-left p-3 font-semibold min-w-[140px]">
                          Status
                        </th>
                        <th className="text-left p-3 font-semibold min-w-[100px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCompletedOrders.map((order) => {
                        const activationStatus = getOrderActivationStatus(order);
                        const isActivated = activationStatus === 'activated';
                        
                        return (
                          <tr
                            key={order._id}
                            className="border-b hover:bg-muted/30 transition-colors"
                          >
                            <td className="p-3">
                              <Badge variant="outline" className="font-mono">
                                {order.orderNo}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div
                                className="font-medium truncate max-w-[160px]"
                                title={order.customerName}
                              >
                                {order.customerName}
                              </div>
                            </td>
                            <td className="p-3">
                              <div
                                className="text-sm truncate max-w-[110px]"
                                title={order.customerPhone}
                              >
                                {order.customerPhone}
                              </div>
                            </td>
                            <td className="p-3">
                              <div
                                className="text-sm truncate max-w-[180px]"
                                title={order.address}
                              >
                                {order.address}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge className="bg-blue-500 text-white whitespace-nowrap">
                                {order.cluster}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div
                                className="text-sm truncate max-w-[100px]"
                                title={order.package}
                              >
                                {order.package}
                              </div>
                            </td>
                            <td className="p-3">
                              <div
                                className="text-sm truncate max-w-[100px]"
                                title={getTechnicianName(order)}
                              >
                                {getTechnicianName(order)}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={
                                    isActivated
                                      ? "bg-blue-500/10 text-blue-700 whitespace-nowrap border border-blue-500/20"
                                      : "bg-green-500 text-white whitespace-nowrap"
                                  }
                                >
                                  {isActivated ? 'Activated' : 'Ready for Activation'}
                                </Badge>
                                {(order.technicianStatus === 'pending' || order.technicianStatus === 'failed') && order.technicianStatusReason && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => {
                                            setSelectedReason({
                                              status: order.technicianStatus!,
                                              reason: order.technicianStatusReason!
                                            });
                                            setShowReasonDialog(true);
                                          }}
                                        >
                                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>View reason</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <Button
                                onClick={() => handleActivateOrder(order)}
                                size="sm"
                                disabled={isActivated}
                                className={
                                  isActivated
                                    ? "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50 hover:bg-gray-400"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                                }
                              >
                                <Zap className="h-4 w-4 mr-1" />
                                {isActivated ? 'Activated' : 'Activate'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All PSB Activations</CardTitle>
            </CardHeader>
            <CardContent>
              <PSBActivationTable
                activations={activations || []}
                onView={handleViewActivation}
                onEdit={handleEditActivation}
                onDelete={handleDeleteActivation}
                onEditInstallationReport={handleEditInstallationReport}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Activation Dialog for Create/Edit */}
      <PSBActivationDialog
        open={isActivationDialogOpen}
        onOpenChange={setIsActivationDialogOpen}
        activation={editingActivation as PSBActivation}
        onSave={handleSaveActivation}
        orderId={selectedOrder?._id}
        selectedOrder={selectedOrder}
        lastCredentials={lastCredentials || undefined}
      />

      {/* Installation Report Dialog */}
      <PSBInstallationReportDialog
        open={installationReportDialogOpen}
        onOpenChange={setInstallationReportDialogOpen}
        activation={editingInstallationReport}
        onSave={handleSaveInstallationReport}
      />

      {/* Technician Status Reason Dialog */}
      <AlertDialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Badge className={selectedReason?.status === 'failed' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}>
                {selectedReason?.status?.toUpperCase()}
              </Badge>
              Reason Details
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Alasan:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedReason?.reason}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
