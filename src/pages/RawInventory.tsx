import { useState } from "react";
import { mockPurchases } from "@/data/mockData";
import { DataTableHeader } from "@/components/DataTableHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const RawInventory = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [purchases, setPurchases] = useState(mockPurchases);

  const filtered = purchases.filter(p =>
    p.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = purchases.reduce((a, b) => a + b.quantity, 0);
  const totalValue = purchases.reduce((a, b) => a + b.quantity * b.costPerKg, 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newPurchase = {
      id: purchases.length + 1,
      supplier: fd.get("supplier") as string,
      quantity: Number(fd.get("quantity")),
      costPerKg: Number(fd.get("costPerKg")),
      date: fd.get("date") as string,
      notes: fd.get("notes") as string,
    };
    setPurchases([newPurchase, ...purchases]);
    setOpen(false);
    toast.success("Purchase recorded successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Raw Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage lentil purchases and raw stock</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Purchase</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record New Purchase</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Supplier Name</Label><Input name="supplier" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Quantity (kg)</Label><Input name="quantity" type="number" required /></div>
                <div className="space-y-2"><Label>Cost per kg (Rs)</Label><Input name="costPerKg" type="number" required /></div>
              </div>
              <div className="space-y-2"><Label>Purchase Date</Label><Input name="date" type="date" required /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea name="notes" /></div>
              <Button type="submit" className="w-full">Save Purchase</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase">Total Raw Stock</p>
          <p className="text-xl font-bold font-display">{totalStock.toLocaleString()} kg</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase">Total Value</p>
          <p className="text-xl font-bold font-display">Rs {totalValue.toLocaleString()}</p>
        </div>
      </div>

      <DataTableHeader searchPlaceholder="Search by supplier..." onSearch={setSearch} onExport={() => toast.info("PDF export coming soon")} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Qty (kg)</TableHead>
              <TableHead className="text-right">Rate (Rs/kg)</TableHead>
              <TableHead className="text-right">Total (Rs)</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.date}</TableCell>
                <TableCell className="font-medium">{p.supplier}</TableCell>
                <TableCell className="text-right">{p.quantity.toLocaleString()}</TableCell>
                <TableCell className="text-right">{p.costPerKg}</TableCell>
                <TableCell className="text-right">{(p.quantity * p.costPerKg).toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RawInventory;
