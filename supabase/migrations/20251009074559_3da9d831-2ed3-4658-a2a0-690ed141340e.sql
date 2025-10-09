-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');

-- Create call status enum
CREATE TYPE call_status AS ENUM ('initiated', 'ringing', 'answered', 'ended', 'missed', 'declined');

-- Create calling_subscriptions table
CREATE TABLE public.calling_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_duration INTEGER NOT NULL, -- in months (1, 3, 6)
  price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  status subscription_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, status) -- Only one active subscription per user
);

-- Create call_logs table
CREATE TABLE public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL, -- 'audio' or 'video'
  status call_status NOT NULL DEFAULT 'initiated',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_contacts table
CREATE TABLE public.user_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.calling_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calling_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.calling_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.calling_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all subscriptions"
  ON public.calling_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for call_logs
CREATE POLICY "Users can view their own call logs"
  ON public.call_logs FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can update their call logs"
  ON public.call_logs FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- RLS Policies for user_contacts
CREATE POLICY "Users can manage their own contacts"
  ON public.user_contacts FOR ALL
  USING (auth.uid() = user_id);

-- Create function to check active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.calling_subscriptions
    WHERE user_id = user_uuid
      AND status = 'active'
      AND expires_at > now()
  );
END;
$$;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calling_subscriptions_updated_at
  BEFORE UPDATE ON public.calling_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;