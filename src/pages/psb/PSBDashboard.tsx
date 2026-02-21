import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText, CheckCircle, Clock, AlertCircle, RefreshCw,
  TrendingUp, BarChart2, MapPin, Wifi, WifiOff, Activity,
  ArrowUpRight, Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';
import { usePSBAnalytics } from '@/hooks/usePSBAnalytics';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/animated-counter';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-bold ml-1">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  IconEl: React.ReactNode;
  WatermarkEl: React.ReactNode;
  accentColor: string;
  bgGradient: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, IconEl, WatermarkEl, accentColor, bgGradient, delay = 0
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Card className={`relative overflow-hidden border-l-4 ${accentColor} hover:shadow-md transition-all duration-200 group`}>
      <div className={`absolute inset-0 ${bgGradient} opacity-40`} />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-foreground leading-none">
              {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-background/60 group-hover:scale-110 transition-transform">
            {IconEl}
          </div>
        </div>
        <div className="absolute -bottom-3 -right-3 opacity-5">
          {WatermarkEl}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-24" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-l-4 border-l-muted">
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <Card className="lg:col-span-3"><CardContent className="p-5"><Skeleton className="h-72 w-full" /></CardContent></Card>
      <Card className="lg:col-span-2"><CardContent className="p-5"><Skeleton className="h-72 w-full" /></CardContent></Card>
    </div>
    <Card><CardContent className="p-5 space-y-3">
      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
    </CardContent></Card>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const PSBDashboard: React.FC = () => {
  const { analytics, loading, error, refreshAnalytics } = usePSBAnalytics();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    if (analytics) setConnectionStatus('connected');
    else if (error) setConnectionStatus('disconnected');
    else setConnectionStatus('checking');
  }, [analytics, error]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAnalytics();
    setIsRefreshing(false);
  };

  if (loading) return <DashboardSkeleton />;

  if (!analytics && !loading) {
    return (
      <div className="space-y-6">
        <Alert className="border-warning/40 bg-warning/5">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <div>
              <strong>Koneksi Backend Bermasalah</strong>
              <p className="text-sm mt-1 text-muted-foreground">{error || 'PSB service tidak dapat dijangkau.'}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {connectionStatus === 'connected'
                ? <Wifi className="h-4 w-4 text-primary" />
                : <WifiOff className="h-4 w-4 text-destructive" />}
              {connectionStatus}
            </div>
          </AlertDescription>
        </Alert>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-6 rounded-2xl bg-muted/50">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Backend PSB tidak tersedia</p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // ─── Data Transforms ──────────────────────────────────────────────────────
  const completionRate = analytics!.summary.totalOrders > 0
    ? Math.round((analytics!.summary.completedOrders / analytics!.summary.totalOrders) * 100)
    : 0;

  const clusterChartData = analytics!.clusterStats.slice(0, 8).map(c => ({
    name: c._id.length > 12 ? c._id.slice(0, 12) + '…' : c._id,
    fullName: c._id,
    Total: c.count,
    Selesai: c.completed,
  }));

  const monthlyData = [...analytics!.monthlyTrends].reverse().map(m => ({
    name: `${m._id.month}/${String(m._id.year).slice(-2)}`,
    Total: m.count,
    Selesai: m.completed,
  }));

  const topCluster = analytics!.clusterStats[0];
  const topSTO = analytics!.stoStats[0];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Dashboard PSB
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitoring real-time data Pemasangan Sambungan Baru
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className="w-full sm:w-auto gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Memuat...' : 'Refresh'}
        </Button>
      </motion.div>

      {/* ── Hero Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Order"
          value={analytics!.summary.totalOrders}
          subtitle="Semua order PSB"
          IconEl={<FileText className="h-5 w-5 text-blue-500" />}
          WatermarkEl={<FileText className="h-20 w-20 text-blue-500" />}
          accentColor="border-l-blue-500"
          bgGradient="bg-gradient-to-br from-blue-500/10 to-transparent"
          delay={0.05}
        />
        <StatCard
          title="Selesai"
          value={analytics!.summary.completedOrders}
          subtitle="Order completed"
          IconEl={<CheckCircle className="h-5 w-5 text-primary" />}
          WatermarkEl={<CheckCircle className="h-20 w-20 text-primary" />}
          accentColor="border-l-primary"
          bgGradient="bg-gradient-to-br from-primary/10 to-transparent"
          delay={0.1}
        />
        <StatCard
          title="In Progress"
          value={analytics!.summary.inProgressOrders}
          subtitle="Sedang dikerjakan"
          IconEl={<Activity className="h-5 w-5 text-warning" />}
          WatermarkEl={<Activity className="h-20 w-20 text-warning" />}
          accentColor="border-l-warning"
          bgGradient="bg-gradient-to-br from-warning/10 to-transparent"
          delay={0.15}
        />
        <StatCard
          title="Pending"
          value={analytics!.summary.pendingOrders}
          subtitle="Menunggu diproses"
          IconEl={<Clock className="h-5 w-5 text-muted-foreground" />}
          WatermarkEl={<Clock className="h-20 w-20 text-muted-foreground" />}
          accentColor="border-l-muted-foreground"
          bgGradient="bg-gradient-to-br from-muted to-transparent"
          delay={0.2}
        />
      </div>

      {/* ── Second Row: Completion Rate + Quick Info ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Completion Rate */}
        <Card className="sm:col-span-1 border-border/60">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Completion Rate</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-center py-2">
              <p className="text-5xl font-black text-primary">{completionRate}<span className="text-2xl font-semibold text-muted-foreground">%</span></p>
              <p className="text-xs text-muted-foreground mt-1">dari total order</p>
            </div>
            <Progress value={completionRate} className="h-2" />
          </CardContent>
        </Card>

        {/* Top Cluster */}
        <Card className="border-border/60">
          <CardContent className="p-5 h-full flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cluster Teratas</p>
              <Layers className="h-4 w-4 text-blue-500" />
            </div>
            {topCluster ? (
              <div className="space-y-2">
                <p className="font-bold text-lg leading-tight text-foreground truncate">{topCluster._id}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{topCluster.count} order</Badge>
                  <Badge className="text-xs bg-primary/10 text-primary border-0">{topCluster.completed} selesai</Badge>
                </div>
                <Progress
                  value={topCluster.count > 0 ? (topCluster.completed / topCluster.count) * 100 : 0}
                  className="h-1.5 mt-1"
                />
              </div>
            ) : <p className="text-sm text-muted-foreground">Tidak ada data</p>}
          </CardContent>
        </Card>

        {/* Top STO */}
        <Card className="border-border/60">
          <CardContent className="p-5 h-full flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">STO Teratas</p>
              <MapPin className="h-4 w-4 text-warning" />
            </div>
            {topSTO ? (
              <div className="space-y-2">
                <p className="font-bold text-lg leading-tight text-foreground truncate">{topSTO._id}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{topSTO.count} order</Badge>
                  <Badge className="text-xs bg-warning/10 text-warning border-0">{topSTO.completed} selesai</Badge>
                </div>
                <Progress
                  value={topSTO.count > 0 ? (topSTO.completed / topSTO.count) * 100 : 0}
                  className="h-1.5 mt-1"
                />
              </div>
            ) : <p className="text-sm text-muted-foreground">Tidak ada data</p>}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Charts ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-4"
      >
        {/* Cluster Bar Chart */}
        <Card className="lg:col-span-3 border-border/60">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                Distribusi per Cluster
              </CardTitle>
              <Badge variant="outline" className="text-xs">Top {clusterChartData.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {clusterChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={clusterChartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  />
                  <Bar dataKey="Total" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Selesai" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Belum ada data cluster
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Area Chart */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-warning" />
              Trend Bulanan
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSelesai" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Total"
                    stroke="hsl(217 91% 60%)"
                    strokeWidth={2}
                    fill="url(#gradTotal)"
                    dot={{ r: 3, fill: 'hsl(217 91% 60%)' }}
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Selesai"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#gradSelesai)"
                    dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Belum ada data bulanan
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Cluster List ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="border-border/60">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Statistik Cluster
              </CardTitle>
              <Badge variant="outline" className="text-xs">{analytics!.clusterStats.length} cluster</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-2.5">
              {analytics!.clusterStats.slice(0, 10).map((cluster, idx) => {
                const rate = cluster.count > 0 ? Math.round((cluster.completed / cluster.count) * 100) : 0;
                return (
                  <div
                    key={cluster._id}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all duration-150"
                  >
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-sm text-foreground truncate">{cluster._id}</span>
                        <span className="text-xs font-semibold text-primary ml-2 flex-shrink-0">{rate}%</span>
                      </div>
                      <Progress value={rate} className="h-1.5" />
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-1">
                      <Badge variant="outline" className="text-xs h-5 px-2">{cluster.count}</Badge>
                      <Badge className="text-xs h-5 px-2 bg-primary/10 text-primary border-0">{cluster.completed}</Badge>
                    </div>
                  </div>
                );
              })}
              {analytics!.clusterStats.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Belum ada data cluster tersedia
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
};

export default PSBDashboard;
