# QuestFlow Course Format for Moodle

QuestFlow is a premium, gamified course format for Moodle that transforms standard linear courses into engaging, interactive "Vertical Timeline" journeys. It eliminates the traditional "Scroll of Death," increasing student engagement through visual micro-goals and immediate progression feedback.

## Key Features
- **Vertical Timeline Interface:** Automatically organizes sections and activities into a beautiful, mobile-friendly chronological path.
- **Cascading Completion:** Chapter milestones dynamically calculate completion status, turning green with a checkmark when all tracked activities inside them are finished.
- **Branching Paths:** Teachers can designate parallel tracks (e.g., Beginner vs. Advanced), causing nodes to group and render side-by-side.
- **Prerequisite Visualization:** Deeply integrates with Moodle's Restrict Access API to visually display "lock" tooltips, explaining exactly what must be completed to unlock an activity.
- **Teacher Heatmaps & Analytics:** Toggle a visual overlay to see where students are clustered in real-time and identify curriculum bottlenecks via high drop-off alerts.
- **Completion Celebrations:** Lightweight, delightful particle confetti effects automatically trigger when students complete chapters or finish the entire course.
- **Ecosystem Gamification:** Native hooks seamlessly detect popular gamification plugins (like Level Up! and Stash) to visually display XP and loot items directly on activity nodes.
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
*   **Architect Mode:** Turn on Moodle's "Edit mode" to see the "Architect Mode" overlay. Here you can toggle the map to full width and use Moodle's standard activity choosers below the map to add content. You can also define Branching Paths here by clicking the "⑂ Branch" button on adjacent nodes to render them side-by-side.
*   **Explorer Mode:** Turn off "Edit mode" to see exactly what students see: a clean, gamified timeline where clicking a node launches the activity directly. Informational activities (without completion tracking) are clearly marked with a neutral dot, while required activities pulse to draw attention.

### Creating Branching Paths
Teachers can visually break the strict vertical timeline to offer choices or parallel tracks (e.g., "Beginner" vs. "Advanced"):
1. **Enable Edit Mode** to view the map in "Architect Mode".
2. Locate two or more sequential activities that represent a choice or split path.
3. Click the **"⑂ Branch"** button on *all* of those adjacent activities. The buttons will turn blue to indicate they are active.
4. The timeline will immediately group these activities and render them **side-by-side horizontally**. 
*Note: This controls the visual layout. Use Moodle's native **Restrict Access** settings on those activities to enforce the actual logic of who can access which branch.*

### Using Teacher Analytics (Heatmaps & Drop-off)
QuestFlow includes built-in analytics to help you optimize your curriculum layout.

1. **Enable Edit Mode:** Ensure you are in "Architect Mode" by turning Moodle's Edit mode on.
2. **Toggle the Heatmap:** Click the **"📊 Show Heatmap"** button located at the top right of the Quest Map.
3. **Analyze Clusters:** The timeline colors will change from standard blue/green to a thermal gradient.
   - **Yellow/Orange/Red glow:** Indicates how many students are currently "stuck" or working on that specific node. The exact number of active students replaces the node's standard icon.
   - **Gray:** Indicates no students are currently active on that node.
4. **Identify Bottlenecks:** Look for the red **"⚠️ XX% Drop-off"** badges. These appear automatically on nodes where a significant percentage of students abandon the course, highlighting areas where instructions might be unclear or tasks too difficult.
