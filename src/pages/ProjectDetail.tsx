import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, MapPin, FileText, AlertTriangle, Map, Leaf, Mountain, Wrench, DollarSign, Users, Brain } from "lucide-react";
import { format } from "date-fns";
import MapDrawing from "@/components/MapDrawing";
import type { Json } from "@/integrations/supabase/types";
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

interface LandAnalysis {
  vegetation: {
    type: string;
    density: string;
    recommendations: string[];
  };
  terrain: {
    type: string;
    slope_estimate: string;
    drainage: string;
    recommendations: string[];
  };
  equipment: {
    recommended: string[];
    considerations: string[];
  };
  labor: {
    estimated_crew_size: number;
    estimated_hours: number;
    difficulty: string;
  };
  hazards: string[];
  cost_factors: {
    base_rate_per_acre: number;
    estimated_total: number;
    factors_affecting_cost: string[];
  };
  summary: string;
}

interface Analysis {
  id: string;
  land_classification: LandAnalysis | null;
  hazards: any;
  path: any;
  created_at: string;
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'moderate': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    case 'challenging': return 'bg-red-500/20 text-red-700 border-red-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getDensityColor(density: string) {
  switch (density?.toLowerCase()) {
    case 'low': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    case 'high': return 'bg-red-500/20 text-red-700 border-red-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
}

function AnalysisDisplay({ analysis, createdAt }: { analysis: LandAnalysis; createdAt: string }) {
  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Land Analysis
          </CardTitle>
          <CardDescription>
            Generated on {format(new Date(createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{analysis.summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Vegetation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              Vegetation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{analysis.vegetation.type}</span>
              <Badge className={getDensityColor(analysis.vegetation.density)}>
                {analysis.vegetation.density} density
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Recommendations</h4>
              <ul className="text-sm space-y-1">
                {analysis.vegetation.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Terrain */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mountain className="h-5 w-5 text-amber-600" />
              Terrain
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{analysis.terrain.type}</span>
              <Badge variant="outline">{analysis.terrain.slope_estimate} slope</Badge>
              <Badge variant="outline">{analysis.terrain.drainage} drainage</Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Recommendations</h4>
              <ul className="text-sm space-y-1">
                {analysis.terrain.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              Recommended Equipment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {analysis.equipment.recommended.map((eq, i) => (
                <Badge key={i} variant="secondary">{eq}</Badge>
              ))}
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Considerations</h4>
              <ul className="text-sm space-y-1">
                {analysis.equipment.considerations.map((con, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Labor Estimate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Labor Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-primary">{analysis.labor.estimated_crew_size}</div>
                <div className="text-sm text-muted-foreground">Crew Size</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-primary">{analysis.labor.estimated_hours}</div>
                <div className="text-sm text-muted-foreground">Hours</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <Badge className={`${getDifficultyColor(analysis.labor.difficulty)} text-sm`}>
                  {analysis.labor.difficulty}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">Difficulty</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Estimate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Cost Estimate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Base rate per acre</span>
              <span className="font-medium">${analysis.cost_factors.base_rate_per_acre}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-semibold">Estimated Total</span>
              <span className="text-2xl font-bold text-primary">
                ${analysis.cost_factors.estimated_total.toLocaleString()}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Factors Affecting Cost</h4>
              <ul className="text-sm space-y-1">
                {analysis.cost_factors.factors_affecting_cost.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Hazards */}
        {analysis.hazards && analysis.hazards.length > 0 && (
          <Card className="border-destructive/30 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Potential Hazards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {analysis.hazards.map((hazard, i) => (
                  <div key={i} className="flex items-start gap-2 bg-destructive/5 p-3 rounded-lg">
                    <span className="text-destructive">⚠</span>
                    <span className="text-sm">{hazard}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
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
        setAnalysis({
          id: analysisData.id,
          land_classification: analysisData.land_classification as unknown as LandAnalysis | null,
          hazards: analysisData.hazards,
          path: analysisData.path,
          created_at: analysisData.created_at
        });
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
                Draw boundaries to define your property area. Click the polygon tool to start drawing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] rounded-lg overflow-hidden">
                <MapDrawing
                  initialBoundary={project.boundary as GeoJSON.Polygon | null}
                  initialAcreage={project.acreage}
                  onSave={async (boundary, acreage) => {
                    const { error } = await supabase
                      .from("projects")
                      .update({ 
                        boundary: boundary as unknown as Json, 
                        acreage,
                        status: "active" 
                      })
                      .eq("id", project.id);

                    if (error) {
                      toast({
                        title: "Error saving boundary",
                        description: error.message,
                        variant: "destructive",
                      });
                    } else {
                      toast({ title: "Boundary saved successfully!" });
                      setProject({ ...project, boundary, acreage, status: "active" });
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          {analysis?.land_classification ? (
            <AnalysisDisplay analysis={analysis.land_classification} createdAt={analysis.created_at} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Land Analysis
                </CardTitle>
                <CardDescription>
                  AI-powered analysis of your property
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No analysis available yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Define property boundaries first, then run AI analysis from the Map tab
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
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
