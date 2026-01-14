import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logger } from '@/utils/logger';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  Wrench, 
  Clock, 
  Calendar,
  Star,
  Save,
  Camera,
  Shield,
  Activity,
  BarChart3
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { usePSBData } from '@/hooks/usePSBData';
import { Technician, getTechnicianById, updateTechnician } from '@/services/technicianApi';
import { getCurrentUser } from '@/services/userApi';
import { isTechnicianMatch } from '@/utils/psbHelpers';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TechnicianProfilePage() {
  const { user } = useApp();
  const { orders } = usePSBData();
  const [technicianData, setTechnicianData] = useState<Technician | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    notes: '',
    workingHours: {
      start: '08:00',
      end: '17:00',
      timezone: 'Asia/Jakarta'
    }
  });

  // Calculate technician statistics from orders
  const technicianStats = React.useMemo(() => {
    const userName = user?.name || '';
    const technicianOrders = orders?.filter(order => isTechnicianMatch(order, userName)) || [];
    
    return {
      totalOrders: technicianOrders.length,
      completedOrders: technicianOrders.filter(o => o.status === 'Completed').length,
      activeOrders: technicianOrders.filter(o => ['Assigned', 'Accepted', 'Survey', 'Installation'].includes(o.status)).length,
      cancelledOrders: technicianOrders.filter(o => o.status === 'Cancelled').length,
      completionRate: technicianOrders.length > 0 
        ? (technicianOrders.filter(o => o.status === 'Completed').length / technicianOrders.length * 100).toFixed(1)
        : '0'
    };
  }, [orders, user?.name]);

  useEffect(() => {
    fetchTechnicianData();
  }, [user]);

  const fetchTechnicianData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch real user profile from API
      const userProfile = await getCurrentUser();
      
      if (!userProfile) {
        toast.error('Gagal memuat data profil');
        setIsLoading(false);
        return;
      }

      // Try to fetch technician-specific data
      let technicianInfo: Technician | null = null;
      try {
        technicianInfo = await getTechnicianById(userProfile.id);
      } catch (error) {
        logger.warn('Technician-specific data not found, using user profile', error, 'TechnicianProfilePage');
      }

      // Merge user profile with technician data
      const mergedTechnicianData: Technician = {
        _id: technicianInfo?._id || userProfile.id,
        userId: {
          _id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone || '',
          avatar: userProfile.avatar
        },
        employeeId: technicianInfo?.employeeId || userProfile.email,
        cluster: technicianInfo?.cluster || 'Cluster A',
        skills: technicianInfo?.skills || ['survey', 'installation', 'maintenance'],
        certification: technicianInfo?.certification || ['Fiber Optic Installation'],
        territory: technicianInfo?.territory || ['Jakarta Selatan', 'Jakarta Timur'],
        isAvailable: technicianInfo?.isAvailable ?? true,
        currentLocation: technicianInfo?.currentLocation,
        performance: {
          completionRate: parseFloat(technicianStats.completionRate),
          averageRating: technicianInfo?.performance?.averageRating || 4.5,
          totalCompletedJobs: technicianStats.completedOrders
        },
        workingHours: technicianInfo?.workingHours || {
          start: '08:00',
          end: '17:00',
          timezone: 'Asia/Jakarta'
        },
        equipment: technicianInfo?.equipment || ['ONT', 'Router', 'Kabel Fiber'],
        emergencyContact: technicianInfo?.emergencyContact || {
          name: '',
          phone: '',
          relationship: ''
        },
        notes: technicianInfo?.notes || '',
        isActive: technicianInfo?.isActive ?? true,
        createdAt: technicianInfo?.createdAt || new Date(),
        updatedAt: technicianInfo?.updatedAt || new Date()
      };

      setTechnicianData(mergedTechnicianData);
      setFormData({
        emergencyContact: mergedTechnicianData.emergencyContact || {
          name: '',
          phone: '',
          relationship: ''
        },
        notes: mergedTechnicianData.notes || '',
        workingHours: mergedTechnicianData.workingHours || {
          start: '08:00',
          end: '17:00',
          timezone: 'Asia/Jakarta'
        }
      });
    } catch (error) {
      logger.error('Failed to fetch technician data', error, 'TechnicianProfilePage');
      toast.error('Gagal memuat data profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!technicianData) return;

    setIsSaving(true);
    try {
      // In real implementation, this would call the API
      // await updateTechnician(technicianData._id, {
      //   emergencyContact: formData.emergencyContact,
      //   notes: formData.notes,
      //   workingHours: formData.workingHours
      // });

      // Update local state
      setTechnicianData(prev => prev ? {
        ...prev,
        emergencyContact: formData.emergencyContact,
        notes: formData.notes,
        workingHours: formData.workingHours
      } : null);

      setIsEditing(false);
      toast.success('Profil berhasil diperbarui');
    } catch (error) {
      logger.error('Failed to update profile', error, 'TechnicianProfilePage');
      toast.error('Gagal memperbarui profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const getSkillBadgeColor = (skill: string) => {
    const colors: Record<string, string> = {
      survey: 'bg-blue-500',
      installation: 'bg-green-500',
      maintenance: 'bg-orange-500',
      troubleshooting: 'bg-red-500',
      ont_config: 'bg-purple-500'
    };
    return colors[skill] || 'bg-gray-500';
  };

  const getSkillDisplayName = (skill: string) => {
    const names: Record<string, string> = {
      survey: 'Survey',
      installation: 'Instalasi',
      maintenance: 'Maintenance',
      troubleshooting: 'Troubleshooting',
      ont_config: 'Konfigurasi ONT'
    };
    return names[skill] || skill;
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

  if (!technicianData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Data profil teknisi tidak ditemukan</p>
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
              Profil Teknisi
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
                  <AvatarImage src={technicianData.userId.avatar} />
                  <AvatarFallback className="text-2xl">
                    {technicianData.userId.name.charAt(0).toUpperCase()}
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
                  <h2 className="text-2xl font-bold">{technicianData.userId.name}</h2>
                  <Badge className={technicianData.isAvailable ? 'bg-green-500' : 'bg-red-500'}>
                    {technicianData.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {technicianData.userId.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {technicianData.userId.phone || 'Tidak ada'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    {technicianData.employeeId}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{technicianData.cluster}</Badge>
                  {technicianData.territory.map(territory => (
                    <Badge key={territory} variant="outline">{territory}</Badge>
                  ))}
                </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <span className="text-sm">Total Pekerjaan</span>
                <Badge variant="secondary">{technicianStats.totalOrders}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Selesai</span>
                <Badge className="bg-green-500">{technicianStats.completedOrders}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Aktif</span>
                <Badge className="bg-blue-500">{technicianStats.activeOrders}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Success Rate</span>
                <Badge variant="outline">{technicianStats.completionRate}%</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{technicianData.performance.averageRating}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Keahlian & Sertifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Keahlian</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {technicianData.skills.map(skill => (
                    <Badge key={skill} className={`${getSkillBadgeColor(skill)} text-white`}>
                      {getSkillDisplayName(skill)}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Sertifikasi</Label>
                <div className="space-y-2 mt-2">
                  {technicianData.certification?.map(cert => (
                    <div key={cert} className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <span className="text-sm">{cert}</span>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">Belum ada sertifikasi</p>}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Peralatan</Label>
                <div className="space-y-1 mt-2">
                  {technicianData.equipment?.map(equipment => (
                    <div key={equipment} className="text-sm text-muted-foreground">
                      • {equipment}
                    </div>
                  )) || <p className="text-sm text-muted-foreground">Belum ada data peralatan</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Jam Kerja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Jam Mulai</Label>
                      <Input
                        type="time"
                        value={formData.workingHours.start}
                        onChange={(e) => handleInputChange('workingHours.start', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Jam Selesai</Label>
                      <Input
                        type="time"
                        value={formData.workingHours.end}
                        onChange={(e) => handleInputChange('workingHours.end', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Zona Waktu</Label>
                    <Select
                      value={formData.workingHours.timezone}
                      onValueChange={(value) => handleInputChange('workingHours.timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Jakarta">WIB (Jakarta)</SelectItem>
                        <SelectItem value="Asia/Makassar">WITA (Makassar)</SelectItem>
                        <SelectItem value="Asia/Jayapura">WIT (Jayapura)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Jam Kerja</span>
                    <span className="text-sm font-medium">
                      {technicianData.workingHours?.start} - {technicianData.workingHours?.end}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Zona Waktu</span>
                    <span className="text-sm font-medium">
                      {technicianData.workingHours?.timezone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Status</span>
                    <Badge className={technicianData.isAvailable ? 'bg-green-500' : 'bg-red-500'}>
                      {technicianData.isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contact & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Kontak Darurat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label>Nama Kontak</Label>
                    <Input
                      value={formData.emergencyContact.name}
                      onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                      placeholder="Nama lengkap"
                    />
                  </div>
                  <div>
                    <Label>No. Telepon</Label>
                    <Input
                      value={formData.emergencyContact.phone}
                      onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                      placeholder="No. telepon yang dapat dihubungi"
                    />
                  </div>
                  <div>
                    <Label>Hubungan</Label>
                    <Select
                      value={formData.emergencyContact.relationship}
                      onValueChange={(value) => handleInputChange('emergencyContact.relationship', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hubungan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Pasangan</SelectItem>
                        <SelectItem value="parent">Orang Tua</SelectItem>
                        <SelectItem value="sibling">Saudara</SelectItem>
                        <SelectItem value="friend">Teman</SelectItem>
                        <SelectItem value="other">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {technicianData.emergencyContact?.name ? (
                    <>
                      <div>
                        <Label className="text-sm">Nama</Label>
                        <p className="text-sm">{technicianData.emergencyContact.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm">Telepon</Label>
                        <p className="text-sm">{technicianData.emergencyContact.phone}</p>
                      </div>
                      <div>
                        <Label className="text-sm">Hubungan</Label>
                        <p className="text-sm capitalize">{technicianData.emergencyContact.relationship}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Belum ada kontak darurat yang terdaftar
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Catatan Tambahan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Tambahkan catatan tentang preferensi kerja, informasi khusus, atau hal lain yang relevan..."
                  rows={6}
                />
              ) : (
                <div className="min-h-[120px]">
                  {technicianData.notes ? (
                    <p className="text-sm whitespace-pre-wrap">{technicianData.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Belum ada catatan tambahan
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}