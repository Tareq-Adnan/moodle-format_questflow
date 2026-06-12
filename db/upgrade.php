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
 * QuestFlow course format upgrade script.
 *
 * @package    format_questflow
 * @copyright  2026 QuestFlow Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Upgrade the QuestFlow course format.
 *
 * @param int $oldversion The old version of the plugin.
 * @return bool
 */
function xmldb_format_questflow_upgrade($oldversion) {
    global $DB;

    $dbman = $DB->get_manager();

    // Add upgrade logic here when increasing version in version.php.

    return true;
}
