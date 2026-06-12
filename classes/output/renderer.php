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

namespace format_questflow\output;

defined('MOODLE_INTERNAL') || die();

use core_courseformat\output\section_renderer;

/**
 * Renderer for course format QuestFlow.
 *
 * @package    format_questflow
 * @copyright  2026 QuestFlow Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class renderer extends section_renderer {

    /**
     * Render the Quest Map container.
     *
     * @param int $courseid The course ID.
     * @return string
     */
    public function render_quest_map(int $courseid): string {
        global $OUTPUT, $COURSE;
        
        $format = course_get_format($COURSE);
        $options = $format->get_format_options();

        // Pass configuration to JS via data-react-props.
        $props = [
            'courseid' => $courseid,
            'editing' => (bool)$this->page->user_is_editing(),
            'wwwroot' => $this->page->theme->settings->wwwroot ?? '',
            'options' => [
                'start_title' => $options['start_title'] ?? 'Journey Begins',
                'start_subtitle' => $options['start_subtitle'] ?? 'Your quest starts here. Follow the path downwards.',
                'start_icon' => $options['start_icon'] ?? '🚀',
                'finish_title' => $options['finish_title'] ?? 'Finish Line',
                'finish_subtitle' => $options['finish_subtitle'] ?? 'Complete all trackable activities to reach the goal.',
                'finish_icon' => $options['finish_icon'] ?? '🏁',
                'finish_title_completed' => $options['finish_title_completed'] ?? 'Course Completed!',
                'finish_subtitle_completed' => $options['finish_subtitle_completed'] ?? 'Congratulations, you have reached the end of the journey.',
                'finish_icon_completed' => $options['finish_icon_completed'] ?? '🏆',
                'map_fullwidth' => $options['map_fullwidth'] ?? 0,
            ]
        ];
        
        $jsonprops = json_encode($props);

        $html = '';

        // Moodle's react_autoinit handles the mounting automatically.
        $html .= '<div class="format-questflow-map-mount" 
                     data-react-component="@moodle/lms/format_questflow/map" 
                     data-react-props=\'' . $jsonprops . '\'>
            <div class="d-flex justify-content-center p-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading Quest Map...</span>
                </div>
            </div>
        </div>';
        
        return $html;
    }
}
