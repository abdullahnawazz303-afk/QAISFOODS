import { useState, useEffect } from "react";
import { useVendorStore } from "@/stores/vendorStore";
import { EmptyState } from "@/components/EmptyState";
import { KpiCard } from "@/components/KpiCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CreditCard, Users, AlertTriangle, Landmark } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatPKR } from "@/lib/formatters";

const Vendors = () => {
  const {
    vendors, loading,
    fetchVendors, fetchPurchases,
    addVendor,
    getOutstanding, getTotalPayables,
    getPayables, getOverduePayables,
  } = useVendorStore();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchVendors();
    fetchPurchases();
  }, []);

  const payables = getPayables();
  const overduePayables = getOverduePayables();
  const totalOverdue = overduePayables.reduce((s, p) => s + p.remainingAmount, 0);
  const vendorsWithOutstanding = vendors.filter(v => getOutstanding(v.id) > 0).length;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = await addVendor({
      name: fd.get("name") as string,
      contactPerson: fd.get("contactPerson") as string || "",
      phone: fd.get("phone") as string,
      city: fd.get("city") as string || "",
      address: fd.get("address") as string || "",
      openingBalance: Number(fd.get("openingBalance")) || 0,
      notes: fd.get("notes") as string || "",
      isActive: true,
    });
    if (id) { setOpen(false); toast.success("Vendor added"); }
    else toast.error("Failed to add vendor");
  };

  const getVendorPendingCount = (vendorId: string) =>
    payables.filter(p => p.vendorId === vendorId && p.remainingAmount > 0).length;

  const filtered = vendors.filter(v =>
    !search ||
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.phone.includes(search)
  );
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Vendors</h1>
          <p className="text-sm text-muted-foreground">Manage supplier list and payments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Vendor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name *</Label><Input name="name" required /></div>
                <div className="space-y-2"><Label>Contact Person</Label><Input name="contactPerson" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone *</Label><Input name="phone" required /></div>
                <div className="space-y-2"><Label>City</Label><Input name="city" /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input name="address" /></div>
              <div className="space-y-2">
                <Label>Opening Balance (PKR)</Label>
                <Input name="openingBalance" type="number" min="0" defaultValue="0" />
                <p className="text-xs text-muted-foreground">Amount you already owe this vendor before today.</p>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea name="notes" /></div>
              <Button type="submit" className="w-full">Add Vendor</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Total Vendors"
          value={String(vendors.length)}
          subtitle={`${vendors.filter(v => v.isActive).length} active`}
          icon={Users}
        />
        <KpiCard
          title="Total Payables"
          value={formatPKR(getTotalPayables())}
          subtitle="Outstanding to vendors"
          icon={Landmark}
          variant={getTotalPayables() > 0 ? "warning" : undefined}
        />
        <KpiCard
          title="Vendors with Dues"
          value={String(vendorsWithOutstanding)}
          subtitle="Need payment"
          icon={CreditCard}
          variant={vendorsWithOutstanding > 0 ? "warning" : undefined}
        />
        <KpiCard
          title="Overdue Payables"
          value={formatPKR(totalOverdue)}
          subtitle={`${overduePayables.length} overdue`}
          icon={AlertTriangle}
          variant={overduePayables.length > 0 ? "danger" : undefined}
        />
      </div>

      <Input
        placeholder="Search vendors..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(0); }}
        className="max-w-xs"
      />

      {vendors.length === 0 ? (
        <EmptyState title="No vendors yet" description="Add your first vendor to get started." actionLabel="Add Vendor" onAction={() => setOpen(true)} />
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
                  <TableHead className="text-center">Pending Invoices</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(v => {
                  const outstanding = getOutstanding(v.id);
                  const pending = getVendorPendingCount(v.id);
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell>{v.phone}</TableCell>
                      <TableCell>{v.city}</TableCell>
                      <TableCell className={`text-right font-medium ${outstanding > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {formatPKR(outstanding)}
                      </TableCell>
                      <TableCell className="text-center">
                        {pending > 0
                          ? <Badge variant="secondary">{pending}</Badge>
                          : <span className="text-muted-foreground">—</span>
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.isActive ? 'default' : 'secondary'}>
                          {v.isActive ? 'Active' : 'Inactive'}
                        </Badge>
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
    </div>
  );
};

export default Vendors;