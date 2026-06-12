# QuestFlow: Future Feature Plan & Roadmap

This document outlines the strategic roadmap for future enhancements to the QuestFlow course format, moving beyond the current "Vertical Timeline" implementation.

## Phase 9: Advanced Gamification Integrations
- **Completion Celebrations:** Trigger lightweight JavaScript particle effects (e.g., confetti or fireworks) across the screen when a student completes a Chapter node or reaches the final Course Completion trophy.
- **Ecosystem Integration (Level Up! & Stash):** Provide native hooks so that if the `block_stash` or `block_xp` plugins are installed, virtual currency, experience points, or "loot items" are rendered visually on the map nodes.

## Phase 10: Advanced Pathing & Logic
- **Prerequisite Visualization:** Add "lock" tooltips that explicitly tell students *which* previous activity is required to unlock the current node (deeply integrating with Moodle's Restrict Access API).
- **Branching Paths:** Introduce special "Choice" nodes that allow teachers to split the vertical timeline into two parallel paths (e.g., a "Beginner Track" vs. an "Advanced Track" based on a Quiz score).

## Phase 11: Analytics & Insights
- **Teacher Heatmaps:** Add a visual overlay toggle in "Architect Mode" showing where students are currently clustered on the map. Nodes glow "hotter" if many students are currently attempting them, helping identify bottlenecks in the curriculum.
- **Drop-off Alerts:** Visual warning indicators on nodes where students frequently fail or abandon the course.

## Phase 12: Theme & Style Packs
- **CSS Variables & Theming:** Expose path colors, node shapes, and background gradients to the Moodle UI settings so administrators can create and assign global themes (e.g., "Deep Space", "Medieval Kingdom", or "Corporate Minimalist").
- **Custom Node Icons:** Allow teachers to upload custom SVG or PNG icons for specific activities directly from the activity settings form, rather than relying solely on the default shape geometries.
