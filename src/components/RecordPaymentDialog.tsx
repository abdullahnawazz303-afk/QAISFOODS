import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomerStore } from "@/stores/customerStore";
import { useSalesStore } from "@/stores/salesStore";
import { useCashFlowStore } from "@/stores/cashFlowStore";
import { useCompanyBalanceStore } from "@/stores/companyBalanceStore";
import { formatPKR, getTodayISO } from "@/lib/formatters";
import { toast } from "sonner";

export type PaymentMethod = "Cash" | "Bank Transfer" | "Other";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a customer */
  preSelectedCustomerId?: string;
  /** Pre-select a sale/order */
  preSelectedSaleId?: string;
}

const RecordPaymentDialog = ({
  open,
  onOpenChange,
  preSelectedCustomerId,
  preSelectedSaleId,
}: RecordPaymentDialogProps) => {
  const { customers, addLedgerEntry } = useCustomerStore();
  const { sales, addPayment } = useSalesStore();
  const { addEntry: addCashEntry } = useCashFlowStore();
  const companyBalance = useCompanyBalanceStore();

  const [customerId, setCustomerId] = useState(preSelectedCustomerId || "");
  const [saleId, setSaleId] = useState(preSelectedSaleId || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayISO());
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [notes, setNotes] = useState("");

  // Reset form when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setCustomerId(preSelectedCustomerId || "");
      setSaleId(preSelectedSaleId || "");
      setAmount("");
      setDate(getTodayISO());
      setMethod("Cash");
      setNotes("");
    }
    onOpenChange(v);
  };

  // Get unpaid sales for the selected customer
  const customerSales = useMemo(
    () => sales.filter((s) => s.customerId === customerId && s.outstanding > 0),
    [sales, customerId]
  );

  const selectedSale = sales.find((s) => s.id === saleId);
  const maxAmount = selectedSale ? selectedSale.outstanding : 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payAmount = Number(amount);
    if (payAmount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    if (!saleId || !selectedSale) {
      toast.error("Please select an order/invoice");
      return;
    }

    if (payAmount > selectedSale.outstanding) {
      toast.error(
        `Payment cannot exceed pending balance of ${formatPKR(selectedSale.outstanding)}`
      );
      return;
    }

    // 1. Update sale payment status
    addPayment(saleId, payAmount);

    // 2. Add customer ledger entry (credit = payment received)
    const methodLabel = method !== "Cash" ? ` (${method})` : "";
    addLedgerEntry(customerId, {
      date,
      type: "Payment Received",
      description: `Payment for ${saleId}${methodLabel}${notes ? " — " + notes : ""}`,
      debit: 0,
      credit: payAmount,
    });

    // 3. Add cash flow entry
    addCashEntry(date, {
      type: "in",
      category: "Customer Payment",
      amount: payAmount,
      description: `Payment from ${customers.find((c) => c.id === customerId)?.name || "customer"} for ${saleId}`,
    });

    // 4. Update company balance
    companyBalance.addSalesIncome(payAmount);

    handleOpenChange(false);
    toast.success(
      `Payment of ${formatPKR(payAmount)} recorded successfully. ${
        selectedSale.outstanding - payAmount <= 0
          ? "Order marked as Paid."
          : `Remaining: ${formatPKR(selectedSale.outstanding - payAmount)}`
      }`
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Customer Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer */}
          <div className="space-y-2">
            <Label>Customer *</Label>
            <Select
              value={customerId}
              onValueChange={(v) => {
                setCustomerId(v);
                setSaleId("");
              }}
              disabled={!!preSelectedCustomerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers
                  .filter((c) => c.isActive)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order / Invoice Reference */}
          <div className="space-y-2">
            <Label>Order / Invoice Reference *</Label>
            {customerId && customerSales.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-md border p-3">
                No pending orders for this customer.
              </p>
            ) : (
              <Select
                value={saleId}
                onValueChange={setSaleId}
                disabled={!customerId || !!preSelectedSaleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  {customerSales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.id} — Outstanding: {formatPKR(s.outstanding)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Sale summary */}
          {selectedSale && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Total</span>
                <span>{formatPKR(selectedSale.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already Paid</span>
                <span className="text-green-600">{formatPKR(selectedSale.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                <span>Pending Balance</span>
                <span className="text-destructive">{formatPKR(selectedSale.outstanding)}</span>
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
            {selectedSale && Number(amount) > 0 && (
              <p className="text-xs text-muted-foreground">
                After this payment:{" "}
                <strong>
                  {formatPKR(Math.max(0, selectedSale.outstanding - Number(amount)))}
                </strong>{" "}
                remaining
                {selectedSale.outstanding - Number(amount) <= 0 && (
                  <span className="text-green-600 ml-1">— Will be marked as Paid ✓</span>
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
              placeholder="e.g. Cheque #1234, reference info..."
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
              disabled={!customerId || !saleId || !amount}
            >
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPaymentDialog;
