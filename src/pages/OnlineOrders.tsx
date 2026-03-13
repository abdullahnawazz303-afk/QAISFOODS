import { useState, useEffect } from "react";
import { useOnlineOrderStore } from "@/stores/onlineOrderStore";
import { useSalesStore } from "@/stores/salesStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatPKR } from "@/lib/formatters";
import { CheckCircle, XCircle, Truck, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { OnlineOrderStatus } from "@/types";

const statusVariant = (s: string) => {
  switch (s) {
    case "Pending":   return "secondary";
    case "Confirmed": return "default";
    case "Rejected":  return "destructive";
    case "Delivered": return "default";
    case "Cancelled": return "destructive";
    default:          return "secondary";
  }
};

const OnlineOrders = () => {
  const { orders, fetchOrders, updateStatus, loading } = useOnlineOrderStore();
  const { addSale } = useSalesStore();
  const { batches, fetchBatches } = useInventoryStore();

  const [search, setSearch]                   = useState("");
  const [statusFilter, setStatusFilter]       = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes]           = useState("");
  const [updating, setUpdating]               = useState(false);
  const [page, setPage]                       = useState(1);
  const pageSize = 10;

  // Delivery dialog state
  const [deliveryOpen, setDeliveryOpen]       = useState(false);
  const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null);
  const [pricePerKg, setPricePerKg]           = useState("");
  const [amountPaid, setAmountPaid]           = useState("0");
  const [deliveryNotes, setDeliveryNotes]     = useState("");
  const [submitting, setSubmitting]           = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchBatches();
  }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      o.customerName.toLowerCase().includes(q) ||
      o.orderRef.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages    = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged         = filtered.slice((page - 1) * pageSize, page * pageSize);
  const order         = selectedOrderId ? orders.find((o) => o.id === selectedOrderId) : null;
  const deliveryOrder = deliveryOrderId ? orders.find((o) => o.id === deliveryOrderId) : null;

  const totalKg      = deliveryOrder ? deliveryOrder.items.reduce((s, i) => s + i.quantity, 0) : 0;
  const price        = Number(pricePerKg) || 0;
  const totalAmount  = totalKg * price;
  const paid         = Math.min(Number(amountPaid) || 0, totalAmount);
  const outstanding  = totalAmount - paid;

  const handleStatusUpdate = async (status: OnlineOrderStatus) => {
    if (!selectedOrderId) return;
    setUpdating(true);
    const ok = await updateStatus(selectedOrderId, status, adminNotes);
    setUpdating(false);
    if (ok) {
      toast.success(`Order marked as ${status}`);
      setSelectedOrderId(null);
      setAdminNotes("");
    } else {
      toast.error("Failed to update order status");
    }
  };

  const openDeliveryDialog = (orderId: string) => {
    setDeliveryOrderId(orderId);
    setPricePerKg("");
    setAmountPaid("0");
    setDeliveryNotes("");
    setSelectedOrderId(null);
    setDeliveryOpen(true);
  };

  const handleConfirmDelivery = async () => {
    if (!deliveryOrder) return;
    if (price <= 0) { toast.error("Enter a valid sale price per kg"); return; }

    setSubmitting(true);

    // Match each item to best available inventory batch
    const saleItems = deliveryOrder.items.map((item) => {
      const batch = batches
        .filter(
          (b) =>
            b.itemName === item.itemName &&
            b.grade === item.grade &&
            b.remainingQuantity >= item.quantity
        )
        .sort((a, b) => b.remainingQuantity - a.remainingQuantity)[0];

      return {
        batchId: batch?.id ?? "",
        itemName: item.itemName,
        grade: item.grade,
        quantity: item.quantity,
        salePrice: price,
        subtotal: item.quantity * price,
      };
    });

    const missing = saleItems.find((i) => !i.batchId);
    if (missing) {
      toast.error(`No stock found for ${missing.itemName} Grade ${missing.grade}. Add inventory first.`);
      setSubmitting(false);
      return;
    }

    const saleId = await addSale({
      date: new Date().toISOString().split("T")[0],
      customerId: deliveryOrder.customerId,
      items: saleItems,
      totalAmount,
      amountPaid: paid,
      notes: deliveryNotes || `Online order ${deliveryOrder.orderRef}`,
      onlineOrderId: deliveryOrderId,
      saleRef: "",
    });

    if (!saleId) {
      toast.error("Failed to create sale. Check inventory stock levels.");
      setSubmitting(false);
      return;
    }

    await updateStatus(deliveryOrderId!, "Delivered");

    setSubmitting(false);
    setDeliveryOpen(false);
    setDeliveryOrderId(null);

    toast.success(
      outstanding > 0
        ? `Sale created. ${formatPKR(outstanding)} outstanding added to customer ledger.`
        : "Sale created and fully paid."
    );
  };

  const pendingCount = orders.filter((o) => o.status === "Pending").length;

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            Online Orders
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">{pendingCount} pending</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">Orders placed by customers through the portal</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by name or order ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Confirmed">Confirmed</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState title="No online orders yet" description="When customers place orders from the portal, they will appear here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Ref</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((o) => (
                  <TableRow key={o.id} className={o.status === "Pending" ? "bg-amber-50/50" : ""}>
                    <TableCell className="font-mono text-sm">{o.orderRef || o.id.slice(0, 8)}</TableCell>
                    <TableCell>{formatDate(o.date)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-xs text-muted-foreground">{o.customerCity}</div>
                    </TableCell>
                    <TableCell className="text-sm">{o.customerPhone}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate text-sm">
                        {o.items.map((i) => `${i.itemName} ${i.grade} (${i.quantity}kg)`).join(", ")}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {o.requestedDeliveryDate ? formatDate(o.requestedDeliveryDate) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm"
                        onClick={() => { setSelectedOrderId(o.id); setAdminNotes(o.adminNotes ?? ""); }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-end gap-2 items-center">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrderId} onOpenChange={(v) => { if (!v) { setSelectedOrderId(null); setAdminNotes(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Review and manage this customer order.</DialogDescription>
          </DialogHeader>
          {order && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm rounded-lg bg-muted/40 p-3">
                <div><span className="text-muted-foreground">Ref: </span><span className="font-mono text-xs">{order.orderRef}</span></div>
                <div><span className="text-muted-foreground">Date: </span>{formatDate(order.date)}</div>
                <div><span className="text-muted-foreground">Customer: </span><span className="font-medium">{order.customerName}</span></div>
                <div><span className="text-muted-foreground">Phone: </span>{order.customerPhone}</div>
              </div>

              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">Items</h4>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                    <span>{item.itemName} <span className="text-muted-foreground text-xs">Grade {item.grade}</span></span>
                    <span className="font-medium">{item.quantity} kg</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 mt-1 border-t">
                  <span>Total</span>
                  <span>{order.items.reduce((s, i) => s + i.quantity, 0)} kg</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
              </div>

              <div className="space-y-1">
                <Label>Admin Notes</Label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2}
                  disabled={order.status === "Delivered" || order.status === "Cancelled"} />
              </div>

              {order.status === "Pending" && (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => handleStatusUpdate("Confirmed")} disabled={updating}>
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />Confirm</>}
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleStatusUpdate("Cancelled")} disabled={updating}>
                    <XCircle className="h-4 w-4 mr-1" />Reject
                  </Button>
                </div>
              )}

              {order.status === "Confirmed" && (
                <Button className="w-full" onClick={() => openDeliveryDialog(order.id)}>
                  <Truck className="h-4 w-4 mr-2" />Mark as Delivered
                </Button>
              )}

              {(order.status === "Delivered" || order.status === "Cancelled") && (
                <p className="text-sm text-center text-muted-foreground">
                  This order is {order.status.toLowerCase()}.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delivery & Sale Dialog */}
      <Dialog open={deliveryOpen} onOpenChange={(v) => { if (!v && !submitting) setDeliveryOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
            <DialogDescription>Set sale price and payment to create the sale record.</DialogDescription>
          </DialogHeader>
          {deliveryOrder && (
            <div className="space-y-4">

              <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{deliveryOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Quantity</span>
                  <span className="font-medium">{totalKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="text-right text-xs max-w-[160px]">
                    {deliveryOrder.items.map((i) => `${i.itemName} (${i.quantity}kg)`).join(", ")}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Sale Price per kg (PKR) *</Label>
                <Input
                  type="number" min={1} placeholder="e.g. 250"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value)}
                  autoFocus
                />
              </div>

              {totalAmount > 0 && (
                <div className="rounded-lg border p-3 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Sale Amount</span>
                    <span className="font-semibold">{formatPKR(totalAmount)}</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Amount Paid Now (PKR)</Label>
                    <Input
                      type="number" min={0} max={totalAmount}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Outstanding</span>
                    <span className={outstanding > 0 ? "text-red-500" : "text-green-600"}>
                      {formatPKR(outstanding)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Notes (optional)</Label>
                <Input placeholder="Any notes..." value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDeliveryOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleConfirmDelivery} disabled={submitting || price <= 0}>
                  {submitting
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    : <><CheckCircle className="h-4 w-4 mr-2" />Confirm</>
                  }
                </Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default OnlineOrders;