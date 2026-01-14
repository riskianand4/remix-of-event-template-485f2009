import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, CheckCircle, XCircle, Calendar, FileText, MapPin, Phone, Package, Star, BarChart3, TrendingUp, Award, Filter, Search, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePSBData } from '@/hooks/usePSBData';
import { PSBOrder } from '@/types/psb';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import { getTechnicianName, isTechnicianMatch } from '@/utils/psbHelpers';
export default function TechnicianHistoryPage() {
  const {
    user
  } = useAuth();
  const {
    orders,
    fetchOrders
  } = usePSBData();
  const [selectedOrder, setSelectedOrder] = useState<PSBOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter completed/cancelled orders for current technician
  console.log('DEBUG - All orders:', orders?.length || 0, 'orders loaded');
  console.log('DEBUG - Current user:', {
    name: user?.name,
    email: user?.email
  });
  const historyOrders = orders?.filter(order => {
    // Match by name or email (case-insensitive, trimmed)
    const userName = user?.name || '';
    const userEmail = user?.email || '';
    const matchesUser = isTechnicianMatch(order, userName) || isTechnicianMatch(order, userEmail);
    const isCompletedOrCancelled = ['Completed', 'Cancelled'].includes(order.status);
    return matchesUser && isCompletedOrCancelled;
  }) || [];
  console.log('DEBUG - Filtered history orders:', historyOrders.length, 'matching orders');

  // Apply filters
  const filteredOrders = historyOrders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) || order.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.date);
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          matchesDate = startOfDay(orderDate).getTime() === startOfDay(now).getTime();
          break;
        case 'week':
          matchesDate = orderDate >= subDays(now, 7);
          break;
        case 'month':
          matchesDate = orderDate >= subMonths(now, 1);
          break;
        case '3months':
          matchesDate = orderDate >= subMonths(now, 3);
          break;
      }
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate statistics
  const stats = {
    total: historyOrders.length,
    completed: historyOrders.filter(o => o.status === 'Completed').length,
    cancelled: historyOrders.filter(o => o.status === 'Cancelled').length,
    thisMonth: historyOrders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate >= subMonths(new Date(), 1);
    }).length
  };
  const completionRate = stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : '0';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500 text-white';
      case 'Cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return CheckCircle;
      case 'Cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };
  const exportHistory = () => {
    if (filteredOrders.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    // Simple CSV export
    const csvData = filteredOrders.map(order => ({
      'No. Order': order.orderNo,
      'Tanggal': format(new Date(order.date), 'dd/MM/yyyy'),
      'Pelanggan': order.customerName,
      'Telepon': order.customerPhone,
      'Alamat': order.address,
      'Paket': order.package,
      'Status': order.status,
      'Cluster': order.cluster
    }));
    const csv = [Object.keys(csvData[0]).join(','), ...csvData.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `riwayat_pekerjaan_${format(new Date(), 'ddMMyyyy')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Data riwayat berhasil diekspor');
  };
  const OrderDetailDialog = ({
    order
  }: {
    order: PSBOrder;
  }) => <DialogContent className="sm:max-w-3xl max-w-[360px] md:max-w-2xl mx-0 rounded-md">
      <DialogHeader className="pb-4 border-b border-border">
        <DialogTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span>Detail Riwayat Pekerjaan</span>
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{order.orderNo}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(order.date), 'dd MMMM yyyy, HH:mm')}
            </p>
          </div>
          <Badge className={`${getStatusColor(order.status)} ml-4 text-sm px-3 py-1`}>
            {order.status}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
              <Phone className="w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
              Informasi Pelanggan
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nama Pelanggan</label>
                <p className="text-sm font-semibold bg-background rounded px-3 py-2 border border-border">{order.customerName}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">No. Telepon</label>
                <div className="flex items-center space-x-2 bg-background rounded px-3 py-2 border border-border">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{order.customerPhone}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alamat</label>
                <div className="flex items-start space-x-2 bg-background rounded px-3 py-2 border border-border">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm font-medium">{order.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
              Detail Pekerjaan
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paket</label>
                <p className="text-sm font-semibold bg-background rounded px-3 py-2 border border-border">{order.package}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cluster</label>
                <p className="text-sm font-medium bg-background rounded px-3 py-2 border border-border">{order.cluster}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">STO</label>
                <p className="text-sm font-medium bg-background rounded px-3 py-2 border border-border">{order.sto}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prioritas</label>
                <Badge variant="outline" className="w-fit">
                  {order.priority}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Catatan</h3>
            <p className="text-sm text-muted-foreground bg-background rounded px-3 py-2 border border-border">{order.notes}</p>
          </div>}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Dikerjakan oleh: {getTechnicianName(order)}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            ID: {order._id}
          </Badge>
        </div>
      </div>
    </DialogContent>;
  return <div className="min-h-screen bg-background p-2 sm:p-4 lg:p-6">
      <div className="sm:w-full w-[370px] max-w-7xl  mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Riwayat Pekerjaan
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Lihat riwayat dan statistik pekerjaan yang telah selesai
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-2 w-fit">
              <Clock className="w-4 h-4" />
              History
            </Badge>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-sm font-medium text-muted-foreground">Total Pekerjaan</p>
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
                </div>
                <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-sm font-medium text-muted-foreground">Selesai</p>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-sm font-medium text-muted-foreground">Dibatalkan</p>
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-sm font-medium text-muted-foreground">Success Rate</p>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-primary">{completionRate}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-base sm:text-lg">Filter & Pencarian</span>
              <Button onClick={exportHistory} variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari order, nama, alamat..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              
              {/* Filter Selects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Completed">Selesai</SelectItem>
                    <SelectItem value="Cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Tanggal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tanggal</SelectItem>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="week">7 Hari Terakhir</SelectItem>
                    <SelectItem value="month">30 Hari Terakhir</SelectItem>
                    <SelectItem value="3months">3 Bulan Terakhir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results Counter */}
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Filter className="w-4 h-4" />
                <span>{filteredOrders.length} dari {historyOrders.length} record</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card>
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-sm sm:text-base lg:text-lg">
              Riwayat Pekerjaan ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 lg:p-6 lg:pt-0">
            {filteredOrders.length === 0 ? <div className="text-center py-8 sm:py-12 px-3 sm:px-4">
                <Clock className="h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-muted-foreground text-[10px] sm:text-sm lg:text-base break-words">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? 'Tidak ada data yang cocok dengan filter' : 'Belum ada riwayat pekerjaan'}
                </p>
              </div> : <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px] text-[10px] sm:text-sm whitespace-nowrap">Order</TableHead>
                      <TableHead className="min-w-[120px] text-[10px] sm:text-sm whitespace-nowrap">Pelanggan</TableHead>
                      <TableHead className="min-w-[140px] text-[10px] sm:text-sm whitespace-nowrap">Alamat</TableHead>
                      <TableHead className="min-w-[80px] text-[10px] sm:text-sm hidden lg:table-cell whitespace-nowrap">Paket</TableHead>
                      <TableHead className="min-w-[70px] text-[10px] sm:text-sm whitespace-nowrap">Status</TableHead>
                      <TableHead className="min-w-[80px] text-[10px] sm:text-sm hidden md:table-cell whitespace-nowrap">Tanggal</TableHead>
                      <TableHead className="min-w-[60px] text-[10px] sm:text-sm whitespace-nowrap">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map(order => {
                  const StatusIcon = getStatusIcon(order.status);
                  return <TableRow key={order._id}>
                          <TableCell className="p-2 sm:p-3 lg:p-4">
                            <Badge variant="outline" className="text-[10px] whitespace-nowrap">{order.orderNo}</Badge>
                          </TableCell>
                          <TableCell className="p-2 sm:p-3 lg:p-4">
                            <div className="min-w-0">
                              <div className="font-medium text-[10px] sm:text-[11px] truncate max-w-[100px] sm:max-w-[120px]">{order.customerName}</div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate max-w-[100px]">{order.customerPhone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-2 sm:p-3 lg:p-4">
                            <div className="min-w-0 max-w-[120px] sm:max-w-[160px]">
                              <div className="truncate text-[10px] sm:text-[11px]">{order.address}</div>
                              <div className="text-[10px] text-muted-foreground truncate mt-1">{order.cluster}</div>
                            </div>
                          </TableCell>
                          <TableCell className="p-2 sm:p-3 lg:p-4 hidden lg:table-cell">
                            <div className="text-[10px] sm:text-[11px] truncate max-w-[80px]">{order.package}</div>
                          </TableCell>
                          <TableCell className="p-2 sm:p-3 lg:p-4">
                            <Badge className={`text-[10px] ${getStatusColor(order.status)} flex items-center gap-1 w-fit whitespace-nowrap`}>
                              <StatusIcon className="w-3 h-3 flex-shrink-0" />
                              <span className="hidden sm:inline">{order.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 sm:p-3 lg:p-4 hidden md:table-cell">
                            <div className="text-[10px] sm:text-sm whitespace-nowrap">
                              {format(new Date(order.date), 'dd/MM/yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="p-2 sm:p-3 lg:p-4">
                            <Dialog open={isDetailOpen && selectedOrder?._id === order._id} onOpenChange={open => {
                        setIsDetailOpen(open);
                        if (!open) setSelectedOrder(null);
                      }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailOpen(true);
                          }} className="text-[10px] p-1 sm:p-2 h-7 sm:h-9">
                                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 flex-shrink-0" />
                                </Button>
                              </DialogTrigger>
                              {selectedOrder && <OrderDetailDialog order={selectedOrder} />}
                            </Dialog>
                          </TableCell>
                        </TableRow>;
                })}
                  </TableBody>
                </Table>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
}