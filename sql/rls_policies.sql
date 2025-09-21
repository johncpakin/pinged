-- RLS Policies for Pinged.gg

-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view all posts
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);

-- Policy to allow users to insert their own posts
CREATE POLICY "Users can insert their own posts" ON posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own posts
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own posts
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE 
USING (auth.uid() = user_id);

-- Note: These policies should be applied in your Supabase dashboard or through a migration
-- The delete policy ensures users can only delete posts they created (user_id matches auth.uid())