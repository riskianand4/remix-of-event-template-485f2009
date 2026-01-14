import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, X, Upload, Image as ImageIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useEnhancedProductManager } from '@/hooks/useEnhancedProductManager';
import { useProductMetadata } from '@/hooks/useProductMetadata';
import { WAREHOUSE_LOCATIONS } from '@/data/constants';
import { cn } from '@/lib/utils';
const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  sku: z.string().min(1, 'SKU wajib diisi'),
  productCode: z.string().min(1, 'Kode produk wajib diisi'),
  category: z.string().min(1, 'Kategori wajib dipilih'),
  unit: z.string().min(1, 'Unit wajib dipilih'),
  stock: z.number().min(0, 'Stok tidak boleh negatif'),
  minStock: z.number().min(1, 'Minimum stok harus lebih besar dari 0'),
  description: z.string().default(''),
  location: z.string().min(1, 'Lokasi gudang wajib dipilih'),
  supplier: z.string().default('')
});
type ProductFormData = z.infer<typeof productSchema>;
interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddProductDialog = ({
  open,
  onOpenChange
}: AddProductDialogProps) => {
  const {
    addProduct,
    isLoading
  } = useEnhancedProductManager();
  const { categories, units } = useProductMetadata();
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      productCode: '',
      category: '',
      unit: 'pcs',
      stock: 0,
      minStock: 1,
      description: '',
      location: '',
      supplier: ''
    }
  });

  // Format category/unit name (capitalize first letter of each word)
  const formatName = (name: string): string => {
    return name.trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Filter categories/units based on search
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
        form.setValue('category', newCategory);
      }
    } else {
      form.setValue('category', value);
    }
    setCategoryOpen(false);
    setCategorySearch('');
  };

  const handleUnitSelect = (value: string) => {
    if (value === '__new__') {
      const newUnit = unitSearch.trim().toLowerCase();
      if (newUnit) {
        form.setValue('unit', newUnit);
      }
    } else {
      form.setValue('unit', value);
    }
    setUnitOpen(false);
    setUnitSearch('');
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Hanya file gambar yang diizinkan');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setSelectedImageFile(file);
      toast.success('Gambar berhasil dipilih');
    }
  };
  const onSubmit = async (data: ProductFormData) => {
    try {
      // Cast to ensure all required fields are present
      const productData = {
        name: data.name,
        sku: data.sku,
        productCode: data.productCode,
        category: data.category,
        unit: data.unit as 'pcs' | 'unit' | 'meter' | 'bungkus' | 'batang' | 'buah' | 'kotak' | 'haspel',
        // Cast to correct type
        stock: data.stock,
        minStock: data.minStock,
        description: data.description || '',
        location: data.location || '',
        supplier: data.supplier || ''
        // image: '',
        // images: [],
      };
      await addProduct(productData, selectedImageFile || undefined);
      form.reset();
      // setImagePreview('');
      // setSelectedImageFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Gagal menambahkan produk. Silakan coba lagi.');
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto mobile-responsive-padding">
        <DialogHeader className="mobile-spacing-normal">
          <DialogTitle className="flex items-center mobile-gap-normal mobile-text-medium">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Tambah Produk Baru
          </DialogTitle>
          <DialogDescription className="mobile-text-small">
            Lengkapi informasi produk yang akan ditambahkan ke inventory
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Product Name */}
              <FormField control={form.control} name="name" render={({
              field
            }) => <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs sm:text-sm">Nama Produk *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Router Cisco RV340W" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* SKU */}
              <FormField control={form.control} name="sku" render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-xs sm:text-sm">SKU *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: RTR-CSC-RV340W" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Kode unik untuk identifikasi produk
                    </FormDescription>
                    <FormMessage />
                  </FormItem>} />

              {/* Product Code */}
              <FormField control={form.control} name="productCode" render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Kode Produk *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: RV340W-001" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Kode yang tertera pada produk fisik
                    </FormDescription>
                    <FormMessage />
                  </FormItem>} />

              {/* Category - Combobox */}
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Kategori *</FormLabel>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button 
                          variant="outline" 
                          role="combobox"
                          aria-expanded={categoryOpen}
                          className="w-full justify-between"
                        >
                          <span className="truncate">
                            {field.value || "Pilih atau ketik kategori..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
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
                                  field.value === category ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{category}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />


              {/* Unit - Combobox */}
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Unit *</FormLabel>
                  <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button 
                          variant="outline" 
                          role="combobox"
                          aria-expanded={unitOpen}
                          className="w-full justify-between"
                        >
                          <span className="truncate">
                            {field.value || "Pilih atau ketik unit..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
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
                                  field.value === unit ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{unit.toUpperCase()}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Stock */}
              <FormField control={form.control} name="stock" render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Stok Saat Ini *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Min Stock */}
              <FormField control={form.control} name="minStock" render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Minimum Stok *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Alert akan muncul jika stok di bawah nilai ini
                    </FormDescription>
                    <FormMessage />
                  </FormItem>} />

              {/* Location */}
              <FormField control={form.control} name="location" render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Lokasi Gudang *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih lokasi gudang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
                        {WAREHOUSE_LOCATIONS.map(location => <SelectItem key={location} value={location} className="hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            {location}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              {/* Supplier */}
              <FormField control={form.control} name="supplier" render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Supplier</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: PT Teknologi Nusantara" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>

            {/* Product Image */}
            

            {/* Description */}
            <FormField control={form.control} name="description" render={({
            field
          }) => <FormItem>
                <FormLabel className="text-xs sm:text-sm">Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deskripsi detail produk..." className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-3 sm:pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Plus className="w-4 h-4 mr-2" />
                {isLoading ? 'Menyimpan...' : 'Tambah Produk'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>;
};
export default AddProductDialog;