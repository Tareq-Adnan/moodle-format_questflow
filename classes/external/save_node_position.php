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
use invalid_parameter_exception;

/**
 * External function for saving QuestFlow node position.
 *
 * @package    format_questflow
 * @copyright  2026 QuestFlow Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class save_node_position extends external_api {

    /**
     * Parameters for execute.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters([
            'courseid'  => new external_value(PARAM_INT, 'The course ID'),
            'nodeid'    => new external_value(PARAM_INT, 'The node ID (0 for new)'),
            'sectionid' => new external_value(PARAM_INT, 'The section ID'),
            'cmid'      => new external_value(PARAM_INT, 'The CM ID'),
            'x'         => new external_value(PARAM_INT, 'X coordinate'),
            'y'         => new external_value(PARAM_INT, 'Y coordinate'),
        ]);
    }

    /**
     * Execute the function.
     *
     * @param int $courseid
     * @param int $nodeid
     * @param int $sectionid
     * @param int $cmid
     * @param int $x
     * @param int $y
     * @return array
     */
    public static function execute(int $courseid, int $nodeid, int $sectionid, int $cmid, int $x, int $y): array {
        global $DB;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'  => $courseid,
            'nodeid'    => $nodeid,
            'sectionid' => $sectionid,
            'cmid'      => $cmid,
            'x'         => $x,
            'y'         => $y,
        ]);

        $context = context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('moodle/course:update', $context);

        $record = new \stdClass();
        $record->courseid = $params['courseid'];
        $record->sectionid = $params['sectionid'];
        $record->cmid = $params['cmid'];
        $record->x = $params['x'];
        $record->y = $params['y'];

        if ($params['nodeid'] > 0) {
            $record->id = $params['nodeid'];
            $DB->update_record('format_questflow_nodes', $record);
        } else {
            // Check if a node already exists for this section/cm.
            $existing = $DB->get_record('format_questflow_nodes', [
                'courseid' => $params['courseid'],
                'sectionid' => $params['sectionid'],
                'cmid' => $params['cmid']
            ], '*', IGNORE_MULTIPLE);
            if ($existing) {
                $record->id = $existing->id;
                $DB->update_record('format_questflow_nodes', $record);
            } else {
                $record->id = $DB->insert_record('format_questflow_nodes', $record);
            }
        }

        return [
            'status' => true,
            'nodeid' => (int)$record->id,
        ];
    }

    /**
     * Return description.
     *
     * @return external_single_structure
     */
    public static function execute_returns() {
        return new external_single_structure([
            'status' => new external_value(PARAM_BOOL, 'Success status'),
            'nodeid' => new external_value(PARAM_INT, 'The saved node ID'),
        ]);
    }
}
