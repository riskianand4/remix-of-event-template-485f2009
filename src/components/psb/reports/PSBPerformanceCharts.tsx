import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Users, AlertTriangle, Eye, Phone, Clock, Target, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { PSBActivationAnalytics } from '@/types/psb';
import { motion, AnimatePresence } from 'framer-motion';

interface TechnicianData {
  name: string; orders: number; completed: number; efficiency: number;
  avgTime: number; status?: string; phone?: string; role?: string;
  activations?: number; signedActivations?: number; activationRate?: number;
}

interface PSBPerformanceChartsProps {
  trendData: Array<{ month: string; orders: number; completed: number; pending: number; efficiency: string }>;
  clusterData: Array<{ name: string; orders: number; completed: number; activations: number; efficiency: string }>;
  technicianData: TechnicianData[];
  activationAnalytics: PSBActivationAnalytics | null;
  bottleneckPhase?: string;
}

const tabs = [
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'clusters', label: 'Clusters', icon: BarChart3 },
  { id: 'technicians', label: 'Teknisi', icon: Users },
  { id: 'activations', label: 'Aktivasi', icon: Activity },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export const PSBPerformanceCharts: React.FC<PSBPerformanceChartsProps> = ({
  trendData, clusterData, technicianData, activationAnalytics, bottleneckPhase
}) => {
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('trends');

  const handleViewTechnician = (tech: TechnicianData) => {
    setSelectedTechnician(tech);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Bottleneck Alert */}
      {bottleneckPhase && bottleneckPhase !== 'N/A' && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500/15 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Bottleneck Terdeteksi</p>
                <p className="text-xs text-muted-foreground">
                  Tahapan <strong>{bottleneckPhase}</strong> membutuhkan perhatian lebih
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pill-style Tabs */}
      <div className="flex gap-1.5 p-1 bg-muted/50 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'trends' && (
          <motion.div key="trends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={360}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="rptOrdersGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="rptCompletedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} fill="url(#rptOrdersGrad)" name="Total Orders" />
                    <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fill="url(#rptCompletedGrad)" name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'clusters' && (
          <motion.div key="clusters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cluster Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={clusterData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="orders" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="activations" fill="#f59e0b" name="Activations" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'technicians' && (
          <motion.div key="technicians" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Technician Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {technicianData.length > 0 ? (
                  <div className="space-y-3">
                    {technicianData.map((tech, i) => {
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                      return (
                        <div key={tech.name} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                            {medal || (i + 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{tech.name}</span>
                              <Badge variant={tech.status === 'Active' ? 'outline' : 'secondary'} className="text-[10px] px-1.5 py-0">
                                {tech.status || 'Active'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={tech.efficiency} className="h-1.5 flex-1" />
                              <span className="text-xs font-medium text-muted-foreground w-10 text-right">{tech.efficiency}%</span>
                            </div>
                            <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
                              <span>{tech.orders} orders</span>
                              <span>{tech.completed} done</span>
                              <span>{tech.activations || 0} activated</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => handleViewTechnician(tech)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Tidak ada data teknisi tersedia</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Technician Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="rounded-md max-w-[360px] md:max-w-md">
                <DialogHeader>
                  <DialogTitle>Detail Teknisi</DialogTitle>
                  <DialogDescription>Informasi lengkap performa teknisi</DialogDescription>
                </DialogHeader>
                {selectedTechnician && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{selectedTechnician.name}</h3>
                        <p className="text-xs text-muted-foreground">{selectedTechnician.role || 'Teknisi'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border rounded-lg space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />Kontak</span>
                        <p className="text-sm font-medium">{selectedTechnician.phone || 'N/A'}</p>
                      </div>
                      <div className="p-3 border rounded-lg space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" />Status</span>
                        <Badge variant={selectedTechnician.status === 'Active' ? 'outline' : 'secondary'} className="text-xs">
                          {selectedTechnician.status || 'Active'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border rounded-lg">
                        <span className="text-xs text-muted-foreground">Total Orders</span>
                        <p className="text-2xl font-bold text-primary">{selectedTechnician.orders}</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <span className="text-xs text-muted-foreground">Completed</span>
                        <p className="text-2xl font-bold text-green-600">{selectedTechnician.completed}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border rounded-lg space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" />Efficiency</span>
                        <Badge variant={selectedTechnician.efficiency >= 90 ? 'default' : selectedTechnician.efficiency >= 80 ? 'secondary' : 'destructive'} className="text-sm px-2 py-0.5">
                          {selectedTechnician.efficiency}%
                        </Badge>
                      </div>
                      <div className="p-3 border rounded-lg space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Avg Time</span>
                        <p className="text-base font-semibold">{selectedTechnician.avgTime} days</p>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </motion.div>
        )}

        {activeTab === 'activations' && (
          <motion.div key="activations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Activation Performance by OLT</CardTitle>
              </CardHeader>
              <CardContent>
                {activationAnalytics && activationAnalytics.oltStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={360}>
                    <BarChart data={activationAnalytics.oltStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                      <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#3b82f6" name="Total Activations" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="configured" fill="#10b981" name="Configured" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Tidak ada data aktivasi tersedia</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Signal Level Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {activationAnalytics && activationAnalytics.monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={activationAnalytics.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                      <XAxis dataKey="_id.month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="averageSignal" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} name="Avg Signal Level" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Tidak ada data signal level tersedia</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
