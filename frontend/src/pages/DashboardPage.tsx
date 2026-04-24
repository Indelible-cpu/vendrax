import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/posDB';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const DashboardPage: React.FC = () => {
  const sales = useLiveQuery(() => db.salesQueue.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const products = useLiveQuery(() => db.products.toArray());

  const totalRevenue = sales?.reduce((sum, s) => sum + s.total, 0) || 0;
  const totalOrders = sales?.length || 0;
  const creditCustomers = customers?.filter(c => c.balance > 0) || [];
  const totalCreditAmount = creditCustomers.reduce((sum, c) => sum + c.balance, 0);
  const lowStockCount = products?.filter(p => !p.isService && p.quantity <= 5).length || 0;

  // Process data for charts
  const chartData = useMemo(() => {
    if (!sales) return [];
    
    // Group by last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString();
    });

    const groups = sales.reduce((acc: any, sale) => {
      const date = new Date(sale.createdAt).toLocaleDateString();
      if (!acc[date]) acc[date] = { revenue: 0, count: 0 };
      acc[date].revenue += sale.total;
      acc[date].count += 1;
      return acc;
    }, {});

    return last7Days.map(date => ({
      name: date.split('/')[0] + '/' + date.split('/')[1], // Short date
      revenue: groups[date]?.revenue || 0,
      customers: groups[date]?.count || 0 // Customer flow = transaction count
    }));
  }, [sales]);

  const stats = [
    { label: 'Total Revenue', value: `MK ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', trend: '+12.5%' },
    { label: 'Total Orders', value: totalOrders.toString(), icon: Activity, color: 'text-primary-400', trend: '+5.2%' },
    { label: 'Active Credits', value: `MK ${totalCreditAmount.toLocaleString()}`, icon: Users, color: 'text-amber-500', trend: `${creditCustomers.length} Users` },
    { label: 'Low Stock Items', value: lowStockCount.toString(), icon: Package, color: 'text-red-500', trend: 'Excl. Services' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface-bg transition-all pb-24 md:pb-0">
      <div className="p-0 md:p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-card border border-surface-border p-6 rounded-3xl group hover:border-primary-500/30 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-surface-bg border border-surface-border group-hover:border-primary-500/20 transition-colors ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 ${stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight mb-1">{stat.value}</div>
              <div className="text-[10px] font-bold text-surface-text/30 uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Revenue & Customer Flow Chart */}
           <div className="lg:col-span-2 bg-surface-card border border-surface-border rounded-3xl p-8 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                 <div>
                    <h3 className="text-sm font-black italic tracking-tighter text-primary-500">Business Analytics</h3>
                    <p className="text-[10px] font-bold text-surface-text/30 uppercase tracking-widest">Revenue vs Customer Flow (Last 7 Days)</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-primary-500" />
                       <span className="text-[9px] font-black text-surface-text/40">REVENUE</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-amber-500" />
                       <span className="text-[9px] font-black text-surface-text/40">FLOW</span>
                    </div>
                 </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontWeight: 900 }}
                    />
                    <YAxis 
                      hide
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        fontSize: '10px',
                        fontWeight: '900'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="var(--color-primary-500)" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorRev)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="customers" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="transparent" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Daily Flow Breakdown */}
           <div className="bg-surface-card border border-surface-border rounded-3xl p-8">
              <div className="mb-8">
                 <h3 className="text-sm font-black italic tracking-tighter text-amber-500">Peak Flow</h3>
                 <p className="text-[10px] font-bold text-surface-text/30 uppercase tracking-widest">Transactions per day</p>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Bar dataKey="customers" radius={[10, 10, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'var(--color-primary-500)' : 'rgba(255,255,255,0.1)'} />
                      ))}
                    </Bar>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.2)', fontWeight: 900 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ 
                        backgroundColor: '#111', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        fontSize: '10px',
                        fontWeight: '900'
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Recent & Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-surface-card border border-surface-border rounded-3xl p-8">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-sm font-black uppercase tracking-widest">Active Credits</h3>
                 <button onClick={() => window.location.href='/debt'} className="text-[10px] font-black text-primary-400 hover:underline">Manage all</button>
              </div>
              <div className="space-y-4">
                 {creditCustomers?.slice(0, 5).map((customer, i) => (
                   <div key={i} className="flex justify-between items-center p-4 bg-surface-bg/50 rounded-2xl border border-surface-border group hover:border-primary-500/20 transition-all">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-xs font-black">{customer.name}</div>
                            <div className="text-[9px] text-surface-text/30 font-bold uppercase">Due: 7 Days</div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-black text-red-500">MK {customer.balance.toLocaleString()}</div>
                         <div className="text-[8px] text-surface-text/20 font-bold uppercase">Outstanding</div>
                      </div>
                   </div>
                 ))}
                 {(!creditCustomers || creditCustomers.length === 0) && (
                    <div className="p-10 text-center text-surface-text/20 font-bold text-xs uppercase tracking-widest">No active credits</div>
                 )}
              </div>
           </div>

           <div className="bg-surface-card border border-surface-border rounded-3xl p-8">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-sm font-black uppercase tracking-widest">Low stock alert</h3>
                 <button className="text-[10px] font-black text-primary-400 hover:underline">Manage inventory</button>
              </div>
              <div className="space-y-4">
                 {products?.filter(p => !p.isService && p.quantity <= 5).slice(0, 5).map((p, i) => (
                   <div key={i} className="flex justify-between items-center p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                            <Package className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-xs font-black">{p.name}</div>
                            <div className="text-[9px] text-surface-text/30 font-bold tracking-wider">SKU: {p.sku}</div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-black text-red-500">{p.quantity}</div>
                         <div className="text-[8px] text-surface-text/20 font-black uppercase">Left in stock</div>
                      </div>
                   </div>
                 ))}
                 {lowStockCount === 0 && (
                    <div className="p-10 text-center text-emerald-500/20 font-bold text-xs uppercase tracking-widest">All stock levels healthy</div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
