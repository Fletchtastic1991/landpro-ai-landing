import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, jobDescription, propertySize, propertyUnit, materialNotes } = await req.json();
    
    console.log('Generating quote for:', { clientName, jobDescription, propertySize, propertyUnit });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Construct a detailed prompt for OpenAI to analyze the job
    const prompt = `You are LandPro AI — an expert in landscaping and land management quotes.
Based on the details below, generate a professional, itemized project estimate.

Client: ${clientName}
Job Description: ${jobDescription}
Property Size: ${propertySize} ${propertyUnit}
${materialNotes ? `Materials/Notes: ${materialNotes}` : ''}

Provide a detailed breakdown including:
1. A brief job title (max 50 characters)
2. Labor cost (in USD)
3. Equipment cost (in USD) 
4. Material cost (in USD)
5. Estimated completion time (in days)
6. Professional notes about the project

Consider factors like:
- Property size and terrain complexity
- Type of work (clearing, grading, mulching, maintenance, etc.)
- Equipment rental and labor requirements
- Material costs specific to the job type
- Debris removal and finishing work

Respond ONLY with a valid JSON object in this exact format:
{
  "jobTitle": "Brief descriptive title",
  "laborCost": number,
  "equipmentCost": number,
  "materialCost": number,
  "completionTime": number,
  "notes": "Professional notes about the project"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are LandPro AI, a professional landscaping cost estimator. Always respond with valid JSON only, no markdown formatting or additional text.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('OpenAI payment required. Please check your API key billing.');
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse the JSON response
    let quoteData;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      quoteData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Calculate total and add metadata
    const totalEstimate = quoteData.laborCost + quoteData.equipmentCost + quoteData.materialCost;
    
    const result = {
      jobTitle: quoteData.jobTitle,
      laborCost: Math.round(quoteData.laborCost),
      equipmentCost: Math.round(quoteData.equipmentCost),
      materialCost: Math.round(quoteData.materialCost),
      totalEstimate: Math.round(totalEstimate),
      completionTime: Math.round(quoteData.completionTime),
      notes: quoteData.notes || '',
      clientName,
      timestamp: new Date().toISOString()
    };

    console.log('Generated quote:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-quote function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
