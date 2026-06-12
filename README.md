# QuestFlow Course Format for Moodle

QuestFlow is a premium, gamified course format for Moodle that transforms standard linear courses into engaging, interactive "Vertical Timeline" journeys. It eliminates the traditional "Scroll of Death," increasing student engagement through visual micro-goals and immediate progression feedback.

## Key Features
- **Vertical Timeline Interface:** Automatically organizes sections and activities into a beautiful, mobile-friendly chronological path.
- **Cascading Completion:** Chapter milestones dynamically calculate completion status, turning green with a checkmark when all tracked activities inside them are finished.
- **Real-Time Synchronization:** Bypasses static caching to sync 100% in real-time with Moodle's native course structure. Adding or hiding an activity immediately updates the map.
- **Customizable Milestones:** Teachers can customize the text and emojis for the "Journey Begins" and "Finish Line" milestones directly from standard Moodle course settings using curated dropdown selectors.
- **Immersive Student View ("Explorer Mode"):** Hides standard Moodle lists and empty chapters for students, providing a focused, distraction-free learning experience.
- **Teacher Tools ("Architect Mode"):** Seamlessly integrates with Moodle's native editing tools. Includes a persistent "Full Width" toggle that utilizes a CSS breakout trick (`100vw`) to span across any theme's container restrictions.
- **Marketplace Ready:** Fully compliant with Moodle 4.x Development Standards (GPL v3, Privacy Provider API, WCAG 2.2 accessibility, strict PHP typing, and Frankenstyle naming).

## Installation
1. Download the plugin and extract it.
2. Place the `questflow` folder into your Moodle `course/format/` directory.
3. Log in to Moodle as an administrator and go to **Site administration > Notifications** to complete the database installation.

## Usage
1. Go to any course and click **Settings**.
2. Scroll down to the **Course format** section and select **QuestFlow**.
3. (Optional) Customize your Start and Finish milestone texts and icons.
4. Click **Save and display**.

### Architect Mode vs. Explorer Mode
*   **Architect Mode:** Turn on Moodle's "Edit mode" to see the "Architect Mode" overlay. Here you can toggle the map to full width and use Moodle's standard activity choosers below the map to add content.
*   **Explorer Mode:** Turn off "Edit mode" to see exactly what students see: a clean, gamified timeline where clicking a node launches the activity directly. Informational activities (without completion tracking) are clearly marked with a neutral dot, while required activities pulse to draw attention.
