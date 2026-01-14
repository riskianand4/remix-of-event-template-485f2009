import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PSBOrder } from "@/types/psb";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

interface TechnicianStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PSBOrder | null;
  onSave: (orderId: string, status: "pending" | "failed" | "complete", reason?: string) => Promise<void>;
}

export const TechnicianStatusDialog: React.FC<TechnicianStatusDialogProps> = ({
  open,
  onOpenChange,
  order,
  onSave,
}) => {
  const [status, setStatus] = useState<"pending" | "failed" | "complete">(
    order?.technicianStatus || "pending"
  );
  const [reason, setReason] = useState(order?.technicianStatusReason || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!order) return;

    // Validate: reason required for pending/failed
    if ((status === "pending" || status === "failed") && !reason.trim()) {
      alert("Alasan wajib diisi untuk status Pending atau Failed");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(order._id, status, reason);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update technician status:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Status Pekerjaan</DialogTitle>
          <DialogDescription>
            Order: {order?.orderNo} - {order?.customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Status Pekerjaan</Label>
            <RadioGroup value={status} onValueChange={(value) => setStatus(value as any)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="complete" id="complete" />
                <Label htmlFor="complete" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Complete</div>
                    <div className="text-xs text-muted-foreground">Pekerjaan selesai, siap aktivasi</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="pending" id="pending" />
                <Label htmlFor="pending" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-medium">Pending</div>
                    <div className="text-xs text-muted-foreground">Tertunda, perlu tindak lanjut</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="failed" id="failed" />
                <Label htmlFor="failed" className="flex items-center gap-2 cursor-pointer flex-1">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-medium">Failed</div>
                    <div className="text-xs text-muted-foreground">Gagal, butuh penanganan khusus</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {(status === "pending" || status === "failed") && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                Alasan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan alasan kenapa pending/failed..."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Wajib diisi untuk status Pending atau Failed
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
