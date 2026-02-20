import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { logger } from '@/utils/logger';
import { motion } from 'framer-motion';
import { 
  User, Phone, Mail, Save, Camera, Shield, Calendar, Clock, CheckCircle
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getCurrentUser, updateCurrentUser } from '@/services/userApi';
import { toast } from 'sonner';

export default function InterruptionProfilePage() {
  const { user: appUser } = useApp();
  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', department: '', position: ''
  });

  useEffect(() => { fetchUserData(); }, [appUser]);

  const fetchUserData = async () => {
    if (!appUser?.id) return;
    setIsLoading(true);
    try {
      const userProfile = await getCurrentUser();
      if (!userProfile) { toast.error('Gagal memuat data profil'); return; }
      setUserData(userProfile);
      setFormData({
        name: userProfile.name || '', email: userProfile.email || '',
        phone: userProfile.phone || '', department: userProfile.department || '',
        position: userProfile.position || ''
      });
    } catch (error) {
      logger.error('Failed to fetch user data', error, 'InterruptionProfilePage');
      toast.error('Gagal memuat data profil');
    } finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!userData) return;
    setIsSaving(true);
    try {
      const updatedUser = await updateCurrentUser({
        name: formData.name, phone: formData.phone,
        department: formData.department, position: formData.position
      });
      if (updatedUser) {
        setUserData(updatedUser); setIsEditing(false);
        toast.success('Profil berhasil diperbarui');
      } else { toast.error('Gagal memperbarui profil'); }
    } catch (error) {
      logger.error('Failed to update profile', error, 'InterruptionProfilePage');
      toast.error('Gagal memperbarui profil');
    } finally { setIsSaving(false); }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-20">
        <User className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">Data profil tidak ditemukan</p>
      </div>
    );
  }

  const ProfileField = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || 'Belum diisi'}</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Profile Hero Card */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-border/50">
          <div className="h-20 bg-gradient-to-r from-destructive/20 via-destructive/10 to-transparent" />
          <CardContent className="relative px-6 pb-6 -mt-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-background shadow-md">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback className="text-xl font-semibold bg-destructive/10 text-destructive">
                    {userData.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button size="icon" variant="outline" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full" disabled>
                  <Camera className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex-1 pt-2 sm:pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-semibold">{userData.name}</h2>
                  <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-xs">
                    {userData.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{userData.email}</span>
                  {userData.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{userData.phone}</span>}
                </div>
              </div>
              <div className="sm:ml-auto">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      <Save className="w-3.5 h-3.5 mr-1" />
                      {isSaving ? 'Saving...' : 'Simpan'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                      Batal
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    Edit Profil
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-destructive/60 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-destructive" />
                Informasi Profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  {[
                    { label: 'Nama Lengkap', field: 'name', disabled: false },
                    { label: 'Email', field: 'email', disabled: true },
                    { label: 'Nomor Telepon', field: 'phone', disabled: false },
                    { label: 'Departemen', field: 'department', disabled: false },
                    { label: 'Posisi', field: 'position', disabled: false },
                  ].map(({ label, field, disabled }) => (
                    <div key={field} className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
                      <Input
                        value={(formData as any)[field]}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        disabled={disabled}
                        className={disabled ? 'bg-muted/50' : ''}
                        placeholder={label}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <ProfileField label="Nama" value={userData.name} />
                  <ProfileField label="Email" value={userData.email} />
                  <ProfileField label="Telepon" value={userData.phone} />
                  <ProfileField label="Departemen" value={userData.department} />
                  <ProfileField label="Posisi" value={userData.position} />
                  <ProfileField label="Role" value={userData.role === 'superadmin' ? 'Super Administrator' : 'Administrator'} />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-l-4 border-l-primary/60 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Informasi Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="flex items-center justify-between py-3 border-b border-border/30">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Status Akun</span>
                <Badge variant="outline" className={
                  userData.status === 'active'
                    ? 'border-green-500/30 bg-green-500/10 text-green-600'
                    : 'border-red-500/30 bg-red-500/10 text-red-600'
                }>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${userData.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                  {userData.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/30">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Email Verifikasi</span>
                <Badge variant="outline" className={
                  userData.emailVerified
                    ? 'border-green-500/30 bg-green-500/10 text-green-600'
                    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600'
                }>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {userData.emailVerified ? 'Terverifikasi' : 'Belum'}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/30">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Bergabung</span>
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {new Date(userData.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>
              {userData.lastLogin && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Login Terakhir</span>
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {new Date(userData.lastLogin).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
