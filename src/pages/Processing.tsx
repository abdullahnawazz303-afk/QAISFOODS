import { useState } from "react";
import { mockProcessing } from "@/data/mockData";
import { DataTableHeader } from "@/components/DataTableHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Processing = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState(mockProcessing);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setRecords([{
      id: records.length + 1,
      date: fd.get("date") as string,
      rawInput: Number(fd.get("rawInput")),
      highQuality: Number(fd.get("highQuality")),
      lowQuality: Number(fd.get("lowQuality")),
      waste: Number(fd.get("waste")),
    }, ...records]);
    setOpen(false);
    toast.success("Processing batch recorded");
  };

  const getEfficiency = (r: typeof records[0]) => ((r.highQuality + r.lowQuality) / r.rawInput * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Processing</h1>
          <p className="text-sm text-muted-foreground">Record and track processing batches</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Batch</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Processing Batch</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Date</Label><Input name="date" type="date" required /></div>
              <div className="space-y-2"><Label>Raw Input (kg)</Label><Input name="rawInput" type="number" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>High Quality Output (kg)</Label><Input name="highQuality" type="number" required /></div>
                <div className="space-y-2"><Label>Low Quality Output (kg)</Label><Input name="lowQuality" type="number" required /></div>
              </div>
              <div className="space-y-2"><Label>Waste (kg)</Label><Input name="waste" type="number" required /></div>
              <Button type="submit" className="w-full">Save Batch</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTableHeader searchPlaceholder="Search by date..." onSearch={setSearch} onExport={() => toast.info("PDF export coming soon")} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Raw Input (kg)</TableHead>
              <TableHead className="text-right">High Quality (kg)</TableHead>
              <TableHead className="text-right">Low Quality (kg)</TableHead>
              <TableHead className="text-right">Waste (kg)</TableHead>
              <TableHead className="text-right">Efficiency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.filter(r => r.date.includes(search)).map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell className="text-right">{r.rawInput.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.highQuality.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.lowQuality.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.waste.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={Number(getEfficiency(r)) >= 90 ? "default" : "secondary"}>
                    {getEfficiency(r)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Processing;
