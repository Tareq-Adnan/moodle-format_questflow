# QuestFlow: Architecture & Technical Plan

## 1. Project Motivation
Moodle's default course structure is often criticized for the "Scroll of Death"—a long, overwhelming list of activities. QuestFlow solves this by providing a visual, interactive learning journey that increases student engagement and makes progress intuitive.

## 2. Goals & Target Audience
- **Goal:** Provide a high-engagement, gamified course format for Moodle 4.5+.
- **Target:** K-12, Higher Ed, and Corporate training (Moodle Workplace).

## 3. Database Design
### Table: `{format_questflow_nodes}`
Used to persist the visual layout of the map.
- `id`: Primary key.
- `courseid`: Link to `{course}`.
- `sectionid`: Link to `{course_sections}` (if node represents a section).
- `cmid`: Link to `{course_modules}` (if node represents an activity).
- `x`, `y`: Coordinates for node placement on the SVG map.
- `metadata`: JSON field for extended properties (colors, labels, branching info).

## 4. Web Services (AJAX Endpoints)
These services allow the React frontend to communicate with Moodle.
- `format_questflow_get_map_data`: Retrieves all nodes, completion status, and coordinates for a course.
- `format_questflow_save_node_position`: Saves X/Y coordinates when a teacher drags a node in Edit Mode.
- `format_questflow_get_branching_logic`: Fetches prerequisite data for visual "line of sight" rendering.

## 5. Frontend Architecture
- **Framework:** React.
- **Rendering Engine:** SVG (Scalable Vector Graphics) for the paths and map background.
- **State Management:** React Context to handle real-time completion updates.
- **Interaction:** Pinch-to-zoom and drag-to-pan for mobile compatibility.

## 6. Security & Permissions
- **Capability:** `format/questflow:editmap` required for saving node positions.
- **Integrity:** All AJAX calls validated via `sesskey` and user context checks.
