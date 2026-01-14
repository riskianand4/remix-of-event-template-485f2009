import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Phone, User, Package, AlertCircle } from 'lucide-react';
import { psbApi } from '@/services/psbApi';
import { PSBOrder } from '@/types/psb';
import { format, isAfter, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
interface RecentPSBOrdersProps {
  refreshTrigger?: number;
}
export const RecentPSBOrders: React.FC<RecentPSBOrdersProps> = ({
  refreshTrigger
}) => {
  const [recentOrders, setRecentOrders] = useState<PSBOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get orders from the last 24 hours
      const yesterday = subDays(new Date(), 1);
      const response = await psbApi.getOrders({
        dateFrom: format(yesterday, 'yyyy-MM-dd'),
        dateTo: format(new Date(), 'yyyy-MM-dd'),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 10
      });
      if (response.success) {
        // Filter orders created in the last 24 hours
        const filtered = response.data.filter(order => {
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const formatDate = (dateString: string) => {
    // Use your original format function with date-fns
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', {
      locale: id
    });
  };


  if (loading) {
    return <Card className="w-full">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="flex flex-col xs:flex-row xs:items-center gap-2 text-sm sm:text-base lg:text-lg">
            <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-primary shrink-0" />
            <span>Data Terbaru (24 Jam)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          {/* Mobile Loading */}
          <div className="block xl:hidden space-y-2 sm:space-y-3">
            {[1, 2, 3].map(i => 
              <div key={i} className="p-2 sm:p-3 border rounded-lg space-y-2">
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <Skeleton className="h-3 w-16 sm:h-4 sm:w-20" />
                    <Skeleton className="h-2 w-20 sm:h-3 sm:w-24" />
                  </div>
                  <Skeleton className="h-4 w-12 sm:h-5 sm:w-14" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-2 w-full sm:h-3" />
                  <Skeleton className="h-2 w-3/4 sm:h-3" />
                </div>
              </div>
            )}
          </div>
          <div className="hidden xl:block">
            <div className="overflow-hidden border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium">Order</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Customer</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Location</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Package</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map(i => 
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-3 py-2"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-3 py-2"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-3 py-2"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-3 py-2"><Skeleton className="h-4 w-14" /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className="w-full">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="flex flex-col xs:flex-row xs:items-center gap-2 text-sm sm:text-base lg:text-lg">
            <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-primary shrink-0" />
            <span>Data Terbaru (24 Jam)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 text-muted-foreground text-xs sm:text-sm p-2 sm:p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-destructive" />
            <span className="text-center xs:text-left">{error}</span>
          </div>
        </CardContent>
      </Card>;
  }


  return <Card className="w-full">
      <CardHeader className="p-3 sm:p-4 lg:p-6">
        <CardTitle className="flex flex-col xs:flex-row xs:items-center gap-2 text-sm sm:text-base lg:text-lg">
          <div className="flex items-center gap-2 justify-center xs:justify-start">
            <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-primary shrink-0" />
            <span>Data Terbaru (24 Jam)</span>
            {recentOrders.length > 0 && 
              <Badge variant="secondary" className="text-xs">
                {recentOrders.length} item
              </Badge>
            }
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
        {recentOrders.length === 0 ? 
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-sm sm:text-base font-medium mb-2">Belum ada data terbaru</p>
            <p className="text-xs sm:text-sm px-4">
              Data yang diinput dalam 24 jam terakhir akan muncul di sini
            </p>
          </div> 
        : 
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="overflow-hidden border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Order</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Customer</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Location</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Package</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background">
                    {recentOrders.map((order, index) => 
                      <tr key={order._id} className={`border-t hover:bg-muted/20 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/5'}`}>
                        <td className="px-3 py-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-xs truncate">#{order.orderNo}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(order.createdAt || order.date)}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="min-w-0 max-w-[180px]">
                            <div className="font-medium text-xs truncate">{order.customerName}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-2 w-2 shrink-0" />
                              <span className="truncate">{order.customerPhone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs min-w-0 max-w-[120px]">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-2 w-2 text-muted-foreground shrink-0" />
                              <span className="truncate">{order.cluster}</span>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{order.sto}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 text-xs min-w-0 max-w-[150px]">
                            <Package className="h-2 w-2 text-muted-foreground shrink-0" />
                            <span className="truncate" title={order.package}>
                              {order.package}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge className={`${getStatusColor(order.status)} text-xs`}>
                            {order.status}
                          </Badge>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </CardContent>
    </Card>;
};