import { useState, useMemo } from "react";
import { useVendorStore } from "@/stores/vendorStore";
import { useVendorPayableStore } from "@/stores/vendorPayableStore";
import { KpiCard } from "@/components/KpiCard";
import { EmptyState } from "@/components/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, AlertTriangle, Clock, CheckCircle, Landmark, Calendar } from "lucide-react";
import { formatPKR, formatDate, getTodayISO } from "@/lib/formatters";
import VendorPaymentDialog from "@/components/VendorPaymentDialog";
import type { VendorPayable, PayableStatus } from "@/types";

const VendorPayables = () => {
  const { vendors, getTotalPayables } = useVendorStore();
  const { payables, getOverduePayables, getUpcomingPayables, payments } = useVendorPayableStore();

  const [search, setSearch] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(0);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>();
  const [selectedPayableId, setSelectedPayableId] = useState<string | undefined>();
  const pageSize = 10;

  const overduePayables = getOverduePayables();
  const upcomingPayables = getUpcomingPayables(7);
  const totalPending = payables.reduce((sum, p) => sum + p.remainingAmount, 0);
  const totalOverdue = overduePayables.reduce((sum, p) => sum + p.remainingAmount, 0);
  const paidPayables = payables.filter(p => p.status === 'Paid');
  const totalPaidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const getVendorName = (id: string) => vendors.find(v => v.id === id)?.name || 'Unknown';

  const getStatusVariant = (status: PayableStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Overdue': return 'destructive';
      case 'Partially Paid': return 'secondary';
      default: return 'outline';
    }
  };

  const filtered = useMemo(() => {
    return payables.filter(p => {
      if (filterVendor && p.vendorId !== filterVendor) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.description.toLowerCase().includes(q) || getVendorName(p.vendorId).toLowerCase().includes(q);
      }
      return true;
    });
  }, [payables, filterVendor, filterStatus, search, vendors]);

  const pendingFiltered = filtered.filter(p => p.remainingAmount > 0);
  const paidFiltered = filtered.filter(p => p.status === 'Paid');

  const paged = pendingFiltered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(pendingFiltered.length / pageSize);

  const handlePayPayable = (vendorId: string, payableId: string) => {
    setSelectedVendorId(vendorId);
    setSelectedPayableId(payableId);
    setPaymentDialogOpen(true);
  };

  const handlePaymentDialogClose = (open: boolean) => {
    setPaymentDialogOpen(open);
    if (!open) {
      setSelectedVendorId(undefined);
      setSelectedPayableId(undefined);
    }
  };

  const PayablesTable = ({ data, showActions = true }: { data: VendorPayable[], showActions?: boolean }) => (
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
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(p => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{getVendorName(p.vendorId)}</TableCell>
            <TableCell className="max-w-[200px] truncate">{p.description}</TableCell>
            <TableCell>{formatDate(p.purchaseDate)}</TableCell>
            <TableCell className={p.status === 'Overdue' ? 'text-destructive font-medium' : ''}>
              {formatDate(p.dueDate)}
            </TableCell>
            <TableCell className="text-right">{formatPKR(p.totalAmount)}</TableCell>
            <TableCell className="text-right status-healthy">{formatPKR(p.paidAmount)}</TableCell>
            <TableCell className={`text-right font-medium ${p.remainingAmount > 0 ? 'status-overdue' : 'status-healthy'}`}>
              {formatPKR(p.remainingAmount)}
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(p.status)}>{p.status}</Badge>
            </TableCell>
            {showActions && (
              <TableCell className="text-right">
                {p.remainingAmount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePayPayable(p.vendorId, p.id)}
                  >
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
          <h1 className="text-2xl font-display font-bold">Vendor Payables</h1>
          <p className="text-sm text-muted-foreground">Track and manage vendor payments and dues</p>
        </div>
        <Button onClick={() => setPaymentDialogOpen(true)}>
          <CreditCard className="h-4 w-4 mr-2" /> Make Payment
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total Pending" 
          value={formatPKR(totalPending)} 
          subtitle={`${pendingFiltered.length} invoices`} 
          icon={Landmark} 
        />
        <KpiCard 
          title="Overdue Amount" 
          value={formatPKR(totalOverdue)} 
          subtitle={`${overduePayables.length} overdue`} 
          icon={AlertTriangle}
          variant={overduePayables.length > 0 ? "danger" : undefined}
        />
        <KpiCard 
          title="Due in 7 Days" 
          value={formatPKR(upcomingPayables.reduce((s, p) => s + p.remainingAmount, 0))} 
          subtitle={`${upcomingPayables.length} upcoming`} 
          icon={Clock}
          variant={upcomingPayables.length > 0 ? "warning" : undefined}
        />
        <KpiCard 
          title="Total Paid" 
          value={formatPKR(totalPaidAmount)} 
          subtitle={`${paidPayables.length} cleared`} 
          icon={CheckCircle}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input 
          placeholder="Search payables..." 
          value={search} 
          onChange={(e) => { setSearch(e.target.value); setPage(0); }} 
          className="max-w-xs" 
        />
        <Select value={filterVendor} onValueChange={(v) => { setFilterVendor(v === "all" ? "" : v); setPage(0); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Vendors" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setPage(0); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {payables.length === 0 ? (
        <EmptyState 
          title="No payables yet" 
          description="Payables will appear here when you add inventory from vendors. Go to Inventory to add your first purchase." 
        />
      ) : (
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingFiltered.length})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue ({overduePayables.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="h-4 w-4" />
              Due Soon ({upcomingPayables.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Paid ({paidFiltered.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingFiltered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No pending payables found.</div>
            ) : (
              <>
                <div className="rounded-lg border">
                  <PayablesTable data={paged} />
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, pendingFiltered.length)} of {pendingFiltered.length}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                      <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="overdue">
            {overduePayables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No overdue payables. Great job staying on top of payments!</div>
            ) : (
              <div className="rounded-lg border">
                <PayablesTable data={overduePayables} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingPayables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No payments due in the next 7 days.</div>
            ) : (
              <div className="rounded-lg border">
                <PayablesTable data={upcomingPayables} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="paid">
            {paidFiltered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No paid payables found.</div>
            ) : (
              <div className="rounded-lg border">
                <PayablesTable data={paidFiltered} showActions={false} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Vendor Payment Dialog */}
      <VendorPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={handlePaymentDialogClose}
        preSelectedVendorId={selectedVendorId}
        preSelectedPayableId={selectedPayableId}
      />
    </div>
  );
};

export default VendorPayables;
