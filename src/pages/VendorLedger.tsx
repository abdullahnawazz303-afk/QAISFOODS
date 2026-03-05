import { useState } from "react";
import { mockVendors, mockVendorTransactions } from "@/data/mockData";
import { DataTableHeader } from "@/components/DataTableHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const VendorLedger = () => {
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);

  const statusVariant = (s: string) => s === "Overdue" ? "destructive" : s === "Due Soon" ? "outline" : "default";

  const vendorTxns = mockVendorTransactions.filter(t => t.vendorId === selectedVendor);
  const vendorName = mockVendors.find(v => v.id === selectedVendor)?.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Vendor Ledger</h1>
        <p className="text-sm text-muted-foreground">Track vendor balances and payment status</p>
      </div>

      <DataTableHeader searchPlaceholder="Search vendors..." onSearch={setSearch} onExport={() => {}} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Credit Days</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockVendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase())).map(v => (
              <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedVendor(v.id)}>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell className="text-right">Rs {v.outstanding.toLocaleString()}</TableCell>
                <TableCell className="text-right">{v.creditDays}</TableCell>
                <TableCell>{v.dueDate}</TableCell>
                <TableCell><Badge variant={statusVariant(v.status)}>{v.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={selectedVendor !== null} onOpenChange={() => setSelectedVendor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Transaction History — {vendorName}</DialogTitle></DialogHeader>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorTxns.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{t.date}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className="text-right">{t.debit ? `Rs ${t.debit.toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-right">{t.credit ? `Rs ${t.credit.toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-right font-medium">Rs {t.balance.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {vendorTxns.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No transactions found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorLedger;
