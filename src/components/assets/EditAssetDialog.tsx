import React, { useState, useEffect, useMemo } from 'react';
import { Asset, getLocationString } from '@/types/assets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Package, Save, X, ChevronsUpDown, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAssetMetadata } from '@/hooks/useAssetMetadata';
import { WAREHOUSE_LOCATIONS } from '@/data/constants';

interface EditAssetDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (assetId: string, updates: Partial<Asset>) => Promise<void>;
  loading?: boolean;
}

export const EditAssetDialog: React.FC<EditAssetDialogProps> = ({
  asset,
  open,
  onOpenChange,
  onSave,
  loading = false,
}) => {
  const { categories, refresh: refreshCategories } = useAssetMetadata();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    description: '',
    condition: 'good' as Asset['condition'],
    status: 'available' as Asset['status'],
    location: '',
    purchasePrice: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCategoryName = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories;
    return categories.filter((cat) =>
      cat.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const handleCategorySelect = (value: string) => {
    if (value === "__new__") {
      const newCategory = formatCategoryName(categorySearch.trim());
      handleInputChange('category', newCategory);
      refreshCategories();
    } else {
      handleInputChange('category', value);
    }
    setCategoryOpen(false);
    setCategorySearch("");
  };

  // Reset form when asset changes
  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name,
        category: asset.category,
        quantity: asset.quantity || 1,
        description: asset.description || '',
        condition: asset.condition,
        status: asset.status,
        location: getLocationString(asset.location),
        purchasePrice: asset.purchasePrice,
      });
      setErrors({});
    }
  }, [asset]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama asset harus diisi';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Kategori harus diisi';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Lokasi harus diisi';
    }

    if (formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Harga pembelian harus lebih dari 0';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Jumlah harus lebih dari 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!asset || !validateForm()) return;

    try {
      await onSave(asset.id, {
        ...formData,
        updatedAt: new Date(),
      });
      
      toast.success('Asset berhasil diperbarui');
      onOpenChange(false);
    } catch (error) {
      toast.error('Gagal memperbarui asset');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Edit Asset: {asset.code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nama Asset <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Masukkan nama asset"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Kategori <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryOpen}
                        className={cn(
                          "w-full justify-between",
                          !formData.category && "text-muted-foreground",
                          errors.category && "border-destructive"
                        )}
                      >
                        {formData.category || "Pilih kategori..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 z-50" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Cari atau ketik kategori baru..."
                          value={categorySearch}
                          onValueChange={setCategorySearch}
                        />
                        <CommandEmpty>
                          {categorySearch && (
                            <div className="p-2">
                              <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => handleCategorySelect("__new__")}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah "{formatCategoryName(categorySearch)}"
                              </Button>
                            </div>
                          )}
                        </CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                          {filteredCategories.map((category) => (
                            <CommandItem
                              key={category}
                              value={category}
                              onSelect={() => handleCategorySelect(category)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.category === category
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {category}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Jumlah <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                    placeholder="1"
                    min="1"
                    className={errors.quantity ? 'border-destructive' : ''}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-destructive">{errors.quantity}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Masukkan deskripsi asset (opsional)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status & Condition */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Status & Kondisi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Asset['status']) => 
                      handleInputChange('status', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Tersedia</SelectItem>
                      <SelectItem value="borrowed">Dipinjam</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="damaged">Rusak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Kondisi</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value: Asset['condition']) => 
                      handleInputChange('condition', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Sangat Baik</SelectItem>
                      <SelectItem value="good">Baik</SelectItem>
                      <SelectItem value="fair">Cukup</SelectItem>
                      <SelectItem value="poor">Buruk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Price */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Lokasi & Harga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">
                    Lokasi <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => handleInputChange('location', value)}
                  >
                    <SelectTrigger className={errors.location ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Pilih lokasi gudang" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-md z-50">
                      {WAREHOUSE_LOCATIONS.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">
                    Harga Pembelian <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', Number(e.target.value))}
                    placeholder="0"
                    className={errors.purchasePrice ? 'border-destructive' : ''}
                  />
                  {errors.purchasePrice && (
                    <p className="text-sm text-destructive">{errors.purchasePrice}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Batal
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};