import { useState, useEffect } from 'react';
import { apiClient } from '@/services/apiClient';
import { PSBOrder } from '@/types/psb';
import { getTechnicianName } from '@/utils/psbHelpers';

export interface TechnicianPerformance {
  name: string;
  orders: number;
  completed: number;
  efficiency: number;
  avgTime: number;
  status: string;
  phone: string;
  role: string;
  activations: number;
  signedActivations: number;
  activationRate: number;
}

export interface TechnicianDataHook {
  technicians: TechnicianPerformance[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTechnicianData = (): TechnicianDataHook => {
  const [technicians, setTechnicians] = useState<TechnicianPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateTechnicianPerformance = (users: any[], orders: PSBOrder[], activations: any[]): TechnicianPerformance[] => {
    // Only consider registered technicians from users table
    const teknisiUsers = users.filter((u) => u.role === 'teknisi' || u.role === 'technician');

    // If there are no registered technicians, return empty (avoid any mock/derived names)
    if (teknisiUsers.length === 0) return [];

    const technicianStats: { [key: string]: TechnicianPerformance } = {};

    // Initialize technician data from users only
    teknisiUsers.forEach((user) => {
      technicianStats[user.name] = {
        name: user.name,
        orders: 0,
        completed: 0,
        efficiency: 0,
        avgTime: 0,
        status: user.isActive ? 'Active' : 'Inactive',
        phone: user.phone || 'N/A',
        role: user.role,
        activations: 0,
        signedActivations: 0,
        activationRate: 0
      };
    });

    // Calculate performance from orders, but only for known technicians
    const technicianOrders: { [key: string]: PSBOrder[] } = {};

    orders.forEach((order) => {
      const techName = getTechnicianName(order).trim();
      if (!techName) return;
      if (!technicianStats[techName]) return; // Ignore technicians not registered in users table

      if (!technicianOrders[techName]) {
        technicianOrders[techName] = [];
      }

      technicianOrders[techName].push(order);
      technicianStats[techName].orders++;
      if (order.status === 'Completed') {
        technicianStats[techName].completed++;
      }
    });

    // Calculate from activations
    activations.forEach((activation) => {
      const techName = (activation.technician || '').trim();
      if (!techName || !technicianStats[techName]) return;

      technicianStats[techName].activations++;
      
      // Check if signed (has both signatures)
      if (activation.installationReport?.signatures?.technician && 
          activation.installationReport?.signatures?.customer) {
        technicianStats[techName].signedActivations++;
      }
    });

    // Calculate efficiency, avg time, and activation rate
    Object.keys(technicianStats).forEach((techName) => {
      const stats = technicianStats[techName];
      
      // Calculate activation rate
      if (stats.activations > 0) {
        stats.activationRate = Math.round((stats.signedActivations / stats.activations) * 100);
      }
      
      if (stats.orders > 0) {
        stats.efficiency = Math.round((stats.completed / stats.orders) * 100);

        // Calculate average completion time for completed orders
        const completedOrders = technicianOrders[techName]?.filter((o) => o.status === 'Completed') || [];
        if (completedOrders.length > 0) {
          const totalDays = completedOrders.reduce((sum, order) => {
            const startDate = new Date(order.date || order.createdAt);
            const endDate = new Date(order.updatedAt);
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return sum + diffDays;
          }, 0);
          stats.avgTime = Math.round((totalDays / completedOrders.length) * 10) / 10;
        } else {
          stats.avgTime = 0;
        }
      } else {
        stats.efficiency = 0;
        stats.avgTime = 0;
      }
    });

    // Return technicians with at least one order or activation
    return Object.values(technicianStats)
      .filter((tech) => tech.orders > 0 || tech.activations > 0)
      .sort((a, b) => b.efficiency - a.efficiency);
  };

  const fetchTechnicianData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users, PSB orders, and activations in parallel
      const [usersResponse, ordersResponse, activationsResponse] = await Promise.all([
        apiClient.get('/api/users'),
        apiClient.get('/api/psb-orders?limit=10000'),
        apiClient.get('/api/psb-activations?limit=10000')
      ]);

      const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
      const activations = Array.isArray(activationsResponse.data) ? activationsResponse.data : [];

      const technicianPerformance = calculateTechnicianPerformance(users, orders, activations);
      setTechnicians(technicianPerformance);

    } catch (err) {
      console.error('Error fetching technician data:', err);
      setError('Failed to fetch technician data');
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicianData();
  }, []);

  return {
    technicians,
    loading,
    error,
    refetch: fetchTechnicianData
  };
};