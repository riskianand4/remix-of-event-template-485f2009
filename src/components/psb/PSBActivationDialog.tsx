import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PSBActivation, CreatePSBActivationRequest } from "@/types/psb";
import { toast } from "sonner";
const activationSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  serviceNumber: z.string().min(1, "Service number is required"),
  pppoeUsername: z.string().min(1, "PPPoE username is required"),
  pppoePassword: z.string().min(1, "PPPoE password is required"),
  oltName: z.string().min(1, "OLT name is required"),
  ponPort: z.string().min(1, "PON port is required"),
  onuNumber: z.string().min(1, "ONU number is required"),
  signalLevel: z
    .number()
    .min(-50)
    .max(0, "Signal level must be between -50 and 0 dBm"),
  activationDate: z.string().min(1, "Activation date is required"),
  ontStatus: z.enum(["configured", "pending", "failed"]),
  cluster: z.string().min(1, "Cluster is required"),
  technician: z.string().min(1, "Technician is required"),
  notes: z.string().optional(),
});
type ActivationFormData = z.infer<typeof activationSchema>;
interface PSBActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activation?: PSBActivation | null;
  onSave: (
    id: string | undefined,
    data: CreatePSBActivationRequest
  ) => Promise<void>;
  orderId?: string;
  autoServiceNumber?: string;
  selectedOrder?: any;
  lastCredentials?: { serviceNumber: string; email: string; password: string };
}
export const PSBActivationDialog: React.FC<PSBActivationDialogProps> = ({
  open,
  onOpenChange,
  activation,
  onSave,
  orderId,
  autoServiceNumber,
  selectedOrder,
  lastCredentials,
}) => {
  const [manualMode, setManualMode] = useState(false);
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const [lastCredentialsRef, setLastCredentialsRef] = useState<string | null>(
    null
  );
  
  const form = useForm<ActivationFormData>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      customerName: "",
      serviceNumber: autoServiceNumber || "",
      pppoeUsername: autoServiceNumber
        ? `${autoServiceNumber}@telnet.co.id`
        : "",
      pppoePassword: autoServiceNumber || "",
      oltName: "",
      ponPort: "",
      onuNumber: "",
      signalLevel: -20,
      activationDate: new Date().toISOString().split("T")[0],
      ontStatus: "pending",
      cluster: "",
      technician: "",
      notes: "",
    },
  });
  // Helper function to increment numbers in string
  function incrementValue(value: string): string {
    const match = value.match(/\d+/);
    if (!match) return value;
    const numberPart = match[0];
    const incremented = (parseInt(numberPart, 10) + 1).toString();
    return value.replace(numberPart, incremented);
  }

  // Handle auto-generate button click
  const handleAutoGenerate = () => {
    if (!lastCredentials) return;

    const nextServiceNumber = incrementValue(lastCredentials.serviceNumber);
    const nextEmail = `${nextServiceNumber}@telnet.co.id`;
    const nextPassword = incrementValue(lastCredentials.password);

    form.setValue("serviceNumber", nextServiceNumber);
    form.setValue("pppoeUsername", nextEmail);
    form.setValue("pppoePassword", nextPassword);
    setManualMode(false);
  };

  useEffect(() => {
    if (!open) {
      // Reset tracking when dialog closes
      setHasUserEdited(false);
      setLastCredentialsRef(null);
      return;
    }

    // Jika sedang edit, isi data lama
    if (activation) {
      form.reset({
        customerName: activation.customerName || "",
        serviceNumber: activation.serviceNumber,
        pppoeUsername: activation.pppoeUsername,
        pppoePassword: activation.pppoePassword,
        oltName: activation.oltName,
        ponPort: activation.ponPort,
        onuNumber: activation.onuNumber,
        signalLevel: activation.signalLevel,
        activationDate: activation.activationDate.split("T")[0],
        ontStatus: activation.ontStatus,
        cluster: activation.cluster,
        technician: activation.technician,
        notes: activation.notes || "",
      });
      setHasUserEdited(false);
    } else {
      // Only reset form on initial open or when dialog first opens
      // Skip if user has edited OLT/PON/ONU fields and only lastCredentials changed
      const currentCredentialsKey = lastCredentials
        ? JSON.stringify(lastCredentials)
        : null;
      const credentialsChanged = currentCredentialsKey !== lastCredentialsRef;

      // If user has edited fields like OLT, PON, ONU - don't reset those
      if (hasUserEdited && credentialsChanged && lastCredentialsRef !== null) {
        // Only update credentials fields, preserve user-edited fields
        if (lastCredentials) {
          const nextServiceNumber = incrementValue(
            lastCredentials.serviceNumber
          );
          const nextEmail = `${nextServiceNumber}@telnet.co.id`;
          const nextPassword = incrementValue(lastCredentials.password);

          form.setValue("serviceNumber", nextServiceNumber);
          form.setValue("pppoeUsername", nextEmail);
          form.setValue("pppoePassword", nextPassword);
        }
        setLastCredentialsRef(currentCredentialsKey);
        return;
      }

      // Full reset for new dialog open
      let nextServiceNumber = "";
      let nextEmail = "";
      let nextPassword = "";

      if (lastCredentials) {
        nextServiceNumber = incrementValue(lastCredentials.serviceNumber);
        nextEmail = `${nextServiceNumber}@telnet.co.id`;
        nextPassword = incrementValue(lastCredentials.password);
      }

      const technicianName =
        selectedOrder?.technician ||
        selectedOrder?.createdBy?.name ||
        selectedOrder?.updatedBy?.name ||
        "";

      form.reset({
        customerName: selectedOrder?.customerName || "",
        serviceNumber: nextServiceNumber,
        pppoeUsername: nextEmail,
        pppoePassword: nextPassword,
        oltName: "",
        ponPort: "",
        onuNumber: "",
        signalLevel: -20,
        activationDate: new Date().toISOString().split("T")[0],
        ontStatus: "pending",
        cluster: selectedOrder?.cluster || "",
        technician: technicianName,
        notes: "",
      });
      setManualMode(false);
      setHasUserEdited(false);
      setLastCredentialsRef(currentCredentialsKey);
    }
  }, [open, activation, selectedOrder, lastCredentials]);

  const handleSubmit = async (data: ActivationFormData) => {
    try {
      // 🟢 Ambil user login dari localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const technicianId = user?.id || null;

      // 🟢 Susun payload
      const activationData: CreatePSBActivationRequest =
        {
          customerName: data.customerName,
          serviceNumber: data.serviceNumber,
          pppoeUsername: data.pppoeUsername,
          pppoePassword: data.pppoePassword,
          oltName: data.oltName,
          ponPort: data.ponPort,
          onuNumber: data.onuNumber,
          signalLevel: data.signalLevel,
          activationDate: new Date(data.activationDate).toISOString(),
          ontStatus: data.ontStatus,
          cluster: data.cluster,
          technician: data.technician,
          notes: data.notes,
          psbOrderId: orderId,
          technicianId,
        };

      await onSave(activation?._id, activationData);
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes("409:")) {
        toast.error("Service number already exists");
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to save activation data" ,error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-md max-w-[360px] md:max-w-xl sm:max-w-2xl  mx-0  max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {activation ? "Edit Service Activation" : "Add Service Activation"}
          </DialogTitle>
          <DialogDescription>
            {activation
              ? "Update the service activation details below."
              : "Fill in the service activation details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                {...form.register("customerName")}
                placeholder="e.g., Susanti Lestari"
              />
              {form.formState.errors.customerName && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.customerName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceNumber">Service Number *</Label>
              <div className="flex gap-2">
                <Input
                  id="serviceNumber"
                  {...form.register("serviceNumber")}
                  placeholder="e.g., 12345678901"
                  readOnly={!!activation}
                  onChange={() => setManualMode(true)}
                  className={!!activation ? "bg-muted cursor-not-allowed" : ""}
                />
                {!activation && lastCredentials && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAutoGenerate}
                    title="Auto-generate credentials"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {form.formState.errors.serviceNumber && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.serviceNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cluster">Cluster *</Label>
              <Input
                id="cluster"
                {...form.register("cluster")}
                placeholder="e.g., PLK"
              />
              {form.formState.errors.cluster && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.cluster.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pppoeUsername">PPPoE Username (Email) *</Label>
              <Input
                id="pppoeUsername"
                {...form.register("pppoeUsername")}
                placeholder="e.g., 2988372626@telnet.co.id"
                readOnly={!!activation}
                onChange={() => setManualMode(true)}
                className={!!activation ? "bg-muted cursor-not-allowed" : ""}
              />
              {form.formState.errors.pppoeUsername && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.pppoeUsername.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pppoePassword">PPPoE Password *</Label>
              <Input
                id="pppoePassword"
                type="text"
                {...form.register("pppoePassword")}
                placeholder="Password"
                readOnly={!!activation}
                onChange={() => setManualMode(true)}
                className={!!activation ? "bg-muted cursor-not-allowed" : ""}
              />
              {form.formState.errors.pppoePassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.pppoePassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="oltName">OLT Name *</Label>
              <Input
                id="oltName"
                {...form.register("oltName", {
                  onChange: () => setHasUserEdited(true),
                })}
                placeholder="e.g., OLT-PLK-01"
              />
              {form.formState.errors.oltName && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.oltName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ponPort">PON Port *</Label>
              <Input
                id="ponPort"
                {...form.register("ponPort", {
                  onChange: () => setHasUserEdited(true),
                })}
                placeholder="e.g., 1/1/1"
              />
              {form.formState.errors.ponPort && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.ponPort.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="onuNumber">ONU Number *</Label>
              <Input
                id="onuNumber"
                {...form.register("onuNumber", {
                  onChange: () => setHasUserEdited(true),
                })}
                placeholder="e.g., 15"
              />
              {form.formState.errors.onuNumber && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.onuNumber.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signalLevel">Signal Level (dBm) *</Label>
              <Input
                id="signalLevel"
                type="number"
                step="0.1"
                min="-50"
                max="0"
                {...form.register("signalLevel", {
                  valueAsNumber: true,
                })}
                placeholder="e.g., -18.5"
              />
              {form.formState.errors.signalLevel && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.signalLevel.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ontStatus">ONT Status *</Label>
              <Select
                value={form.watch("ontStatus")}
                onValueChange={(value: "configured" | "pending" | "failed") =>
                  form.setValue("ontStatus", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="configured">Configured</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.ontStatus && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.ontStatus.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="activationDate">Activation Date *</Label>
              <Input
                id="activationDate"
                type="date"
                {...form.register("activationDate")}
              />
              {form.formState.errors.activationDate && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.activationDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="technician">Technician *</Label>
            <Input
              id="technician"
              {...form.register("technician")}
              placeholder="e.g., Ahmad Surya"
            />
            {form.formState.errors.technician && (
              <p className="text-sm text-red-500">
                {form.formState.errors.technician.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Saving..."
                : activation
                ? "Update Activation"
                : "Create Activation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
