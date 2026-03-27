import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useVendorStore } from "@/stores/vendorStore";
import { formatPKR, formatDate, getTodayISO } from "@/lib/formatters";
import { toast } from "sonner";
import type { PaymentMethod, VendorPayable } from "@/types";

interface VendorPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedVendorId?: string;
  preSelectedPayableId?: string;
}

const VendorPaymentDialog = ({
  open,
  onOpenChange,
  preSelectedVendorId,
  preSelectedPayableId,
}: VendorPaymentDialogProps) => {
  const { vendors, recordPayment, getOutstanding, getPayables } = useVendorStore();

  const [vendorId, setVendorId] = useState(preSelectedVendorId || "");
  const [payableId, setPayableId] = useState(preSelectedPayableId || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayISO());
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [notes, setNotes] = useState("");

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setVendorId(preSelectedVendorId || "");
      setPayableId(preSelectedPayableId || "");
      setAmount("");
      setDate(getTodayISO());
      setMethod("Cash");
      setNotes("");
    }
    onOpenChange(v);
  };

  // Get pending payables for the selected vendor
  const vendorPayables = useMemo(
    () => getPayables().filter((p) => p.vendorId === vendorId && p.remainingAmount > 0),
    [getPayables, vendorId]
  );

  const selectedPayable = getPayables().find((p) => p.id === payableId);
  const maxAmount = selectedPayable ? selectedPayable.remainingAmount : 0;
  const vendorOutstanding = vendorId ? getOutstanding(vendorId) : 0;

  const getStatusVariant = (payable: VendorPayable) => {
    if (payable.status === 'Overdue') return 'destructive';
    if (payable.status === 'Partially Paid') return 'secondary';
    return 'outline';
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payAmount = Number(amount);
    if (payAmount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    if (!vendorId) {
      toast.error("Please select a vendor");
      return;
    }

    if (!payableId || !selectedPayable) {
      toast.error("Please select a payable/invoice");
      return;
    }

    if (payAmount > selectedPayable.remainingAmount) {
      toast.error(
        `Payment cannot exceed pending balance of ${formatPKR(selectedPayable.remainingAmount)}`
      );
      return;
    }

    const vendor = vendors.find((v) => v.id === vendorId);

    // 1. Record payment via central store (handles DB, cash flow, cheques, ledger)
    recordPayment(payableId, vendorId, payAmount, method, notes);

    const newRemainingOnPayable = selectedPayable.remainingAmount - payAmount;
    
    handleOpenChange(false);
    toast.success(
      `Payment of ${formatPKR(payAmount)} recorded for ${vendor?.name}. ${
        newRemainingOnPayable <= 0
          ? "Invoice fully paid."
          : `Remaining: ${formatPKR(newRemainingOnPayable)}`
      }`
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pay Vendor</DialogTitle>
          <DialogDescription>Record a payment to a vendor for an outstanding purchase.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vendor */}
          <div className="space-y-2">
            <Label>Vendor *</Label>
            <Select
              value={vendorId}
              onValueChange={(v) => {
                setVendorId(v);
                setPayableId("");
              }}
              disabled={!!preSelectedVendorId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors
                  .filter((v) => v.isActive)
                  .map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} — Outstanding: {formatPKR(getOutstanding(v.id))}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendor Outstanding Summary */}
          {vendorId && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Outstanding to Vendor</span>
                <span className={`font-semibold ${vendorOutstanding > 0 ? 'text-destructive' : 'status-healthy'}`}>
                  {formatPKR(vendorOutstanding)}
                </span>
              </div>
            </div>
          )}

          {/* Invoice / Payable Selection */}
          <div className="space-y-2">
            <Label>Invoice / Payable Reference *</Label>
            {vendorId && vendorPayables.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-md border p-3">
                No pending payables for this vendor.
              </p>
            ) : (
              <Select
                value={payableId}
                onValueChange={setPayableId}
                disabled={!vendorId || !!preSelectedPayableId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payable" />
                </SelectTrigger>
                <SelectContent>
                  {vendorPayables.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <span>{p.description}</span>
                        <Badge variant={getStatusVariant(p)} className="ml-1">
                          {p.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Payable summary */}
          {selectedPayable && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Total</span>
                <span>{formatPKR(selectedPayable.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already Paid</span>
                <span className="status-healthy">{formatPKR(selectedPayable.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span className={selectedPayable.status === 'Overdue' ? 'text-destructive font-medium' : ''}>
                  {formatDate(selectedPayable.dueDate)}
                  {selectedPayable.status === 'Overdue' && ' (Overdue)'}
                </span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                <span>Pending Balance</span>
                <span className="text-destructive">{formatPKR(selectedPayable.remainingAmount)}</span>
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label>Payment Amount (PKR) *</Label>
            <Input
              type="number"
              min="1"
              max={maxAmount || undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={maxAmount ? `Max: ${formatPKR(maxAmount)}` : "Enter amount"}
              required
            />
            {selectedPayable && Number(amount) > 0 && (
              <p className="text-xs text-muted-foreground">
                After this payment:{" "}
                <strong>
                  {formatPKR(Math.max(0, selectedPayable.remainingAmount - Number(amount)))}
                </strong>{" "}
                remaining
                {selectedPayable.remainingAmount - Number(amount) <= 0 && (
                  <span className="status-healthy ml-1">— Will be marked as Paid</span>
                )}
              </p>
            )}
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cheque #1234, bank reference..."
              maxLength={500}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!vendorId || !payableId || !amount}
            >
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VendorPaymentDialog;
