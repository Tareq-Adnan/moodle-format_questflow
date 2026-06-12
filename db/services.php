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
 * QuestFlow course format web services.
 *
 * @package    format_questflow
 * @copyright  2026 QuestFlow Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'format_questflow_get_map_data' => [
        'classname'   => 'format_questflow\external\get_map_data',
        'methodname'  => 'execute',
        'description' => 'Returns map nodes and completion data for a course.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'format_questflow_save_node_position' => [
        'classname'   => 'format_questflow\external\save_node_position',
        'methodname'  => 'execute',
        'description' => 'Saves the X/Y coordinates of a map node.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'format_questflow_toggle_fullwidth' => [
        'classname'   => 'format_questflow\external\toggle_fullwidth',
        'methodname'  => 'execute',
        'description' => 'Toggles the full width setting for the course map.',
        'type'        => 'write',
        'ajax'        => true,
    ],
];
