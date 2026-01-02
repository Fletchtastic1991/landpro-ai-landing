import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Map, Loader2, ArrowRight } from "lucide-react";
import MapDrawing from "@/components/MapDrawing";
import IntentSelector, { LandIntent, INTENT_OPTIONS } from "@/components/IntentSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ProjectData {
  boundary: GeoJSON.Polygon;
  acreage: number;
  analysis?: any;
  intent?: LandIntent;
}

export default function MapExplorer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<LandIntent | null>(null);

  const handleCreateProject = (boundary: GeoJSON.Polygon, acreage: number, analysis?: any) => {
    const intentLabel = selectedIntent 
      ? INTENT_OPTIONS.find(o => o.id === selectedIntent)?.label 
      : "";
    setProjectData({ boundary, acreage, analysis, intent: selectedIntent || undefined });
    setProjectName(`${intentLabel ? `${intentLabel} - ` : ""}${acreage} acres`);
    setProjectDescription(analysis?.summary || "");
    setShowCreateDialog(true);
  };

  const handleSubmitProject = async () => {
    if (!user || !projectData) {
      toast.error("Please sign in to create a project");
      return;
    }

    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    setIsCreating(true);
    try {
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectName.trim(),
          description: projectDescription.trim() || null,
          boundary: projectData.boundary as any,
          acreage: projectData.acreage,
          status: 'draft'
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // If we have analysis data, save it
      if (projectData.analysis && project) {
        const { error: analysisError } = await supabase
          .from('analysis')
          .insert({
            project_id: project.id,
            land_classification: {
              vegetation: projectData.analysis.vegetation,
              terrain: projectData.analysis.terrain,
              intent: projectData.intent,
            },
            hazards: projectData.analysis.hazards,
            path: {
              equipment: projectData.analysis.equipment,
              labor: projectData.analysis.labor,
              cost_factors: projectData.analysis.cost_factors,
            }
          });

        if (analysisError) {
          console.error('Failed to save analysis:', analysisError);
        }
      }

      toast.success("Project created successfully!");
      setShowCreateDialog(false);
      navigate(`/dashboard/projects/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const getIntentDescription = () => {
    if (!selectedIntent) return null;
    const intent = INTENT_OPTIONS.find(o => o.id === selectedIntent);
    return intent?.description;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Analyze Your Land</h1>
        <p className="text-muted-foreground">
          Select what you want to do, then search for your property to get instant AI analysis
        </p>
      </div>

      {/* Step 1: Intent Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </span>
            What do you want to do with your land?
          </CardTitle>
          <CardDescription>
            Select your goal so we can tailor the analysis to your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IntentSelector 
            selectedIntent={selectedIntent} 
            onSelectIntent={setSelectedIntent} 
          />
        </CardContent>
      </Card>

      {/* Step 2: Map and Analysis */}
      <Card className={!selectedIntent ? "opacity-60 pointer-events-none" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              2
            </span>
            <Map className="h-5 w-5" />
            Find Your Property
            {selectedIntent && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {getIntentDescription()}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {selectedIntent 
              ? "Search for an address or drop a pin, then draw your property boundary. Analysis runs automatically."
              : "First, select what you want to do above"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] rounded-lg overflow-hidden">
            <MapDrawing 
              readOnly={false} 
              onCreateProject={handleCreateProject}
              intent={selectedIntent}
              autoAnalyze={!!selectedIntent}
            />
          </div>
        </CardContent>
      </Card>

      {/* Floating Intent Indicator */}
      {selectedIntent && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-md rounded-full shadow-lg border px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Goal:</span>
          <IntentSelector 
            selectedIntent={selectedIntent} 
            onSelectIntent={setSelectedIntent}
            compact
          />
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Save your selected land boundary as a new project. 
              {projectData?.acreage && ` Area: ${projectData.acreage} acres`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            {projectData?.analysis && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <span className="font-medium">AI Analysis included:</span>
                <span className="text-muted-foreground ml-2">
                  Vegetation, terrain, equipment recommendations, and cost estimates will be saved with this project.
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitProject} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
