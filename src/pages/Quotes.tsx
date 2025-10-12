import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

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

export default function Quotes() {
  const [open, setOpen] = useState(false);

  const handleGenerateQuote = () => {
    toast.success("AI Quote Generated!", {
      description: "Your quote has been generated and is ready to send.",
    });
    setOpen(false);
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
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generate AI Quote
              </DialogTitle>
              <DialogDescription>
                Provide job details and let AI generate an accurate quote for you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client Name</Label>
                <Input id="client" placeholder="Enter client name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job">Job Description</Label>
                <Textarea
                  id="job"
                  placeholder="Describe the job requirements..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Property Size</Label>
                <Input id="size" placeholder="e.g., 2 acres or 5000 sq ft" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Materials / Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional materials or special requirements..."
                  rows={2}
                />
              </div>
              <Button onClick={handleGenerateQuote} className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Quote
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
