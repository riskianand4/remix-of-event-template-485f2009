import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Clock, AlertCircle, Zap } from 'lucide-react';

// Simplified mock data for velocity analysis
const mockVelocityData = [
  {
    productId: '1',
    productName: 'Product A',
    productCode: 'PA001',
    velocity: 'fast' as const,
    monthlyUsage: 150,
    currentStock: 300,
    daysOfSupply: 60
  },
  {
    productId: '2',
    productName: 'Product B',
    productCode: 'PB002',
    velocity: 'moderate' as const,
    monthlyUsage: 75,
    currentStock: 150,
    daysOfSupply: 60
  },
  {
    productId: '3',
    productName: 'Product C',
    productCode: 'PC003',
    velocity: 'slow' as const,
    monthlyUsage: 25,
    currentStock: 100,
    daysOfSupply: 120
  },
  {
    productId: '4',
    productName: 'Product D',
    productCode: 'PD004',
    velocity: 'stagnant' as const,
    monthlyUsage: 5,
    currentStock: 200,
    daysOfSupply: 365
  }
];

const StockVelocityAnalysis = () => {
  const [timeframe, setTimeframe] = useState('monthly');
  const [sortBy, setSortBy] = useState('velocity');
  const [loading, setLoading] = useState(false);

  const getVelocityColor = (velocity: string) => {
    switch (velocity) {
      case 'fast': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'slow': return 'text-orange-600 bg-orange-100';
      case 'stagnant': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVelocityIcon = (velocity: string) => {
    switch (velocity) {
      case 'fast': return <Zap className="w-4 h-4" />;
      case 'moderate': return <Activity className="w-4 h-4" />;
      case 'slow': return <Clock className="w-4 h-4" />;
      case 'stagnant': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const velocityStats = {
    fast: mockVelocityData.filter(v => v.velocity === 'fast').length,
    moderate: mockVelocityData.filter(v => v.velocity === 'moderate').length,
    slow: mockVelocityData.filter(v => v.velocity === 'slow').length,
    stagnant: mockVelocityData.filter(v => v.velocity === 'stagnant').length,
  };

  const chartData = mockVelocityData.map(item => ({
    name: item.productCode,
    monthly: item.monthlyUsage,
    velocity: item.velocity
  }));

  const pieData = [
    { name: 'Fast Moving', value: velocityStats.fast, color: '#10b981' },
    { name: 'Moderate Moving', value: velocityStats.moderate, color: '#f59e0b' },
    { name: 'Slow Moving', value: velocityStats.slow, color: '#f97316' },
    { name: 'Stagnant', value: velocityStats.stagnant, color: '#ef4444' },
  ];

  const sortedData = [...mockVelocityData].sort((a, b) => {
    switch (sortBy) {
      case 'velocity':
        const velocityOrder = { 'fast': 4, 'moderate': 3, 'slow': 2, 'stagnant': 1 };
        return velocityOrder[b.velocity] - velocityOrder[a.velocity];
      case 'usage':
        return b.monthlyUsage - a.monthlyUsage;
      case 'daysOfSupply':
        return a.daysOfSupply - b.daysOfSupply;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fast Moving</p>
                  <p className="text-md font-bold text-green-600">{velocityStats.fast}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Moderate Moving</p>
                  <p className="text-md font-bold text-yellow-600">{velocityStats.moderate}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Slow Moving</p>
                  <p className="text-md font-bold text-orange-600">{velocityStats.slow}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stagnant Stock</p>
                  <p className="text-md font-bold text-red-600">{velocityStats.stagnant}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Stock Usage Analysis
              </span>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="monthly" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Velocity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Velocity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Detailed Velocity Analysis
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="velocity">Sort by Velocity</SelectItem>
                <SelectItem value="usage">Sort by Usage</SelectItem>
                <SelectItem value="daysOfSupply">Sort by Days of Supply</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedData.map((item, index) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getVelocityColor(item.velocity)}`}>
                    {getVelocityIcon(item.velocity)}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.productName}</h4>
                    <p className="text-sm text-muted-foreground">{item.productCode}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Monthly Usage</p>
                    <p className="font-medium">{item.monthlyUsage}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Days of Supply</p>
                    <p className="font-medium">{item.daysOfSupply} days</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Current Stock</p>
                    <p className="font-medium">{item.currentStock}</p>
                  </div>
                  
                  <Badge className={getVelocityColor(item.velocity)}>
                    {item.velocity.toUpperCase()}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockVelocityAnalysis;