import { useState } from "react";
import { useCustomerStore } from "@/stores/customerStore";
import { useSalesStore } from "@/stores/salesStore";
import { EmptyState } from "@/components/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CreditCard, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatDate } from "@/lib/formatters";
import RecordPaymentDialog from "@/components/RecordPaymentDialog";

const Customers = () => {
  const { customers, addCustomer, getOutstanding } = useCustomerStore();
  const { sales } = useSalesStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Payment dialog state
  const [payOpen, setPayOpen] = useState(false);
  const [payCustomerId, setPayCustomerId] = useState<string | undefined>(undefined);

  // Customer detail dialog
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addCustomer({
      name: fd.get("name") as string,
      contactPerson: fd.get("contactPerson") as string || "",
      phone: fd.get("phone") as string,
      city: fd.get("city") as string || "",
      address: fd.get("address") as string || "",
      openingBalance: Number(fd.get("openingBalance")) || 0,
      creditLimit: Number(fd.get("creditLimit")) || 0,
      notes: fd.get("notes") as string || "",
      isActive: true,
    });
    setOpen(false);
    toast.success("Customer added");
  };

  const openPayment = (customerId: string) => {
    setPayCustomerId(customerId);
    setPayOpen(true);
  };

  const filtered = customers.filter(c => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
  });

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  // Detail customer
  const detailCustomer = customers.find(c => c.id === detailCustomerId);
  const detailSales = detailCustomerId
    ? sales.filter(s => s.customerId === detailCustomerId)
    : [];
  const pendingSales = detailSales.filter(s => s.outstanding > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage wholesale customer list</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setPayCustomerId(undefined); setPayOpen(true); }}>
            <CreditCard className="h-4 w-4 mr-2" /> Record Payment
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Customer</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name *</Label><Input name="name" required maxLength={100} /></div>
                  <div className="space-y-2"><Label>Contact Person</Label><Input name="contactPerson" maxLength={100} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Phone *</Label><Input name="phone" required maxLength={20} /></div>
                  <div className="space-y-2"><Label>City</Label><Input name="city" maxLength={50} /></div>
                </div>
                <div className="space-y-2"><Label>Address</Label><Input name="address" maxLength={200} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Opening Balance (PKR)</Label>
                    <Input name="openingBalance" type="number" min="0" defaultValue="0" />
                    <p className="text-xs text-muted-foreground">Amount this customer already owes you.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Credit Limit (PKR)</Label>
                    <Input name="creditLimit" type="number" min="0" defaultValue="0" />
                  </div>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea name="notes" maxLength={500} /></div>
                <Button type="submit" className="w-full">Add Customer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Input placeholder="Search customers..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="max-w-xs" />

      {customers.length === 0 ? (
        <EmptyState title="No customers yet" description="No records found. Add your first customer to get started." actionLabel="Add First Customer" onAction={() => setOpen(true)} />
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(c => {
                  const outstanding = getOutstanding(c.id);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.city}</TableCell>
                      <TableCell className={`text-right font-medium ${outstanding > 0 ? 'status-overdue' : 'status-healthy'}`}>
                        {formatPKR(outstanding)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setDetailCustomerId(c.id)} title="View Profile">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {outstanding > 0 && (
                            <Button size="sm" variant="outline" onClick={() => openPayment(c.id)} title="Record Payment">
                              <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        preSelectedCustomerId={payCustomerId}
      />

      {/* Customer Detail/Profile Dialog */}
      <Dialog open={!!detailCustomerId} onOpenChange={(v) => { if (!v) setDetailCustomerId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Profile — {detailCustomer?.name}</DialogTitle>
          </DialogHeader>
          {detailCustomer && (
            <div className="space-y-5">
              {/* Info cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-sm">{detailCustomer.phone}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground">City</p>
                  <p className="font-medium text-sm">{detailCustomer.city || "—"}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                  <p className={`font-semibold text-sm ${getOutstanding(detailCustomer.id) > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {formatPKR(getOutstanding(detailCustomer.id))}
                  </p>
                </div>
              </div>

              {/* Pending Orders */}
              {pendingSales.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Pending Orders ({pendingSales.length})</h4>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Pending</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingSales.map(s => (
                          <TableRow key={s.id}>
                            <TableCell className="font-mono text-xs">{s.id}</TableCell>
                            <TableCell>{formatDate(s.date)}</TableCell>
                            <TableCell className="text-right">{formatPKR(s.totalAmount)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatPKR(s.amountPaid)}</TableCell>
                            <TableCell className="text-right text-destructive font-medium">{formatPKR(s.outstanding)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDetailCustomerId(null);
                                  setPayCustomerId(detailCustomer.id);
                                  setPayOpen(true);
                                }}
                              >
                                <CreditCard className="h-3 w-3 mr-1" /> Pay
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* All Orders */}
              <div>
                <h4 className="font-semibold text-sm mb-2">All Orders ({detailSales.length})</h4>
                {detailSales.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailSales.map(s => (
                          <TableRow key={s.id}>
                            <TableCell className="font-mono text-xs">{s.id}</TableCell>
                            <TableCell>{formatDate(s.date)}</TableCell>
                            <TableCell className="text-right">{formatPKR(s.totalAmount)}</TableCell>
                            <TableCell>
                              <Badge variant={s.paymentStatus === 'Paid' ? 'default' : s.paymentStatus === 'Unpaid' ? 'destructive' : 'secondary'}>
                                {s.paymentStatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Quick pay button */}
              {getOutstanding(detailCustomer.id) > 0 && (
                <Button
                  className="w-full"
                  onClick={() => {
                    setDetailCustomerId(null);
                    openPayment(detailCustomer.id);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" /> Record Payment
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
