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

namespace format_questflow\privacy;

defined('MOODLE_INTERNAL') || die();

use core_privacy\local\metadata\collection;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\approved_userlist;

/**
 * Privacy Subsystem for QuestFlow course format.
 *
 * @package    format_questflow
 * @copyright  2026 QuestFlow Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider {
    /**
     * Returns metadata about the data that is stored by this plugin.
     *
     * @param collection $collection The collection of metadata.
     * @return collection The collection of metadata.
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table(
            'format_questflow_nodes',
            [
                'courseid' => 'privacy:metadata:format_questflow_nodes:courseid',
                'sectionid' => 'privacy:metadata:format_questflow_nodes:sectionid',
                'cmid' => 'privacy:metadata:format_questflow_nodes:cmid',
                'x' => 'privacy:metadata:format_questflow_nodes:x',
                'y' => 'privacy:metadata:format_questflow_nodes:y',
                'metadata' => 'privacy:metadata:format_questflow_nodes:metadata',
            ],
            'privacy:metadata:format_questflow_nodes'
        );

        return $collection;
    }

    /**
     * Get the list of contexts that contain user information for the specified user.
     *
     * @param int $userid The user to search.
     * @return contextlist The contextlist containing the list of contexts used by this user.
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        // This plugin only stores course layout data, not user-specific data.
        return new contextlist();
    }

    /**
     * Export all user data for the specified user, in the specified contexts.
     *
     * @param approved_contextlist $contextlist The list of contexts from which to export data for a user.
     */
    public static function export_user_data(approved_contextlist $contextlist) {
        // No user data to export.
    }

    /**
     * Delete all data for all users in the specified context.
     *
     * @param \context $context The specific context to delete data for.
     */
    public static function delete_data_for_all_users_in_context(\context $context) {
        // No user data to delete.
    }

    /**
     * Delete all user data for the specified user, in the specified contexts.
     *
     * @param approved_contextlist $contextlist The list of contexts to delete data from.
     */
    public static function delete_data_for_user(approved_contextlist $contextlist) {
        // No user data to delete.
    }
}
