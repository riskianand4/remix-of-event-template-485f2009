import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Navigation, 
  Wrench, 
  FileText, 
  RefreshCw,
  Eye,
  MessageSquare,
  Activity
} from 'lucide-react';
import { usePSBData } from '@/hooks/usePSBData';
import { useAuth } from '@/contexts/AuthContext';
import { PSBOrder } from '@/types/psb';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getTechnicianName } from '@/utils/psbHelpers';

interface TechnicianActivity {
  id: string;
  technicianName: string;
  currentLocation?: { lat: number; lng: number };
  activeOrders: PSBOrder[];
  lastUpdate: string;
  status: 'active' | 'idle' | 'offline';
  completedToday: number;
}

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const { orders, fetchOrders } = usePSBData();
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Only allow access for admin and superadmin
  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
              <p className="text-muted-foreground">
                Anda tidak memiliki izin untuk mengakses Dashboard Supervisor
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchOrders();
  }, [refreshKey]);

  // Group orders by technician
  const technicianActivities: TechnicianActivity[] = React.useMemo(() => {
    if (!orders) return [];

    const technicianMap = new Map<string, TechnicianActivity>();

    orders.forEach(order => {
      const techName = getTechnicianName(order).trim();
      if (!techName) return;

      if (!technicianMap.has(techName)) {
        technicianMap.set(techName, {
          id: techName,
          technicianName: techName,
          activeOrders: [],
          lastUpdate: new Date().toISOString(),
          status: 'active', // Simplified - would need real tracking
          completedToday: 0
        });
      }

      const techActivity = technicianMap.get(techName)!;
      
      if (['Assigned', 'Accepted', 'Survey', 'Installation'].includes(order.status)) {
        techActivity.activeOrders.push(order);
      }
      
      if (order.status === 'Completed' && 
          new Date(order.updatedAt || order.date).toDateString() === new Date().toDateString()) {
        techActivity.completedToday++;
      }
    });

    return Array.from(technicianMap.values());
  }, [orders]);

  const totalActiveTechnicians = technicianActivities.length;
  const totalActiveOrders = technicianActivities.reduce((sum, tech) => sum + tech.activeOrders.length, 0);
  const totalCompletedToday = technicianActivities.reduce((sum, tech) => sum + tech.completedToday, 0);

  const filteredTechnicians = selectedTechnician === 'all' ? 
    technicianActivities : 
    technicianActivities.filter(t => t.id === selectedTechnician);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Assigned': return 'bg-blue-500 text-white';
      case 'Accepted': return 'bg-purple-500 text-white';
      case 'Survey': return 'bg-orange-500 text-white';
      case 'Installation': return 'bg-yellow-500 text-white';
      case 'Completed': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Dashboard Supervisor
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor real-time aktivitas teknisi di lapangan
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pilih Teknisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Teknisi</SelectItem>
                {technicianActivities.map(tech => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.technicianName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setRefreshKey(prev => prev + 1)}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teknisi Aktif</p>
                  <p className="text-2xl font-bold">{totalActiveTechnicians}</p>
                </div>
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pekerjaan Aktif</p>
                  <p className="text-2xl font-bold text-orange-600">{totalActiveOrders}</p>
                </div>
                <Wrench className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Selesai Hari Ini</p>
                  <p className="text-2xl font-bold text-green-600">{totalCompletedToday}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rata-rata Selesai</p>
                  <p className="text-2xl font-bold text-primary">
                    {totalActiveTechnicians > 0 ? (totalCompletedToday / totalActiveTechnicians).toFixed(1) : '0'}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technician Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTechnicians.map(technician => (
            <Card key={technician.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getActivityStatusColor(technician.status)}`} />
                    <CardTitle className="text-lg">{technician.technicianName}</CardTitle>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(technician.lastUpdate), 'HH:mm')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Performance Summary */}
                <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Aktif</p>
                    <p className="text-xl font-bold text-orange-600">{technician.activeOrders.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Selesai</p>
                    <p className="text-xl font-bold text-green-600">{technician.completedToday}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={`${getActivityStatusColor(technician.status)} text-white text-xs`}>
                      {technician.status}
                    </Badge>
                  </div>
                </div>

                {/* Active Orders */}
                {technician.activeOrders.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Pekerjaan Aktif ({technician.activeOrders.length})
                    </h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {technician.activeOrders.map(order => (
                        <div key={order._id} className="p-3 border rounded-lg bg-background">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs">{order.orderNo}</Badge>
                            <Badge className={`${getStatusColor(order.status)} text-xs`}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">{order.customerName}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {order.customerPhone}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {order.cluster}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Tidak ada pekerjaan aktif</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Detail
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Navigation className="w-4 h-4 mr-2" />
                    Lokasi
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTechnicians.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedTechnician === 'all' 
                  ? 'Tidak ada teknisi aktif saat ini'
                  : 'Teknisi tidak ditemukan atau tidak memiliki aktivitas'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}