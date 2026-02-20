import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
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
  Zap, CheckCircle, Clock, AlertTriangle, RefreshCw, Activity,
  Server, Search, Info,
} from "lucide-react";
import { logger } from "@/utils/logger";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const PSBActivationPage: React.FC = () => {
  const { orders, fetchOrders, loading } = usePSBData();
  const [activations, setActivations] = useState<PSBActivation[]>([]);
  const [activationsLoading, setActivationsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isActivationDialogOpen, setIsActivationDialogOpen] = useState(false);
  const [editingActivation, setEditingActivation] = useState<PSBActivation | Partial<PSBActivation> | null>(null);
  const [viewingActivation, setViewingActivation] = useState<PSBActivation | null>(null);
  const [installationReportDialogOpen, setInstallationReportDialogOpen] = useState(false);
  const [editingInstallationReport, setEditingInstallationReport] = useState<PSBActivation | null>(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState<{ status: string; reason: string } | null>(null);
  const [lastCredentials, setLastCredentials] = useState<{ serviceNumber: string; email: string; password: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'ready' | 'activations'>('ready');

  const fetchLastCredentials = async () => {
    try {
      const response = await psbActivationApi.getLastCredentials();
      if (response.success && response.data) setLastCredentials(response.data);
    } catch (error) { logger.error("Failed to fetch last credentials", error, "PSBActivation"); }
  };

  const fetchActivations = async () => {
    setActivationsLoading(true);
    try {
      const response = await psbActivationApi.getActivations();
      setActivations(response.data);
    } catch (error) { logger.error("Failed to fetch activations", error, "PSBActivation"); }
    finally { setActivationsLoading(false); }
  };

  useEffect(() => {
    const initialLoad = async () => {
      await fetchActivations(); await fetchOrders(); await fetchLastCredentials();
      setLastRefresh(new Date());
    };
    initialLoad();
    const interval = setInterval(async () => {
      await fetchOrders(); await fetchActivations(); await fetchLastCredentials();
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const getOrderActivationStatus = (order: any): 'activated' | 'ready' => {
    const hasActivation = activations?.some(activation => {
      const psbOrderId = activation?.psbOrderId;
      if (!psbOrderId) return false;
      const orderIdFromActivation = typeof psbOrderId === 'object' ? (psbOrderId as any)?._id : psbOrderId;
      return orderIdFromActivation === order._id;
    });
    return hasActivation ? 'activated' : 'ready';
  };

  const completedOrders = orders?.filter(
    (order) => ["Installation", "Completed"].includes(order.status) && order.technicianStatus === "complete"
  ) || [];

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

  const sortedCompletedOrders = React.useMemo(() => {
    return [...filteredCompletedOrders].sort((a, b) => {
      const statusA = getOrderActivationStatus(a);
      const statusB = getOrderActivationStatus(b);
      if (statusA === 'ready' && statusB === 'activated') return -1;
      if (statusA === 'activated' && statusB === 'ready') return 1;
      return 0;
    });
  }, [filteredCompletedOrders, activations]);

  const activationStats = {
    readyForActivation: completedOrders.filter(order => getOrderActivationStatus(order) === 'ready').length,
    totalActivations: activations?.length || 0,
    configuredONT: activations?.filter((a) => a.ontStatus === "configured").length || 0,
    pendingONT: activations?.filter((a) => a.ontStatus === "pending").length || 0,
    failedONT: activations?.filter((a) => a.ontStatus === "failed").length || 0,
    averageSignal: activations?.length > 0
      ? (activations.reduce((sum, a) => sum + a.signalLevel, 0) / activations.length).toFixed(1) : "0",
  };

  const configRate = activationStats.totalActivations > 0
    ? ((activationStats.configuredONT / activationStats.totalActivations) * 100).toFixed(1) : '0';

  const handleRefresh = async () => {
    await Promise.all([fetchOrders(), fetchActivations()]);
    setLastRefresh(new Date());
  };

  const handleDeleteActivation = async (activation: PSBActivation) => {
    try {
      await psbActivationApi.deleteActivation(activation._id);
      toast.success("Aktivasi berhasil dihapus"); await fetchActivations();
    } catch (error: any) {
      logger.error("Failed to delete activation", error, "PSBActivation");
      toast.error(error.message || "Gagal menghapus aktivasi");
    }
  };

  const handleSaveActivation = async (id: string | undefined, data: CreatePSBActivationRequest) => {
    try {
      let newActivation;
      if (id) {
        await psbActivationApi.updateActivation(id, data);
        toast.success("Aktivasi berhasil diupdate");
      } else {
        const response = await psbActivationApi.createActivation(data);
        newActivation = { ...response.data, psbOrderId: data.psbOrderId || selectedOrder?._id };
        setActivations(prev => [...(prev || []), newActivation]);
        await fetchLastCredentials();
        toast.success("Aktivasi berhasil dibuat");
      }
      setIsActivationDialogOpen(false); setEditingActivation(null); setSelectedOrder(null);
      fetchActivations(); setLastRefresh(new Date());
    } catch (error: any) {
      logger.error("Failed to save activation", error, "PSBActivation");
      throw error;
    }
  };

  const handleViewActivation = (activation: PSBActivation) => { setViewingActivation(activation); };
  const handleEditActivation = (activation: PSBActivation) => { setEditingActivation(activation); setIsActivationDialogOpen(true); };
  const handleEditInstallationReport = (activation: PSBActivation) => { setEditingInstallationReport(activation); setInstallationReportDialogOpen(true); };

  const handleSaveInstallationReport = async (data: any) => {
    if (!editingInstallationReport) return;
    try {
      await psbActivationApi.updateInstallationReport(editingInstallationReport._id, data);
      toast.success('Data laporan berhasil disimpan'); await fetchActivations();
      setInstallationReportDialogOpen(false); setEditingInstallationReport(null);
    } catch (error: any) {
      logger.error('Failed to save installation report', error, 'PSBActivation');
      toast.error('Gagal menyimpan data laporan');
    }
  };

  const handleActivateOrder = (order: any) => { setSelectedOrder(order); setEditingActivation(null); setIsActivationDialogOpen(true); };

  const statCards = [
    { label: 'Ready', value: activationStats.readyForActivation, icon: Clock, accentBar: 'border-l-blue-500', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
    { label: 'Total Activations', value: activationStats.totalActivations, icon: Zap, accentBar: 'border-l-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { label: 'Configured ONT', value: activationStats.configuredONT, icon: CheckCircle, accentBar: 'border-l-green-500', iconBg: 'bg-green-500/10', iconColor: 'text-green-500' },
    { label: 'Avg Signal', value: `${activationStats.averageSignal} dBm`, icon: Activity, accentBar: 'border-l-orange-500', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-500' },
  ];

  return (
    <div className="space-y-5 p-0 w-[360px] sm:w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-5 sm:p-6"
      >
        <div className="absolute top-0 right-0 opacity-[0.06]">
          <Zap className="w-32 h-32 sm:w-40 sm:h-40 -mt-4 -mr-4" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Activation Center</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Setting ONT dan aktivasi layanan pelanggan</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading || activationsLoading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading || activationsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {lastRefresh.toLocaleTimeString("id-ID")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const IconEl = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`border-l-4 ${card.accentBar} border-border/50 hover:shadow-md transition-shadow relative overflow-hidden`}>
                <div className="absolute top-0 right-0 opacity-[0.05]">
                  <IconEl className="w-20 h-20 -mt-2 -mr-2" />
                </div>
                <CardContent className="p-4 sm:p-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{card.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold">{card.value}</p>
                  <div className={`w-7 h-7 ${card.iconBg} rounded-lg flex items-center justify-center mt-2`}>
                    <IconEl className={`w-3.5 h-3.5 ${card.iconColor}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ONT Status Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="border-border/50">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Server className="w-3 h-3" /> Configured
                  </span>
                  <span className="text-xs font-medium text-green-600">{configRate}%</span>
                </div>
                <Progress value={Number(configRate)} className="h-1.5" />
                <p className="text-lg font-bold text-green-600">{activationStats.configuredONT}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                </div>
                <Progress value={activationStats.totalActivations > 0 ? (activationStats.pendingONT / activationStats.totalActivations) * 100 : 0} className="h-1.5" />
                <p className="text-lg font-bold text-yellow-600">{activationStats.pendingONT}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Failed
                  </span>
                </div>
                <Progress value={activationStats.totalActivations > 0 ? (activationStats.failedONT / activationStats.totalActivations) * 100 : 0} className="h-1.5" />
                <p className="text-lg font-bold text-red-600">{activationStats.failedONT}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pill Tabs */}
      <div className="flex gap-1.5 p-1 bg-muted/50 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('ready')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'ready' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Ready for Activation
        </button>
        <button
          onClick={() => setActiveTab('activations')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'activations' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All Activations
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'ready' && (
          <motion.div key="ready" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <CardTitle className="text-sm font-medium">Orders Ready for Activation</CardTitle>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Cari order, pelanggan, cluster..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-8 text-sm" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCompletedOrders.length === 0 ? (
                  <div className="text-center py-10">
                    {searchTerm ? (
                      <>
                        <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <p className="text-sm text-muted-foreground">Tidak ditemukan untuk "{searchTerm}"</p>
                        <Button variant="outline" size="sm" onClick={() => setSearchTerm("")} className="mt-2">Hapus Filter</Button>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3 opacity-60" />
                        <p className="text-sm text-muted-foreground">Belum ada order yang siap untuk aktivasi</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          {['Order No.', 'Pelanggan', 'No. HP', 'Alamat', 'Cluster', 'Paket', 'Teknisi', 'Status', 'Actions'].map(h => (
                            <th key={h} className="text-left p-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCompletedOrders.map((order) => {
                          const isActivated = getOrderActivationStatus(order) === 'activated';
                          return (
                            <tr key={order._id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                              <td className="p-3"><Badge variant="outline" className="font-mono text-xs">{order.orderNo}</Badge></td>
                              <td className="p-3"><div className="text-sm font-medium truncate max-w-[150px]" title={order.customerName}>{order.customerName}</div></td>
                              <td className="p-3"><div className="text-sm truncate max-w-[110px]">{order.customerPhone}</div></td>
                              <td className="p-3"><div className="text-sm truncate max-w-[170px]" title={order.address}>{order.address}</div></td>
                              <td className="p-3"><Badge variant="secondary" className="text-xs">{order.cluster}</Badge></td>
                              <td className="p-3"><div className="text-sm truncate max-w-[100px]">{order.package}</div></td>
                              <td className="p-3"><div className="text-sm truncate max-w-[100px]">{getTechnicianName(order)}</div></td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className={isActivated ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 text-xs' : 'border-green-500/30 bg-green-500/10 text-green-600 text-xs'}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isActivated ? 'bg-blue-500' : 'bg-green-500'}`} />
                                    {isActivated ? 'Activated' : 'Ready'}
                                  </Badge>
                                  {(order.technicianStatus === 'pending' || order.technicianStatus === 'failed') && order.technicianStatusReason && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setSelectedReason({ status: order.technicianStatus!, reason: order.technicianStatusReason! }); setShowReasonDialog(true); }}>
                                            <Info className="h-3 w-3 text-muted-foreground" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>View reason</p></TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <Button onClick={() => handleActivateOrder(order)} size="sm" disabled={isActivated}
                                  className={`text-xs ${isActivated ? 'opacity-40' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                  variant={isActivated ? 'outline' : 'default'}
                                >
                                  <Zap className="h-3 w-3 mr-1" />
                                  {isActivated ? 'Done' : 'Activate'}
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
          </motion.div>
        )}

        {activeTab === 'activations' && (
          <motion.div key="activations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">All PSB Activations</CardTitle>
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
          </motion.div>
        )}
      </AnimatePresence>

      <PSBActivationDialog
        open={isActivationDialogOpen} onOpenChange={setIsActivationDialogOpen}
        activation={editingActivation as PSBActivation} onSave={handleSaveActivation}
        orderId={selectedOrder?._id} selectedOrder={selectedOrder}
        lastCredentials={lastCredentials || undefined}
      />
      <PSBInstallationReportDialog
        open={installationReportDialogOpen} onOpenChange={setInstallationReportDialogOpen}
        activation={editingInstallationReport} onSave={handleSaveInstallationReport}
      />
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
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedReason?.reason}</p>
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
