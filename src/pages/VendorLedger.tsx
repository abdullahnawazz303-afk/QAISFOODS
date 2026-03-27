import { useState, useEffect } from "react";
import { useVendorStore } from "@/stores/vendorStore";
import { EmptyState } from "@/components/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer } from "lucide-react";
import { formatPKR, formatDate } from "@/lib/formatters";

const VendorLedger = () => {
  const {
    vendors,
    ledgerEntries,
    fetchVendors,
    fetchLedger,
    getOutstanding,
  } = useVendorStore();

  const [selectedVendor, setSelectedVendor] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendor) fetchLedger(selectedVendor);
  }, [selectedVendor]);

  const vendor = vendors.find(v => v.id === selectedVendor);

  // ── Entries sorted latest first for display
  const allEntries  = ledgerEntries[selectedVendor] || [];
  const entries     = [...allEntries].reverse(); // latest at top, oldest at bottom
  const totalCredit = allEntries.reduce((s, e) => s + e.credit, 0);
  const totalDebit  = allEntries.reduce((s, e) => s + e.debit, 0);

  const exportCSV = () => {
    if (allEntries.length === 0) return;
    const headers = "Date,Type,Description,Debit,Credit\n";
    const rows    = allEntries
      .map(e => `${e.date},${e.type},${e.description},${e.debit},${e.credit}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `vendor-ledger-${vendor?.name || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Ledger</h1>
          <p className="text-sm text-muted-foreground">View vendor transaction history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          {allEntries.length > 0 && (
            <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
          )}
        </div>
      </div>

      {/* Vendor Selector */}
      <Select value={selectedVendor} onValueChange={setSelectedVendor}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select vendor" />
        </SelectTrigger>
        <SelectContent>
          {vendors.map(v => (
            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedVendor ? (
        <EmptyState title="Select a vendor"
          description="Choose a vendor from the dropdown to view their ledger." />
      ) : allEntries.length === 0 ? (
        <EmptyState title="No transactions yet"
          description={`No ledger entries for ${vendor?.name}. Transactions appear here automatically when you add inventory, record purchases, or make payments via Payables.`} />
      ) : (
        <>
          {/* Summary Cards */}
          {vendor && (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p className="font-semibold">{vendor.name}</p>
                <p className="text-sm text-muted-foreground">{vendor.phone}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Total Purchased</p>
                <p className="font-semibold">{formatPKR(totalCredit)}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">We Owe Them</p>
                <p className={`font-semibold ${getOutstanding(selectedVendor) > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {formatPKR(getOutstanding(selectedVendor))}
                </p>
              </div>
            </div>
          )}

          {/* Ledger Table — latest at top */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.date)}</TableCell>
                    <TableCell>{e.type}</TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell className="text-right">
                      {e.debit > 0 ? formatPKR(e.debit) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {e.credit > 0 ? formatPKR(e.credit) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary Footer */}
          <div className="flex justify-end gap-8 text-sm border-t pt-4">
            <span>Total Purchased: <strong>{formatPKR(totalCredit)}</strong></span>
            <span>Total Paid: <strong>{formatPKR(totalDebit)}</strong></span>
            <span>Remaining:{" "}
              <strong className={getOutstanding(selectedVendor) > 0 ? 'text-destructive' : 'text-green-600'}>
                {formatPKR(getOutstanding(selectedVendor))}
              </strong>
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default VendorLedger;