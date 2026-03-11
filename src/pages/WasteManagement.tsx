import { useState } from "react";
import { useWasteStore } from "@/stores/wasteStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useVendorStore } from "@/stores/vendorStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { DataTableHeader } from "@/components/DataTableHeader";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Trash2, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import { formatPKR, formatKG, formatDate, getTodayISO } from "@/lib/formatters";

const PAGE_SIZE = 10;

export default function WasteManagement() {
  const wasteStore = useWasteStore();
  const inventoryStore = useInventoryStore();
  const vendorStore = useVendorStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [wasteQty, setWasteQty] = useState("");
  const [date, setDate] = useState(getTodayISO());
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [filterVendor, setFilterVendor] = useState("all");
  const [page, setPage] = useState(1);

  const batches = inventoryStore.batches.filter((b) => b.remainingQuantity > 0);
  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  const getVendorName = (id: string) => vendorStore.vendors.find((v) => v.id === id)?.name || "Unknown";
  const getBatchRef = (id: string) => inventoryStore.batches.find((b) => b.id === id)?.batchRef || id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !wasteQty || Number(wasteQty) <= 0) {
      toast.error("Select a batch and enter waste quantity");
      return;
    }
    const batch = inventoryStore.batches.find((b) => b.id === selectedBatchId);
    if (!batch) { toast.error("Batch not found"); return; }

    const waste = Number(wasteQty);
    if (waste > batch.remainingQuantity) {
      toast.error(`Waste cannot exceed remaining quantity (${formatKG(batch.remainingQuantity)})`);
      return;
    }

    // Deduct waste from inventory batch
    const success = inventoryStore.deductFromBatch(selectedBatchId, waste);
    if (!success) { toast.error("Failed to deduct from batch"); return; }

    const cleanedQuantity = batch.remainingQuantity - waste;

    wasteStore.addEntry({
      date,
      batchId: selectedBatchId,
      vendorId: batch.vendorId,
      itemName: batch.itemName,
      grade: batch.grade,
      originalQuantity: batch.remainingQuantity,
      wasteQuantity: waste,
      cleanedQuantity,
      notes,
    });

    toast.success(`Cleansing recorded: ${formatKG(waste)} waste separated, ${formatKG(cleanedQuantity)} cleaned stock remains`);
    setSelectedBatchId("");
    setWasteQty("");
    setNotes("");
    setDialogOpen(false);
  };

  // Filtering
  const filtered = wasteStore.entries.filter((e) => {
    const matchSearch =
      e.itemName.toLowerCase().includes(search.toLowerCase()) ||
      getBatchRef(e.batchId).toLowerCase().includes(search.toLowerCase()) ||
      getVendorName(e.vendorId).toLowerCase().includes(search.toLowerCase());
    const matchVendor = filterVendor === "all" || e.vendorId === filterVendor;
    return matchSearch && matchVendor;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalWaste = wasteStore.entries.reduce((s, e) => s + e.wasteQuantity, 0);
  const totalCleaned = wasteStore.entries.reduce((s, e) => s + e.cleanedQuantity, 0);
  const uniqueVendors = new Set(wasteStore.entries.map((e) => e.vendorId)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Waste Management</h1>
          <p className="text-sm text-muted-foreground">Track cleansing process waste from vendor batches</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Record Cleansing</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Cleansing Process</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Select Batch *</Label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger><SelectValue placeholder="Choose a batch" /></SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.batchRef} — {b.itemName} {b.grade} ({formatKG(b.remainingQuantity)}) — {getVendorName(b.vendorId)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedBatch && (
                <div className="rounded-lg border p-3 bg-muted/50 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Item:</span> {selectedBatch.itemName} ({selectedBatch.grade})</p>
                  <p><span className="text-muted-foreground">Vendor:</span> {getVendorName(selectedBatch.vendorId)}</p>
                  <p><span className="text-muted-foreground">Remaining:</span> {formatKG(selectedBatch.remainingQuantity)}</p>
                </div>
              )}
              <div className="space-y-1">
                <Label>Waste Quantity (kg) *</Label>
                <Input
                  type="number"
                  value={wasteQty}
                  onChange={(e) => setWasteQty(e.target.value)}
                  placeholder="Enter waste amount"
                  max={selectedBatch?.remainingQuantity}
                />
                {selectedBatch && wasteQty && Number(wasteQty) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cleaned stock after: {formatKG(selectedBatch.remainingQuantity - Number(wasteQty))}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              </div>
              <Button type="submit" className="w-full">Record Waste & Update Stock</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Total Waste" value={formatKG(totalWaste)} icon={Trash2} />
        <KpiCard title="Total Cleaned" value={formatKG(totalCleaned)} icon={Filter} />
        <KpiCard title="Vendors Affected" value={String(uniqueVendors)} icon={Search} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search item, batch, vendor..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="sm:max-w-xs"
            />
            <Select value={filterVendor} onValueChange={(v) => { setFilterVendor(v); setPage(1); }}>
              <SelectTrigger className="sm:max-w-[200px]">
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendorStore.vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {paged.length === 0 ? (
            <EmptyState title="No waste records" description="Record your first cleansing process to start tracking waste." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Original (kg)</TableHead>
                  <TableHead className="text-right">Waste (kg)</TableHead>
                  <TableHead className="text-right">Cleaned (kg)</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.date)}</TableCell>
                    <TableCell className="font-mono text-xs">{getBatchRef(e.batchId)}</TableCell>
                    <TableCell>{e.itemName}</TableCell>
                    <TableCell><Badge variant="outline">{e.grade}</Badge></TableCell>
                    <TableCell>{getVendorName(e.vendorId)}</TableCell>
                    <TableCell className="text-right">{formatKG(e.originalQuantity)}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">{formatKG(e.wasteQuantity)}</TableCell>
                    <TableCell className="text-right text-primary font-medium">{formatKG(e.cleanedQuantity)}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground text-sm">{e.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground py-2">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
