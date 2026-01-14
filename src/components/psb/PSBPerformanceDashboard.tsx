import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Clock, CheckCircle, AlertTriangle, BarChart3, PieChart, Activity, Target, Timer, Zap, Download, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell } from 'recharts';
import { PSBAnalytics, PSBActivationAnalytics } from '@/types/psb';
interface PSBPerformanceDashboardProps {
  orderAnalytics: PSBAnalytics | null;
  activationAnalytics: PSBActivationAnalytics | null;
  loading?: boolean;
}
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
export const PSBPerformanceDashboard: React.FC<PSBPerformanceDashboardProps> = ({
  orderAnalytics,
  activationAnalytics,
  loading = false
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Performance metrics calculation
  const getPerformanceMetrics = () => {
    if (!orderAnalytics || !activationAnalytics) return null;
    const installationEfficiency = orderAnalytics.summary.totalOrders > 0 ? (orderAnalytics.summary.completedOrders / orderAnalytics.summary.totalOrders * 100).toFixed(1) : '0';
    const activationEfficiency = activationAnalytics.summary.totalActivations > 0 ? (activationAnalytics.summary.configuredONT / activationAnalytics.summary.totalActivations * 100).toFixed(1) : '0';
    const overallEfficiency = ((parseFloat(installationEfficiency) + parseFloat(activationEfficiency)) / 2).toFixed(1);
    return {
      installationEfficiency,
      activationEfficiency,
      overallEfficiency,
      avgSignalLevel: activationAnalytics.summary.averageSignalLevel.toFixed(1),
      bottleneckPhase: identifyBottleneck()
    };
  };
  const identifyBottleneck = () => {
    if (!orderAnalytics) return 'N/A';
    const pending = orderAnalytics.summary.pendingOrders;
    const inProgress = orderAnalytics.summary.inProgressOrders;
    if (pending > inProgress * 2) return 'Order Assignment';
    if (inProgress > orderAnalytics.summary.completedOrders * 0.5) return 'Field Installation';
    return 'Service Activation';
  };

  // Cluster performance data
  const getClusterPerformanceData = () => {
    if (!orderAnalytics || !activationAnalytics) return [];
    return orderAnalytics.clusterStats.map(cluster => {
      const activationData = activationAnalytics.clusterStats.find(a => a._id === cluster._id);
      return {
        name: cluster._id,
        orders: cluster.count,
        completed: cluster.completed,
        activations: activationData?.count || 0,
        efficiency: cluster.count > 0 ? (cluster.completed / cluster.count * 100).toFixed(1) : 0
      };
    });
  };

  // Monthly trend data
  const getTrendData = () => {
    if (!orderAnalytics) return [];
    return orderAnalytics.monthlyTrends.map(trend => ({
      month: `${trend._id.month}/${trend._id.year}`,
      orders: trend.count,
      completed: trend.completed,
      pending: trend.count - trend.completed,
      efficiency: trend.count > 0 ? (trend.completed / trend.count * 100).toFixed(1) : 0
    }));
  };

  // Technician performance (mock data - in real implementation, this would come from API)
  const getTechnicianPerformance = () => [{
    name: 'Ahmad',
    orders: 25,
    completed: 23,
    efficiency: 92,
    avgTime: 2.5
  }, {
    name: 'Budi',
    orders: 22,
    completed: 19,
    efficiency: 86,
    avgTime: 3.1
  }, {
    name: 'Citra',
    orders: 28,
    completed: 26,
    efficiency: 93,
    avgTime: 2.3
  }, {
    name: 'Doni',
    orders: 20,
    completed: 16,
    efficiency: 80,
    avgTime: 3.8
  }, {
    name: 'Eko',
    orders: 24,
    completed: 22,
    efficiency: 92,
    avgTime: 2.7
  }];
  const metrics = getPerformanceMetrics();
  const clusterData = getClusterPerformanceData();
  const trendData = getTrendData();
  const technicianData = getTechnicianPerformance();
  if (loading) {
    return <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({
          length: 4
        }).map((_, i) => <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Efficiency</p>
                <p className="text-2xl font-bold text-primary">{metrics?.overallEfficiency || '0'}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Installation Rate</p>
                <p className="text-2xl font-bold text-blue-600">{metrics?.installationEfficiency || '0'}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activation Rate</p>
                <p className="text-2xl font-bold text-green-600">{metrics?.activationEfficiency || '0'}%</p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Signal Level</p>
                <p className="text-2xl font-bold text-orange-600">{metrics?.avgSignalLevel || '0'} dBm</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottleneck Alert */}
      {metrics?.bottleneckPhase && <Card className=" ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Bottleneck Terdeteksi</p>
                <p className="text-xs text-yellow-700">
                  Tahapan <strong>{metrics.bottleneckPhase}</strong> membutuhkan perhatian lebih
                </p>
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Performance Analysis Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="clusters">Clusters</TabsTrigger>
          <TabsTrigger value="technicians">Teknisi</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Total Orders" />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clusters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cluster Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={clusterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#3b82f6" name="Total Orders" />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="activations" fill="#f59e0b" name="Activations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technicians" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {technicianData.map((tech, index) => <div key={tech.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{tech.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tech.completed}/{tech.orders} orders completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={tech.efficiency >= 90 ? 'default' : tech.efficiency >= 80 ? 'secondary' : 'destructive'}>
                        {tech.efficiency}% efficiency
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-medium">{tech.avgTime} days</p>
                        <p className="text-xs text-muted-foreground">avg time</p>
                      </div>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Signal Level Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Excellent (-10 to -15 dBm)</span>
                    <Badge className="bg-green-500">45%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Good (-15 to -20 dBm)</span>
                    <Badge className="bg-blue-500">35%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fair (-20 to -25 dBm)</span>
                    <Badge className="bg-yellow-500">15%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Poor (&lt; -25 dBm)</span>
                    <Badge className="bg-red-500">5%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OLT Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activationAnalytics?.oltStats?.slice(0, 5).map((olt, index) => <div key={olt._id} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{olt._id}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {olt.configured}/{olt.count}
                        </span>
                        <Badge variant="outline">
                          {(olt.configured / olt.count * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>;
};