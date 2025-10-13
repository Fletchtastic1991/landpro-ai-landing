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
    const prompt = `You are an expert landscaping and land management estimator. Analyze the following job request and provide a detailed cost breakdown:

Client: ${clientName}
Job Description: ${jobDescription}
Property Size: ${propertySize} ${propertyUnit}
${materialNotes ? `Material Notes: ${materialNotes}` : ''}

Based on industry standards for landscaping and land management, provide:
1. Estimated labor cost (in USD)
2. Estimated material cost (in USD)
3. Suggested completion time (in days)
4. A brief job title (max 50 characters)

Consider factors like:
- Property size and terrain complexity
- Type of work (clearing, grading, mulching, maintenance, etc.)
- Equipment and labor requirements
- Material costs specific to the job type

Respond ONLY with a valid JSON object in this exact format:
{
  "jobTitle": "Brief descriptive title",
  "laborCost": number,
  "materialCost": number,
  "completionTime": number
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional landscaping cost estimator. Always respond with valid JSON only, no markdown formatting or additional text.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_completion_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
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
    const totalEstimate = quoteData.laborCost + quoteData.materialCost;
    
    const result = {
      jobTitle: quoteData.jobTitle,
      laborCost: Math.round(quoteData.laborCost),
      materialCost: Math.round(quoteData.materialCost),
      totalEstimate: Math.round(totalEstimate),
      completionTime: Math.round(quoteData.completionTime),
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
