-- Needed for drag to reorder habits
alter table habits add column if not exists sort_order integer;
