-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  quote_id UUID REFERENCES public.quotes(id),
  invoice_number TEXT NOT NULL UNIQUE,
  amount DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  stripe_payment_link TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Landscapers can view their own invoices"
  ON public.invoices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Landscapers can create invoices"
  ON public.invoices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Landscapers can update their own invoices"
  ON public.invoices
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Landscapers can delete their own invoices"
  ON public.invoices
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Clients can view their own invoices"
  ON public.invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = invoices.client_id
      AND clients.client_user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year TEXT;
BEGIN
  year := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'LP-' || year || '-(.*)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE invoice_number LIKE 'LP-' || year || '-%';
  
  RETURN 'LP-' || year || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;