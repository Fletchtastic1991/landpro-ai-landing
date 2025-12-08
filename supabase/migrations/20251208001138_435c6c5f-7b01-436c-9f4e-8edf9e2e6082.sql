-- Add project_id column to quotes table for optional project linking
ALTER TABLE public.quotes 
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_quotes_project_id ON public.quotes(project_id);

-- Add RLS policy for project-linked quotes
CREATE POLICY "Users can view quotes for their projects"
ON public.quotes
FOR SELECT
USING (
  project_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = quotes.project_id 
    AND projects.user_id = auth.uid()
  )
);