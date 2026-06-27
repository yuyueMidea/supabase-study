-- ============================================================
-- FlowDesk — Complete Supabase Schema
-- Run this in your Supabase SQL editor to set up all tables.
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── User Profiles ───────────────────────────────────────────
create table if not exists user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  avatar_url  text,
  role        text not null default 'employee' check (role in ('admin','manager','employee')),
  department  text,
  created_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Workflow Definitions ─────────────────────────────────────
create table if not exists workflow_definitions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  category    text not null default '其他',
  icon        text not null default '📋',
  color       text not null default '#6270f3',
  steps       jsonb not null default '[]',
  is_active   boolean not null default true,
  created_by  uuid references user_profiles(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── Workflow Instances ───────────────────────────────────────
create table if not exists workflow_instances (
  id              uuid primary key default gen_random_uuid(),
  definition_id   uuid references workflow_definitions(id) on delete restrict,
  title           text not null,
  current_step    text not null,
  status          text not null default 'pending'
                  check (status in ('pending','running','approved','rejected','cancelled')),
  priority        text not null default 'normal'
                  check (priority in ('low','normal','high','urgent')),
  payload         jsonb not null default '{}',
  assignee_id     uuid references user_profiles(id),
  created_by      uuid references user_profiles(id),
  due_date        timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── Workflow Logs ────────────────────────────────────────────
create table if not exists workflow_logs (
  id          uuid primary key default gen_random_uuid(),
  instance_id uuid references workflow_instances(id) on delete cascade,
  from_step   text,
  to_step     text,
  action      text not null
              check (action in ('submit','approve','reject','cancel','reassign','comment','timeout')),
  operator_id uuid references user_profiles(id),
  comment     text,
  created_at  timestamptz default now()
);

-- ─── Notifications ────────────────────────────────────────────
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references user_profiles(id) on delete cascade,
  instance_id uuid references workflow_instances(id) on delete cascade,
  type        text not null
              check (type in ('task_assigned','task_approved','task_rejected','task_cancelled','comment_added')),
  title       text not null,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz default now()
);

-- ─── Indexes ─────────────────────────────────────────────────
create index if not exists idx_instances_status       on workflow_instances(status);
create index if not exists idx_instances_assignee     on workflow_instances(assignee_id);
create index if not exists idx_instances_created_by   on workflow_instances(created_by);
create index if not exists idx_instances_definition   on workflow_instances(definition_id);
create index if not exists idx_logs_instance          on workflow_logs(instance_id);
create index if not exists idx_notifs_user            on notifications(user_id, is_read);

-- ─── Updated_at trigger ──────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_instances_updated_at on workflow_instances;
create trigger trg_instances_updated_at
  before update on workflow_instances
  for each row execute function update_updated_at();

drop trigger if exists trg_definitions_updated_at on workflow_definitions;
create trigger trg_definitions_updated_at
  before update on workflow_definitions
  for each row execute function update_updated_at();

-- ─── RLS Policies ────────────────────────────────────────────
alter table user_profiles       enable row level security;
alter table workflow_definitions enable row level security;
alter table workflow_instances   enable row level security;
alter table workflow_logs        enable row level security;
alter table notifications        enable row level security;

-- user_profiles: anyone can see, only owner can update
create policy "profiles_select" on user_profiles for select using (true);
create policy "profiles_update" on user_profiles for update using (id = auth.uid());

-- definitions: everyone can read active ones; only admins can write
create policy "defs_select" on workflow_definitions for select using (is_active = true or created_by = auth.uid());
create policy "defs_insert" on workflow_definitions for insert with check (auth.uid() is not null);
create policy "defs_update" on workflow_definitions for update using (
  created_by = auth.uid() or
  exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
);

-- instances: creator or assignee or admin
create policy "instances_select" on workflow_instances for select using (
  created_by = auth.uid() or
  assignee_id = auth.uid() or
  exists (select 1 from user_profiles where id = auth.uid() and role in ('admin','manager'))
);
create policy "instances_insert" on workflow_instances for insert with check (auth.uid() is not null);
create policy "instances_update" on workflow_instances for update using (
  assignee_id = auth.uid() or
  created_by = auth.uid() or
  exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
);

-- logs: visible to instance participants
create policy "logs_select" on workflow_logs for select using (
  exists (
    select 1 from workflow_instances wi
    where wi.id = instance_id
      and (wi.created_by = auth.uid() or wi.assignee_id = auth.uid())
  ) or
  exists (select 1 from user_profiles where id = auth.uid() and role in ('admin','manager'))
);
create policy "logs_insert" on workflow_logs for insert with check (auth.uid() is not null);

-- notifications: own only
create policy "notifs_select" on notifications for select using (user_id = auth.uid());
create policy "notifs_update" on notifications for update using (user_id = auth.uid());

-- ─── Enable Realtime ─────────────────────────────────────────
alter publication supabase_realtime add table workflow_instances;
alter publication supabase_realtime add table notifications;

-- ─── Seed demo definitions ───────────────────────────────────
-- (Optional — remove if you don't want seed data)
-- These run only if table is empty
do $$
begin
  if not exists (select 1 from workflow_definitions limit 1) then
    insert into workflow_definitions (name, description, category, icon, color, steps) values
    (
      '请假申请',
      '员工请假审批流程，需主管确认后HR备案',
      '人事', '🏖️', '#6270f3',
      '[
        {"id":"submit","name":"提交申请","type":"start","assignee_role":"self","allow_comment":true,"required_comment":false},
        {"id":"manager_review","name":"主管审批","type":"approval","assignee_role":"manager","allow_comment":true,"required_comment":true,"timeout_hours":48,"timeout_action":"approve"},
        {"id":"hr_confirm","name":"HR备案","type":"review","assignee_role":"hr","allow_comment":true,"required_comment":false},
        {"id":"done","name":"完成","type":"end","assignee_role":"self","allow_comment":false,"required_comment":false}
      ]'::jsonb
    ),
    (
      '报销申请',
      '费用报销审批，超过5000元需财务总监复核',
      '财务', '💰', '#10b981',
      '[
        {"id":"submit","name":"提交申请","type":"start","assignee_role":"self","allow_comment":true,"required_comment":false},
        {"id":"manager_approve","name":"主管审批","type":"approval","assignee_role":"manager","allow_comment":true,"required_comment":false},
        {"id":"finance_review","name":"财务审核","type":"approval","assignee_role":"admin","allow_comment":true,"required_comment":true},
        {"id":"done","name":"打款完成","type":"end","assignee_role":"self","allow_comment":false,"required_comment":false}
      ]'::jsonb
    ),
    (
      '采购申请',
      '物资采购审批流程',
      '行政', '📦', '#f59e0b',
      '[
        {"id":"submit","name":"提交申请","type":"start","assignee_role":"self","allow_comment":true,"required_comment":false},
        {"id":"dept_approve","name":"部门负责人审批","type":"approval","assignee_role":"manager","allow_comment":true,"required_comment":false},
        {"id":"admin_review","name":"行政审核","type":"review","assignee_role":"admin","allow_comment":true,"required_comment":false},
        {"id":"done","name":"采购完成","type":"end","assignee_role":"self","allow_comment":false,"required_comment":false}
      ]'::jsonb
    );
  end if;
end;
$$;
