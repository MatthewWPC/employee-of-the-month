# Project: WealthPoint Employee of the Month Voting Portal

## Who I Am
I am not a developer. I give all instructions in plain English only.
Do not ask me to edit code, run terminal commands, or make technical decisions.
Handle ALL technical problems yourself - debug, fix, and test without asking me.
If something breaks, fix it silently and move on. Never show me error messages or code.
Only talk to me about design, features, and how things look.

## What This Project Is
A stunning, cutting-edge web-based voting portal for WealthPoint Capital's monthly Employee of the Month awards. This should feel premium, polished, and full of delightful surprises. Think award-show energy meets private banking elegance.

## Design & Branding
- Company: WealthPoint Capital
- Primary colour: Navy blue (#1B3A5C)
- Secondary colour: Steel/slate blue (#4A6FA5)
- Accent: Gold (#C8A951) for highlights and interactive elements
- Background: Soft light grey/blue gradient (like #F0F4F8 to #E8EEF4)
- Font: Clean, modern, premium (Inter or similar sans-serif)
- Cards: White with subtle shadow, light blue-grey border, rounded corners
- Buttons: Navy blue with white text, rounded, satisfying hover effects
- The WealthPoint Capital logo text should appear in the header in navy blue
- Overall vibe: Premium, elegant, warm, celebratory - like a luxury awards ceremony

## Architecture - Three Core Screens

### Screen 1: Welcome / Login Page
- Centered layout, clean and bold
- WealthPoint Capital logo/wordmark at the top
- Large hero text: "Dare to be great." with "great" in italic gold or italic serif
- Subtitle: "Employee of the Month Awards"
- A white card with a text input: "Your Full Name" (placeholder: "e.g. Jane Doe")
- A prominent navy blue button: "Begin Voting →"
- SECRET ADMIN ACCESS: If someone types "admin" in the name field, they bypass voting and go directly to the Admin Dashboard instead
- This page should feel inspiring and cinematic

### Screen 2: Voting Page
- Header bar with WealthPoint Capital wordmark on the left
- Progress indicator in top right (e.g. "0% Complete" updating as they vote)
- Main heading: "Cast your votes" with subtitle "Welcome, [Name]. Select up to 2 nominees per category."
- RIGHT SIDEBAR: "Your Nominations" panel showing a real-time tally of who you've voted for and how many times, with each team member's name and vote count
- MAIN CONTENT: A scrollable list of award categories, each in its own card:

#### Award Categories (each card has an icon, title, description, and nominee buttons):
1. THE CORNERSTONE - "The foundation others build on. Consistent, dependable, and unshakeable - the person the whole team quietly relies on to deliver, without fail, every single time."
2. THE PILOT - "Committed to growth - theirs and others'. They invest in becoming sharper, more skilled, and more effective every quarter. Always learning, always improving."
3. THE CRAFTSMAN - "Takes genuine pride in doing their work exceptionally well. Accuracy, quality, and attention to detail are non-negotiable standards - not a checklist."
4. THE ENERGY GIVER - "Walks into a room and raises the temperature. Their attitude is contagious, their encouragement is real, and they make everyone around them better just by being present."
5. THE NIGHT WATCHMAN - "When the moment demanded more than the job description, they delivered - quietly, without fanfare, after hours if needed. Whatever it took. No questions asked."
6. THE CONNECTOR - "Bridges people, ideas, and teams. Builds relationships internally and externally that move the business forward."
7. THE CLEAR HEAD - "Brought calm, clarity, and good judgment in a moment of pressure, complexity, or ambiguity."
8. THE CLIENT CHAMPION - "Went above and beyond to deliver an exceptional client or stakeholder experience. They made people feel heard, valued, and genuinely well looked after."
9. THE CULTURE KEEPER - "Actively protects and enriches what makes Wealthpoint special. Lives the values. Sets the tone. Leads by example."
10. THE DARK HORSE - "The unsung hero. Quietly exceptional, never seeking the spotlight - yet their contribution, dedication and impact are felt by everyone. This one's for the person who deserves far more recognition than they ever ask for."

#### Each category card should have:
- A unique, atmospheric icon/image on the left (use AI-themed or abstract professional imagery style - dark, moody, cinematic feel like the screenshots)
- Category name as a bold heading
- Description text in lighter grey
- A vote counter badge in top right showing "0/2" updating as selections are made
- 8 nominee buttons in a 4x2 grid, each as a rounded pill/chip with light blue-grey background
- Clicking a nominee highlights them (selected state with colour change)
- Maximum 2 selections per category

#### Team Members (the same 8 people appear in every category):
- Steve Staplyton Smith
- Adam Turk
- Jan Faure
- Matthew Norris
- James Booth
- James Poole
- Kira Williams
- Candice Boshoff

#### Below all categories - "A Memorable Interaction" section:
- Heading: "A Memorable Interaction"
- Subtitle: "Share a specific moment that stood out to you this month."
- Dropdown: "Who is this about?" - Select a team member
- Text area: "What happened?" with character counter (0/300)
- This is optional but encouraged

#### Submit button at the bottom
- After submitting, show a celebratory confirmation with animation (confetti, fireworks, or similar)

### Screen 3: Admin Dashboard (accessed by typing "admin" in the name field)
- Clean dashboard layout
- Show all accumulated votes across all categories
- Show which team members got the most votes overall
- Show votes broken down by category
- Show the memorable interaction submissions
- Show who voted (list of voter names)
- Charts or visual data where appropriate
- Make this genuinely useful and insightful for reviewing results

## Technical Requirements
- Must work on phones AND desktops (fully responsive)
- Data must persist (votes should be saved so they accumulate across multiple voters)
- Each person can only vote once (check by name)
- Use a database or persistent storage - not just browser memory
- Must be hostable on a simple platform like Vercel, Netlify, Railway, or Replit

## Wow Factor & Surprises
- Smooth animations and transitions between pages
- Satisfying micro-interactions (button clicks, selections, hover effects)
- Celebratory moment when votes are submitted (confetti, animation)
- Premium feel throughout - no part should feel like a basic template
- Category icons should feel atmospheric, moody, and cinematic
- The whole experience should make employees feel like this is something special, not just a form

## Key Rules
- Fix all your own problems. Never ask me to debug.
- Show me a working version I can open in my browser after each major step
- When in doubt, choose the option that looks more premium
- Explain decisions to me in plain English only
- Test everything works before telling me it's done
