import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDashboard } from "@/lib/api";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format } from "date-fns";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const StatCard = ({ title, value, icon: Icon, trend, type }) => (
  <Card className={`stat-card ${type} card-hover`} data-testid={`stat-${type}`}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{formatCurrency(value)}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{Math.abs(trend)}% from last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          type === 'income' ? 'bg-emerald-500/10 text-emerald-500' :
          type === 'expense' ? 'bg-red-500/10 text-red-500' :
          'bg-amber-500/10 text-amber-500'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await getDashboard();
      setData(response.data);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8" data-testid="dashboard-loading">
        <div className="space-y-2">
          <div className="skeleton h-10 w-64" />
          <div className="skeleton h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
      </div>
    );
  }

  const monthlyData = data?.monthly_chart?.map(item => ({
    ...item,
    month: format(new Date(item.month + '-01'), 'MMM'),
  })) || [];

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6366F1'];

  return (
    <div className="space-y-8 animate-fadeIn" data-testid="dashboard">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Track your company's financial performance at a glance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Income" 
          value={data?.total_income || 0} 
          icon={TrendingUp}
          type="income"
        />
        <StatCard 
          title="Total Expenses" 
          value={data?.total_expense || 0} 
          icon={TrendingDown}
          type="expense"
        />
        <StatCard 
          title="Net Balance" 
          value={data?.balance || 0} 
          icon={Wallet}
          type="balance"
        />
        <StatCard 
          title="Transactions" 
          value={data?.transaction_count || 0} 
          icon={Receipt}
          type="transactions"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <Card className="card-hover" data-testid="monthly-chart">
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>Income vs Expenses over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state h-full">
                  <Receipt className="w-12 h-12 mb-4 opacity-50" />
                  <p>No transaction data yet</p>
                  <p className="text-sm">Add transactions to see your monthly trends</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense by Category */}
        <Card className="card-hover" data-testid="expense-chart">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              {data?.expense_by_category?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.expense_by_category}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {data.expense_by_category.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state h-full">
                  <TrendingDown className="w-12 h-12 mb-4 opacity-50" />
                  <p>No expense data yet</p>
                  <p className="text-sm">Add expense transactions to see breakdown</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="card-hover" data-testid="recent-transactions">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recent_transactions?.length > 0 ? (
            <div className="space-y-3">
              {data.recent_transactions.map((transaction, index) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-accent/30 transaction-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category_name} • {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <p className={`text-lg font-semibold ${
                    transaction.type === 'income' ? 'amount-positive' : 'amount-negative'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Receipt className="w-12 h-12 mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Add your first transaction to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
