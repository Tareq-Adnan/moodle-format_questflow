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

namespace format_questflow\external;

defined('MOODLE_INTERNAL') || die();

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_value;
use core_external\external_single_structure;
use context_course;

/**
 * External function for toggling full width map layout.
 *
 * @package    format_questflow
 * @copyright  2026 QuestFlow Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class toggle_fullwidth extends external_api {

    /**
     * Parameters for execute.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'The course ID'),
            'fullwidth' => new external_value(PARAM_INT, '1 for full width, 0 for standard'),
        ]);
    }

    /**
     * Execute the function.
     *
     * @param int $courseid
     * @param int $fullwidth
     * @return array
     */
    public static function execute(int $courseid, int $fullwidth): array {
        global $DB;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'fullwidth' => $fullwidth,
        ]);

        $context = context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('moodle/course:update', $context);

        // Update course_format_options table
        $existing = $DB->get_record('course_format_options', [
            'courseid' => $params['courseid'],
            'format' => 'questflow',
            'name' => 'map_fullwidth',
            'sectionid' => 0
        ]);

        if ($existing) {
            $existing->value = (string)$params['fullwidth'];
            $DB->update_record('course_format_options', $existing);
        } else {
            $record = new \stdClass();
            $record->courseid = $params['courseid'];
            $record->format = 'questflow';
            $record->sectionid = 0;
            $record->name = 'map_fullwidth';
            $record->value = (string)$params['fullwidth'];
            $DB->insert_record('course_format_options', $record);
        }

        // Clear course cache to ensure format options are reloaded
        rebuild_course_cache($params['courseid'], true);

        return ['status' => true];
    }

    /**
     * Return description.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'status' => new external_value(PARAM_BOOL, 'Success status'),
        ]);
    }
}
