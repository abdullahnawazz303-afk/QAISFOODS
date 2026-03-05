import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { mockPurchases, mockProcessing, mockPackaging, mockSales, mockVendors, mockCheques, mockCashEntries } from "@/data/mockData";

const Reports = () => {
  const [dateFrom, setDateFrom] = useState("2026-02-01");
  const [dateTo, setDateTo] = useState("2026-03-05");

  const exportPdf = () => toast.info("PDF export coming soon");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and export operational reports</p>
      </div>

      <div className="flex items-end gap-4">
        <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" /></div>
        <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" /></div>
        <Button variant="outline" size="sm" onClick={exportPdf}><FileDown className="h-4 w-4 mr-2" /> Export PDF</Button>
      </div>

      <Tabs defaultValue="raw" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="raw">Raw Inventory</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="packaging">Packaging</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Outstanding</TabsTrigger>
          <TabsTrigger value="cheques">Cheque Status</TabsTrigger>
          <TabsTrigger value="cash">Cash Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="raw" className="rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Qty (kg)</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {mockPurchases.map(p => (
                <TableRow key={p.id}><TableCell>{p.date}</TableCell><TableCell>{p.supplier}</TableCell><TableCell className="text-right">{p.quantity.toLocaleString()}</TableCell><TableCell className="text-right">{p.costPerKg}</TableCell><TableCell className="text-right">Rs {(p.quantity * p.costPerKg).toLocaleString()}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="processing" className="rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Input</TableHead><TableHead className="text-right">HQ</TableHead><TableHead className="text-right">LQ</TableHead><TableHead className="text-right">Waste</TableHead><TableHead className="text-right">Efficiency</TableHead></TableRow></TableHeader>
            <TableBody>
              {mockProcessing.map(r => (
                <TableRow key={r.id}><TableCell>{r.date}</TableCell><TableCell className="text-right">{r.rawInput}</TableCell><TableCell className="text-right">{r.highQuality}</TableCell><TableCell className="text-right">{r.lowQuality}</TableCell><TableCell className="text-right">{r.waste}</TableCell><TableCell className="text-right">{((r.highQuality + r.lowQuality) / r.rawInput * 100).toFixed(1)}%</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="packaging" className="rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Quantity</TableHead></TableRow></TableHeader>
            <TableBody>{mockPackaging.map(r => (<TableRow key={r.id}><TableCell>{r.date}</TableCell><TableCell>{r.packageType}</TableCell><TableCell className="text-right">{r.quantity}</TableCell></TableRow>))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="sales" className="rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Product</TableHead><TableHead>Payment</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Outstanding</TableHead></TableRow></TableHeader>
            <TableBody>{mockSales.map(r => (<TableRow key={r.id}><TableCell>{r.date}</TableCell><TableCell>{r.customer}</TableCell><TableCell>{r.product}</TableCell><TableCell>{r.paymentMethod}</TableCell><TableCell className="text-right">Rs {r.amount.toLocaleString()}</TableCell><TableCell className="text-right">Rs {r.outstanding.toLocaleString()}</TableCell></TableRow>))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="vendors" className="rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead className="text-right">Outstanding</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{mockVendors.map(v => (<TableRow key={v.id}><TableCell>{v.name}</TableCell><TableCell className="text-right">Rs {v.outstanding.toLocaleString()}</TableCell><TableCell>{v.dueDate}</TableCell><TableCell className={v.status === "Overdue" ? "status-overdue" : v.status === "Due Soon" ? "status-due-soon" : "status-healthy"}>{v.status}</TableCell></TableRow>))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="cheques" className="rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Cheque No</TableHead><TableHead>Vendor</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{mockCheques.map(c => (<TableRow key={c.id}><TableCell className="font-mono">{c.chequeNo}</TableCell><TableCell>{c.vendor}</TableCell><TableCell className="text-right">Rs {c.amount.toLocaleString()}</TableCell><TableCell className={c.status === "Bounced" ? "status-overdue" : c.status === "Pending" ? "status-due-soon" : "status-healthy"}>{c.status}</TableCell></TableRow>))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="cash" className="rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>{mockCashEntries.map(e => (<TableRow key={e.id}><TableCell>{e.description}</TableCell><TableCell>{e.type === "in" ? "Cash In" : "Cash Out"}</TableCell><TableCell className={`text-right ${e.type === "in" ? "status-healthy" : "status-overdue"}`}>Rs {e.amount.toLocaleString()}</TableCell></TableRow>))}</TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
