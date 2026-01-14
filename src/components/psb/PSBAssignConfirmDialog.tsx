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
import { PSBOrder } from '@/types/psb';
import { User, FileText, UserCheck } from 'lucide-react';

interface PSBAssignConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PSBOrder | null;
  technician: string;
  onConfirm: () => void;
  isAssigning: boolean;
}

export const PSBAssignConfirmDialog: React.FC<PSBAssignConfirmDialogProps> = ({
  open,
  onOpenChange,
  order,
  technician,
  onConfirm,
  isAssigning
}) => {
  if (!order) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Konfirmasi Assignment
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Anda akan mengassign teknisi ke order berikut:
              </p>
              
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Order Number:</span>
                  <Badge variant="outline" className="text-xs">
                    {order.orderNo}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Customer:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {order.customerName}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Teknisi:</span>
                  <Badge className="bg-blue-500 text-white text-xs">
                    {technician}
                  </Badge>
                </div>
              </div>
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
            {isAssigning ? 'Assigning...' : 'OK, Assign'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};