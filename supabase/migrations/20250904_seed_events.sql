-- Seed events for Kratos 2k25
-- Categories: Technical, No-Code, PlayGround, Online Events

INSERT INTO events (
  name, description, rules, price, min_team_size, max_team_size, 
  category, event_type, status, participant_limit, registration_start, 
  registration_end, event_date, incharge_name1, incharge_phone1, 
  incharge_name2, incharge_phone2
) VALUES

-- Technical Events
(
  'CodeStorm', 
  'A competitive programming contest testing your algorithmic skills and problem-solving abilities.',
  'Teams of 1-3 members. Laptops required. Internet access provided. Duration: 3 hours.',
  500, 1, 3, 'Technical', 'team', 'open', 100,
  '2025-01-15 00:00:00+00', '2025-02-10 23:59:59+00', '2025-02-15 09:00:00+00',
  'Rajesh Kumar', '+91 9876543210', 'Priya Singh', '+91 9876543211'
),

(
  'Web Warriors', 
  'Design and develop a complete web application within 24 hours.',
  'Teams of 2-4 members. Any framework allowed. Must be responsive and functional.',
  800, 2, 4, 'Technical', 'team', 'open', 50,
  '2025-01-15 00:00:00+00', '2025-02-10 23:59:59+00', '2025-02-16 10:00:00+00',
  'Amit Sharma', '+91 9876543212', 'Neha Gupta', '+91 9876543213'
),

(
  'AI Challenge', 
  'Build an AI/ML solution for real-world problems.',
  'Teams of 1-3 members. Python preferred. Datasets will be provided. 6-hour duration.',
  600, 1, 3, 'Technical', 'team', 'open', 75,
  '2025-01-15 00:00:00+00', '2025-02-10 23:59:59+00', '2025-02-17 11:00:00+00',
  'Dr. Kavita Patel', '+91 9876543214', 'Rohit Mehta', '+91 9876543215'
),

-- No-Code Events
(
  'Design Sprint', 
  'Create stunning UI/UX designs using no-code tools and design thinking.',
  'Individual or teams of up to 2. Tools: Figma, Adobe XD, or similar. 4-hour sprint.',
  300, 1, 2, 'No-Code', 'team', 'open', 80,
  '2025-01-20 00:00:00+00', '2025-02-12 23:59:59+00', '2025-02-18 14:00:00+00',
  'Sneha Reddy', '+91 9876543216', 'Karan Joshi', '+91 9876543217'
),

(
  'App Builder Pro', 
  'Build a complete mobile app using no-code platforms like Bubble or FlutterFlow.',
  'Teams of 2-3 members. No coding experience required. Focus on functionality and design.',
  450, 2, 3, 'No-Code', 'team', 'open', 60,
  '2025-01-20 00:00:00+00', '2025-02-12 23:59:59+00', '2025-02-19 09:00:00+00',
  'Vikram Singh', '+91 9876543218', 'Anita Desai', '+91 9876543219'
),

-- PlayGround Events
(
  'Tech Quiz Mania', 
  'Test your knowledge across various technology domains.',
  'Individual participation. Multiple rounds: written, buzzer, rapid fire. No devices allowed.',
  200, 1, 1, 'PlayGround', 'solo', 'open', 150,
  '2025-01-25 00:00:00+00', '2025-02-14 23:59:59+00', '2025-02-20 16:00:00+00',
  'Suresh Kumar', '+91 9876543220', 'Meena Sharma', '+91 9876543221'
),

(
  'Debugging Derby', 
  'Find and fix bugs in given code snippets as fast as possible.',
  'Individual event. Multiple programming languages. Time-based scoring. 2-hour duration.',
  250, 1, 1, 'PlayGround', 'solo', 'open', 100,
  '2025-01-25 00:00:00+00', '2025-02-14 23:59:59+00', '2025-02-21 10:00:00+00',
  'Rahul Verma', '+91 9876543222', 'Pooja Agarwal', '+91 9876543223'
),

(
  'Innovation Pitch', 
  'Present your innovative tech idea in 5 minutes and convince the judges.',
  'Individual or teams of up to 3. Presentation slides required. No prototypes needed.',
  350, 1, 3, 'PlayGround', 'team', 'open', 40,
  '2025-01-25 00:00:00+00', '2025-02-14 23:59:59+00', '2025-02-22 15:00:00+00',
  'Prof. Arun Kumar', '+91 9876543224', 'Divya Patel', '+91 9876543225'
),

-- Online Events
(
  'Virtual Hackathon', 
  'A 48-hour online hackathon open to participants worldwide.',
  'Teams of 1-4 members. Theme will be announced at start. Submit via GitHub. Discord for communication.',
  400, 1, 4, 'Online Events', 'team', 'open', 200,
  '2025-01-10 00:00:00+00', '2025-02-05 23:59:59+00', '2025-02-08 18:00:00+00',
  'Tech Lead Alex', '+91 9876543226', 'Community Manager Sarah', '+91 9876543227'
),

(
  'Cyber Security CTF', 
  'Capture The Flag competition testing your cybersecurity skills.',
  'Individual or teams of up to 3. Categories: Web, Crypto, Forensics, Binary. Online platform provided.',
  550, 1, 3, 'Online Events', 'team', 'open', 120,
  '2025-01-10 00:00:00+00', '2025-02-05 23:59:59+00', '2025-02-09 20:00:00+00',
  'Security Expert Mike', '+91 9876543228', 'CTF Organizer Lisa', '+91 9876543229'
),

(
  'Open Source Sprint', 
  'Contribute to open source projects and make a real impact.',
  'Individual participation. Choose from listed projects. Mentors available. Submit PRs by deadline.',
  0, 1, 1, 'Online Events', 'solo', 'open', 300,
  '2025-01-05 00:00:00+00', '2025-02-01 23:59:59+00', '2025-02-05 09:00:00+00',
  'OSS Coordinator John', '+91 9876543230', 'Mentor Lead Emma', '+91 9876543231'
),

(
  'Data Science Bootcamp', 
  'Learn and apply data science techniques in this intensive online workshop.',
  'Individual registration. Jupyter notebooks provided. Python knowledge preferred. 8-hour session.',
  750, 1, 1, 'Online Events', 'solo', 'open', 100,
  '2025-01-10 00:00:00+00', '2025-02-05 23:59:59+00', '2025-02-12 10:00:00+00',
  'Data Scientist Dr. Raj', '+91 9876543232', 'Workshop Assistant Nina', '+91 9876543233'
);

-- Update current_registrations to 0 for all events
UPDATE events SET current_registrations = 0 WHERE current_registrations IS NULL;
