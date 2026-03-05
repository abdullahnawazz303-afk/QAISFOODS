import { KpiCard } from "@/components/KpiCard";
import { Package, Cog, BoxSelect, Wallet, FileText, AlertTriangle } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of factory operations & finances</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Raw Stock" value="21,500 kg" subtitle="5 suppliers active" icon={Package} />
        <KpiCard title="Processed Stock" value="10,800 kg" subtitle="70% high quality" icon={Cog} />
        <KpiCard title="Packaged Inventory" value="1,950 packs" subtitle="1kg: 1300 | 2kg: 450 | 3kg: 200" icon={BoxSelect} />
        <KpiCard title="Today's Cash Balance" value="Rs 46,500" subtitle="In: 62,000 | Out: 35,500" icon={Wallet} />
        <KpiCard title="Pending Cheques" value="3" subtitle="Total: Rs 1,791,000" icon={FileText} variant="warning" />
        <KpiCard title="Overdue Vendors" value="1" subtitle="Baloch Harvest Co." icon={AlertTriangle} variant="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-3">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { text: "Purchase recorded - 6,000kg from Islamabad Foods", time: "2 hours ago" },
              { text: "Processing batch completed - 2,800kg input", time: "4 hours ago" },
              { text: "Sale to Metro Superstore - Rs 54,000", time: "5 hours ago" },
              { text: "Cheque CHQ-001248 bounced", time: "1 day ago" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <span>{item.text}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-4">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-3">Upcoming Payments</h3>
          <div className="space-y-3">
            {[
              { vendor: "Islamabad Foods", amount: "Rs 660,000", due: "Mar 7", status: "Due Soon" },
              { vendor: "Khan Agro Supplies", amount: "Rs 600,000", due: "Mar 22", status: "On Time" },
              { vendor: "Sindh Lentil Corp", amount: "Rs 531,000", due: "Apr 10", status: "On Time" },
              { vendor: "Baloch Harvest Co.", amount: "Rs 341,600", due: "Mar 2", status: "Overdue" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <div>
                  <span className="font-medium">{item.vendor}</span>
                  <span className="text-muted-foreground ml-2">{item.amount}</span>
                </div>
                <span className={item.status === "Overdue" ? "status-overdue text-xs" : item.status === "Due Soon" ? "status-due-soon text-xs" : "status-healthy text-xs"}>
                  {item.status} · {item.due}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
