-- Create events table with all fields including image_url
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  attendees INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for select (anyone can view events)
CREATE POLICY "Anyone can view events" 
  ON public.events 
  FOR SELECT 
  USING (true);

-- Create RLS policy for insert/update/delete (only admin)
CREATE POLICY "Only admin can manage events"
  ON public.events
  FOR ALL
  USING (auth.email() = 'mrisa.set@mriu.edu.in')
  WITH CHECK (auth.email() = 'mrisa.set@mriu.edu.in');

-- If the table already exists, add image_url column if it doesn't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS image_url TEXT;
