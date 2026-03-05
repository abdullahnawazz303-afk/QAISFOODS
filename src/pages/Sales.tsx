import { useState } from "react";
import { mockSales } from "@/data/mockData";
import { DataTableHeader } from "@/components/DataTableHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Sales = () => {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState(mockSales);
  const [search, setSearch] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount"));
    const method = fd.get("paymentMethod") as string;
    setRecords([{
      id: records.length + 1,
      customer: fd.get("customer") as string,
      product: fd.get("product") as string,
      quantity: Number(fd.get("quantity")),
      date: fd.get("date") as string,
      paymentMethod: method as "Cash" | "Credit" | "Cheque",
      amount,
      outstanding: method === "Cash" ? 0 : amount,
    }, ...records]);
    setOpen(false);
    toast.success("Sale recorded successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Sales</h1>
          <p className="text-sm text-muted-foreground">Record sales and track customer balances</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Sale</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Sale</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Customer Name</Label><Input name="customer" required /></div>
              <div className="space-y-2"><Label>Product</Label><Input name="product" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Quantity</Label><Input name="quantity" type="number" required /></div>
                <div className="space-y-2"><Label>Amount (Rs)</Label><Input name="amount" type="number" required /></div>
              </div>
              <div className="space-y-2"><Label>Sale Date</Label><Input name="date" type="date" required /></div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select name="paymentMethod" required>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit">Credit</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Save Sale</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTableHeader searchPlaceholder="Search by customer..." onSearch={setSearch} onExport={() => toast.info("PDF export coming soon")} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.filter(r => r.customer.toLowerCase().includes(search.toLowerCase())).map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell className="font-medium">{r.customer}</TableCell>
                <TableCell>{r.product}</TableCell>
                <TableCell className="text-right">{r.quantity}</TableCell>
                <TableCell>
                  <Badge variant={r.paymentMethod === "Cash" ? "default" : "secondary"}>{r.paymentMethod}</Badge>
                </TableCell>
                <TableCell className="text-right">Rs {r.amount.toLocaleString()}</TableCell>
                <TableCell className={`text-right font-medium ${r.outstanding > 0 ? "status-overdue" : "status-healthy"}`}>
                  Rs {r.outstanding.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Sales;
