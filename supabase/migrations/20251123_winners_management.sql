-- Create winners table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  team_name TEXT,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  team_members TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Winners are viewable by everyone" ON public.winners;
DROP POLICY IF EXISTS "Only admin can insert winners" ON public.winners;
DROP POLICY IF EXISTS "Only admin can update winners" ON public.winners;
DROP POLICY IF EXISTS "Only admin can delete winners" ON public.winners;

-- Create RLS policies
-- Allow everyone to view winners
CREATE POLICY "Winners are viewable by everyone" 
ON public.winners 
FOR SELECT 
USING (true);

-- Allow admin to insert winners
CREATE POLICY "Only admin can insert winners"
  ON public.winners
  FOR INSERT
  WITH CHECK (auth.email() = 'mrisa.set@mriu.edu.in');

-- Allow admin to update winners
CREATE POLICY "Only admin can update winners"
  ON public.winners
  FOR UPDATE
  USING (auth.email() = 'mrisa.set@mriu.edu.in')
  WITH CHECK (auth.email() = 'mrisa.set@mriu.edu.in');

-- Allow admin to delete winners
CREATE POLICY "Only admin can delete winners"
  ON public.winners
  FOR DELETE
  USING (auth.email() = 'mrisa.set@mriu.edu.in');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_winners_event_id ON public.winners(event_id);
CREATE INDEX IF NOT EXISTS idx_winners_rank ON public.winners(rank);

-- Add comments to fields
COMMENT ON COLUMN public.winners.team_members IS 'Comma-separated list of team members for group victories';
COMMENT ON COLUMN public.winners.image_url IS 'URL of the winner image';
