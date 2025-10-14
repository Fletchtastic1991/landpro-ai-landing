import { useState, useEffect } from "react";
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

interface SavedQuote {
  id: string;
  client_name: string;
  job_description: string;
  property_size: string;
  property_unit: string;
  labor_cost: number;
  equipment_cost: number;
  material_cost: number;
  total_cost: number;
  completion_time: string;
  notes: string;
  created_at: string;
}

interface GeneratedQuote {
  jobTitle: string;
  laborCost: number;
  equipmentCost: number;
  materialCost: number;
  totalEstimate: number;
  completionTime: number;
  notes: string;
  timestamp: Date;
  clientName: string;
}

export default function Quotes() {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState<GeneratedQuote | null>(null);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [clientName, setClientName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [propertySize, setPropertySize] = useState("");
  const [propertyUnit, setPropertyUnit] = useState("acres");
  const [materialNotes, setMaterialNotes] = useState("");

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSavedQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast.error("Failed to load quotes");
    } finally {
      setIsLoading(false);
    }
  };

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
        equipmentCost: data.equipmentCost,
        materialCost: data.materialCost,
        totalEstimate: data.totalEstimate,
        completionTime: data.completionTime,
        notes: data.notes,
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

  const handleSaveQuote = async () => {
    if (!generatedQuote) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save quotes");
        return;
      }

      const { error } = await supabase.from('quotes').insert({
        user_id: user.id,
        client_name: generatedQuote.clientName,
        job_description: jobDescription,
        property_size: propertySize,
        property_unit: propertyUnit,
        material_notes: materialNotes,
        labor_cost: generatedQuote.laborCost,
        equipment_cost: generatedQuote.equipmentCost,
        material_cost: generatedQuote.materialCost,
        total_cost: generatedQuote.totalEstimate,
        completion_time: `${generatedQuote.completionTime} days`,
        notes: generatedQuote.notes,
      });

      if (error) throw error;

      toast.success("Quote saved!", {
        description: "Quote has been saved to your account.",
      });

      // Refresh quotes list
      fetchQuotes();

      // Reset form
      setClientName("");
      setJobDescription("");
      setPropertySize("");
      setMaterialNotes("");
      setGeneratedQuote(null);
      setOpen(false);
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error("Failed to save quote", {
        description: error instanceof Error ? error.message : "Please try again",
      });
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
                        <span className="text-sm text-muted-foreground">Labor:</span>
                        <span className="font-semibold text-lg">
                          ${generatedQuote.laborCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Equipment:</span>
                        <span className="font-semibold text-lg">
                          ${generatedQuote.equipmentCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Materials:</span>
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
                      {generatedQuote.notes && (
                        <>
                          <Separator />
                          <div className="pt-2">
                            <span className="text-sm font-medium">Notes:</span>
                            <p className="text-sm text-muted-foreground mt-1">{generatedQuote.notes}</p>
                          </div>
                        </>
                      )}
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

      {savedQuotes.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Saved Quotes
            </CardTitle>
            <CardDescription>Your saved quotes from the database</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {savedQuotes.slice(0, 5).map((quote) => (
                  <div key={quote.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{quote.client_name}</p>
                      <p className="text-sm text-muted-foreground">{quote.job_description.substring(0, 50)}...</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(quote.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">
                        ${Number(quote.total_cost).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {quote.completion_time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Quotes</CardTitle>
          <CardDescription>Complete list of your saved quotes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : savedQuotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No quotes yet. Generate your first AI quote to get started!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Job Description</TableHead>
                  <TableHead>Property Size</TableHead>
                  <TableHead>Total Estimate</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.client_name}</TableCell>
                    <TableCell>{quote.job_description.substring(0, 40)}...</TableCell>
                    <TableCell>{quote.property_size} {quote.property_unit}</TableCell>
                    <TableCell className="font-semibold">
                      ${Number(quote.total_cost).toLocaleString()}
                    </TableCell>
                    <TableCell>{new Date(quote.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
