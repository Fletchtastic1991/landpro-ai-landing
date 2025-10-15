import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, FileText, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MetricsData {
  totalUsers: number;
  activeSubscriptions: number;
  mrr: number;
  totalQuotes: number;
  avgQuotesPerUser: number;
}

interface UserData {
  id: string;
  business_name: string;
  email: string;
  plan: string;
  subscription_status: string;
  quotes_count: number;
  created_at: string;
}

interface QuoteData {
  id: string;
  client_name: string;
  job_description: string;
  total_cost: number;
  created_at: string;
  user_business_name: string;
}

const Admin = () => {
  const [metrics, setMetrics] = useState<MetricsData>({
    totalUsers: 0,
    activeSubscriptions: 0,
    mrr: 0,
    totalQuotes: 0,
    avgQuotesPerUser: 0,
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<QuoteData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Simulated revenue data for chart
  const revenueData = [
    { month: "Sep", revenue: 3200 },
    { month: "Oct", revenue: 3800 },
    { month: "Nov", revenue: 4200 },
    { month: "Dec", revenue: 4800 },
    { month: "Jan", revenue: 5100 },
    { month: "Feb", revenue: 5430 },
  ];

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total quotes
      const { count: quoteCount } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true });

      // Get all users with their quotes
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, business_name, email, created_at');

      // Get quote counts per user
      const usersWithQuotes = await Promise.all(
        (usersData || []).map(async (user) => {
          const { count } = await supabase
            .from('quotes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          return {
            ...user,
            business_name: user.business_name || 'N/A',
            plan: 'Starter', // Simulated until Stripe integration
            subscription_status: 'active',
            quotes_count: count || 0,
          };
        })
      );

      setUsers(usersWithQuotes);

      // Calculate metrics
      const totalUsers = userCount || 0;
      const totalQuotes = quoteCount || 0;
      const avgQuotes = totalUsers > 0 ? Math.round(totalQuotes / totalUsers) : 0;

      setMetrics({
        totalUsers,
        activeSubscriptions: Math.round(totalUsers * 0.57), // Simulated ~57% conversion
        mrr: 5430, // Simulated MRR
        totalQuotes,
        avgQuotesPerUser: avgQuotes,
      });

      // Get recent quotes with user info
      const { data: quotesData } = await supabase
        .from('quotes')
        .select(`
          id,
          client_name,
          job_description,
          total_cost,
          created_at,
          profiles:user_id (business_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedQuotes = (quotesData || []).map((quote: any) => ({
        ...quote,
        user_business_name: quote.profiles?.business_name || 'Unknown',
      }));

      setRecentQuotes(formattedQuotes);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const filteredUsers = users.filter(user =>
    user.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">{currentDate}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Welcome, Admin. Here's your LandPro AI performance overview for this month.
          </p>
        </div>
        <Button onClick={fetchMetrics} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.mrr.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalQuotes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quotes/User</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgQuotesPerUser}</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Recurring Revenue (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <Input
            placeholder="Search by business name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quotes</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.business_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'}>
                      {user.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.quotes_count}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quotes Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Job Description</TableHead>
                <TableHead>Estimate</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.user_business_name}</TableCell>
                  <TableCell>{quote.client_name}</TableCell>
                  <TableCell className="max-w-xs truncate">{quote.job_description}</TableCell>
                  <TableCell>${quote.total_cost.toLocaleString()}</TableCell>
                  <TableCell>
                    {new Date(quote.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
