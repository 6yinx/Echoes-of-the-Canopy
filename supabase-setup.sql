-- Supabase Database Setup for Echoes of the Canopy
-- Run this SQL in your Supabase SQL Editor

-- Create the player_saves table
create table player_saves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  session_id text not null,
  save_name text not null,
  health numeric not null,
  hunger numeric not null,
  stamina numeric not null,
  player_position jsonb not null,
  time_of_day numeric not null,
  is_lantern_active boolean not null,
  inventory jsonb not null default '[]'::jsonb,
  active_slot integer not null default 0,
  dropped_items jsonb not null default '[]'::jsonb,
  show_touch_controls boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_auto_save boolean not null default true,
  unique(session_id, save_name)
);

-- Create indexes for better query performance
create index player_saves_user_id_idx on player_saves(user_id);
create index player_saves_session_id_idx on player_saves(session_id);
create index player_saves_updated_at_idx on player_saves(updated_at desc);

-- Enable Row Level Security
alter table player_saves enable row level security;

-- RLS Policy: Allow all operations for anonymous saves
-- This allows anyone to read/write saves based on their session_id
create policy "Allow anonymous saves"
  on player_saves for all
  using (true)
  with check (true);

-- Optional: If you want to add user authentication later, you can add this policy:
-- create policy "Users can manage their own saves"
--   on player_saves for all
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create a trigger to call the function before updates
create trigger update_player_saves_updated_at
  before update on player_saves
  for each row
  execute function update_updated_at_column();
