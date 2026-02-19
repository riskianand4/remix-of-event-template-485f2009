import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Phone, Package, AlertCircle, RefreshCw, CheckCircle2, Zap } from 'lucide-react';
import { psbApi } from '@/services/psbApi';
import { PSBOrder } from '@/types/psb';
import { format, isAfter, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentPSBOrdersProps {
  refreshTrigger?: number;
}

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  Completed: {
    label: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  'In Progress': {
    label: 'In Progress',
    className: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  Pending: {
    label: 'Pending',
    className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  Cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
};

export const RecentPSBOrders: React.FC<RecentPSBOrdersProps> = ({ refreshTrigger }) => {
  const [recentOrders, setRecentOrders] = useState<PSBOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const yesterday = subDays(new Date(), 1);
      const response = await psbApi.getOrders({
        dateFrom: format(yesterday, 'yyyy-MM-dd'),
        dateTo: format(new Date(), 'yyyy-MM-dd'),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 10,
      });
      if (response.success) {
        const filtered = response.data.filter((order) => {
          const orderDate = new Date(order.createdAt || order.date);
          return isAfter(orderDate, yesterday);
        });
        setRecentOrders(filtered);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setError('Gagal memuat data terbaru');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, [refreshTrigger]);

  const formatDate = (dateString: string) =>
    format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id });

  const getStatus = (status: string) =>
    statusConfig[status] ?? {
      label: status,
      className: 'bg-muted text-muted-foreground border-border',
      dot: 'bg-muted-foreground',
    };

  /* ─── Loading ─────────────────────────────────────────── */
  if (loading) {
    return (
      <Card className="w-full border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            Data Terbaru (24 Jam)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border/50 p-4">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  /* ─── Error ───────────────────────────────────────────── */
  if (error) {
    return (
      <Card className="w-full border-destructive/30 shadow-sm">
        <CardContent className="py-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ─── Empty ───────────────────────────────────────────── */
  if (recentOrders.length === 0) {
    return (
      <Card className="w-full border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            Data Terbaru (24 Jam)
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-medium text-foreground/70">Belum ada data terbaru</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Data yang diinput dalam 24 jam terakhir akan muncul di sini
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ─── Main ────────────────────────────────────────────── */
  return (
    <Card className="w-full border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            Data Terbaru (24 Jam)
          </CardTitle>
          <Badge
            variant="secondary"
            className="rounded-full px-3 text-xs font-semibold"
          >
            {recentOrders.length} order
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b border-border/50 bg-muted/30">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Lokasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Paket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <AnimatePresence>
                {recentOrders.map((order, i) => {
                  const s = getStatus(order.status);
                  return (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-xs text-foreground">
                          #{order.orderNo}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(order.createdAt || order.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-sm">{order.customerName}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Phone className="h-2.5 w-2.5 shrink-0" />
                          {order.customerPhone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          {order.cluster}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 pl-4">
                          {order.sto}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground max-w-[160px]">
                          <Package className="h-3 w-3 shrink-0" />
                          <span className="truncate" title={order.package}>
                            {order.package}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.className}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="lg:hidden divide-y divide-border/40">
          {recentOrders.map((order, i) => {
            const s = getStatus(order.status);
            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">
                      #{order.orderNo}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${s.className}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{order.customerName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {order.cluster}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-2.5 w-2.5" />
                      <span className="truncate max-w-[100px]">{order.package}</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(order.createdAt || order.date)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
