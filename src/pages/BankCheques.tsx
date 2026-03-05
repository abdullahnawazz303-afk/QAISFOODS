import { useState } from "react";
import { mockCheques } from "@/data/mockData";
import { DataTableHeader } from "@/components/DataTableHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const BankCheques = () => {
  const [open, setOpen] = useState(false);
  const [cheques, setCheques] = useState(mockCheques);
  const [search, setSearch] = useState("");

  const updateStatus = (id: number, status: "Cleared" | "Bounced") => {
    setCheques(cheques.map(c => c.id === id ? { ...c, status } : c));
    toast.success(`Cheque marked as ${status}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setCheques([{
      id: cheques.length + 1,
      vendor: fd.get("vendor") as string,
      amount: Number(fd.get("amount")),
      chequeNo: fd.get("chequeNo") as string,
      issueDate: fd.get("issueDate") as string,
      status: "Pending" as const,
    }, ...cheques]);
    setOpen(false);
    toast.success("Cheque issued");
  };

  const statusColor = (s: string) => s === "Cleared" ? "default" : s === "Bounced" ? "destructive" : "secondary";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Bank & Cheques</h1>
          <p className="text-sm text-muted-foreground">Manage issued cheques and their status</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Issue Cheque</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Issue New Cheque</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Vendor</Label><Input name="vendor" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Amount (Rs)</Label><Input name="amount" type="number" required /></div>
                <div className="space-y-2"><Label>Cheque No</Label><Input name="chequeNo" required /></div>
              </div>
              <div className="space-y-2"><Label>Issue Date</Label><Input name="issueDate" type="date" required /></div>
              <Button type="submit" className="w-full">Issue Cheque</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTableHeader searchPlaceholder="Search by vendor or cheque no..." onSearch={setSearch} onExport={() => toast.info("PDF export coming soon")} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cheque No</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cheques.filter(c => c.vendor.toLowerCase().includes(search.toLowerCase()) || c.chequeNo.toLowerCase().includes(search.toLowerCase())).map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.chequeNo}</TableCell>
                <TableCell className="font-medium">{c.vendor}</TableCell>
                <TableCell>{c.issueDate}</TableCell>
                <TableCell className="text-right">Rs {c.amount.toLocaleString()}</TableCell>
                <TableCell><Badge variant={statusColor(c.status)}>{c.status}</Badge></TableCell>
                <TableCell>
                  {c.status === "Pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "Cleared")}><Check className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "Bounced")}><X className="h-3 w-3" /></Button>
                    </div>
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

export default BankCheques;
