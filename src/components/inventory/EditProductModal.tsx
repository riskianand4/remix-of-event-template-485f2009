import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Edit2, Package, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProductMetadata } from '@/hooks/useProductMetadata';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  code: string;
  sku: string;
  category: string;
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  location: string;
  supplier?: string;
  status: string;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSave?: (productId: string, updatedProduct: Partial<Product>) => void;
}

const EditProductModal = ({ isOpen, onClose, product, onSave }: EditProductModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sku: '',
    category: '',
    description: '',
    price: 0,
    minStock: 0,
    maxStock: 0,
    unit: '',
    location: '',
    supplier: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const { toast } = useToast();
  const { categories, units } = useProductMetadata();

  // Format name
  const formatName = (name: string): string => {
    return name.trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Filter based on search
  const filteredCategories = categories.filter(cat => 
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );
  
  const filteredUnits = units.filter(unit => 
    unit.toLowerCase().includes(unitSearch.toLowerCase())
  );

  const handleCategorySelect = (value: string) => {
    if (value === '__new__') {
      const newCategory = formatName(categorySearch);
      if (newCategory) {
        handleInputChange('category', newCategory);
      }
    } else {
      handleInputChange('category', value);
    }
    setCategoryOpen(false);
    setCategorySearch('');
  };

  const handleUnitSelect = (value: string) => {
    if (value === '__new__') {
      const newUnit = unitSearch.trim().toLowerCase();
      if (newUnit) {
        handleInputChange('unit', newUnit);
      }
    } else {
      handleInputChange('unit', value);
    }
    setUnitOpen(false);
    setUnitSearch('');
  };

  const locations = [
    'Telnet Banda Aceh',
    'Telnet Meulaboh',
  ];

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        code: product.code || '',
        sku: product.sku || '',
        category: product.category || '',
        description: product.description || '',
        price: product.price || 0,
        minStock: product.minStock || 0,
        maxStock: product.maxStock || 0,
        unit: product.unit || 'pcs',
        location: product.location || '',
        supplier: product.supplier || ''
      });
    }
  }, [product]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama produk wajib diisi';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Kode produk wajib diisi';
    }
    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU wajib diisi';
    }
    if (!formData.category) {
      newErrors.category = 'Kategori wajib dipilih';
    }
    if (formData.price < 0) {
      newErrors.price = 'Harga tidak boleh negatif';
    }
    if (formData.minStock < 0) {
      newErrors.minStock = 'Stok minimum tidak boleh negatif';
    }
    if (formData.maxStock < formData.minStock) {
      newErrors.maxStock = 'Stok maksimum harus lebih besar dari stok minimum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Mohon periksa kembali data yang diisi",
        variant: "destructive",
      });
      return;
    }

    // Call the onSave callback with updated data
    onSave?.(product.id, formData);
        onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            Edit Produk
          </DialogTitle>
          <DialogDescription>
            Ubah informasi produk yang dipilih
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Product Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4" />
                <span className="font-medium">Produk Saat Ini</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nama:</span>
                  <p className="font-medium">{product.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Stok:</span>
                  <p className="font-medium">{product.stock} {product.unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Masukkan nama produk"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Kode Produk *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Masukkan kode produk"
                className={errors.code ? 'border-destructive' : ''}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Masukkan SKU"
                className={errors.sku ? 'border-destructive' : ''}
              />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
            </div>

            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className={cn("w-full justify-between", errors.category ? 'border-destructive' : '')}
                  >
                    <span className="truncate">
                      {formData.category || "Pilih atau ketik kategori..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 z-[100]" align="start">
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
                            className="w-full justify-start text-sm"
                            onClick={() => handleCategorySelect('__new__')}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah "{formatName(categorySearch)}"
                          </Button>
                        </div>
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredCategories.map((category) => (
                        <CommandItem
                          key={category}
                          value={category}
                          onSelect={() => handleCategorySelect(category)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.category === category ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{category}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Masukkan deskripsi produk..."
              rows={3}
            />
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Harga</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">Stok Minimum</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
                placeholder="0"
                className={errors.minStock ? 'border-destructive' : ''}
              />
              {errors.minStock && <p className="text-xs text-destructive">{errors.minStock}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxStock">Stok Maksimum</Label>
              <Input
                id="maxStock"
                type="number"
                min="0"
                value={formData.maxStock}
                onChange={(e) => handleInputChange('maxStock', parseInt(e.target.value) || 0)}
                placeholder="0"
                className={errors.maxStock ? 'border-destructive' : ''}
              />
              {errors.maxStock && <p className="text-xs text-destructive">{errors.maxStock}</p>}
            </div>
          </div>

          {/* Unit and Location */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Satuan</Label>
              <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox"
                    aria-expanded={unitOpen}
                    className="w-full justify-between"
                  >
                    <span className="truncate">
                      {formData.unit || "Pilih atau ketik unit..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 z-[100]" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Cari atau ketik unit baru..." 
                      value={unitSearch}
                      onValueChange={setUnitSearch}
                    />
                    <CommandEmpty>
                      {unitSearch && (
                        <div className="p-2">
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-sm"
                            onClick={() => handleUnitSelect('__new__')}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah "{unitSearch.trim().toLowerCase()}"
                          </Button>
                        </div>
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredUnits.map((unit) => (
                        <CommandItem
                          key={unit}
                          value={unit}
                          onSelect={() => handleUnitSelect(unit)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.unit === unit ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{unit.toUpperCase()}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                placeholder="Nama supplier"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;