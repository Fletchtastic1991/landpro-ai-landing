import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, MapPin, FileText, AlertTriangle, Map } from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  name: string;
  description: string | null;
  boundary: any;
  acreage: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Analysis {
  id: string;
  land_classification: any;
  hazards: any;
  path: any;
  created_at: string;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (projectError || !projectData) {
        toast({
          title: "Project not found",
          description: projectError?.message || "Could not load project",
          variant: "destructive",
        });
        navigate("/dashboard/projects");
        return;
      }

      setProject(projectData);

      const { data: analysisData } = await supabase
        .from("analysis")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (analysisData) {
        setAnalysis(analysisData);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [id, navigate, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/projects")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Created {format(new Date(project.created_at), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Acreage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {project.acreage ? `${project.acreage.toFixed(2)} acres` : "Not measured"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Boundary Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" />
                  {project.boundary ? "Defined" : "Not set"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Analysis Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {analysis ? "Complete" : "Pending"}
                </div>
              </CardContent>
            </Card>
          </div>

          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Property Map
              </CardTitle>
              <CardDescription>
                Draw boundaries to define your property area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                <div className="text-center">
                  <Map className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Map interface coming soon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add your Mapbox token to enable the interactive map
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Land Analysis
              </CardTitle>
              <CardDescription>
                AI-powered analysis of your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="space-y-4">
                  {analysis.land_classification && (
                    <div>
                      <h4 className="font-semibold mb-2">Land Classification</h4>
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                        {JSON.stringify(analysis.land_classification, null, 2)}
                      </pre>
                    </div>
                  )}
                  {analysis.hazards && (
                    <div>
                      <h4 className="font-semibold mb-2">Hazards Identified</h4>
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                        {JSON.stringify(analysis.hazards, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No analysis available yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Define property boundaries first, then run AI analysis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Reports
              </CardTitle>
              <CardDescription>
                Work orders and PDF exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  No reports generated yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Complete an analysis to generate work orders
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
