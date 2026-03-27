import { useState, useEffect } from "react";
import { useVendorStore } from "@/stores/vendorStore";
import { useBookingStore } from "@/stores/bookingStore";
import { useCashFlowStore } from "@/stores/cashFlowStore";
import { EmptyState } from "@/components/EmptyState";
import { KpiCard } from "@/components/KpiCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, AlertTriangle, Clock, CheckCircle, Landmark, Calendar } from "lucide-react";
import { toast } from "sonner";
import { formatPKR, formatDate, getTodayISO } from "@/lib/formatters";
import type { VendorPayable } from "@/types";

const VendorPayables = () => {
  const {
    vendors, purchases,
    fetchVendors, fetchPurchases,
    getPayables, getOverduePayables, getUpcomingPayables,
    getTotalPayables, recordPayment,
  } = useVendorStore();
  const { addEntry: addCashEntry } = useCashFlowStore();

  const [search, setSearch] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<VendorPayable | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVendors();
    fetchPurchases();
  }, []);

  const payables = getPayables();
  const overduePayables = getOverduePayables();
  const upcomingPayables = getUpcomingPayables(7);
  const paidPurchases = purchases.filter(p => p.paymentStatus === 'Paid');

  const totalPending = payables.reduce((s, p) => s + p.remainingAmount, 0);
  const totalOverdue = overduePayables.reduce((s, p) => s + p.remainingAmount, 0);
  const totalPaid = paidPurchases.reduce((s, p) => s + p.totalAmount, 0);

  const getVendorName = (id: string) => vendors.find(v => v.id === id)?.name ?? 'Unknown';

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'Paid') return 'default';
    if (status === 'Overdue') return 'destructive';
    if (status === 'Partially Paid') return 'secondary';
    return 'outline';
  };

  const filtered = (list: VendorPayable[]) => list.filter(p => {
    if (filterVendor && p.vendorId !== filterVendor) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.description.toLowerCase().includes(q) || getVendorName(p.vendorId).toLowerCase().includes(q);
    }
    return true;
  });

  const handlePayClick = (p: VendorPayable) => {
    setSelectedPayable(p);
    setPayOpen(true);
  };

  const handlePaySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPayable) return;
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount"));
    const method = fd.get("method") as string;
    const notes = fd.get("notes") as string || "";

    if (amount <= 0 || amount > selectedPayable.remainingAmount) {
      toast.error("Invalid amount");
      return;
    }

    setSubmitting(true);
    
    if (selectedPayable.type === 'booking') {
      await useBookingStore.getState().addPayment(selectedPayable.id, amount, notes);
    } else {
      await recordPayment(selectedPayable.id, selectedPayable.vendorId, amount, method, notes);
    }

    // Record cash outflow
    await addCashEntry(getTodayISO(), {
      type: 'out',
      category: 'Vendor Payment',
      amount,
      description: `Payment to ${getVendorName(selectedPayable.vendorId)} — ${notes || selectedPayable.description}`,
    });

    // Refresh everything for accurate counters
    await fetchVendors();
    await fetchPurchases();
    await useBookingStore.getState().fetchBookings();

    setSubmitting(false);
    setPayOpen(false);
    setSelectedPayable(null);
    toast.success("Payment recorded");
  };

  const PayablesTable = ({ data, showPay = true }: { data: VendorPayable[]; showPay?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Purchase Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Paid</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
          <TableHead>Status</TableHead>
          {showPay && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showPay ? 9 : 8} className="text-center py-8 text-muted-foreground">
              No records found
            </TableCell>
          </TableRow>
        ) : data.map(p => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{getVendorName(p.vendorId)}</TableCell>
            <TableCell className="max-w-[200px] truncate text-sm">{p.description}</TableCell>
            <TableCell>{formatDate(p.purchaseDate)}</TableCell>
            <TableCell className={p.status === 'Overdue' ? 'text-destructive font-medium' : ''}>
              {formatDate(p.dueDate)}
            </TableCell>
            <TableCell className="text-right">{formatPKR(p.totalAmount)}</TableCell>
            <TableCell className="text-right text-green-600">{formatPKR(p.paidAmount)}</TableCell>
            <TableCell className={`text-right font-medium ${p.remainingAmount > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatPKR(p.remainingAmount)}
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(p.status)}>{p.status}</Badge>
            </TableCell>
            {showPay && (
              <TableCell>
                {p.remainingAmount > 0 && (
                  <Button size="sm" variant="outline" onClick={() => handlePayClick(p)}>
                    <CreditCard className="h-3 w-3 mr-1" /> Pay
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Payables</h1>
          <p className="text-sm text-muted-foreground">Track and manage vendor payments and dues</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Pending" value={formatPKR(totalPending)}
          subtitle={`${payables.length} invoices`} icon={Landmark} />
        <KpiCard title="Overdue Amount" value={formatPKR(totalOverdue)}
          subtitle={`${overduePayables.length} overdue`} icon={AlertTriangle}
          variant={overduePayables.length > 0 ? "danger" : undefined} />
        <KpiCard title="Due in 7 Days"
          value={formatPKR(upcomingPayables.reduce((s, p) => s + p.remainingAmount, 0))}
          subtitle={`${upcomingPayables.length} upcoming`} icon={Clock}
          variant={upcomingPayables.length > 0 ? "warning" : undefined} />
        <KpiCard title="Total Paid" value={formatPKR(totalPaid)}
          subtitle={`${paidPurchases.length} cleared`} icon={CheckCircle} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Search..." value={search}
          onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filterVendor} onValueChange={v => setFilterVendor(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Vendors" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {purchases.length === 0 ? (
        <EmptyState
          title="No payables yet"
          description="Payables are created automatically when you add inventory stock. Go to Inventory → Add Stock and fill in the payment details."
        />
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending"><Clock className="h-4 w-4 mr-1" />Pending ({filtered(payables).length})</TabsTrigger>
            <TabsTrigger value="overdue"><AlertTriangle className="h-4 w-4 mr-1" />Overdue ({filtered(overduePayables).length})</TabsTrigger>
            <TabsTrigger value="upcoming"><Calendar className="h-4 w-4 mr-1" />Due Soon ({filtered(upcomingPayables).length})</TabsTrigger>
            <TabsTrigger value="paid"><CheckCircle className="h-4 w-4 mr-1" />Paid ({paidPurchases.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="rounded-lg border"><PayablesTable data={filtered(payables)} /></div>
          </TabsContent>
          <TabsContent value="overdue">
            <div className="rounded-lg border"><PayablesTable data={filtered(overduePayables)} /></div>
          </TabsContent>
          <TabsContent value="upcoming">
            <div className="rounded-lg border"><PayablesTable data={filtered(upcomingPayables)} /></div>
          </TabsContent>
          <TabsContent value="paid">
            <div className="rounded-lg border">
              <PayablesTable
                data={paidPurchases.map(p => ({
                  id: p.id,
                  vendorId: p.vendorId,
                  purchaseRef: p.purchaseRef,
                  purchaseDate: p.purchaseDate,
                  dueDate: p.dueDate ?? p.purchaseDate,
                  paymentTermsDays: p.paymentTermsDays,
                  totalAmount: p.totalAmount,
                  paidAmount: p.amountPaid,
                  remainingAmount: 0,
                  status: 'Paid' as const,
                  description: p.items.map((i: any) => i.itemName).join(', '),
                }))}
                showPay={false}
              />
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={v => { setPayOpen(v); if (!v) setSelectedPayable(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          {selectedPayable && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor</span>
                  <span className="font-medium">{getVendorName(selectedPayable.vendorId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description</span>
                  <span className="text-right max-w-[200px] truncate">{selectedPayable.description}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                  <span>Remaining</span>
                  <span className="text-destructive">{formatPKR(selectedPayable.remainingAmount)}</span>
                </div>
              </div>
              <form onSubmit={handlePaySubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label>Amount (PKR)</Label>
                  <Input name="amount" type="number" min="1"
                    max={selectedPayable.remainingAmount} required autoFocus
                    placeholder={`Max: ${formatPKR(selectedPayable.remainingAmount)}`} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select name="method" defaultValue="Cash">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input name="notes" placeholder="Optional" />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setPayOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? "Saving..." : "Record Payment"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorPayables;