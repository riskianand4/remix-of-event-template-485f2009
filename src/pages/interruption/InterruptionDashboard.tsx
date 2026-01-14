import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, TrendingUp, Activity, Calendar } from 'lucide-react';
import { getInterruptionAnalytics } from '@/services/interruptionApi';
import { InterruptionAnalytics } from '@/types/interruption';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

export const InterruptionDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<InterruptionAnalytics | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | '5years' | 'custom'>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // Custom selected but no date range yet
        setLoading(false);
        return;
      }
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Gagal memuat data analytics. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value as 'today' | 'week' | 'month' | 'year' | '5years' | 'custom');
    if (value !== 'custom') {
      setDateRange(undefined);
    }
  };

  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setDateRange(newRange);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Memuat data analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadAnalytics} variant="outline">
          Coba Lagi
        </Button>
      </div>
    );
  }

  if (!analytics || analytics.summary.totalReports === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Report Gangguan</h1>
            <p className="text-muted-foreground">Monitoring dan analisis tiket gangguan</p>
          </div>
        </div>
        
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertTriangle className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Belum Ada Data Gangguan</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Belum ada tiket gangguan yang terdaftar. Silakan tambahkan tiket gangguan baru untuk mulai melihat analytics dan statistik.
            </p>
            <Button onClick={() => window.location.href = '/interruption/data'} className="mt-4">
              Tambah Tiket Gangguan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const monthlyTrendData = analytics.monthlyTrends.map(trend => ({
    month: monthNames[trend._id.month - 1],
    total: trend.count,
    resolved: trend.resolved,
    avgTime: parseFloat(trend.avgHandlingTime.toFixed(1))
  }));

  const typeBreakdownData = analytics.typeBreakdown.map(type => ({
    name: type._id || 'Tidak diketahui',
    count: type.count
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-destructive to-destructive/70 bg-clip-text text-transparent">
              Dashboard Report Gangguan
            </h1>
            <p className="text-sm text-muted-foreground">Monitoring dan analisis tiket gangguan real-time</p>
          </div>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full sm:w-[200px] bg-card border-border/50">
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
        
        {/* Date Range Picker - shown when custom is selected */}
        {period === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-card/50"
          >
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <DateRangePicker
              date={dateRange}
              onDateChange={handleDateRangeChange}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs flex items-center gap-2">
                <Activity className="h-4 w-4 text-destructive" />
                Total Tiket
              </CardDescription>
              <CardTitle className="text-3xl font-bold">{analytics.summary.totalReports}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-destructive/10 to-card hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Tiket Open
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-destructive">{analytics.summary.openReports}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-card hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Tiket Resolved
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-green-500">{analytics.summary.resolvedReports}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-card hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Rata-rata Waktu
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-blue-500">
                {analytics.summary.averageHandlingTime.toFixed(1)}<span className="text-sm ml-1">jam</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-card hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Performance Rate
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-purple-500">{analytics.summary.performanceRate}%</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Visualisasi Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trend" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="trend" className="text-xs sm:text-sm">Trend Bulanan</TabsTrigger>
                <TabsTrigger value="type" className="text-xs sm:text-sm">Jenis Gangguan</TabsTrigger>
                <TabsTrigger value="performance" className="text-xs sm:text-sm">Performa Teknisi</TabsTrigger>
              </TabsList>

              {/* Monthly Trend Chart */}
              <TabsContent value="trend" className="space-y-4">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                        name="Total Gangguan"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="resolved" 
                        stroke="hsl(142 76% 36%)" 
                        strokeWidth={2}
                        name="Resolved"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgTime" 
                        stroke="hsl(217 91% 60%)" 
                        strokeWidth={2}
                        name="Avg Time (jam)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              {/* Interruption Type Breakdown */}
              <TabsContent value="type" className="space-y-4">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeBreakdownData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="count" fill="hsl(var(--destructive))" name="Jumlah" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              {/* Technician Performance */}
              <TabsContent value="performance" className="space-y-4">
                <div className="space-y-3">
                  {analytics.technicianPerformance.map((tech, index) => (
                    <motion.div
                      key={tech._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 text-destructive font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{tech.name}</p>
                          <p className="text-xs text-muted-foreground">{tech.totalReports} tiket</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{tech.avgHandlingTime.toFixed(1)} jam</p>
                          <p className="text-xs text-muted-foreground">Rata-rata</p>
                        </div>
                        <Badge 
                          variant={tech.performanceRate >= 80 ? 'default' : tech.performanceRate >= 60 ? 'secondary' : 'destructive'}
                        >
                          {tech.performanceRate.toFixed(0)}%
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default InterruptionDashboard;
