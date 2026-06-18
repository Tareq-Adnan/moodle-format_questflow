<?php
namespace format_questflow\external;

defined('MOODLE_INTERNAL') || die();

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_value;
use core_external\external_single_structure;
use context_course;

class save_node_metadata extends external_api {
    public static function execute_parameters() {
        return new external_function_parameters([
            'courseid'  => new external_value(PARAM_INT, 'The course ID'),
            'sectionid' => new external_value(PARAM_INT, 'The section ID'),
            'cmid'      => new external_value(PARAM_INT, 'The CM ID'),
            'metadata'  => new external_value(PARAM_RAW, 'JSON encoded metadata'),
        ]);
    }

    public static function execute(int $courseid, int $sectionid, int $cmid, string $metadata): array {
        global $DB;
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'  => $courseid,
            'sectionid' => $sectionid,
            'cmid'      => $cmid,
            'metadata'  => $metadata,
        ]);

        $context = context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('moodle/course:update', $context);

        $existing = $DB->get_record('format_questflow_nodes', [
            'courseid' => $params['courseid'],
            'sectionid' => $params['sectionid'],
            'cmid' => $params['cmid']
        ], '*', IGNORE_MULTIPLE);

        $record = new \stdClass();
        $record->courseid = $params['courseid'];
        $record->sectionid = $params['sectionid'];
        $record->cmid = $params['cmid'];
        
        $new_meta = json_decode($params['metadata'], true) ?: [];
        if ($existing) {
            $existing_meta = [];
            if (!empty($existing->metadata)) {
                $existing_meta = json_decode($existing->metadata, true) ?: [];
            }
            $record->metadata = json_encode(array_merge($existing_meta, $new_meta));
            $record->id = $existing->id;
            $DB->update_record('format_questflow_nodes', $record);
        } else {
            $record->metadata = json_encode($new_meta);
            $record->id = $DB->insert_record('format_questflow_nodes', $record);
        }

        return ['status' => true];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'status' => new external_value(PARAM_BOOL, 'Success status'),
        ]);
    }
}
