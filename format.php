<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * QuestFlow course format. Display the course as an interactive quest map.
 *
 * @package    format_questflow
 * @copyright  2026 QuestFlow Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/filelib.php');
require_once($CFG->libdir . '/completionlib.php');

$format = course_get_format($course);
$course = $format->get_course();
$context = context_course::instance($course->id);

// Make sure section 0 is created.
course_create_sections_if_missing($course, 0);

$renderer = $PAGE->get_renderer('format_questflow');

if (!is_null($displaysection)) {
    $format->set_sectionnum($displaysection);
}

// If editing, the standard Moodle content editor is the main view.
// The Quest Map is placed in a slideable left drawer.
if ($PAGE->user_is_editing()) {
    echo '<div class="questflow-architect-wrapper mb-5">';
    
    // Floating Action Button (FAB) for Map Preview
    echo '<button id="questflowPreviewFab" onclick="openQuestflowDrawer();" title="Preview Map">';
    echo '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>';
    echo '<span style="margin-left: 8px;">Preview</span>';
    echo '</button>';

    echo '<style>
        #questflowPreviewFab {
            position: fixed;
            bottom: 40px;
            right: 40px;
            z-index: 1030;
            background: linear-gradient(135deg, #3b82f6, #0ea5e9);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 14px 28px;
            font-size: 1.1rem;
            font-weight: 700;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
            cursor: pointer;
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
        }
        #questflowPreviewFab:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6);
            color: white;
            text-decoration: none;
        }
    </style>';

    // The Native Moodle Editor (Main View)
    echo '<div class="format-questflow-native-editor">';
    $outputclass = $format->get_output_classname('content');
    $widget = new $outputclass($format);
    echo $renderer->render($widget);
    echo '</div>'; 
    
    echo '</div>'; // End wrapper

    // --- Offcanvas Drawer for the Map ---
    echo '<style>
        #questflowDrawerOverlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15,23,42,0.6); z-index: 1040; display: none; opacity: 0; transition: opacity 0.3s ease;
        }
        #questflowDrawerOverlay.show { display: block; opacity: 1; }
        #questflowDrawer {
            position: fixed; top: 0; left: -100%; width: 90vw; max-width: 900px; height: 100vh;
            background: #f8fafc; z-index: 1050; transition: left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 4px 0 25px rgba(0,0,0,0.3); overflow-y: auto; overflow-x: hidden; padding: 20px;
        }
        #questflowDrawer.show { left: 0; }
    </style>';

    echo '<div id="questflowDrawerOverlay" onclick="closeQuestflowDrawer()"></div>';
    echo '<div id="questflowDrawer">';
    echo '<div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">';
    echo '  <h3 class="m-0 text-dark font-weight-bold">🗺️ Live Map Preview</h3>';
    echo '  <button class="btn btn-outline-secondary rounded-circle shadow-sm" onclick="closeQuestflowDrawer()" title="Close Preview" style="width: 45px; height: 45px; font-size: 1.5rem; line-height: 1;">&times;</button>';
    echo '</div>';
    echo $renderer->render_quest_map($course->id);
    echo '</div>';

    echo '<script>
        function openQuestflowDrawer() {
            var overlay = document.getElementById("questflowDrawerOverlay");
            var drawer = document.getElementById("questflowDrawer");
            overlay.style.display = "block";
            // Force reflow
            void overlay.offsetWidth;
            overlay.classList.add("show");
            drawer.classList.add("show");
            document.body.style.overflow = "hidden"; // Prevent background scrolling
        }
        function closeQuestflowDrawer() {
            var overlay = document.getElementById("questflowDrawerOverlay");
            var drawer = document.getElementById("questflowDrawer");
            drawer.classList.remove("show");
            overlay.classList.remove("show");
            document.body.style.overflow = ""; // Restore background scrolling
            setTimeout(function() {
                overlay.style.display = "none";
            }, 300);
        }
    </script>';

} else {
    // Student View: Just the map.
    echo $renderer->render_quest_map($course->id);
}

