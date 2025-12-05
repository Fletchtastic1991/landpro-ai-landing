import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { boundary, acreage, location } = await req.json();
    
    if (!boundary || !acreage) {
      return new Response(
        JSON.stringify({ error: 'Boundary and acreage are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const coordinates = boundary.coordinates[0];
    const centroid = coordinates.reduce(
      (acc: [number, number], coord: [number, number]) => [acc[0] + coord[0], acc[1] + coord[1]],
      [0, 0]
    ).map((v: number) => v / coordinates.length);

    const prompt = `You are an AI land analysis expert for landscaping professionals. Analyze this land parcel and provide detailed recommendations.

Land Details:
- Area: ${acreage} acres (${(acreage * 4046.86).toFixed(0)} square meters)
- Location coordinates: ${centroid[1].toFixed(4)}°N, ${Math.abs(centroid[0]).toFixed(4)}°W
- Polygon vertices: ${coordinates.length - 1} points
${location ? `- Address/Location: ${location}` : ''}

Based on typical land characteristics for this region and size, provide a comprehensive analysis in the following JSON format:

{
  "vegetation": {
    "type": "string describing likely vegetation type (e.g., mixed grass, wooded, brush)",
    "density": "low/medium/high",
    "recommendations": ["array of vegetation management recommendations"]
  },
  "terrain": {
    "type": "string describing likely terrain (e.g., flat, rolling hills, steep)",
    "slope_estimate": "percentage range estimate",
    "drainage": "good/moderate/poor",
    "recommendations": ["array of terrain-related recommendations"]
  },
  "equipment": {
    "recommended": ["array of recommended equipment types"],
    "considerations": ["array of equipment considerations based on terrain/vegetation"]
  },
  "labor": {
    "estimated_crew_size": number,
    "estimated_hours": number,
    "difficulty": "easy/moderate/challenging"
  },
  "hazards": ["array of potential hazards to watch for"],
  "cost_factors": {
    "base_rate_per_acre": number,
    "estimated_total": number,
    "factors_affecting_cost": ["array of cost factors"]
  },
  "summary": "2-3 sentence summary of the analysis"
}

Provide realistic estimates based on the acreage and typical conditions. Be specific and actionable in recommendations.`;

    console.log('Calling Lovable AI for land analysis...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert land analysis AI for landscaping professionals. Always respond with valid JSON only, no markdown or extra text.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response, handling potential markdown code blocks
    let analysis;
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse analysis results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Land analysis completed successfully');
    
    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-land function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
