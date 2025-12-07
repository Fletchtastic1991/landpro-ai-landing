-- Create the preprocessed storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('preprocessed', 'preprocessed', false);

-- Storage policies for preprocessed bucket
CREATE POLICY "Users can upload their own preprocessed files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'preprocessed' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own preprocessed files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'preprocessed' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own preprocessed files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'preprocessed' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create analysis_jobs table
CREATE TABLE public.analysis_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  preprocess_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for analysis_jobs
CREATE POLICY "Users can view their own analysis jobs"
ON public.analysis_jobs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis jobs"
ON public.analysis_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis jobs"
ON public.analysis_jobs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis jobs"
ON public.analysis_jobs
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_analysis_jobs_updated_at
BEFORE UPDATE ON public.analysis_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();