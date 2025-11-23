-- Create CTF events table
CREATE TABLE public.ctf_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_link TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'past')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.ctf_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  team_name TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create winners table
CREATE TABLE public.winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.ctf_events(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  team_name TEXT,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team table
CREATE TABLE public.team (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact messages table
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ctf_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "CTF events are viewable by everyone" 
ON public.ctf_events FOR SELECT USING (true);

CREATE POLICY "Winners are viewable by everyone" 
ON public.winners FOR SELECT USING (true);

CREATE POLICY "Team members are viewable by everyone" 
ON public.team FOR SELECT USING (true);

CREATE POLICY "Anyone can register for events" 
ON public.registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can send contact messages" 
ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ctf_events_updated_at
  BEFORE UPDATE ON public.ctf_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.ctf_events (title, description, date, status) VALUES
  ('CyberNight CTF 2024', 'Epic 48-hour hacking competition with $10,000 in prizes. Test your skills in web exploitation, cryptography, reverse engineering, and more.', '2024-03-15 18:00:00+00', 'upcoming'),
  ('Binary Breach Challenge', 'Advanced reverse engineering and binary exploitation challenge. Only the elite hackers will crack these puzzles.', '2024-02-01 12:00:00+00', 'past'),
  ('Crypto Wars', 'Cryptography-focused CTF with custom challenges ranging from classical ciphers to modern blockchain security.', '2024-04-20 09:00:00+00', 'upcoming');

INSERT INTO public.winners (event_id, player_name, team_name, rank, score) VALUES
  ((SELECT id FROM public.ctf_events WHERE title = 'Binary Breach Challenge'), 'Neo_Hacker', 'Matrix Breakers', 1, 2847),
  ((SELECT id FROM public.ctf_events WHERE title = 'Binary Breach Challenge'), 'CyberPhoenix', 'Code Warriors', 2, 2651),
  ((SELECT id FROM public.ctf_events WHERE title = 'Binary Breach Challenge'), 'ZeroDay', 'Null Pointers', 3, 2534);

INSERT INTO public.team (name, role, bio) VALUES
  ('Alex Chen', 'Founder & CEO', 'Former red team lead at major tech companies. Passionate about making cybersecurity accessible through gamification.'),
  ('Sarah Martinez', 'CTO', 'Security researcher and CTF legend. Built scalable platforms handling millions of concurrent connections.'),
  ('Marcus Kim', 'Lead Developer', 'Full-stack engineer specializing in real-time systems and competitive programming platforms.'),
  ('Elena Volkov', 'Security Researcher', 'Exploit developer and vulnerability researcher. Creates mind-bending CTF challenges that push hackers to their limits.');