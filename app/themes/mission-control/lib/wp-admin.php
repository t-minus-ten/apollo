<?php

/* Change aspects of WP Admin */
namespace Apollo\Extend\WP_Admin;


/**
 * Add custom editor styles.
 * Create a `editor-styles.scss` file in the `assets/sass/main` directory
 *
 * @since  1.0.0
 */
function add_editor_styles() {
  $home_path  = get_bloginfo( 'stylesheet_directory' );
  $asset_path = $home_path . '/assets/dist/';

  add_editor_style( $asset_path . 'css/editor-style.css' );

}

add_action( 'after_setup_theme', __NAMESPACE__ . '\\add_editor_styles' );





/**
 * Remove Post Type Support for specific Post Types.
 *
 * @since  1.0.0
 */
function hide_on_screen() {

  $post_types = ['page'];
  $features   = ['editor'];

	foreach ( $post_types as $post_type ) {
		foreach ( $features as $feature ) {
			remove_post_type_support( $post_type, $feature);
		}
	}

}

// add_action( 'init', __NAMESPACE__ . '\\hide_on_screen', 10 );





/**
 * Hide the front-end admin bar in the development enviornment
 *
 * @since  1.0.0
 */
if ( WP_ENV === 'development' ) :

  add_filter('show_admin_bar', '__return_false');

endif;
