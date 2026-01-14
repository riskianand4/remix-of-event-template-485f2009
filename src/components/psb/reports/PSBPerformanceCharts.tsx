import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, AlertTriangle, Eye, Phone, Clock, Target, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { PSBActivationAnalytics } from '@/types/psb';
interface TechnicianData {
  name: string;
  orders: number;
  completed: number;
  efficiency: number;
  avgTime: number;
  status?: string;
  phone?: string;
  role?: string;
  activations?: number;
  signedActivations?: number;
  activationRate?: number;
}
interface PSBPerformanceChartsProps {
  trendData: Array<{
    month: string;
    orders: number;
    completed: number;
    pending: number;
    efficiency: string;
  }>;
  clusterData: Array<{
    name: string;
    orders: number;
    completed: number;
    activations: number;
    efficiency: string;
  }>;
  technicianData: TechnicianData[];
  activationAnalytics: PSBActivationAnalytics | null;
  bottleneckPhase?: string;
}
export const PSBPerformanceCharts: React.FC<PSBPerformanceChartsProps> = ({
  trendData,
  clusterData,
  technicianData,
  activationAnalytics,
  bottleneckPhase
}) => {
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const handleViewTechnician = (tech: TechnicianData) => {
    setSelectedTechnician(tech);
    setIsDialogOpen(true);
  };
  return <div className="space-y-6">
      {/* Bottleneck Alert */}
      {bottleneckPhase && bottleneckPhase !== 'N/A' && <Card className=" ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Bottleneck Terdeteksi</p>
                <p className="text-xs text-yellow-700">
                  Tahapan <strong>{bottleneckPhase}</strong> membutuhkan perhatian lebih
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
          <TabsTrigger value="activations">Aktivasi</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className='text-md sm:text-lg '>Monthly Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    fill="url(#ordersGradient)" 
                    name="Total Orders" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    fill="url(#completedGradient)" 
                    name="Completed" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clusters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className='text-md sm:text-lg '>Cluster Performance Comparison</CardTitle>
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
              <CardTitle className='text-md sm:text-lg '>Technician Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {technicianData.length > 0 ? <div className="border rounded-lg overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Teknisi</TableHead>
                        <TableHead className="min-w-[120px]">No. HP</TableHead>
                        <TableHead className="min-w-[100px]">Orders</TableHead>
                        <TableHead className="min-w-[100px]">Completed</TableHead>
                        <TableHead className="min-w-[100px]">Activations</TableHead>
                        <TableHead className="min-w-[100px]">Signed</TableHead>
                        <TableHead className="min-w-[100px]">Efficiency</TableHead>
                        <TableHead className="min-w-[100px]">Avg Time</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="text-center min-w-[80px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {technicianData.map(tech => <TableRow key={tech.name} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <div className="truncate max-w-[120px]" title={tech.name}>
                                {tech.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="truncate max-w-[100px]" title={tech.phone || 'N/A'}>
                              {tech.phone || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{tech.orders}</TableCell>
                          <TableCell className="text-center">{tech.completed}</TableCell>
                          <TableCell className="text-center">{tech.activations || 0}</TableCell>
                          <TableCell className="text-center">{tech.signedActivations || 0}</TableCell>
                          <TableCell>
                            <Badge variant={tech.efficiency >= 90 ? 'default' : tech.efficiency >= 80 ? 'secondary' : 'destructive'} className="whitespace-nowrap">
                              {tech.efficiency}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            {tech.avgTime} days
                          </TableCell>
                          <TableCell>
                            <Badge variant={tech.status === 'Active' ? 'outline' : 'secondary'} className="whitespace-nowrap text-xs">
                              {tech.status || 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => handleViewTechnician(tech)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div> : <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada data teknisi tersedia</p>
                  <p className="text-sm">Data teknisi akan muncul setelah ada assignment order</p>
                </div>}
            </CardContent>
          </Card>

          {/* Technician Detail Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="rounded-md max-w-[360px] md:max-w-md sm:max-w-xl  mx-0 ">
              <DialogHeader>
                <DialogTitle>Detail Teknisi</DialogTitle>
                <DialogDescription>
                  Informasi lengkap performa teknisi
                </DialogDescription>
              </DialogHeader>
              {selectedTechnician && <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedTechnician.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedTechnician.role || 'Teknisi'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Kontak</span>
                      </div>
                      <p className="text-sm">{selectedTechnician.phone || 'N/A'}</p>
                    </div>

                    <div className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Status</span>
                      </div>
                      <div>
                        <Badge variant={selectedTechnician.status === 'Active' ? 'outline' : 'secondary'}>
                          {selectedTechnician.status || 'Active'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 p-3 border rounded-lg bg-transparent">
                      <span className="text-sm font-medium text-muted-foreground">Total Orders</span>
                      <p className="text-2xl font-bold text-primary">{selectedTechnician.orders}</p>
                    </div>
                    <div className="space-y-2 p-3 border rounded-lg bg-transparent">
                      <span className="text-sm font-medium text-muted-foreground">Completed</span>
                      <p className="text-2xl font-bold text-green-600">{selectedTechnician.completed}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Efficiency</span>
                      </div>
                      <Badge variant={selectedTechnician.efficiency >= 90 ? 'default' : selectedTechnician.efficiency >= 80 ? 'secondary' : 'destructive'} className="text-base px-3 py-1">
                        {selectedTechnician.efficiency}%
                      </Badge>
                    </div>
                    <div className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Avg Time</span>
                      </div>
                      <p className="text-lg font-semibold">{selectedTechnician.avgTime} days</p>
                    </div>
                  </div>
                </div>}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="activations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className='text-md sm:text-lg'>Activation Performance by OLT</CardTitle>
            </CardHeader>
            <CardContent>
              {activationAnalytics && activationAnalytics.oltStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={activationAnalytics.oltStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Total Activations" />
                    <Bar dataKey="configured" fill="#10b981" name="Configured" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada data aktivasi tersedia</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-md sm:text-lg'>Signal Level Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {activationAnalytics && activationAnalytics.monthlyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activationAnalytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id.month" label={{ value: 'Month', position: 'insideBottom' }} />
                    <YAxis label={{ value: 'Avg Signal (dBm)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="averageSignal" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Avg Signal Level" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada data signal level tersedia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};