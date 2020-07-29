<?php

/**
 * Fallback definition for WP_ENV
 *
 * @since  1.0.0
 */
if ( ! defined( 'WP_ENV' ) ) {

  define( 'WP_ENV', 'production' );

}


/**
 * List function files by name to be included
 *
 * @var   array List of function file names
 * @since 1.0.0
 */
$function_includes = [
  'config-definitions',     // Setup Definitions for Config/Settings
  'config-settings',        // Theme Setup, contol WordPress `<head>` output
  'config-conditionals',    // Conditionals for layout, display, etc.

  'theme-wrapper',          // @scribu WordPress Theme Wrapper
  'theme-structure',        // Determine the base html structure based on settings
  'theme-assets',           // Load css, js, and other assets
  'utilities',              // Theme based utility functions
  'theme-modules',          // Create modular, reusable HTML components

  'queries',                // Change how queries operate
  'images',                 // Add new Image sizes
  'post-types',             // Add Custom Post Types
  'taxonomy',               // Add Custom Taxonomies
  'wp-admin',               // Change aspects of WP Admin
  'wp-output',              // Change output of default WP HTML, i.e. nav items, oembeds, and body classes
];


/**
 * Loop through files and require them
 *
 * @since  1.0.0
 */
foreach ( $function_includes as $filename ) {

  $filepath = '/lib/' . $filename . '.php';
  require_once get_template_directory() . $filepath;

}

unset($filename, $filepath);
