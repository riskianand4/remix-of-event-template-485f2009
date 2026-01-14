import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Asset } from '@/types/assets';

interface ImportAssetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (assets: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'maintenanceHistory'>[]) => Promise<void>;
}

interface ImportValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ParsedAsset {
  name: string;
  code: string;
  category: string;
  quantity: number;
  description?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  status: 'available' | 'borrowed' | 'maintenance' | 'damaged';
  location: string;
  purchaseDate: Date | string;
  purchasePrice: number;
  rowIndex: number;
  validation: ImportValidation;
}

export const ImportAssetDialog: React.FC<ImportAssetDialogProps> = ({
  isOpen,
  onOpenChange,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedAsset[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Column mapping untuk fleksibilitas format file - sesuai dengan backend Asset model
  const columnMappings = {
    name: ['name', 'nama', 'nama asset', 'asset name', 'nama_asset'],
    code: ['code', 'kode', 'kode asset', 'asset code', 'kode_asset'],
    category: ['category', 'kategori', 'jenis', 'type'],
    quantity: ['quantity', 'jumlah', 'qty'],
    description: ['description', 'deskripsi', 'keterangan', 'desc'],
    condition: ['condition', 'kondisi', 'status kondisi'],
    status: ['status', 'status asset'],
    location: ['location', 'lokasi', 'tempat'],
    purchaseDate: ['purchase_date', 'tanggal beli', 'tanggal_beli', 'purchase date'],
    purchasePrice: ['purchase_price', 'harga beli', 'harga_beli', 'purchase price', 'harga']
  };

  const validateRow = (row: any, index: number): ImportValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!row.name || !row.name.toString().trim()) {
      errors.push('Nama asset wajib diisi');
    }
    if (!row.code || !row.code.toString().trim()) {
      errors.push('Kode asset wajib diisi');
    }
    if (!row.category || !row.category.toString().trim()) {
      errors.push('Kategori wajib diisi');
    }
    if (!row.purchasePrice && row.purchasePrice !== 0) {
      errors.push('Harga beli wajib diisi');
    } else if (isNaN(Number(row.purchasePrice)) || Number(row.purchasePrice) < 0) {
      errors.push('Harga beli harus berupa angka positif');
    }

    // Warnings
    if (!row.quantity) {
      warnings.push('Jumlah tidak diisi (akan diset ke 1)');
    }
    if (!row.condition) {
      warnings.push('Kondisi tidak diisi (akan diset ke "good")');
    }
    if (!row.status) {
      warnings.push('Status tidak diisi (akan diset ke "available")');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  };

  const mapColumnNames = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    
    Object.entries(columnMappings).forEach(([field, possibleNames]) => {
      const matchedHeader = headers.find(header => 
        possibleNames.some(name => 
          header.toLowerCase().trim() === name.toLowerCase()
        )
      );
      if (matchedHeader) {
        mapping[matchedHeader] = field;
      }
    });

    return mapping;
  };

  const parseExcelDate = (value: any): Date | string => {
    if (!value) return new Date().toISOString();
    
    // If it's already a Date object
    if (value instanceof Date) return value.toISOString();
    
    // If it's a number (Excel date serial)
    if (typeof value === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 86400000);
      return date.toISOString();
    }
    
    // If it's a string, try to parse it
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  };

  const parseFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const data = await file.arrayBuffer();
      setProgress(25);

      const workbook = XLSX.read(data);
      setProgress(50);

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      setProgress(75);

      if (jsonData.length === 0) {
        throw new Error('File kosong atau tidak ada data');
      }

      // Map kolom berdasarkan header yang ada
      const headers = Object.keys(jsonData[0] as object);
      const columnMapping = mapColumnNames(headers);

      const validCategories = [
        "Tools", "Power Tools", "Testing Equipment", "Safety Equipment",
        "Power Equipment", "Network Equipment", "Measuring Tools",
        "Vehicle", "Computer Equipment", "Other"
      ];

      const parsed: ParsedAsset[] = jsonData.map((row: any, index) => {
        // Mapping kolom ke field yang benar
        const mappedRow: any = {};
        Object.entries(row).forEach(([header, value]) => {
          const field = columnMapping[header];
          if (field) {
            mappedRow[field] = value;
          }
        });

        // Normalize category
        let category = mappedRow.category?.toString().trim() || 'Other';
        if (!validCategories.includes(category)) {
          category = 'Other';
        }

        // Normalize condition
        let condition = mappedRow.condition?.toString().toLowerCase() || 'good';
        if (!['excellent', 'good', 'fair', 'poor'].includes(condition)) {
          condition = 'good';
        }

        // Normalize status
        let status = mappedRow.status?.toString().toLowerCase() || 'available';
        if (!['available', 'borrowed', 'maintenance', 'damaged'].includes(status)) {
          status = 'available';
        }

        const asset: ParsedAsset = {
          name: mappedRow.name?.toString().trim() || '',
          code: mappedRow.code?.toString().trim().toUpperCase() || '',
          category: category as any,
          quantity: Number(mappedRow.quantity) || 1,
          description: mappedRow.description?.toString().trim() || '',
          condition: condition as 'excellent' | 'good' | 'fair' | 'poor',
          status: status as 'available' | 'borrowed' | 'maintenance' | 'damaged',
          location: mappedRow.location?.toString().trim() || '',
          purchaseDate: parseExcelDate(mappedRow.purchaseDate),
          purchasePrice: Number(mappedRow.purchasePrice) || 0,
          rowIndex: index + 2,
          validation: validateRow(mappedRow, index)
        };

        return asset;
      });

      setParsedData(parsed);
      setStep('preview');
      setProgress(100);
      
      const validCount = parsed.filter(p => p.validation.valid).length;
      toast.success(`Berhasil memproses ${parsed.length} baris data. ${validCount} valid, ${parsed.length - validCount} error.`);

    } catch (error) {
      toast.error(`Gagal memproses file: ${error instanceof Error ? error.message : 'Error tidak dikenal'}`);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Format file tidak didukung. Gunakan Excel (.xlsx, .xls) atau CSV.');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (!validTypes.includes(droppedFile.type)) {
        toast.error('Format file tidak didukung. Gunakan Excel (.xlsx, .xls) atau CSV.');
        return;
      }

      setFile(droppedFile);
      parseFile(droppedFile);
    }
  }, [parseFile]);

  const handleImport = async () => {
    const validAssets = parsedData.filter(p => p.validation.valid);
    
    if (validAssets.length === 0) {
      toast.error('Tidak ada data valid untuk diimpor');
      return;
    }

    setStep('importing');
    setProgress(0);

    try {
      const assetsToImport = validAssets.map(({ validation, rowIndex, ...asset }) => asset);
      await onImport(assetsToImport as any);
      
      toast.success(`Berhasil mengimpor ${validAssets.length} aset`);
      resetDialog();
      onOpenChange(false);
      
    } catch (error) {
      toast.error(`Gagal mengimpor data: ${error instanceof Error ? error.message : 'Error tidak dikenal'}`);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Nama Asset': 'Laptop Dell Latitude 5520',
        'Kode Asset': 'AST-LPT-001',
        'Kategori': 'Computer Equipment',
        'Jumlah': 1,
        'Kondisi': 'good',
        'Status': 'available',
        'Lokasi': 'Kantor Pusat - Lantai 2',
        'Tanggal Beli': '2024-01-15',
        'Harga Beli': 15000000,
        'Deskripsi': 'Laptop untuk keperluan kantor'
      },
      {
        'Nama Asset': 'OTDR Yokogawa AQ7280',
        'Kode Asset': 'AST-TST-001',
        'Kategori': 'Testing Equipment',
        'Jumlah': 2,
        'Kondisi': 'excellent',
        'Status': 'available',
        'Lokasi': 'Gudang Peralatan',
        'Tanggal Beli': '2024-03-20',
        'Harga Beli': 75000000,
        'Deskripsi': 'OTDR untuk testing fiber optic'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 30 }, // Nama Asset
      { wch: 15 }, // Kode Asset
      { wch: 20 }, // Kategori
      { wch: 8 },  // Jumlah
      { wch: 12 }, // Kondisi
      { wch: 12 }, // Status
      { wch: 25 }, // Lokasi
      { wch: 12 }, // Tanggal Beli
      { wch: 15 }, // Harga Beli
      { wch: 30 }  // Deskripsi
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Asset');
    XLSX.writeFile(workbook, 'template_import_asset.xlsx');
  };

  const resetDialog = () => {
    setFile(null);
    setParsedData([]);
    setStep('upload');
    setProgress(0);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = parsedData.filter(p => p.validation.valid).length;
  const errorCount = parsedData.filter(p => !p.validation.valid).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetDialog();
      onOpenChange(open);
    }}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-hidden z-50 p-4 md:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <FileSpreadsheet className="w-4 h-4 md:w-5 md:h-5" />
            Import Data Asset
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Impor data asset dari file Excel (.xlsx, .xls) atau CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Download Template */}
              <div className="flex justify-center">
                <Button variant="outline" onClick={downloadTemplate} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template Excel
                </Button>
              </div>

              {/* Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/40'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-lg font-medium mb-2">
                  {dragActive ? 'Lepaskan file di sini' : 'Pilih file atau drag & drop'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                  Pilih File
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Format: Excel (.xlsx, .xls) atau CSV
                </p>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">Memproses file...</p>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {validCount} Valid
                  </Badge>
                  {errorCount > 0 && (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {errorCount} Error
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={resetDialog}>
                  <X className="w-4 h-4 mr-1" /> Reset
                </Button>
              </div>

              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-4 space-y-2">
                  {parsedData.slice(0, 20).map((asset, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        asset.validation.valid 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{asset.name || 'Tanpa Nama'}</p>
                          <p className="text-sm text-muted-foreground">
                            Kode: {asset.code} | Kategori: {asset.category} | Harga: Rp {asset.purchasePrice.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <Badge variant={asset.validation.valid ? "default" : "destructive"}>
                          Baris {asset.rowIndex}
                        </Badge>
                      </div>
                      {asset.validation.errors.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">
                          {asset.validation.errors.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                  {parsedData.length > 20 && (
                    <p className="text-center text-muted-foreground">
                      ...dan {parsedData.length - 20} data lainnya
                    </p>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetDialog}>Batal</Button>
                <Button onClick={handleImport} disabled={validCount === 0}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {validCount} Asset
                </Button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Mengimpor data...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAssetDialog;