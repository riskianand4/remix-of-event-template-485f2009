import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck } from 'lucide-react';

interface PSBBulkAssignConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician: string;
  orderCount: number;
  onConfirm: () => void;
  isAssigning: boolean;
}

export const PSBBulkAssignConfirmDialog: React.FC<PSBBulkAssignConfirmDialogProps> = ({
  open,
  onOpenChange,
  technician,
  orderCount,
  onConfirm,
  isAssigning
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Konfirmasi Bulk Assignment
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Anda akan mengassign teknisi ke beberapa order sekaligus:
              </p>
              
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Teknisi:</span>
                  <Badge className="bg-blue-500 text-white text-xs">
                    {technician}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Jumlah Customer:</span>
                  <Badge variant="outline" className="text-xs font-bold">
                    {orderCount} Customer
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                Semua order yang dipilih akan di-assign ke teknisi ini.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isAssigning}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isAssigning}
            className="bg-primary hover:bg-primary/90"
          >
            {isAssigning ? 'Assigning...' : 'OK, Assign All'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};