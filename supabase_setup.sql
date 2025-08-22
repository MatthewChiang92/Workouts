-- Workouts App Database Schema Recreation
-- Run these commands in your new Supabase SQL Editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create routines table
create table public.routines (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    training_days integer default 0,
    rest_days integer default 7,
    is_active boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create exercises table
create table public.exercises (
    id uuid default uuid_generate_v4() primary key,
    routine_id uuid references public.routines(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    sets integer default 3,
    reps integer default 10,
    weight integer default 0,
    day text not null, -- 'Monday', 'Tuesday', etc.
    type text default 'strength', -- 'strength' or 'cardio'
    duration integer, -- for cardio exercises (minutes)
    distance numeric, -- for cardio exercises (km)
    is_completed boolean default false, -- for workout tracking
    is_pr boolean default false, -- for personal record tracking
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index routines_user_id_idx on public.routines(user_id);
create index routines_is_active_idx on public.routines(is_active);
create index exercises_routine_id_idx on public.exercises(routine_id);
create index exercises_user_id_idx on public.exercises(user_id);
create index exercises_day_idx on public.exercises(day);

-- Enable Row Level Security
alter table public.routines enable row level security;
alter table public.exercises enable row level security;

-- Create RLS policies for routines
create policy "Users can view their own routines" 
    on public.routines for select 
    using (auth.uid() = user_id);

create policy "Users can create their own routines" 
    on public.routines for insert 
    with check (auth.uid() = user_id);

create policy "Users can update their own routines" 
    on public.routines for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own routines" 
    on public.routines for delete 
    using (auth.uid() = user_id);

-- Create RLS policies for exercises
create policy "Users can view their own exercises" 
    on public.exercises for select 
    using (auth.uid() = user_id);

create policy "Users can create their own exercises" 
    on public.exercises for insert 
    with check (auth.uid() = user_id);

create policy "Users can update their own exercises" 
    on public.exercises for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own exercises" 
    on public.exercises for delete 
    using (auth.uid() = user_id);

-- Optional: Create a function to automatically deactivate other routines when one is set to active
create or replace function handle_routine_activation()
returns trigger as $$
begin
    -- If the routine is being set to active
    if new.is_active = true and (old.is_active is null or old.is_active = false) then
        -- Deactivate all other routines for this user
        update public.routines 
        set is_active = false 
        where user_id = new.user_id and id != new.id;
    end if;
    return new;
end;
$$ language plpgsql;

-- Create trigger for automatic routine activation handling
create trigger on_routine_activation
    before update on public.routines
    for each row execute procedure handle_routine_activation();

-- Optional: Create a view for easier routine querying with exercise counts
create or replace view routine_summary as
select 
    r.*,
    count(e.id) as exercise_count,
    count(distinct e.day) as training_days_with_exercises
from public.routines r
left join public.exercises e on r.id = e.routine_id
group by r.id, r.name, r.user_id, r.training_days, r.rest_days, r.is_active, r.created_at;