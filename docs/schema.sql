-- PostgreSQL schema draft for Memory Ticket.
-- Use UUID primary keys for app/backend portability and future mini-program distribution.

create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  wechat_openid varchar(128) unique,
  phone varchar(32) unique,
  nickname varchar(80),
  avatar_url varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  scene varchar(32) not null check (scene in ('trip', 'graduation', 'person', 'custom')),
  status varchar(32) not null default 'draft' check (status in ('draft', 'collecting', 'preview', 'published', 'ordered', 'archived')),
  privacy varchar(24) not null default 'private' check (privacy in ('private', 'link_visible', 'public')),
  title varchar(64),
  subtitle varchar(120),
  occurred_at date,
  period_label varchar(64),
  location_name varchar(120),
  template_key varchar(64) not null default 'train',
  story_slug varchar(96) unique,
  qr_token varchar(128) unique,
  nfc_uid varchar(128) unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_memories_owner_status on memories(owner_id, status);
create index idx_memories_story_slug on memories(story_slug);
create index idx_memories_created_at on memories(created_at desc);

create table memory_assets (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references memories(id) on delete cascade,
  owner_id uuid not null references users(id) on delete cascade,
  asset_type varchar(24) not null check (asset_type in ('photo', 'video', 'voice', 'text_note', 'old_ticket', 'cover', 'print_pdf')),
  storage_key varchar(255) not null,
  mime_type varchar(80) not null,
  byte_size integer not null check (byte_size > 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_memory_assets_memory_type on memory_assets(memory_id, asset_type);
create index idx_memory_assets_owner on memory_assets(owner_id);

create table interview_answers (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references memories(id) on delete cascade,
  question_text varchar(240) not null,
  answer_text text,
  audio_asset_id uuid references memory_assets(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_interview_answers_memory_order on interview_answers(memory_id, sort_order);

create table memory_contents (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references memories(id) on delete cascade,
  version integer not null default 1 check (version > 0),
  source varchar(24) not null default 'ai' check (source in ('ai', 'human_editor', 'user')),
  ticket_title varchar(64) not null,
  ticket_subtitle varchar(120) not null,
  back_copy varchar(400) not null,
  story_body text not null,
  audio_summary varchar(160),
  print_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(memory_id, version)
);

create index idx_memory_contents_memory_version on memory_contents(memory_id, version desc);

create table products (
  id uuid primary key default gen_random_uuid(),
  sku varchar(64) not null unique,
  name varchar(80) not null,
  product_type varchar(32) not null check (product_type in ('single_ticket', 'ticket_set', 'zine', 'book', 'gift_box')),
  delivery_type varchar(24) not null check (delivery_type in ('qr', 'nfc', 'print', 'mixed')),
  price_cents integer not null check (price_cents >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete restrict,
  memory_id uuid not null references memories(id) on delete restrict,
  product_id uuid not null references products(id) on delete restrict,
  status varchar(32) not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'content_confirmed', 'printing', 'shipped', 'completed', 'cancelled', 'refunded')),
  quantity integer not null default 1 check (quantity > 0),
  amount_cents integer not null check (amount_cents >= 0),
  recipient_name varchar(80),
  recipient_phone varchar(32),
  shipping_address jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_user_status on orders(user_id, status);
create index idx_orders_memory on orders(memory_id);

create table production_tasks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  task_type varchar(32) not null check (task_type in ('content_check', 'qr_bind', 'nfc_write', 'print', 'pack', 'ship')),
  status varchar(24) not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  operator_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_production_tasks_order_status on production_tasks(order_id, status);

create table ai_jobs (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references memories(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  job_type varchar(32) not null check (job_type in ('audio_transcribe', 'story_generate', 'title_generate', 'print_pdf_generate')),
  status varchar(24) not null default 'pending' check (status in ('pending', 'running', 'done', 'failed', 'cancelled')),
  input_asset_id uuid references memory_assets(id) on delete set null,
  result_content_id uuid references memory_contents(id) on delete set null,
  error_code varchar(64),
  error_message text,
  idempotency_key varchar(128) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_type, idempotency_key)
);

create index idx_ai_jobs_memory_status on ai_jobs(memory_id, status);
create index idx_ai_jobs_status_created on ai_jobs(status, created_at);

create table story_share_links (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references memories(id) on delete cascade,
  created_by_user_id uuid not null references users(id) on delete cascade,
  token varchar(128) not null unique,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_story_share_links_memory on story_share_links(memory_id);

create table story_access_logs (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references memories(id) on delete cascade,
  share_link_id uuid references story_share_links(id) on delete set null,
  visitor_user_id uuid references users(id) on delete set null,
  source varchar(32) not null default 'unknown' check (source in ('scan_qr', 'share_card', 'direct_link', 'unknown')),
  created_at timestamptz not null default now()
);

create index idx_story_access_logs_memory_created on story_access_logs(memory_id, created_at desc);
create index idx_story_access_logs_share_link on story_access_logs(share_link_id);
