import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, DollarSign, Send, CheckCircle, Clock, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  stripe_payment_link: string | null;
  client_id: string;
  quote_id: string | null;
  clients: {
    client_name: string;
    email: string;
  };
}

export default function Invoices() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          clients!invoices_client_id_fkey (
            client_name,
            email
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["approvedQuotes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("quotes")
        .select("id, client_name, job_description, total_cost, status, client_id")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clientsForInvoice", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("clients")
        .select("id, client_name, email")
        .eq("landscaper_id", user.id)
        .order("client_name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async ({ quoteId, clientId, amount, dueDate }: { 
      quoteId: string | null; 
      clientId: string; 
      amount: number; 
      dueDate: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Generate invoice number
      const { data: invoiceNumber, error: fnError } = await supabase.rpc("generate_invoice_number");
      if (fnError) throw fnError;

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          client_id: clientId,
          quote_id: quoteId,
          invoice_number: invoiceNumber,
          amount,
          due_date: dueDate,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully!");
      setIsCreating(false);
      setSelectedQuoteId("");
      setSelectedClientId("");
      setAmount("");
      setDueDate("");
    },
    onError: (error) => {
      toast.error("Failed to create invoice: " + error.message);
    },
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      // Call edge function to create Stripe payment link
      const { data, error } = await supabase.functions.invoke("create-payment-link", {
        body: { invoiceId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice sent with payment link!");
    },
    onError: (error) => {
      toast.error("Failed to send invoice: " + error.message);
    },
  });

  const markPaidManuallyMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice marked as paid!");
    },
    onError: (error) => {
      toast.error("Failed to update invoice: " + error.message);
    },
  });

  const handleCreateInvoice = () => {
    if (selectedQuoteId) {
      const quote = quotes.find(q => q.id === selectedQuoteId);
      if (quote) {
        createInvoiceMutation.mutate({
          quoteId: selectedQuoteId,
          clientId: quote.client_id || selectedClientId,
          amount: parseFloat(amount || quote.total_cost.toString()),
          dueDate,
        });
      }
    } else if (selectedClientId && amount && dueDate) {
      createInvoiceMutation.mutate({
        quoteId: null,
        clientId: selectedClientId,
        amount: parseFloat(amount),
        dueDate,
      });
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", icon: Clock },
      sent: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: Send },
      paid: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle },
      overdue: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const copyPaymentLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Payment link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage invoices and accept payments
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create an invoice from an approved quote or manually
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quote">From Approved Quote (Optional)</Label>
                <Select value={selectedQuoteId} onValueChange={(value) => {
                  setSelectedQuoteId(value);
                  const quote = quotes.find(q => q.id === value);
                  if (quote) {
                    setAmount(quote.total_cost.toString());
                    setSelectedClientId(quote.client_id || "");
                  }
                }}>
                  <SelectTrigger id="quote">
                    <SelectValue placeholder="Select a quote" />
                  </SelectTrigger>
                  <SelectContent>
                    {quotes.map((quote) => (
                      <SelectItem key={quote.id} value={quote.id}>
                        {quote.client_name} - {quote.job_description} (${quote.total_cost.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedQuoteId && (
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInvoice}>
                Create Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No invoices yet. Create your first invoice to get started!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>{invoice.clients.client_name}</TableCell>
                  <TableCell className="font-semibold">
                    ${invoice.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    {new Date(invoice.issue_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {invoice.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => sendInvoiceMutation.mutate(invoice.id)}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Send
                        </Button>
                      )}
                      {invoice.status === "sent" && invoice.stripe_payment_link && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyPaymentLink(invoice.stripe_payment_link!)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Link
                        </Button>
                      )}
                      {invoice.status !== "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markPaidManuallyMutation.mutate(invoice.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-6 bg-muted/50">
        <div className="flex items-start gap-4">
          <DollarSign className="h-8 w-8 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-lg mb-2">Payment Summary</h3>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  ${invoices
                    .filter(i => i.status === "paid")
                    .reduce((sum, i) => sum + Number(i.amount), 0)
                    .toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${invoices
                    .filter(i => i.status === "sent")
                    .reduce((sum, i) => sum + Number(i.amount), 0)
                    .toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  ${invoices
                    .filter(i => i.status === "overdue")
                    .reduce((sum, i) => sum + Number(i.amount), 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
