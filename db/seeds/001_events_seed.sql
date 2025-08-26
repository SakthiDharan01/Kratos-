-- 001_events_seed.sql
-- Seed initial events with rules (idempotent pattern: skip if name exists)

with ins as (
  insert into public.events (name, description, rules, category, price, min_team_size, max_team_size)
  select * from (values
    ('Code Hunt', 'A treasure hunt but for programmers! Solve coding clues to find the next location.', '<ul><li>No internet searching for direct answers</li><li>Teams must stay together</li><li>Time penalties for rule violations</li></ul>', 'pre-events', 100, 2, 4),
    ('Hackathon', 'Build innovative solutions in 24 hours. Bring your ideas to life and compete for amazing prizes.', '<ol><li>All code must be written during event</li><li>External libraries allowed</li><li>Pitch limited to 5 minutes</li></ol>', 'technical', 500, 2, 6),
    ('Photography Contest', 'Capture the essence of technology and innovation through your lens.', '<ul><li>Original photos only</li><li>Basic edits allowed</li><li>Submit max 3 entries</li></ul>', 'non-technical', 150, 1, 1),
    ('Tech Olympics', 'Multi-sport competition with a tech twist. Physical challenges meet digital innovation.', '<ul><li>All members must participate in at least one challenge</li><li>Points aggregated across events</li></ul>', 'grounds', 300, 4, 8),
    ('Robot Soccer', 'Build and program robots to play soccer in an automated tournament.', '<ul><li>Robots must pass safety inspection</li><li>Max weight limit applies</li></ul>', 'grounds', 600, 3, 6),
    ('Drone Racing', 'Navigate through obstacle courses with custom-built racing drones.', '<ul><li>FPV goggles allowed</li><li>Frequency coordination required</li><li>Crashes must be cleared promptly</li></ul>', 'grounds', 400, 1, 2)
  ) as v(name, description, rules, category, price, min_team_size, max_team_size)
  where not exists (select 1 from public.events e where e.name = v.name)
  returning 1
)
select count(*) as inserted_rows from ins;
