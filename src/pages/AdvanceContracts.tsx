import { useState } from "react";
import { mockContracts } from "@/data/mockData";
import { DataTableHeader } from "@/components/DataTableHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const AdvanceContracts = () => {
  const [open, setOpen] = useState(false);
  const [contracts, setContracts] = useState(mockContracts);
  const [search, setSearch] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const totalQty = Number(fd.get("totalQty"));
    const pricePerKg = Number(fd.get("pricePerKg"));
    const advancePaid = Number(fd.get("advancePaid"));
    setContracts([{
      id: `AC-2026-${String(contracts.length + 1).padStart(3, "0")}`,
      supplier: fd.get("supplier") as string,
      totalQty,
      pricePerKg,
      advancePaid,
      remaining: totalQty * pricePerKg - advancePaid,
      deliveryDate: fd.get("deliveryDate") as string,
      notes: fd.get("notes") as string,
      locked: false,
    }, ...contracts]);
    setOpen(false);
    toast.success("Contract created. You can lock it once confirmed.");
  };

  const lockContract = (id: string) => {
    setContracts(contracts.map(c => c.id === id ? { ...c, locked: true } : c));
    toast.success("Contract locked. Only adjustment entries allowed.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Advance Contracts</h1>
          <p className="text-sm text-muted-foreground">Manage advance bookings with suppliers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Contract</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Advance Booking</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Supplier</Label><Input name="supplier" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Total Quantity (kg)</Label><Input name="totalQty" type="number" required /></div>
                <div className="space-y-2"><Label>Locked Price (Rs/kg)</Label><Input name="pricePerKg" type="number" required /></div>
              </div>
              <div className="space-y-2"><Label>Advance Paid (Rs)</Label><Input name="advancePaid" type="number" required /></div>
              <div className="space-y-2"><Label>Delivery Date</Label><Input name="deliveryDate" type="date" required /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea name="notes" /></div>
              <Button type="submit" className="w-full">Create Contract</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTableHeader searchPlaceholder="Search by supplier or contract ID..." onSearch={setSearch} onExport={() => toast.info("PDF export coming soon")} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Qty (kg)</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Advance</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.filter(c => c.supplier.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())).map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.id}</TableCell>
                <TableCell className="font-medium">{c.supplier}</TableCell>
                <TableCell className="text-right">{c.totalQty.toLocaleString()}</TableCell>
                <TableCell className="text-right">Rs {c.pricePerKg}</TableCell>
                <TableCell className="text-right">Rs {c.advancePaid.toLocaleString()}</TableCell>
                <TableCell className="text-right">Rs {c.remaining.toLocaleString()}</TableCell>
                <TableCell>{c.deliveryDate}</TableCell>
                <TableCell>
                  {c.locked ? (
                    <Badge variant="default" className="gap-1"><Lock className="h-3 w-3" /> Locked</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><Unlock className="h-3 w-3" /> Draft</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {!c.locked && (
                    <Button size="sm" variant="outline" onClick={() => lockContract(c.id)}>
                      <Lock className="h-3 w-3 mr-1" /> Lock
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdvanceContracts;
