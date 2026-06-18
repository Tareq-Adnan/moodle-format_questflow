# QuestFlow: Architecture & Technical Plan

## 1. Project Motivation
Moodle's default course structure is often criticized for the "Scroll of Death"—a long, overwhelming list of activities. QuestFlow solves this by providing a visual, interactive learning journey that increases student engagement and makes progress intuitive.

## 2. Goals & Target Audience
- **Goal:** Provide a high-engagement, gamified course format for Moodle 4.5+.
- **Target:** K-12, Higher Ed, and Corporate training (Moodle Workplace).

## 3. Database Design
### Table: `{format_questflow_nodes}`
Used to persist custom visual layout data not natively supported by Moodle.
- `id`: Primary key.
- `courseid`: Link to `{course}`.
- `sectionid`: Link to `{course_sections}` (if node represents a section).
- `cmid`: Link to `{course_modules}` (if node represents an activity).
- `x`, `y`: Coordinates for node placement on the SVG map (deprecated by flexbox timeline).
- `metadata`: JSON field for extended properties (`isBranch`, `branchCaption`, etc.).

## 4. Web Services (AJAX Endpoints)
These services allow the React frontend to communicate with Moodle.
- `format_questflow_get_map_data`: Retrieves all nodes, completion status, restriction data, and injected analytics (Heatmaps/Drop-off) for a course.
- `format_questflow_save_node_metadata`: Saves JSON metadata (like Branch toggles and Branch Captions) to the DB.
- `format_questflow_toggle_fullwidth`: Toggles the user's preferred layout width.
- `format_questflow_save_node_position`: Saves X/Y coordinates (Legacy).

## 5. Frontend Architecture
- **Framework:** React.
- **Rendering Engine:** SVG (Scalable Vector Graphics) for the paths and map background.
- **State Management:** React Context to handle real-time completion updates.
- **Interaction:** Pinch-to-zoom and drag-to-pan for mobile compatibility.

## 6. Security & Permissions
- **Capability:** `format/questflow:editmap` required for saving node positions.
- **Integrity:** All AJAX calls validated via `sesskey` and user context checks.
