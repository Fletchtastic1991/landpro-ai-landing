import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, MessageSquare, DollarSign, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function ClientPortal() {
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: clientProfile } = useQuery({
    queryKey: ["clientProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*, profiles!clients_landscaper_id_fkey(business_name, full_name)")
        .eq("client_user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: quotes = [], refetch: refetchQuotes } = useQuery({
    queryKey: ["clientQuotes", clientProfile?.id],
    queryFn: async () => {
      if (!clientProfile?.id) return [];
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("client_id", clientProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientProfile?.id,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["clientInvoices", clientProfile?.id],
    queryFn: async () => {
      if (!clientProfile?.id) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_id", clientProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientProfile?.id,
  });

  const handleQuoteAction = async (quoteId: string, status: "approved" | "declined") => {
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status })
        .eq("id", quoteId);

      if (error) throw error;

      toast.success(`Quote ${status} successfully!`);
      refetchQuotes();
    } catch (error: any) {
      toast.error("Failed to update quote: " + error.message);
    }
  };

  const landscaperName = clientProfile?.profiles?.business_name || 
                        clientProfile?.profiles?.full_name || 
                        "Your Landscaper";

  const pendingQuotes = quotes.filter(q => q.status === "pending");
  const approvedQuotes = quotes.filter(q => q.status === "approved");
  const completedQuotes = quotes.filter(q => q.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Welcome, {clientProfile?.client_name}
              </h1>
              <p className="text-muted-foreground text-lg">
                Your project portal with <span className="font-semibold text-primary">{landscaperName}</span>
              </p>
            </div>
            <div className="text-sm text-muted-foreground bg-card px-4 py-2 rounded-lg border">
              <p className="font-medium">Powered by</p>
              <p className="text-primary font-bold">LandPro AI</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending Quotes</p>
                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-2">{pendingQuotes.length}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Approved Jobs</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">{approvedQuotes.length}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Completed Work</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{completedQuotes.length}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </Card>
        </div>

        {/* Quotes Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <MessageSquare className="mr-2 h-6 w-6 text-primary" />
            Your Quotes
          </h2>

          {quotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No quotes yet.</p>
              <p className="text-sm mt-2">Your landscaper will send you quotes for review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <Card key={quote.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-foreground">
                          {quote.job_description}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          quote.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : quote.status === "approved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : quote.status === "declined"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}>
                          {quote.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Property: {quote.property_size} {quote.property_unit} • Completion: {quote.completion_time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">
                        ${quote.total_cost.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Labor</p>
                      <p className="text-lg font-semibold">${quote.labor_cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Materials</p>
                      <p className="text-lg font-semibold">${quote.material_cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Equipment</p>
                      <p className="text-lg font-semibold">${quote.equipment_cost.toLocaleString()}</p>
                    </div>
                  </div>

                  {quote.notes && (
                    <div className="mb-4 p-3 bg-muted/30 rounded">
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Notes:</p>
                      <p className="text-sm">{quote.notes}</p>
                    </div>
                  )}

                  {quote.status === "pending" && (
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={() => handleQuoteAction(quote.id, "approved")}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Quote
                      </Button>
                      <Button
                        onClick={() => handleQuoteAction(quote.id, "declined")}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Decline Quote
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Invoices Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <DollarSign className="mr-2 h-6 w-6 text-primary" />
            Invoices & Payments
          </h2>

          {invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No invoices yet.</p>
              <p className="text-sm mt-2">Your invoices will appear here when sent by {landscaperName}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-foreground">
                          Invoice {invoice.invoice_number}
                        </h3>
                        <Badge className={
                          invoice.status === "draft"
                            ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                            : invoice.status === "sent"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : invoice.status === "paid"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Issue Date: {new Date(invoice.issue_date).toLocaleDateString()} • 
                        Due Date: {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">
                        ${Number(invoice.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {invoice.status === "sent" && invoice.stripe_payment_link && (
                    <div className="mt-4">
                      <Button
                        onClick={() => window.open(invoice.stripe_payment_link!, "_blank")}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Pay Now with Stripe
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {invoice.status === "paid" && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Payment received - Thank you!
                      </span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Messages Section Placeholder */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Messages</h2>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>Message feature coming soon!</p>
            <p className="text-sm mt-2">You'll be able to chat with {landscaperName} directly here.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
