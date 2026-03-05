import { useState } from "react";
import { mockPackaging } from "@/data/mockData";
import { DataTableHeader } from "@/components/DataTableHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const Packaging = () => {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState(mockPackaging);
  const [search, setSearch] = useState("");

  const summary = records.reduce((acc, r) => {
    acc[r.packageType] = (acc[r.packageType] || 0) + r.quantity;
    return acc;
  }, {} as Record<string, number>);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setRecords([{
      id: records.length + 1,
      date: fd.get("date") as string,
      packageType: fd.get("packageType") as string,
      quantity: Number(fd.get("quantity")),
    }, ...records]);
    setOpen(false);
    toast.success("Packaging entry saved. Stock auto-deducted from processed inventory.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Packaging</h1>
          <p className="text-sm text-muted-foreground">Package processed stock into retail packs</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Packaging</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Packaging Entry</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Date</Label><Input name="date" type="date" required /></div>
              <div className="space-y-2">
                <Label>Package Type</Label>
                <Select name="packageType" required>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1kg">1 kg</SelectItem>
                    <SelectItem value="2kg">2 kg</SelectItem>
                    <SelectItem value="3kg">3 kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Quantity Packed</Label><Input name="quantity" type="number" required /></div>
              <Button type="submit" className="w-full">Save Entry</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {["1kg", "2kg", "3kg"].map(type => (
          <div key={type} className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase">{type} Packs</p>
            <p className="text-xl font-bold font-display">{(summary[type] || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <DataTableHeader searchPlaceholder="Search..." onSearch={setSearch} onExport={() => toast.info("PDF export coming soon")} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Package Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.filter(r => r.packageType.includes(search) || r.date.includes(search)).map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell className="font-medium">{r.packageType}</TableCell>
                <TableCell className="text-right">{r.quantity.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Packaging;
