import { useState } from "react";
import { mockCashEntries } from "@/data/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Lock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Rokar = () => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(mockCashEntries);
  const [locked, setLocked] = useState(false);
  const openingBalance = 20000;

  const runningBalances = entries.reduce<number[]>((acc, entry, i) => {
    const prev = i === 0 ? openingBalance : acc[i - 1];
    acc.push(entry.type === "in" ? prev + entry.amount : prev - entry.amount);
    return acc;
  }, []);

  const closingBalance = runningBalances[runningBalances.length - 1] || openingBalance;
  const totalIn = entries.filter(e => e.type === "in").reduce((a, b) => a + b.amount, 0);
  const totalOut = entries.filter(e => e.type === "out").reduce((a, b) => a + b.amount, 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (locked) { toast.error("Day is closed. Cannot add entries."); return; }
    const fd = new FormData(e.currentTarget);
    setEntries([...entries, {
      id: entries.length + 1,
      date: "2026-03-05",
      type: fd.get("type") as "in" | "out",
      description: fd.get("description") as string,
      amount: Number(fd.get("amount")),
    }]);
    setOpen(false);
    toast.success("Cash entry added");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Rokar (Cash Register)</h1>
          <p className="text-sm text-muted-foreground">Daily cash book — March 5, 2026</p>
        </div>
        <div className="flex gap-2">
          {!locked && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Add Entry</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Cash Entry</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select name="type" required>
                      <SelectTrigger><SelectValue placeholder="Cash In / Out" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Cash In</SelectItem>
                        <SelectItem value="out">Cash Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Description</Label><Input name="description" required /></div>
                  <div className="space-y-2"><Label>Amount (Rs)</Label><Input name="amount" type="number" required /></div>
                  <Button type="submit" className="w-full">Save Entry</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Button variant={locked ? "secondary" : "destructive"} onClick={() => {
            if (!locked) { setLocked(true); toast.success("Day closed. Entries locked."); }
          }}>
            <Lock className="h-4 w-4 mr-2" /> {locked ? "Day Closed" : "Close Day"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground uppercase">Opening</p><p className="text-lg font-bold">Rs {openingBalance.toLocaleString()}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground uppercase">Total In</p><p className="text-lg font-bold status-healthy">Rs {totalIn.toLocaleString()}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground uppercase">Total Out</p><p className="text-lg font-bold status-overdue">Rs {totalOut.toLocaleString()}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground uppercase">Closing</p><p className="text-lg font-bold">Rs {closingBalance.toLocaleString()}</p></div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e, i) => (
              <TableRow key={e.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{e.description}</TableCell>
                <TableCell><Badge variant={e.type === "in" ? "default" : "secondary"}>{e.type === "in" ? "Cash In" : "Cash Out"}</Badge></TableCell>
                <TableCell className={`text-right font-medium ${e.type === "in" ? "status-healthy" : "status-overdue"}`}>
                  {e.type === "in" ? "+" : "-"} Rs {e.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium">Rs {runningBalances[i].toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Rokar;
