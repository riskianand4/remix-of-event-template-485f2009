import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { StockMovement } from '@/types/stock-movement';
import { Plus, Minus, RotateCcw, Package } from 'lucide-react';
import { WAREHOUSE_LOCATIONS } from '@/data/constants';
interface EditStockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement: StockMovement | null;
  onUpdate?: (updatedMovement: StockMovement) => void;
}
const EditStockMovementModal = ({
  isOpen,
  onClose,
  movement,
  onUpdate
}: EditStockMovementModalProps) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (movement) {
      setQuantity(Math.abs(movement.quantity));
      setReason(movement.reason || '');
      setReference(movement.reference || '');
      setLocation('');
      setNotes(movement.reason || '');
    }
  }, [movement]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movement || !quantity || !reason || !location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Calculate new stock based on transaction type and new quantity
      const quantityDiff = movement.type === 'out' ? -quantity : quantity;
      const originalQuantityDiff = movement.quantity;
      const stockAdjustment = quantityDiff - originalQuantityDiff;
      const newStock = (movement as any).newStock + stockAdjustment;
      const updatedMovement: StockMovement = {
        ...movement,
        quantity: movement.type === 'out' ? -quantity : quantity,
        reason,
        reference,
        product: location || 'default'
      };
      onUpdate?.(updatedMovement);
      onClose();
      toast({
        title: "Success",
        description: "Stock movement updated successfully"
      });
    } catch (error) {
      console.error('Failed to update movement:', error);
      toast({
        title: "Error",
        description: "Failed to update stock movement",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <Plus className="w-4 h-4" />;
      case 'out':
        return <Minus className="w-4 h-4" />;
      case 'adjustment':
        return <RotateCcw className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'bg-success/10 text-success border-success/20';
      case 'out':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'adjustment':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted';
    }
  };
  if (!movement) return null;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-md max-w-[360px] md:max-w-xl sm:max-w-2xl  mx-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTransactionIcon(movement.type)}
            Edit Stock Movement
          </DialogTitle>
          <DialogDescription>
            Edit transaksi pergerakan stok yang sudah tercatat
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Movement Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Produk</div>
                <div className="font-semibold">Product Info</div>
                <div className="text-xs text-muted-foreground">ID: {movement.id}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Tipe Transaksi</div>
                <Badge className={getTransactionColor(movement.type)}>
                  {movement.type === 'in' ? 'Masuk' : movement.type === 'out' ? 'Keluar' : 'Adjustment'}
                </Badge>
              </div>
              <div>
                <div className="text-muted-foreground">Stok Sebelumnya</div>
                <div className="font-semibold">{movement.previousStock}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Tanggal</div>
                <div className="font-semibold">{new Date(movement.createdAt || Date.now()).toLocaleDateString('id-ID')}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  {movement.type === 'adjustment' ? 'Stok Baru' : 'Jumlah'} *
                </Label>
                <Input id="quantity" type="number" min="0" value={quantity} onChange={e => setQuantity(Number(e.target.value))} placeholder={movement.type === 'adjustment' ? 'Stok setelah adjustment' : '0'} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Alasan *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih alasan" />
                  </SelectTrigger>
                  <SelectContent>
                    {movement.type === 'in' && <>
                        <SelectItem value="purchase">Pembelian</SelectItem>
                        <SelectItem value="return">Retur dari Customer</SelectItem>
                        <SelectItem value="transfer_in">Transfer Masuk</SelectItem>
                        <SelectItem value="adjustment_in">Adjustment Masuk</SelectItem>
                      </>}
                    {movement.type === 'out' && <>
                        <SelectItem value="sale">Penjualan</SelectItem>
                        <SelectItem value="return_supplier">Retur ke Supplier</SelectItem>
                        <SelectItem value="transfer_out">Transfer Keluar</SelectItem>
                        <SelectItem value="damage">Kerusakan</SelectItem>
                        <SelectItem value="lost">Kehilangan</SelectItem>
                      </>}
                    {movement.type === 'adjustment' && <>
                        <SelectItem value="stock_opname">Stock Opname</SelectItem>
                        <SelectItem value="correction">Koreksi</SelectItem>
                        <SelectItem value="initial_stock">Stok Awal</SelectItem>
                      </>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lokasi/Gudang *</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih lokasi" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
                    {WAREHOUSE_LOCATIONS.map(loc => <SelectItem key={loc} value={loc} className="hover:bg-accent hover:text-accent-foreground cursor-pointer">
                        {loc}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reference">Referensi</Label>
                <Input id="reference" value={reference} onChange={e => setReference(e.target.value)} placeholder="No. PO, Invoice, Transfer, dll" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan..." rows={3} />
              </div>
            </div>
          </div>

          {/* Stock Calculation Preview */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Stok Sebelumnya</div>
                <div className="font-semibold">{movement.previousStock}</div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  {movement.type === 'adjustment' ? 'Perubahan' : 'Jumlah Transaksi'}
                </div>
                <div className="font-semibold">
                  {movement.type === 'out' ? '-' : ''}
                  {movement.type === 'adjustment' ? quantity - movement.previousStock : quantity}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Stok Setelah Edit</div>
                <div className="font-semibold">
                  {movement.type === 'in' ? movement.previousStock + quantity : movement.type === 'out' ? movement.previousStock - quantity : quantity}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Unit</div>
                <div className="font-semibold">pcs</div>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Update Movement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};
export default EditStockMovementModal;