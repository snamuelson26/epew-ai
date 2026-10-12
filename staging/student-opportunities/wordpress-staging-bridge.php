<?php
/**
 * Emanon synthetic Tutor integration bridge — STAGING ONLY.
 * Paste without the opening PHP tag when using WPCode.
 * Creates no real applications/payments; blocks outbound mail on this staging host.
 * Not yet runtime-tested. Owner must review before enabling on staging.
 */
if (!defined('ABSPATH')) { return; }
if (wp_parse_url(home_url(), PHP_URL_HOST) !== 'staging.emanoninstitute.org'
    || wp_parse_url(site_url(), PHP_URL_HOST) !== 'staging.emanoninstitute.org') {
    return;
}
if (class_exists('Emanon_IES_Synthetic_Bridge', false)) { return; }

final class Emanon_IES_Synthetic_Bridge {
    private static $enrollment_target = 0;

    public static function boot() {
        add_action('init', array(__CLASS__, 'register_records'));
        add_action('rest_api_init', array(__CLASS__, 'routes'));
        add_filter('tutor_allow_course_enrollment', array(__CLASS__, 'enrollment_gate'), 999, 2);
        // Synthetic stage only. Real email testing requires separately reviewed configuration.
        add_filter('pre_wp_mail', function ($value) { return false; }, 999);
    }

    public static function register_records() {
        register_post_type('ies_stage_record', array(
            'label' => 'IES Synthetic Test Records', 'public' => false,
            'show_ui' => true, 'show_in_rest' => false,
            'supports' => array('title'), 'capability_type' => 'post',
            'capabilities' => array('edit_posts' => 'manage_options', 'create_posts' => 'manage_options'),
            'map_meta_cap' => true,
        ));
    }

    public static function admin_permission() {
        return current_user_can('manage_options');
    }

    public static function routes() {
        register_rest_route('emanon-ies-staging/v1', '/identity', array(
            'methods' => 'GET',
            'permission_callback' => function () { return is_user_logged_in(); },
            'callback' => function () {
                return array('wordpress_user_id' => get_current_user_id(),
                    'organization' => 'EMANON', 'environment' => 'synthetic-staging',
                    'staff_authority' => current_user_can('manage_options'));
            },
        ));
        foreach (array('fixture', 'review', 'waiver', 'enroll') as $action) {
            register_rest_route('emanon-ies-staging/v1', '/' . $action, array(
                'methods' => 'POST', 'permission_callback' => array(__CLASS__, 'admin_permission'),
                'callback' => array(__CLASS__, $action),
            ));
        }
        register_rest_route('emanon-ies-staging/v1', '/status', array(
            'methods' => 'GET', 'permission_callback' => array(__CLASS__, 'admin_permission'),
            'callback' => array(__CLASS__, 'status'),
        ));
    }

    private static function error($message, $status = 409) {
        return new WP_Error('ies_staging_blocked', $message, array('status' => $status));
    }

    private static function saved_fixture() {
        $fixture = get_option('emanon_ies_synthetic_fixture', array());
        if (empty($fixture['student']) || empty($fixture['course']) || empty($fixture['application'])
            || !get_userdata($fixture['student'])
            || get_user_meta($fixture['student'], '_emanon_ies_synthetic', true) !== '1'
            || get_post_meta($fixture['course'], '_emanon_ies_synthetic', true) !== '1'
            || get_post_meta($fixture['application'], '_emanon_ies_synthetic', true) !== '1') {
            return self::error('No verified synthetic fixture is available.');
        }
        return $fixture;
    }

    private static function record_event($action, $fixture) {
        $events = get_post_meta($fixture['application'], '_emanon_ies_staging_events', true);
        if (!is_array($events)) { $events = array(); }
        $events[] = array('action' => $action, 'actor' => get_current_user_id(), 'utc' => gmdate('c'));
        update_post_meta($fixture['application'], '_emanon_ies_staging_events', $events);
    }

    public static function fixture($request) {
        if (!class_exists('Tutor\\Models\\EnrollmentModel')) {
            return self::error('Tutor LMS enrollment API is unavailable.', 503);
        }
        // One synthetic fixture per staging installation. Retries reuse it.
        $saved = get_option('emanon_ies_synthetic_fixture', false);
        if ($saved) { return self::status($request); }
        if (!add_option('emanon_ies_staging_fixture_lock', gmdate('c'), '', false)) {
            return self::error('Fixture creation is already in progress.');
        }
        try {
            if (username_exists('ies-synthetic-student')) {
                return self::error('Username conflict: manual review required; no account was reused or modified.');
            }
            $student = wp_insert_user(array(
                'user_login' => 'ies-synthetic-student',
                'user_email' => 'ies-synthetic-student@example.invalid',
                'display_name' => 'Synthetic IES Student', 'role' => 'subscriber',
                'user_pass' => wp_generate_password(48, true, true),
            ));
            if (is_wp_error($student)) { return $student; }
            update_user_meta($student, '_emanon_ies_synthetic', '1');
            // Published synthetic course is required to exercise Tutor's accessibility check.
            $course = wp_insert_post(array('post_type' => 'courses',
                'post_title' => 'IES SYNTHETIC STAGING — Enrollment Test',
                'post_status' => 'publish', 'post_author' => get_current_user_id(),
                'post_content' => 'Synthetic test course. No real student or educational award.',
                'meta_input' => array('_emanon_ies_synthetic' => '1', '_tutor_course_price_type' => 'free')), true);
            if (is_wp_error($course)) { return $course; }
            $application = wp_insert_post(array('post_type' => 'ies_stage_record',
                'post_title' => 'Synthetic application — pending academic review',
                'post_status' => 'private', 'post_author' => get_current_user_id(),
                'meta_input' => array('_emanon_ies_synthetic' => '1',
                    '_ies_academic_state' => 'pending', '_ies_financial_state' => 'pending',
                    '_ies_initial_fee_minor' => 10000)), true);
            if (is_wp_error($application)) { return $application; }
            $fixture = array('student' => (int)$student, 'course' => (int)$course, 'application' => (int)$application);
            update_option('emanon_ies_synthetic_fixture', $fixture, false);
            self::record_event('synthetic_fixture_created', $fixture);
            return self::status($request);
        } finally {
            delete_option('emanon_ies_staging_fixture_lock');
        }
    }

    public static function review($request) {
        $fixture = self::saved_fixture();
        if (is_wp_error($fixture)) { return $fixture; }
        if ($request->get_param('synthetic_acceptance') !== true) {
            return self::error('Explicit synthetic academic acceptance required.', 400);
        }
        update_post_meta($fixture['application'], '_ies_academic_state', 'accepted');
        self::record_event('synthetic_academic_acceptance', $fixture);
        return self::status($request);
    }

    public static function waiver($request) {
        $fixture = self::saved_fixture();
        if (is_wp_error($fixture)) { return $fixture; }
        if ($request->get_param('synthetic_waiver') !== true) {
            return self::error('Explicit synthetic waiver approval required.', 400);
        }
        update_post_meta($fixture['application'], '_ies_financial_state', 'synthetic_waiver');
        self::record_event('synthetic_waiver_approved', $fixture);
        return self::status($request);
    }

    private static function eligible($fixture) {
        return get_post_meta($fixture['application'], '_ies_academic_state', true) === 'accepted'
            && get_post_meta($fixture['application'], '_ies_financial_state', true) === 'synthetic_waiver';
    }

    public static function enrollment_gate($allowed, $course_id) {
        if (get_post_meta($course_id, '_emanon_ies_synthetic', true) !== '1') { return $allowed; }
        $fixture = self::saved_fixture();
        $target = self::$enrollment_target ?: get_current_user_id();
        if (is_wp_error($fixture) || (int)$course_id !== $fixture['course']
            || $target !== $fixture['student'] || !self::eligible($fixture)) {
            return self::error('Synthetic IES enrollment requires approved academic and financial states.', 403);
        }
        return $allowed;
    }

    public static function enroll($request) {
        $fixture = self::saved_fixture();
        if (is_wp_error($fixture)) { return $fixture; }
        if (!self::eligible($fixture)) { return self::error('Pending approval or financial coverage: enrollment denied.', 403); }
        if (!class_exists('Tutor\\Models\\EnrollmentModel')) { return self::error('Tutor enrollment API unavailable.', 503); }
        if (!add_option('emanon_ies_staging_enrollment_lock', gmdate('c'), '', false)) {
            return self::error('Enrollment is already in progress.');
        }
        self::$enrollment_target = $fixture['student'];
        try {
            $id = \Tutor\Models\EnrollmentModel::do_enroll($fixture['course'], 0, $fixture['student']);
            if (!$id || get_post_status($id) !== 'completed') {
                return self::error('Tutor did not confirm a completed enrollment.', 502);
            }
            self::record_event('actual_tutor_synthetic_enrollment_confirmed', $fixture);
            return self::status($request);
        } finally {
            self::$enrollment_target = 0;
            delete_option('emanon_ies_staging_enrollment_lock');
        }
    }

    public static function status($request) {
        $fixture = self::saved_fixture();
        if (is_wp_error($fixture)) { return $fixture; }
        if (!class_exists('Tutor\\Models\\EnrollmentModel')) { return self::error('Tutor enrollment API unavailable.', 503); }
        // Verify actual persisted records rather than relying on cached enrollment lookup.
        $records = get_posts(array('post_type' => 'tutor_enrolled',
            'post_parent' => $fixture['course'], 'author' => $fixture['student'],
            'post_status' => array('completed', 'pending', 'cancel'),
            'posts_per_page' => 2, 'orderby' => 'ID', 'order' => 'DESC'));
        $enrolled = empty($records) ? null : $records[0];
        return array('environment' => 'synthetic-staging', 'fixture' => $fixture,
            'academic_state' => get_post_meta($fixture['application'], '_ies_academic_state', true),
            'financial_state' => get_post_meta($fixture['application'], '_ies_financial_state', true),
            'enrollment_id' => $enrolled ? (int)$enrolled->ID : null,
            'enrollment_status' => $enrolled ? get_post_status($enrolled->ID) : null,
            'enrollment_record_count' => count($records),
            'live_payments' => false, 'outbound_email' => false,
            'events' => get_post_meta($fixture['application'], '_emanon_ies_staging_events', true));
    }
}
Emanon_IES_Synthetic_Bridge::boot();
