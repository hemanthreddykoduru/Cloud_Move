-- Create public.users table referencing auth.users
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Create connected_accounts table
CREATE TABLE public.connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- e.g., 'GOOGLE_DRIVE'
    provider_user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    token_vault_ref TEXT NOT NULL,
    scopes_granted TEXT[] NOT NULL DEFAULT '{}',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    storage_used BIGINT,
    storage_limit BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own connected accounts." ON public.connected_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own connected accounts." ON public.connected_accounts FOR ALL USING (auth.uid() = user_id);

-- Create transfers table
CREATE TABLE public.transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    source_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE RESTRICT,
    destination_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED
    total_files INTEGER NOT NULL DEFAULT 0,
    total_bytes BIGINT NOT NULL DEFAULT 0,
    transferred_bytes BIGINT NOT NULL DEFAULT 0,
    options JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transfers." ON public.transfers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own transfers." ON public.transfers FOR ALL USING (auth.uid() = user_id);

-- Create transfer_files table
CREATE TABLE public.transfer_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
    source_file_id TEXT NOT NULL,
    destination_file_id TEXT,
    file_name TEXT NOT NULL,
    path TEXT NOT NULL,
    size BIGINT NOT NULL,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED
    md5_checksum_source TEXT,
    md5_checksum_dest TEXT,
    upload_session_uri TEXT,
    last_byte_offset BIGINT NOT NULL DEFAULT 0,
    error_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transfer_files ENABLE ROW LEVEL SECURITY;
-- For performance on large transfers, we might need an index
CREATE INDEX idx_transfer_files_transfer_id ON public.transfer_files(transfer_id);
-- No direct RLS needed on transfer_files if we access it securely or we can add it:
CREATE POLICY "Users can view transfer files of their transfers." ON public.transfer_files FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.transfers WHERE id = transfer_files.transfer_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage transfer files of their transfers." ON public.transfer_files FOR ALL USING (
    EXISTS (SELECT 1 FROM public.transfers WHERE id = transfer_files.transfer_id AND user_id = auth.uid())
);

-- Function to handle new user signup and insert into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, picture_url)
    VALUES (new.id, new.email, new.metadata->>'full_name', new.metadata->>'avatar_url');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a user profile when they sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
