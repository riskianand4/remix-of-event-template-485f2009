import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  Activity, Calendar, BarChart2, Medal, RefreshCw
} from 'lucide-react';
import { getInterruptionAnalytics } from '@/services/interruptionApi';
import { InterruptionAnalytics } from '@/types/interruption';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-bold ml-0.5">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardItemProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accentClass: string;
  gradientClass: string;
  dotClass?: string;
  tag?: React.ReactNode;
  delay: number;
}

const StatCardItem: React.FC<StatCardItemProps> = ({
  label, value, icon, accentClass, gradientClass, dotClass, tag, delay
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Card className={`relative overflow-hidden border-l-4 ${accentClass} hover:shadow-md transition-all duration-200`}>
      <div className={`absolute inset-0 ${gradientClass} opacity-40`} />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          {icon}
        </div>
        <div className="flex items-end gap-2">
          <div className="text-3xl font-bold text-foreground leading-none">{value}</div>
          {/* AnimatedCounter applied at usage site */}
          {tag}
        </div>
        {dotClass && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`} />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

// ─── Loading Skeleton ───────────────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-9 w-40" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="border-l-4 border-l-muted">
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card><CardContent className="p-5"><Skeleton className="h-80 w-full" /></CardContent></Card>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────
export const InterruptionDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<InterruptionAnalytics | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | '5years' | 'custom'>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trend' | 'type' | 'performance'>('trend');

  useEffect(() => {
    loadAnalytics();
  }, [period, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (period === 'custom' && dateRange?.from && dateRange?.to) {
        data = await getInterruptionAnalytics({
          startDate: format(dateRange.from, 'yyyy-MM-dd'),
          endDate: format(dateRange.to, 'yyyy-MM-dd')
        });
      } else if (period !== 'custom') {
        data = await getInterruptionAnalytics({ period });
      } else {
        setLoading(false);
        return;
      }
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Gagal memuat data analytics. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value as typeof period);
    if (value !== 'custom') setDateRange(undefined);
  };

  if (loading) return <DashboardSkeleton />;

  if (error) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="p-6 rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <p className="text-muted-foreground text-sm">{error}</p>
      <Button onClick={loadAnalytics} variant="outline" size="sm" className="gap-2">
        <RefreshCw className="h-4 w-4" /> Coba Lagi
      </Button>
    </div>
  );

  if (!analytics || analytics.summary.totalReports === 0) return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Gangguan</h1>
          <p className="text-sm text-muted-foreground">Monitoring tiket gangguan real-time</p>
        </div>
      </div>
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="p-6 rounded-2xl bg-muted/60">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Belum Ada Data Gangguan</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            Belum ada tiket gangguan terdaftar. Tambahkan tiket untuk mulai melihat statistik.
          </p>
          <Button onClick={() => window.location.href = '/interruption/data'} className="mt-2">
            Tambah Tiket Gangguan
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Data Transforms ──────────────────────────────────────────────────────────
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const monthlyTrendData = analytics.monthlyTrends.map(t => ({
    month: monthNames[t._id.month - 1],
    'Total': t.count,
    'Resolved': t.resolved,
    'Avg Waktu (jam)': parseFloat(t.avgHandlingTime.toFixed(1))
  }));

  const typeBreakdownData = analytics.typeBreakdown.map(t => ({
    name: t._id || 'Lainnya',
    Jumlah: t.count
  }));

  const tabs = [
    { id: 'trend' as const, label: 'Trend Bulanan' },
    { id: 'type' as const, label: 'Jenis Gangguan' },
    { id: 'performance' as const, label: 'Performa Teknisi' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-destructive to-destructive/60 bg-clip-text text-transparent">
              Dashboard Gangguan
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitoring dan analisis tiket gangguan real-time
            </p>
          </div>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border shadow-lg">
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
              <SelectItem value="5years">5 Tahun Terakhir</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AnimatePresence>
          {period === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-card/60"
            >
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCardItem
          label="Total Tiket"
          value={<AnimatedCounter value={analytics.summary.totalReports} />}
          icon={<Activity className="h-4 w-4 text-foreground/60" />}
          accentClass="border-l-blue-500"
          gradientClass="bg-gradient-to-br from-blue-500/10 to-transparent"
          delay={0.05}
        />
        <StatCardItem
          label="Tiket Open"
          value={<span className="text-destructive"><AnimatedCounter value={analytics.summary.openReports} /></span>}
          icon={<AlertCircle className="h-4 w-4 text-destructive" />}
          accentClass="border-l-destructive"
          gradientClass="bg-gradient-to-br from-destructive/10 to-transparent"
          dotClass="bg-destructive"
          delay={0.1}
        />
        <StatCardItem
          label="Resolved"
          value={<span className="text-primary"><AnimatedCounter value={analytics.summary.resolvedReports} /></span>}
          icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
          accentClass="border-l-primary"
          gradientClass="bg-gradient-to-br from-primary/10 to-transparent"
          delay={0.15}
        />
        <StatCardItem
          label="Avg Waktu"
          value={
            <span className="text-blue-500">
              <AnimatedCounter value={analytics.summary.averageHandlingTime} decimals={1} />
              <span className="text-base font-medium text-muted-foreground ml-1">jam</span>
            </span>
          }
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          accentClass="border-l-blue-500"
          gradientClass="bg-gradient-to-br from-blue-500/8 to-transparent"
          delay={0.2}
        />
        <StatCardItem
          label="Performance"
          value={<span className="text-purple-500"><AnimatedCounter value={Number(analytics.summary.performanceRate)} />%</span>}
          icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
          accentClass="border-l-purple-500"
          gradientClass="bg-gradient-to-br from-purple-500/10 to-transparent"
          tag={(() => {
            const pr = Number(analytics.summary.performanceRate);
            return (
              <Badge className={`text-xs h-5 border-0 ml-1 ${
                pr >= 80 ? 'bg-primary/15 text-primary' :
                pr >= 60 ? 'bg-warning/15 text-warning' :
                'bg-destructive/15 text-destructive'
              }`}>
                {pr >= 80 ? 'Baik' : pr >= 60 ? 'Cukup' : 'Rendah'}
              </Badge>
            );
          })()}
          delay={0.25}
        />
      </div>

      {/* ── Charts Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-border/60">
          <CardHeader className="pb-0 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-destructive" />
                Visualisasi Data
              </CardTitle>
              {/* Pill Tabs */}
              <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-5 pt-4">
            <AnimatePresence mode="wait">
              {/* Trend Bulanan */}
              {activeTab === 'trend' && (
                <motion.div
                  key="trend"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="h-[340px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                      <Line type="monotone" dataKey="Total" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--destructive))' }} activeDot={{ r: 6 }} name="Total" />
                      <Line type="monotone" dataKey="Resolved" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} name="Resolved" />
                      <Line type="monotone" dataKey="Avg Waktu (jam)" stroke="hsl(217 91% 60%)" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} name="Avg Waktu (jam)" />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Jenis Gangguan */}
              {activeTab === 'type' && (
                <motion.div
                  key="type"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="h-[340px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeBreakdownData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Jumlah" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Performa Teknisi */}
              {activeTab === 'performance' && (
                <motion.div
                  key="performance"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1"
                >
                  {analytics.technicianPerformance.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                      Belum ada data performa teknisi
                    </div>
                  ) : analytics.technicianPerformance.map((tech, idx) => {
                    const rate = Number(tech.performanceRate);
                    const color =
                      rate >= 80 ? 'text-primary' :
                      rate >= 60 ? 'text-warning' : 'text-destructive';
                    const bgColor =
                      rate >= 80 ? 'bg-primary/10' :
                      rate >= 60 ? 'bg-warning/10' : 'bg-destructive/10';
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

                    return (
                      <motion.div
                        key={tech._id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 hover:border-destructive/30 hover:bg-destructive/5 transition-all"
                      >
                        {/* Rank badge */}
                        <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0 text-sm`}>
                          {medal ?? <span className={`font-bold text-xs ${color}`}>#{idx + 1}</span>}
                        </div>

                        {/* Name + tickets */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-sm text-foreground truncate">{tech.name}</span>
                            <span className={`text-sm font-bold ${color} ml-2 flex-shrink-0`}>{tech.performanceRate.toFixed(0)}%</span>
                          </div>
                          <Progress value={tech.performanceRate} className="h-1.5" />
                        </div>

                        {/* Stats */}
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-semibold text-foreground">{tech.avgHandlingTime.toFixed(1)} jam</p>
                          <p className="text-xs text-muted-foreground">{tech.totalReports} tiket</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
};

export default InterruptionDashboard;
