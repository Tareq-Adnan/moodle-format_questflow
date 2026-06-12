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
 * QuestFlow course format library.
 *
 * @package    format_questflow
 * @copyright  2026 QuestFlow Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Main class for the QuestFlow course format.
 *
 * @package    format_questflow
 * @copyright  2026 QuestFlow Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class format_questflow extends core_courseformat\base {
    /**
     * Returns true if this course format uses sections.
     *
     * @return bool
     */
    public function uses_sections() {
        return true;
    }

    /**
     * Returns the display name of the given section.
     *
     * @param int|stdClass $section Section object from database or just field section.section
     * @return string
     */
    public function get_section_name($section) {
        $section = $this->get_section($section);
        if ((string)$section->name !== '') {
            return format_string(
                $section->name,
                true,
                ['context' => context_course::instance($this->courseid)]
            );
        } else {
            return get_string('chapter', 'format_questflow') . ' ' . $section->section;
        }
    }

    /**
     * Returns the information about the ajax support.
     *
     * @return stdClass
     */
    public function supports_ajax() {
        $ajaxsupport = new stdClass();
        $ajaxsupport->capable = true;
        return $ajaxsupport;
    }

    /**
     * Supports components.
     *
     * @return bool
     */
    public function supports_components(): bool {
        return true;
    }

    /**
     * Definitions of the additional options that this course format uses for course.
     *
     * @param bool $foreditform
     * @return array of options
     */
    public function course_format_options($foreditform = false): array {
        static $courseformatoptions = false;

        if ($courseformatoptions === false) {
            $starticons = [
                '🚀' => '🚀 Rocket',
                '🗺️' => '🗺️ Map',
                '🎯' => '🎯 Target',
                '🌟' => '🌟 Star',
                '🚪' => '🚪 Door',
                '🚩' => '🏁 Start Flag',
            ];

            $finishicons = [
                '🏁' => '🏁 Finish Flag',
                '🏆' => '🏆 Trophy',
                '👑' => '👑 Crown',
                '🎓' => '🎓 Graduation',
                '🎉' => '🎉 Celebration',
                '🎁' => '🎁 Reward',
                'treasure' => '📦 Treasure Chest',
                '💎' => '💎 Diamond',
            ];

            $courseformatoptions = [
                'start_title' => [
                    'type' => PARAM_TEXT,
                    'default' => 'Journey Begins',
                    'label' => new lang_string('start_title', 'format_questflow'),
                    'help' => 'start_title',
                    'help_component' => 'format_questflow',
                ],
                'start_subtitle' => [
                    'type' => PARAM_TEXT,
                    'default' => 'Your quest starts here. Follow the path downwards.',
                    'label' => new lang_string('start_subtitle', 'format_questflow'),
                ],
                'start_icon' => [
                    'type' => PARAM_TEXT,
                    'default' => '🚀',
                    'label' => new lang_string('start_icon', 'format_questflow'),
                    'element_type' => 'select',
                    'element_attributes' => [$starticons],
                ],
                'finish_title' => [
                    'type' => PARAM_TEXT,
                    'default' => 'Finish Line',
                    'label' => new lang_string('finish_title', 'format_questflow'),
                ],
                'finish_subtitle' => [
                    'type' => PARAM_TEXT,
                    'default' => 'Complete all trackable activities to reach the goal.',
                    'label' => new lang_string('finish_subtitle', 'format_questflow'),
                ],
                'finish_icon' => [
                    'type' => PARAM_TEXT,
                    'default' => '🏁',
                    'label' => new lang_string('finish_icon', 'format_questflow'),
                    'element_type' => 'select',
                    'element_attributes' => [$finishicons],
                ],
                'finish_title_completed' => [
                    'type' => PARAM_TEXT,
                    'default' => 'Course Completed!',
                    'label' => new lang_string('finish_title_completed', 'format_questflow'),
                ],
                'finish_subtitle_completed' => [
                    'type' => PARAM_TEXT,
                    'default' => 'Congratulations, you have reached the end of the journey.',
                    'label' => new lang_string('finish_subtitle_completed', 'format_questflow'),
                ],
                'finish_icon_completed' => [
                    'type' => PARAM_TEXT,
                    'default' => '🏆',
                    'label' => new lang_string('finish_icon_completed', 'format_questflow'),
                    'element_type' => 'select',
                    'element_attributes' => [$finishicons],
                ],
                'map_fullwidth' => [
                    'type' => PARAM_INT,
                    'default' => 0,
                    'label' => new lang_string('map_fullwidth', 'format_questflow'),
                    'element_type' => 'selectyesno',
                ],
            ];
        }

        return $courseformatoptions;
    }
}

/**
 * Indicates this format uses sections.
 *
 * @return bool
 */
function format_questflow_uses_sections() {
    return true;
}
