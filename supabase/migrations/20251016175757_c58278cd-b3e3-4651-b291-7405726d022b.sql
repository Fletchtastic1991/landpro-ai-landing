-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landscaper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  invitation_token UUID DEFAULT gen_random_uuid(),
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(landscaper_id, email)
);

-- Add client_id and status to quotes table
ALTER TABLE public.quotes ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.quotes ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';

-- Create messages table for client-landscaper communication
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for clients table
CREATE POLICY "Landscapers can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = landscaper_id);

CREATE POLICY "Landscapers can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = landscaper_id);

CREATE POLICY "Landscapers can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = landscaper_id);

CREATE POLICY "Landscapers can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = landscaper_id);

CREATE POLICY "Clients can view their own profile"
  ON public.clients FOR SELECT
  USING (auth.uid() = client_user_id);

-- Update quotes RLS to allow clients to view their quotes
CREATE POLICY "Clients can view their own quotes"
  ON public.quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = quotes.client_id
      AND clients.client_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update quote status"
  ON public.quotes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = quotes.client_id
      AND clients.client_user_id = auth.uid()
    )
  );

-- RLS policies for messages
CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read"
  ON public.messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();