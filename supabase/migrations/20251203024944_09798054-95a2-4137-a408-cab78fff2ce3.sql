-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  boundary JSONB,
  acreage NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis table
CREATE TABLE public.analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  land_classification JSONB,
  hazards JSONB,
  path JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  report_json JSONB NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Analysis policies
CREATE POLICY "Users can view analysis for their projects" ON public.analysis FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = analysis.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create analysis for their projects" ON public.analysis FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = analysis.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update analysis for their projects" ON public.analysis FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = analysis.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete analysis for their projects" ON public.analysis FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = analysis.project_id AND projects.user_id = auth.uid()));

-- Reports policies
CREATE POLICY "Users can view reports for their projects" ON public.reports FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create reports for their projects" ON public.reports FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete reports for their projects" ON public.reports FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();