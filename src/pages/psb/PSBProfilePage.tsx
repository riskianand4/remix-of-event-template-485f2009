import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { logger } from '@/utils/logger';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  Save,
  Camera,
  Shield,
  Activity,
  BarChart3,
  Package
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getCurrentUser, updateCurrentUser } from '@/services/userApi';
import { usePSBData } from '@/hooks/usePSBData';
import { toast } from 'sonner';

export default function PSBProfilePage() {
  const { user: appUser } = useApp();
  const { orders } = usePSBData();
  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: ''
  });

  // Calculate CS statistics from orders
  const csStats = React.useMemo(() => {
    const totalOrders = orders?.length || 0;
    const completedOrders = orders?.filter(o => o.status === 'Completed').length || 0;
    const pendingOrders = orders?.filter(o => ['Pending', 'Assigned'].includes(o.status)).length || 0;
    const activeOrders = orders?.filter(o => ['Accepted', 'Survey', 'Installation'].includes(o.status)).length || 0;
    
    return {
      totalOrders,
      completedOrders,
      pendingOrders,
      activeOrders,
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : '0'
    };
  }, [orders]);

  useEffect(() => {
    fetchUserData();
  }, [appUser]);

  const fetchUserData = async () => {
    if (!appUser?.id) return;
    
    setIsLoading(true);
    try {
      const userProfile = await getCurrentUser();
      
      if (!userProfile) {
        toast.error('Gagal memuat data profil');
        return;
      }

      setUserData(userProfile);
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        department: userProfile.department || '',
        position: userProfile.position || ''
      });
    } catch (error) {
      logger.error('Failed to fetch user data', error, 'PSBProfilePage');
      toast.error('Gagal memuat data profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userData) return;

    setIsSaving(true);
    try {
      const updatedUser = await updateCurrentUser({
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        position: formData.position
      });

      if (updatedUser) {
        setUserData(updatedUser);
        setIsEditing(false);
        toast.success('Profil berhasil diperbarui');
      } else {
        toast.error('Gagal memperbarui profil');
      }
    } catch (error) {
      logger.error('Failed to update profile', error, 'PSBProfilePage');
      toast.error('Gagal memperbarui profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Data profil tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Profil Customer Service
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola informasi profil dan pengaturan akun Anda
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </Badge>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback className="text-2xl">
                    {userData.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                  disabled
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{userData.name}</h2>
                  <Badge className="bg-blue-500">
                    Customer Service
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {userData.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {userData.phone || 'Tidak ada'}
                  </span>
                  {userData.department && (
                    <span className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      {userData.department}
                    </span>
                  )}
                </div>

                {userData.position && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{userData.position}</Badge>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      disabled={isSaving}
                    >
                      Batal
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                  >
                    Edit Profil
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Statistik Kinerja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Order</span>
                <Badge variant="secondary">{csStats.totalOrders}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Selesai</span>
                <Badge className="bg-green-500">{csStats.completedOrders}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending</span>
                <Badge className="bg-yellow-500">{csStats.pendingOrders}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Aktif</span>
                <Badge className="bg-blue-500">{csStats.activeOrders}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm">Completion Rate</span>
                <Badge variant="outline">{csStats.completionRate}%</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informasi Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label>Nama Lengkap</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nama lengkap"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Nomor Telepon</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Nomor telepon"
                    />
                  </div>
                  <div>
                    <Label>Departemen</Label>
                    <Input
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Departemen"
                    />
                  </div>
                  <div>
                    <Label>Posisi</Label>
                    <Input
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="Posisi"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nama</span>
                    <span className="text-sm font-medium">{userData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{userData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Telepon</span>
                    <span className="text-sm font-medium">{userData.phone || 'Belum diisi'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Departemen</span>
                    <span className="text-sm font-medium">{userData.department || 'Belum diisi'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Posisi</span>
                    <span className="text-sm font-medium">{userData.position || 'Belum diisi'}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
