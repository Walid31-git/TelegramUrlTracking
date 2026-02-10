-- Function to update click counts on promoter_links
create or replace function update_link_stats()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    -- Increment total_clicks
    update promoter_links
    set total_clicks = total_clicks + 1
    where id = NEW.link_id;

    -- If converted, increment total_conversions
    if NEW.converted then
      update promoter_links
      set total_conversions = total_conversions + 1
      where id = NEW.link_id;
    end if;
  elsif TG_OP = 'UPDATE' then
    -- If conversion status changed from false to true
    if NEW.converted and not OLD.converted then
      update promoter_links
      set total_conversions = total_conversions + 1
      where id = NEW.link_id;
    elsif not NEW.converted and OLD.converted then
      update promoter_links
      set total_conversions = total_conversions - 1
      where id = NEW.link_id;
    end if;
  end if;

  return NEW;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists update_link_stats_trigger on clicks;

-- Create trigger on clicks table
create trigger update_link_stats_trigger
  after insert or update on clicks
  for each row
  execute function update_link_stats();
