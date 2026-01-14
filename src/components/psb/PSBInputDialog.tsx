import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Save, RefreshCw, Plus, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { psbApi } from '@/services/psbApi';
import { CreatePSBOrderRequest } from '@/types/psb';
import { getTechnicians } from '@/services/interruptionApi';
import { toast } from 'sonner';
const STATUS_OPTIONS = [{
  value: 'Pending',
  label: 'Pending'
}, {
  value: 'In Progress',
  label: 'In Progress'
}, {
  value: 'Completed',
  label: 'Completed'
}, {
  value: 'Cancelled',
  label: 'Cancelled'
}];
const PACKAGE_OPTIONS = [
  'TelnetHome 20 Mbps', 
  'TelnetHome 30 Mbps', 
  'TelnetHome 100 Mbps',
  'Lainnya (Input Manual)'
];
interface PSBInputDialogProps {
  onOrderCreated?: () => void;
}
export const PSBInputDialog: React.FC<PSBInputDialogProps> = ({
  onOrderCreated
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePSBOrderRequest>({
    cluster: '',
    sto: '',
    orderNo: '',
    customerName: '',
    customerPhone: '',
    address: '',
    package: '',
    status: 'Pending',
    technician: '',
    notes: ''
  });
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [customPackage, setCustomPackage] = useState('');
  const [showCustomPackageInput, setShowCustomPackageInput] = useState(false);
  const [technicians, setTechnicians] = useState<Array<{ _id: string; name: string }>>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  
  // Modal states
  const [modalState, setModalState] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    title: string;
    message: string;
  }>({
    type: null,
    title: '',
    message: ''
  });

  // Load technicians on mount
  useEffect(() => {
    if (open) {
      loadTechnicians();
    }
  }, [open]);

  const loadTechnicians = async () => {
    try {
      setLoadingTechnicians(true);
      const techList = await getTechnicians();

      const formatted = techList.map((t: any) => ({
        _id: t._id || t.id,
        name: t.name,
      }));

      setTechnicians(formatted);
    } catch (error) {
      toast.error("Gagal memuat daftar teknisi");
    } finally {
      setLoadingTechnicians(false);
    }
  };
  const handleInputChange = (field: keyof CreatePSBOrderRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePackageChange = (value: string) => {
    if (value === 'Lainnya (Input Manual)') {
      setShowCustomPackageInput(true);
      setFormData(prev => ({ ...prev, package: '' }));
    } else {
      setShowCustomPackageInput(false);
      setCustomPackage('');
      setFormData(prev => ({ ...prev, package: value }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use custom package if input manual is active
    const finalPackage = showCustomPackageInput ? customPackage : formData.package;
    
    if (!formData.cluster || !formData.sto || !formData.orderNo || !formData.customerName || !formData.customerPhone || !formData.address || !finalPackage) {
      setModalState({
        type: 'warning',
        title: 'Peringatan',
        message: 'Mohon lengkapi semua field yang wajib diisi'
      });
      return;
    }
    try {
      setLoading(true);
      const submitData = {
        ...formData,
        package: finalPackage
      };
      const response = await psbApi.createOrder(submitData);
      if (response.success) {
        setModalState({
          type: 'success',
          title: 'Berhasil',
          message: 'Data PSB berhasil disimpan!'
        });
        handleReset();
        setOpen(false);
        onOrderCreated?.();
      }
    } catch (error: any) {
      // Handle specific error cases
      if (error.status === 409 || error.message?.includes('409')) {
        setModalState({
          type: 'error',
          title: 'Error',
          message: 'Nomor order sudah ada! Silakan gunakan nomor order yang berbeda.'
        });
      } else if (error.status === 400) {
        setModalState({
          type: 'error',
          title: 'Error',
          message: 'Data tidak valid. Periksa kembali form Anda.'
        });
      } else {
        setModalState({
          type: 'error',
          title: 'Error',
          message: 'Gagal menyimpan data PSB. Silakan coba lagi.'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleReset = () => {
    setFormData({
      cluster: '',
      sto: '',
      orderNo: '',
      customerName: '',
      customerPhone: '',
      address: '',
      package: '',
      status: 'Pending',
      technician: '',
      notes: ''
    });
    setDate(new Date());
    setCustomPackage('');
    setShowCustomPackageInput(false);
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
          <Plus className="h-5 w-5 mr-2" />
          Tambah Data PSB
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md max-w-[360px] md:max-w-2xl sm:max-w-4xl  mx-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Input Data PSB Baru</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Tanggal <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", {
                    locale: id
                  }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={date => date && setDate(date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Cluster */}
            <div className="space-y-2">
              <Label htmlFor="cluster" className="text-sm font-medium">
                Cluster <span className="text-destructive">*</span>
              </Label>
              <Input id="cluster" value={formData.cluster} onChange={e => handleInputChange('cluster', e.target.value)} placeholder="Masukkan nama cluster" className="h-10" required />
            </div>

            {/* STO */}
            <div className="space-y-2">
              <Label htmlFor="sto" className="text-sm font-medium">
                STO <span className="text-destructive">*</span>
              </Label>
              <Input id="sto" value={formData.sto} onChange={e => handleInputChange('sto', e.target.value)} placeholder="Masukkan nama STO" className="h-10" required />
            </div>

            {/* Order Number */}
            <div className="space-y-2">
              <Label htmlFor="orderNo" className="text-sm font-medium">
                Nomor Order <span className="text-destructive">*</span>
              </Label>
              <Input id="orderNo" value={formData.orderNo} onChange={e => handleInputChange('orderNo', e.target.value)} placeholder="Masukkan nomor order" className="h-10" required />
            </div>

            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-sm font-medium">
                Nama Pelanggan <span className="text-destructive">*</span>
              </Label>
              <Input id="customerName" value={formData.customerName} onChange={e => handleInputChange('customerName', e.target.value)} placeholder="Masukkan nama pelanggan" className="h-10" required />
            </div>

            {/* Customer Phone */}
            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="text-sm font-medium">
                Nomor Telepon <span className="text-destructive">*</span>
              </Label>
              <Input id="customerPhone" type="tel" value={formData.customerPhone} onChange={e => handleInputChange('customerPhone', e.target.value)} placeholder="Masukkan nomor telepon" className="h-10" required />
            </div>

            {/* Package */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Paket <span className="text-destructive">*</span>
              </Label>
              <Select value={showCustomPackageInput ? 'Lainnya (Input Manual)' : formData.package} onValueChange={handlePackageChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih paket" />
                </SelectTrigger>
                <SelectContent>
                  {PACKAGE_OPTIONS.map(pkg => <SelectItem key={pkg} value={pkg}>
                      {pkg}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              {showCustomPackageInput && (
                <Input 
                  value={customPackage}
                  onChange={e => setCustomPackage(e.target.value)}
                  placeholder="Ketik nama paket manual"
                  className="h-10 mt-2"
                  required
                />
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={formData.status} onValueChange={value => handleInputChange('status', value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Technician */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Teknisi</Label>
              <Select 
                value={formData.technician || undefined} 
                onValueChange={value => {
                  if (value === 'none') {
                    handleInputChange('technician', '');
                  } else {
                    handleInputChange('technician', value);
                  }
                }} 
                disabled={loadingTechnicians}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={loadingTechnicians ? "Memuat teknisi..." : "Pilih teknisi (opsional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada teknisi</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech._id} value={tech._id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Alamat <span className="text-destructive">*</span>
            </Label>
            <Textarea id="address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="Masukkan alamat lengkap pelanggan" rows={3} className="resize-none" required />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Catatan</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Catatan tambahan (opsional)" rows={3} className="resize-none" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </> : <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Data
                </>}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </form>

        {/* Modal dialogs */}
        <AlertDialog open={modalState.type !== null} onOpenChange={() => setModalState({ type: null, title: '', message: '' })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {modalState.type === 'success' && <CheckCircle className="w-5 h-5 text-success" />}
                {modalState.type === 'error' && <AlertCircle className="w-5 h-5 text-destructive" />}
                {modalState.type === 'warning' && <AlertTriangle className="w-5 h-5 text-warning" />}
                {modalState.title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {modalState.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setModalState({ type: null, title: '', message: '' })}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>;
};