import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Loader2, Download, Clock } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

const quotes = [
  {
    id: 1,
    client: "Green Acres Property",
    address: "123 Oak Street, Portland",
    jobType: "Lawn Maintenance",
    estimate: "$1,200",
    status: "pending",
  },
  {
    id: 2,
    client: "Mountain View Ranch",
    address: "456 Pine Road, Eugene",
    jobType: "Land Clearing",
    estimate: "$8,500",
    status: "sent",
  },
  {
    id: 3,
    client: "Riverside Estate",
    address: "789 River Drive, Salem",
    jobType: "Tree Removal",
    estimate: "$3,400",
    status: "approved",
  },
];

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  sent: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  approved: "bg-green-500/10 text-green-700 border-green-500/20",
};

interface GeneratedQuote {
  jobTitle: string;
  laborCost: number;
  materialCost: number;
  totalEstimate: number;
  completionTime: number;
  timestamp: Date;
  clientName: string;
}

export default function Quotes() {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState<GeneratedQuote | null>(null);
  const [quoteHistory, setQuoteHistory] = useState<GeneratedQuote[]>([]);
  
  // Form state
  const [clientName, setClientName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [propertySize, setPropertySize] = useState("");
  const [propertyUnit, setPropertyUnit] = useState("acres");
  const [materialNotes, setMaterialNotes] = useState("");

  const handleGenerateQuote = async () => {
    if (!clientName || !jobDescription || !propertySize) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);
    setGeneratedQuote(null);

    try {
      // Call the Lovable Cloud backend endpoint
      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: {
          clientName,
          jobDescription,
          propertySize: parseFloat(propertySize),
          propertyUnit,
          materialNotes
        }
      });

      if (error) {
        console.error('Error generating quote:', error);
        throw new Error(error.message || 'Failed to generate quote');
      }

      const quote: GeneratedQuote = {
        jobTitle: data.jobTitle,
        laborCost: data.laborCost,
        materialCost: data.materialCost,
        totalEstimate: data.totalEstimate,
        completionTime: data.completionTime,
        timestamp: new Date(data.timestamp),
        clientName: data.clientName
      };

      setGeneratedQuote(quote);
      toast.success("AI Quote generated successfully!", {
        description: `Total estimate: $${quote.totalEstimate.toLocaleString()}`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to generate quote", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuote = () => {
    if (generatedQuote) {
      setQuoteHistory([generatedQuote, ...quoteHistory.slice(0, 4)]);
      toast.success("Quote saved!", {
        description: "Quote has been added to your history.",
      });
      // Reset form
      setClientName("");
      setJobDescription("");
      setPropertySize("");
      setMaterialNotes("");
      setGeneratedQuote(null);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quotes</h1>
          <p className="text-muted-foreground mt-1">
            Manage and generate quotes for your clients
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Generate Quote with AI
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Quote Generator
              </DialogTitle>
              <DialogDescription>
                Provide job details and let LandPro AI generate an accurate quote for you.
              </DialogDescription>
            </DialogHeader>
            
            {!generatedQuote ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client Name *</Label>
                  <Input 
                    id="client" 
                    placeholder="Enter client name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job">Job Description *</Label>
                  <Textarea
                    id="job"
                    placeholder="e.g., Land clearing, grading, mulching, tree removal..."
                    rows={3}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="size">Property Size *</Label>
                    <Input 
                      id="size" 
                      type="number"
                      placeholder="e.g., 2 or 5000"
                      value={propertySize}
                      onChange={(e) => setPropertySize(e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={propertyUnit} onValueChange={setPropertyUnit} disabled={isGenerating}>
                      <SelectTrigger id="unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acres">Acres</SelectItem>
                        <SelectItem value="sqft">Square Feet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Material Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional materials or special requirements..."
                    rows={2}
                    value={materialNotes}
                    onChange={(e) => setMaterialNotes(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
                
                {isGenerating && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">
                      LandPro AI is analyzing your job...
                    </p>
                  </div>
                )}
                
                <Button 
                  onClick={handleGenerateQuote} 
                  className="w-full gap-2"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Quote with AI
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Quote Generated
                    </CardTitle>
                    <CardDescription>{generatedQuote.jobTitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Client:</span>
                        <span className="font-medium">{generatedQuote.clientName}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Estimated Labor:</span>
                        <span className="font-semibold text-lg">
                          ${generatedQuote.laborCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Estimated Materials:</span>
                        <span className="font-semibold text-lg">
                          ${generatedQuote.materialCost.toLocaleString()}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Project Estimate:</span>
                        <span className="font-bold text-2xl text-primary">
                          ${generatedQuote.totalEstimate.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Completion Time:
                        </span>
                        <span className="font-medium">
                          {generatedQuote.completionTime} {generatedQuote.completionTime === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveQuote} className="flex-1 gap-2">
                        Save Quote
                      </Button>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => toast.info("PDF export coming soon!")}
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => setGeneratedQuote(null)}
                    >
                      Generate Another Quote
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {quoteHistory.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent AI Quotes
            </CardTitle>
            <CardDescription>Last 5 quotes generated with AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quoteHistory.map((quote, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{quote.clientName}</p>
                    <p className="text-sm text-muted-foreground">{quote.jobTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {quote.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      ${quote.totalEstimate.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {quote.completionTime} days
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Property Address</TableHead>
                <TableHead>Job Type</TableHead>
                <TableHead>Estimate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.client}</TableCell>
                  <TableCell>{quote.address}</TableCell>
                  <TableCell>{quote.jobType}</TableCell>
                  <TableCell className="font-semibold">{quote.estimate}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[quote.status]}>
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
