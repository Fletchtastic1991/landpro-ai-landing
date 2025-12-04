import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";
import MapDrawing from "@/components/MapDrawing";

export default function MapExplorer() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Map Explorer</h1>
        <p className="text-muted-foreground">
          Search locations and explore properties before creating a project
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Interactive Map
          </CardTitle>
          <CardDescription>
            Search for addresses, draw boundaries to calculate acreage, then create a project from your selection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] rounded-lg overflow-hidden">
            <MapDrawing readOnly={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
