import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Trash2, Maximize2 } from "lucide-react";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZmxldGNodGFzdGljMTk5MSIsImEiOiJjbWlxNnNjajUwamI2M2VvdmFmbGQ5NTlsIn0.hIurrjB3WXifVT10VgKXRA";

interface MapDrawingProps {
  initialBoundary?: GeoJSON.Polygon | null;
  initialAcreage?: number | null;
  onSave?: (boundary: GeoJSON.Polygon, acreage: number) => Promise<void>;
  readOnly?: boolean;
}

export default function MapDrawing({
  initialBoundary,
  initialAcreage,
  onSave,
  readOnly = false,
}: MapDrawingProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [acreage, setAcreage] = useState<number | null>(initialAcreage ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<GeoJSON.Polygon | null>(null);

  const calculateArea = useCallback((polygon: GeoJSON.Polygon) => {
    const area = turf.area(polygon);
    const acres = area * 0.000247105; // Convert sq meters to acres
    return Math.round(acres * 100) / 100;
  }, []);

  const updateArea = useCallback(() => {
    if (!draw.current) return;
    
    const data = draw.current.getAll();
    if (data.features.length > 0) {
      const polygon = data.features[0].geometry as GeoJSON.Polygon;
      const acres = calculateArea(polygon);
      setAcreage(acres);
      setCurrentPolygon(polygon);
      setHasChanges(true);
    } else {
      setAcreage(null);
      setCurrentPolygon(null);
    }
  }, [calculateArea]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 4,
      pitch: 0,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.ScaleControl(), "bottom-left");
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserHeading: false,
      }),
      "top-right"
    );

    // Add geocoder search control
    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      marker: true,
      placeholder: "Search for an address or location...",
      flyTo: {
        speed: 1.5,
        zoom: 16,
      },
    });
    map.current.addControl(geocoder, "top-left");

    if (!readOnly) {
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: "simple_select",
        styles: [
          {
            id: "gl-draw-polygon-fill",
            type: "fill",
            filter: ["all", ["==", "$type", "Polygon"]],
            paint: {
              "fill-color": "#22c55e",
              "fill-opacity": 0.3,
            },
          },
          {
            id: "gl-draw-polygon-stroke",
            type: "line",
            filter: ["all", ["==", "$type", "Polygon"]],
            paint: {
              "line-color": "#16a34a",
              "line-width": 3,
            },
          },
          {
            id: "gl-draw-polygon-midpoint",
            type: "circle",
            filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
            paint: {
              "circle-radius": 5,
              "circle-color": "#16a34a",
            },
          },
          {
            id: "gl-draw-polygon-vertex-halo",
            type: "circle",
            filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"]],
            paint: {
              "circle-radius": 8,
              "circle-color": "#fff",
            },
          },
          {
            id: "gl-draw-polygon-vertex",
            type: "circle",
            filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"]],
            paint: {
              "circle-radius": 5,
              "circle-color": "#16a34a",
            },
          },
        ],
      });

      map.current.addControl(draw.current, "top-left");

      map.current.on("draw.create", updateArea);
      map.current.on("draw.update", updateArea);
      map.current.on("draw.delete", () => {
        setAcreage(null);
        setCurrentPolygon(null);
        setHasChanges(false);
      });
    }

    map.current.on("load", () => {
      if (initialBoundary && map.current) {
        // Add the boundary as a source and layer for display
        if (readOnly) {
          map.current.addSource("boundary", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: initialBoundary,
            },
          });

          map.current.addLayer({
            id: "boundary-fill",
            type: "fill",
            source: "boundary",
            paint: {
              "fill-color": "#22c55e",
              "fill-opacity": 0.3,
            },
          });

          map.current.addLayer({
            id: "boundary-line",
            type: "line",
            source: "boundary",
            paint: {
              "line-color": "#16a34a",
              "line-width": 3,
            },
          });
        } else if (draw.current) {
          // Add to draw control for editing
          draw.current.add({
            type: "Feature",
            properties: {},
            geometry: initialBoundary,
          });
        }

        // Fit bounds to the polygon
        const bounds = turf.bbox(initialBoundary);
        map.current.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ],
          { padding: 50, maxZoom: 16 }
        );

        if (initialAcreage) {
          setAcreage(initialAcreage);
        }
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [initialBoundary, initialAcreage, readOnly, updateArea]);

  const handleSave = async () => {
    if (!currentPolygon || !onSave || !acreage) return;
    
    setIsSaving(true);
    try {
      await onSave(currentPolygon, acreage);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (draw.current) {
      draw.current.deleteAll();
      setAcreage(null);
      setCurrentPolygon(null);
      setHasChanges(false);
    }
  };

  const handleFitBounds = () => {
    if (!map.current) return;
    
    const data = draw.current?.getAll();
    if (data && data.features.length > 0) {
      const bounds = turf.bbox(data);
      map.current.fitBounds(
        [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]],
        ],
        { padding: 50, maxZoom: 16 }
      );
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {/* Info Panel */}
      <div className="absolute top-4 right-16 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border">
        <div className="text-sm font-medium text-muted-foreground mb-1">
          Property Area
        </div>
        <div className="text-2xl font-bold text-primary">
          {acreage !== null ? `${acreage} acres` : "—"}
        </div>
        {acreage !== null && (
          <div className="text-xs text-muted-foreground mt-1">
            {(acreage * 4046.86).toLocaleString()} m²
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!readOnly && (
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFitBounds}
            disabled={!currentPolygon}
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            Fit View
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClear}
            disabled={!currentPolygon}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
          {onSave && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Boundary
            </Button>
          )}
        </div>
      )}

      {/* Instructions */}
      {!readOnly && !currentPolygon && (
        <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border max-w-xs">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Draw a polygon:</span>{" "}
            Click the polygon tool, then click on the map to add points. Double-click to finish.
          </p>
        </div>
      )}
    </div>
  );
}
