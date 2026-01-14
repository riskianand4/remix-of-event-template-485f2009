import { PSBAnalytics, PSBActivationAnalytics } from '@/types/psb';

// Calculate performance metrics
export const calculatePerformanceMetrics = (
  orderAnalytics: PSBAnalytics | null,
  activationAnalytics: PSBActivationAnalytics | null
) => {
  if (!orderAnalytics) {
    return {
      installationEfficiency: '0',
      activationEfficiency: '0', 
      overallEfficiency: '0',
      avgSignalLevel: '0',
      bottleneckPhase: 'N/A'
    };
  }

  const installationEfficiency = orderAnalytics.summary.totalOrders > 0 
    ? (orderAnalytics.summary.completedOrders / orderAnalytics.summary.totalOrders * 100).toFixed(1) 
    : '0';
    
  const activationEfficiency = activationAnalytics?.summary.totalActivations > 0 
    ? (activationAnalytics.summary.configuredONT / activationAnalytics.summary.totalActivations * 100).toFixed(1) 
    : '0';
    
  const overallEfficiency = activationAnalytics 
    ? ((parseFloat(installationEfficiency) + parseFloat(activationEfficiency)) / 2).toFixed(1)
    : installationEfficiency;

  return {
    installationEfficiency,
    activationEfficiency, 
    overallEfficiency,
    avgSignalLevel: activationAnalytics?.summary.averageSignalLevel.toFixed(1) || '0',
    bottleneckPhase: identifyBottleneck(orderAnalytics)
  };
};

// Identify bottleneck phase
export const identifyBottleneck = (orderAnalytics: PSBAnalytics) => {
  const pending = orderAnalytics.summary.pendingOrders;
  const inProgress = orderAnalytics.summary.inProgressOrders;
  
  if (pending > inProgress * 2) return 'Order Assignment';
  if (inProgress > orderAnalytics.summary.completedOrders * 0.5) return 'Field Installation';
  return 'Service Activation';
};

// Get cluster performance data
export const getClusterPerformanceData = (
  orderAnalytics: PSBAnalytics | null,
  activationAnalytics: PSBActivationAnalytics | null
) => {
  if (!orderAnalytics) return [];
  
  return orderAnalytics.clusterStats.map(cluster => {
    const activationData = activationAnalytics?.clusterStats.find(a => a._id === cluster._id);
    return {
      name: cluster._id,
      orders: cluster.count,
      completed: cluster.completed,
      activations: activationData?.count || 0,
      efficiency: cluster.count > 0 ? (cluster.completed / cluster.count * 100).toFixed(1) : '0'
    };
  });
};

// Get monthly trend data
export const getMonthlyTrendData = (orderAnalytics: PSBAnalytics | null) => {
  if (!orderAnalytics) return [];
  
  return orderAnalytics.monthlyTrends.map(trend => ({
    month: `${trend._id.month}/${trend._id.year}`,
    orders: trend.count,
    completed: trend.completed,
    pending: trend.count - trend.completed,
    efficiency: trend.count > 0 ? (trend.completed / trend.count * 100).toFixed(1) : '0'
  }));
};

// Export report data as CSV
export const exportReportData = (
  reportType: string,
  orderAnalytics: PSBAnalytics | null,
  activationAnalytics: PSBActivationAnalytics | null,
  technicianData?: any[]
) => {
  if (!orderAnalytics) {
    throw new Error('No data available to export');
  }
  
  let csvData = '';
  let filename = `psb-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
  
  if (reportType === 'summary') {
    csvData = `Report Type,Metric,Value\n`;
    csvData += `Summary,Total Orders,${orderAnalytics.summary.totalOrders}\n`;
    csvData += `Summary,Completed Orders,${orderAnalytics.summary.completedOrders}\n`;
    csvData += `Summary,Pending Orders,${orderAnalytics.summary.pendingOrders}\n`;
    csvData += `Summary,Completion Rate,${orderAnalytics.summary.completionRate}%\n`;
    
    if (activationAnalytics) {
      csvData += `Summary,Total Activations,${activationAnalytics.summary.totalActivations}\n`;
      csvData += `Summary,Configured ONT,${activationAnalytics.summary.configuredONT}\n`;
      csvData += `Summary,Configuration Rate,${activationAnalytics.summary.configurationRate}%\n`;
      csvData += `Summary,Avg Signal Level,${activationAnalytics.summary.averageSignalLevel} dBm\n`;
    }
    
  } else if (reportType === 'cluster') {
    csvData = `Cluster,Total Orders,Completed Orders,Total Activations,Configured ONT\n`;
    orderAnalytics.clusterStats.forEach(cluster => {
      const activationCluster = activationAnalytics?.clusterStats.find(a => a._id === cluster._id);
      csvData += `${cluster._id},${cluster.count},${cluster.completed},${activationCluster?.count || 0},${activationCluster?.configured || 0}\n`;
    });
    
  } else if (reportType === 'technician') {
    if (!technicianData || technicianData.length === 0) {
      throw new Error('No technician data available to export');
    }
    
    csvData = `Technician,Phone,Orders,Completed,Activations,Signed,Efficiency (%),Avg Time (days),Status\n`;
    technicianData.forEach(tech => {
      csvData += `${tech.name},${tech.phone},${tech.orders},${tech.completed},${tech.activations || 0},${tech.signedActivations || 0},${tech.efficiency},${tech.avgTime},${tech.status}\n`;
    });
    
  } else if (reportType === 'package') {
    csvData = `Package,Total Orders,Completed Orders\n`;
    csvData += `Implementation pending...\n`;
  }
  
  // Download CSV
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};