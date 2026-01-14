import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton, StatsCardSkeleton } from '@/components/ui/loading-skeleton';
import { BarChart3, Users, FileText, TrendingUp, CheckCircle, Clock, AlertTriangle, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { usePSBAnalytics } from '@/hooks/usePSBAnalytics';
import { Alert, AlertDescription } from '@/components/ui/alert';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const PSBDashboard: React.FC = () => {
  const {
    analytics,
    loading,
    error,
    refreshAnalytics
  } = usePSBAnalytics();

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    // Check connection status
    if (analytics) {
      setConnectionStatus('connected');
    } else if (error) {
      setConnectionStatus('disconnected');
    } else {
      setConnectionStatus('checking');
    }
  }, [analytics, error]);

  if (loading) {
    return <div className="space-y-4  sm:space-y-6 p-2 sm:p-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 sm:h-8 w-36 sm:w-48" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </div>
          <Skeleton className="h-8 sm:h-9 w-20 sm:w-24" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({
          length: 4
        }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-[250px] sm:h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-[250px] sm:h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Additional Charts Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <Skeleton className="h-5 sm:h-6 w-20 sm:w-24" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-[250px] sm:h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <Skeleton className="h-5 sm:h-6 w-28 sm:w-36" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-[250px] sm:h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Skeleton */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              {Array.from({
              length: 10
            }).map((_, i) => <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-2 sm:p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 ml-5 sm:ml-0">
                    <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 rounded-full" />
                    <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
                    <Skeleton className="h-3 sm:h-4 w-6 sm:w-8" />
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>;
  }

  if (!analytics && !loading) {
    return <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
        <Alert className="border-yellow-300 bg-primary/10">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex-1">
                <strong>Koneksi Backend Bermasalah</strong>
                <p className="text-sm mt-1">
                  {error || 'Backend PSB service tidak dapat dijangkau. Menampilkan mode offline.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                <span className="text-xs capitalize">{connectionStatus}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
        <div className="text-center py-6 sm:py-8">
          <AlertTriangle className="h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">Backend PSB service tidak tersedia</p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 px-2">
            Periksa apakah backend server berjalan di port 3001 dan endpoint /api/psb-orders dapat diakses
          </p>
          <Button onClick={refreshAnalytics} className="mt-4 w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>;
  }

  const statusData = [{
    name: 'Completed',
    value: analytics.summary.completedOrders,
    color: COLORS[0]
  }, {
    name: 'In Progress',
    value: analytics.summary.inProgressOrders,
    color: COLORS[1]
  }, {
    name: 'Pending',
    value: analytics.summary.pendingOrders,
    color: COLORS[2]
  }];

  // Transform data for area charts
  const statusAreaData = statusData.map((item, index) => ({
    name: item.name,
    value: item.value,
    index: index + 1
  }));

  const clusterAreaData = analytics.clusterStats.slice(0, 8).map((item, index) => ({
    name: item._id,
    value: item.count,
    completed: item.completed,
    index: index + 1
  }));

  const stoAreaData = analytics.stoStats.slice(0, 8).map((item, index) => ({
    name: item._id,
    value: item.count,
    index: index + 1
  }));

  const monthlyAreaData = analytics.monthlyTrends.reverse().map((item, index) => ({
    name: `${item._id.month}/${item._id.year}`,
    total: item.count,
    completed: item.completed,
    index: index + 1
  }));

  return <div className="space-y-4 sm:space-y-6 p-0 sm:p-0 ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Dashboard PSB</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Monitoring dan analisis data PSB secara real-time
          </p>
        </div>
        <Button onClick={refreshAnalytics} variant="outline" className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{analytics.summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Semua order PSB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {analytics.summary.completedOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Order selesai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {analytics.summary.inProgressOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sedang dikerjakan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {analytics.summary.pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Order menunggu
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      </div>

      {/* Analytics Tabs */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Analytics Charts</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
              <TabsTrigger value="status" className="text-xs sm:text-sm">Status Order</TabsTrigger>
              <TabsTrigger value="clusters" className="text-xs sm:text-sm">Top Cluster</TabsTrigger>
              <TabsTrigger value="stos" className="text-xs sm:text-sm">Top STO</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs sm:text-sm">Trend Bulanan</TabsTrigger>
            </TabsList>

            <TabsContent value="status">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={statusAreaData}>
                  <defs>
                    <linearGradient id="statusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    fill="url(#statusGradient)" 
                    name="Jumlah Order" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="clusters">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={clusterAreaData}>
                  <defs>
                    <linearGradient id="clusterGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="clusterCompletedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={10} 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2} 
                    fill="url(#clusterGradient)" 
                    name="Total Order" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2} 
                    fill="url(#clusterCompletedGradient)" 
                    name="Completed" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="stos">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={stoAreaData}>
                  <defs>
                    <linearGradient id="stoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={10} 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2} 
                    fill="url(#stoGradient)" 
                    name="Jumlah Order" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="trends">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={monthlyAreaData}>
                  <defs>
                    <linearGradient id="trendsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="trendsCompletedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    fill="url(#trendsGradient)" 
                    name="Total Order" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    fill="url(#trendsCompletedGradient)" 
                    name="Completed" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Stats List */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Statistik Cluster</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 sm:space-y-3">
            {analytics.clusterStats.slice(0, 10).map(cluster => 
              <div key={cluster._id} className="flex flex-row justify-between  sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-2 sm:p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="font-medium text-sm sm:text-base truncate">{cluster._id}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 ml-5 sm:ml-0 flex-wrap">
                  <Badge variant="outline" className="text-xs">{cluster.count} total</Badge>
                  <Badge variant="secondary" className="text-xs">{cluster.completed} selesai</Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {cluster.count > 0 ? (cluster.completed / cluster.count * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>;
};