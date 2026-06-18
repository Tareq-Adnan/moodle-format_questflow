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
use core_external\external_multiple_structure;
use context_course;

/**
 * External function for getting QuestFlow map data.
 *
 * @package    format_questflow
 * @copyright  2026 QuestFlow Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_map_data extends external_api {

    /**
     * Parameters for execute.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'The course ID'),
        ]);
    }

    /**
     * Execute the function.
     *
     * @param int $courseid
     * @return array
     */
    public static function execute(int $courseid): array {
        global $DB, $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
        ]);

        $context = context_course::instance($params['courseid']);
        self::validate_context($context);
        
        $isteacher = has_capability('moodle/course:update', $context);

        // Get course modinfo.
        $modinfo = get_fast_modinfo($params['courseid']);
        $course = $modinfo->get_course();
        $completion = new \completion_info($course);

        $result = [
            'courseid' => $params['courseid'],
            'nodes'    => [],
        ];

        // We build the nodes dynamically based purely on the current Moodle course state.
        $nodecounter = 1;

        foreach ($modinfo->get_section_info_all() as $section) {
            // Calculate aggregate completion status for the section.
            $all_completed = true;
            $has_trackable_activities = false;

            if (isset($modinfo->sections[$section->section])) {
                foreach ($modinfo->sections[$section->section] as $cmid) {
                    $cm = $modinfo->cms[$cmid];
                    if ($completion->is_enabled($cm)) {
                        $has_trackable_activities = true;
                        $data = $completion->get_data($cm, true);
                        if ($data->completionstate != COMPLETION_COMPLETE && $data->completionstate != COMPLETION_COMPLETE_PASS) {
                            $all_completed = false;
                        }
                    }
                }
            }

            $sectionavailable = $section->uservisible;
            
            // Determine section status based on children.
            if (!$sectionavailable) {
                $sectionstatus = 'locked';
            } else if ($has_trackable_activities && $all_completed) {
                $sectionstatus = 'completed';
            } else {
                $sectionstatus = 'current';
            }

            $sectionmetadata = [];
            if (!$sectionavailable && !empty($section->availableinfo)) {
                $sectionmetadata['restrictions'] = strip_tags($section->availableinfo);
            }
            
            $result['nodes'][] = [
                'id'        => $nodecounter++, // Mock ID for React keys
                'sectionid' => (int)$section->id,
                'cmid'      => 0,
                'name'      => (string)get_section_name($course, $section),
                'url'       => (string)course_get_url($course, $section->section)->out(false),
                'x'         => 0, // Ignored by timeline UI
                'y'         => 0, // Ignored by timeline UI
                'status'    => $sectionstatus,
                'available' => (bool)$sectionavailable,
                'hastracking' => (bool)$has_trackable_activities,
                'metadata'  => json_encode($sectionmetadata),
            ];

            // Include Activity Nodes within this section
            if (isset($modinfo->sections[$section->section])) {
                foreach ($modinfo->sections[$section->section] as $cmid) {
                    $cm = $modinfo->cms[$cmid];
                    $available = $cm->uservisible;
                    $status = 'locked';
                    $hastracking = $completion->is_enabled($cm);
                    
                    if ($hastracking) {
                        $data = $completion->get_data($cm, true);
                        if ($data->completionstate == COMPLETION_COMPLETE || $data->completionstate == COMPLETION_COMPLETE_PASS) {
                            $status = 'completed';
                        } else if ($available) {
                            $status = 'current';
                        }
                    } else if ($available) {
                        // If no tracking, it's just 'informational' (always current if available).
                        $status = 'current';
                    }

                    $metadata = [];
                    // Phase 10: Prerequisite Visualization
                    if (!$available && !empty($cm->availableinfo)) {
                        $metadata['restrictions'] = strip_tags($cm->availableinfo);
                    }

                    // Fetch stored metadata from DB
                    $storednode = $DB->get_record('format_questflow_nodes', [
                        'courseid' => $params['courseid'],
                        'cmid' => (int)$cmid
                    ], 'metadata', IGNORE_MULTIPLE);
                    if ($storednode && !empty($storednode->metadata)) {
                        $storedmetadata = json_decode($storednode->metadata, true);
                        if (is_array($storedmetadata)) {
                            $metadata = array_merge($metadata, $storedmetadata);
                        }
                    }

                    // Phase 11: Analytics & Insights (Mock data for Teacher Heatmaps/Drop-off)
                    if ($isteacher && $hastracking) {
                        // Use cmid to generate deterministic random mock numbers for analytics
                        srand($cmid);
                        $metadata['activeUsers'] = rand(0, 45); // How many students are stuck/working here
                        $metadata['dropoffRate'] = rand(0, 100) > 85 ? rand(15, 40) : rand(0, 5); // % of students who drop off here
                        srand(); // Reset rand
                    }

                    // Ecosystem Integration (Phase 9) hooks
                    if (\core_plugin_manager::instance()->get_plugin_info('block_xp')) {
                        // Hook to show XP for tracked activities
                        if ($hastracking) {
                            $metadata['xp'] = 10; // Placeholder points
                        }
                    }
                    if (\core_plugin_manager::instance()->get_plugin_info('block_stash')) {
                        // Hook for stash loot
                        if (rand(1, 10) > 8 && $hastracking) {
                            $metadata['loot'] = '🪙';
                        }
                    }

                    $result['nodes'][] = [
                        'id'        => $nodecounter++, // Mock ID for React keys
                        'sectionid' => (int)$section->id,
                        'cmid'      => (int)$cmid,
                        'name'      => (string)$cm->get_formatted_name(),
                        'url'       => $cm->url ? (string)$cm->url->out(false) : '',
                        'x'         => 0, // Ignored by timeline UI
                        'y'         => 0, // Ignored by timeline UI
                        'status'    => $status,
                        'available' => (bool)$available,
                        'hastracking' => (bool)$hastracking,
                        'metadata'  => json_encode($metadata),
                    ];
                }
            }
        }

        return $result;
    }

    /**
     * Return description.
     *
     * @return external_single_structure
     */
    public static function execute_returns() {
        return new external_single_structure([
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'nodes'    => new external_multiple_structure(
                new external_single_structure([
                    'id'        => new external_value(PARAM_INT, 'Node ID'),
                    'sectionid' => new external_value(PARAM_INT, 'Section ID'),
                    'cmid'      => new external_value(PARAM_INT, 'CM ID'),
                    'name'      => new external_value(PARAM_RAW, 'Display name'),
                    'url'       => new external_value(PARAM_URL, 'Launch URL'),
                    'x'         => new external_value(PARAM_INT, 'X coordinate'),
                    'y'         => new external_value(PARAM_INT, 'Y coordinate'),
                    'status'    => new external_value(PARAM_TEXT, 'Status (locked, current, completed)'),
                    'available' => new external_value(PARAM_BOOL, 'Is node available'),
                    'hastracking' => new external_value(PARAM_BOOL, 'Does node have completion tracking enabled'),
                    'metadata'  => new external_value(PARAM_TEXT, 'JSON metadata', VALUE_OPTIONAL),
                ])
            ),
        ]);
    }
}
