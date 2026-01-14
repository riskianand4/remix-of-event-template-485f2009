import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, UserActivity } from '@/types/users';
import { getRoleDisplayName, getRoleColorClass } from '@/services/roleMapper';
import { User as UserIcon, Mail, Phone, Building, Briefcase, Calendar, Activity, Shield, Clock, MapPin } from 'lucide-react';
interface UserDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  activities?: UserActivity[];
  isLoadingActivities?: boolean;
  onFetchActivities?: (userId: string) => void;
}
export const UserDetailDialog: React.FC<UserDetailDialogProps> = ({
  isOpen,
  onClose,
  user,
  activities = [],
  isLoadingActivities = false,
  onFetchActivities
}) => {
  const [activeTab, setActiveTab] = useState('details');
  useEffect(() => {
    if (isOpen && user && activeTab === 'activity' && onFetchActivities) {
      onFetchActivities(user.id);
    }
  }, [isOpen, user, activeTab, onFetchActivities]);
  if (!user) return null;
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      case 'suspended':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const formatPermissions = (permissions: any[]) => {
    if (!permissions || permissions.length === 0) {
      return 'No specific permissions';
    }
    return permissions.map(p => typeof p === 'string' ? p : p.action).join(', ');
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-w-[360px] md:max-w-2xl mx-0 rounded-md max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary" />
            <span>Detail User</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Badge className={`${getStatusColor(user.status)} ml-4 text-sm px-3 py-1`}>
              {user.status}
            </Badge>
          </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detail Info</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
                  <UserIcon className="w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                  Informasi Pribadi
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nama Lengkap</label>
                    <p className="text-sm font-semibold bg-background rounded px-3 py-2 border border-border">{user.name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                    <div className="flex items-center space-x-2 bg-background rounded px-3 py-2 border border-border">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{user.email}</span>
                    </div>
                  </div>
                  
                  {user.phone && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Telepon</label>
                      <div className="flex items-center space-x-2 bg-background rounded px-3 py-2 border border-border">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{user.phone}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Organization Information */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
                  <Building className="w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                  Informasi Organisasi
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Department</label>
                    <p className="text-sm font-medium bg-background rounded px-3 py-2 border border-border">
                      {user.department || 'Tidak ada'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Posisi</label>
                    <p className="text-sm font-medium bg-background rounded px-3 py-2 border border-border">
                      {user.position || 'Tidak ada'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</label>
                    <Badge className={`${getRoleColorClass(user.role)} w-fit px-3 py-1`}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center mb-4">
                <Clock className="w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                Timeline Aktivitas
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Bergabung</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</span>
                </div>
                
                {user.lastLogin && (
                  <div className="flex items-center justify-between py-2 border-t border-border">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Login Terakhir</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(user.lastLogin)}</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  User Permissions
                </CardTitle>
                <CardDescription>
                  Permissions dan hak akses yang dimiliki user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="font-medium">Role-based Access:</span>
                    <Badge className={`ml-2 ${getRoleColorClass(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </div>
                  
                  <div>
                    <span className="font-medium">Specific Permissions:</span>
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {formatPermissions(user.permissions)}
                      </p>
                    </div>
                  </div>

                  {/* Role Description */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Role Description:</h4>
                    <p className="text-sm text-muted-foreground">
                      {user.role === 'superadmin' && 'Full system access, can manage all users, settings, and data.'}
                      {user.role === 'user' && 'Standard user access to basic features and personal data.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  User Activity Log
                </CardTitle>
                <CardDescription>
                  Riwayat aktivitas dan aksi yang dilakukan user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActivities ? <div className="space-y-2">
                    {Array.from({
                  length: 3
                }).map((_, index) => <div key={index} className="h-12 bg-muted/50 rounded animate-pulse" />)}
                  </div> : activities.length > 0 ? <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map(activity => <TableRow key={activity.id}>
                          <TableCell className="text-sm">
                            {formatDate(activity.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{activity.action}</Badge>
                          </TableCell>
                          <TableCell>{activity.resource}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {activity.details}
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table> : <div className="text-center py-6">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Belum ada aktivitas yang tercatat</p>
                  </div>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Role: {getRoleDisplayName(user.role)}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            ID: {user.id}
          </Badge>
        </div>
        </div>
      </DialogContent>
    </Dialog>;
};