// Config object
const CONFIG = require('./.gulpconfig.js');

// Util
const gulp = require('gulp');
const browsersync = require('browser-sync').create('bc_server');
const yargs = require('yargs').argv;
const fs = require('fs');
// const del = require('del');
const log = require('fancy-log');
const flatmap = require('gulp-flatmap');
const sourcemaps = require('gulp-sourcemaps');
const gulpIf = require('gulp-if');
const colors = require('colors');
const using = require('gulp-using');
// const path = require('path');
// const util = require('util');

// Sass
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const mediaQuery = require('gulp-group-css-media-queries');
const sassGlob = require('gulp-sass-glob');
const gulpStylelint = require('gulp-stylelint');
const postcss = require('gulp-postcss');
const objectFit = require('postcss-object-fit-images');
const easingGradients = require('postcss-easing-gradients');

// Rollup and Scripts
const rollup = require('rollup');
const rollupEach = require('gulp-rollup-each');
const rollupBabel = require('rollup-plugin-babel');
const rollupBuble = require('rollup-plugin-buble')
const rollupResolve = require('rollup-plugin-node-resolve');
const rollupCommon = require('rollup-plugin-commonjs');
const rollupESLint = require('rollup-plugin-eslint');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');

// GitHub Pages
const ghPages = require('gulp-gh-pages');

// Definitions
const localConfig = '.gulpconfig.js';
const localConfigDefault = '.ex-gulpconfig.js';
let production = yargs.production ? yargs.production : false;


// -------------------
// Gulp Task Functions
// -------------------

//
// Reload Browsersync
//
const reload = done => {
  browsersync.reload();
  done();
};



//
// Check to see if a .gulpconfig.js file exists, if
// not, creates one from .ex-gulpconfig.js
//
// const checkGulpConfig = done => {
//   if (!CONFIG.useProxy) {
//     return;
//   }

//   if (CONFIG.proxy == null) {
//     log(`Edit the proxy value to match your local url in ${CONFIG} \n`.underline.red);
//     process.exit(1);
//   }

//   done();
// };

//
// Check to see if a .gulp-config.json file exists, if
// not, creates one from .ex-gulp-config.json
//
const setProductionTrue = done => {
  production = true;
  done();
};

//
// Compile Sass
// Tasks for each sass file
//
const compileSass = (stream, css_dest_path) => {
  return (
    stream
      // .pipe(using({ prefix: 'Processing' }))
      .pipe(gulpIf(!production, sourcemaps.init()))
      .pipe(
        gulpStylelint({
          // fix: true,
          reporters: [{ formatter: 'string', console: true }],
          failAfterError: false,
          debug: true,
        })
      )
      .pipe(sassGlob())
      .pipe(
        sass({
          includePaths: ['node_modules'],
        }).on('error', sass.logError)
      )
      .pipe(postcss([easingGradients]))
      .pipe(postcss([objectFit]))
      .pipe(
        autoprefixer({
          grid: true,
        })
      )
      // .pipe(gulpIf(production, mediaQuery()))
      .pipe(gulpIf(production, cssnano()))
      .pipe(gulpIf(!production, sourcemaps.write('.')))
      .pipe(gulp.dest(css_dest_path))
      .pipe(browsersync.stream({match: "**/*.css"}))
  );
};


// ---------
// SASS TASK
// ---------
gulp.task('sass', () => {
  return gulp
    .src(CONFIG.paths.sass.src)
    .pipe(
      flatmap(stream => {
        return compileSass(stream, CONFIG.paths.sass.dest);
      })
    );
});


// -------
// JS TASK
// -------
gulp.task('js', () => {
  return gulp
    .src(CONFIG.paths.js.src)
    .pipe(using({ prefix: 'Processing' }))
    .pipe(gulpIf(!production, sourcemaps.init()))
    .pipe(
      rollupEach(
        {
          // external: [],
          plugins: [
            rollupResolve({
              mainFields: ['main', 'module'],
              // preferBuiltins: true,
            }),
            rollupCommon({
              include: 'node_modules/**',
            }),
            rollupBabel({
              exclude: 'node_modules/**',
            }),
            rollupESLint.eslint(),
          ],
        },
        {
          format: 'iife',
          // globals: {}
        },
        rollup
      )
    )
    .pipe(gulpIf(!production, sourcemaps.write('.')))
    .pipe(gulpIf(production, uglify()))
    .pipe(gulp.dest(CONFIG.paths.js.dist));
});



// -----------
// IMAGES TASK
// -----------
gulp.task('images', () => {
  return gulp
    .src(CONFIG.paths.images.src)
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            { removeViewBox: true },
            { cleanupIDs: false },
            { cleanupNumericValues: { floatPrecision: 2 } },
          ],
        }),
      ])
    )
    .pipe(gulp.dest(CONFIG.paths.images.dist));
});






// ------------
// DEFAULT TASK
// ------------
gulp.task(
  'default',
  gulp.parallel('sass', 'js', 'images')
);

// ------------
// WATCH TASKS
// ------------

gulp.task('watch', () => {
  gulp.watch(CONFIG.paths.sass.src, gulp.series('sass'));
  gulp.watch(CONFIG.paths.js.src, gulp.series('js', reload));
  gulp.watch(CONFIG.paths.images.src, gulp.series('images'));
  gulp.watch(['**/*.php', '**/*.html', '**/*.twig', '**/*.json'], reload);

  // // Fractal
  // if (CONFIG.fractal.use) {
  //   const fractalSass = CONFIG.fractal.components + '/**/*.scss';
  //   const fractalTwig = CONFIG.fractal.components + '/**/*.twig';
  //   const fractalJS = CONFIG.fractal.components + '/**/*.js';
  //   const fractalJSON = CONFIG.fractal.components + '/**/*.json';

  //   gulp.watch(fractalSass, gulp.series('sass:theme--' + CONFIG.base_theme));
  //   gulp.watch([fractalTwig, fractalJS, fractalJSON], reload);
  // }
});

// ------------
// SERVE TASKS
// ------------

//
// Init CMS Browsersync Server
//
gulp.task('startsync:cms', cb => {
  browsersync.init(CONFIG.browsersyncOpts, cb);
});

//
// Serve CMS in Browsersync
//
gulp.task(
  'serve',
  gulp.series(
    'default',
    'startsync:cms',
    'watch'
  )
);


// ----------
// BUILD TASK
// ----------

gulp.task(
  'build',
  gulp.series(
    setProductionTrue, // Runs with production set to true
    'default',
    'favicon'
  )
);

// -------
// FRACTAL
// -------

// let fractal;
// let logger;
// let fractalServer;

// if (CONFIG.fractal.use) {
//   // Init Fractal
//   fractal = require('./fractal.js');
//   logger = fractal.cli.console;

//   // Set Fractal Browsersync Options
//   fractal.web.set('server.syncOptions', {
//     open: true,
//     notify: true,
//   });

//   // Set Fractal Browsersync Options
//   fractalServer = fractal.web.server({
//     sync: true,
//   });
// }

// //
// // Init Fractal Browsersync Server
// //
// gulp.task('startsync:fractal', function(done) {
//   if (!CONFIG.fractal.use) {
//     return done();
//   }

//   fractalServer.on('error', err => {
//     logger.error(err.message);
//     // return process.exit();     // Uncomment to stop watch on fail
//   });

//   return fractalServer.start().then(() => {
//     logger.success(`Fractal server is now running at ${fractalServer.url}`);
//     done();
//   });
// });

// //
// // Serve Fractal
// //
// gulp.task(
//   'fractal',
//   gulp.series(checkGulpConfig,
//     // 'default',
//     'startsync:fractal', 'watch')
// );

// //
// // Build Fractal
// //
// gulp.task('fractal:build', function(done) {
//   if (CONFIG.fractal.use) {
//     const builder = fractal.web.builder();
//     builder.on('progress', (completed, total) =>
//       logger.update(`Exported ${completed} of ${total} items`, 'info')
//     );
//     builder.on('error', err => logger.error(err.message));
//     return builder.build().then(() => {
//       logger.success('Fractal build completed!');
//     });
//   }
// });

// // Copy Fractal Build to Netlify Branch
// gulp.task('fractal:build:branch', function(done) {
//   if (CONFIG.fractal.use) {
//     return gulp.src('./fractal-build/**/*').pipe(
//       ghPages({
//         branch: 'netlify',
//       })
//     );
//   } else {
//     done();
//   }
// });

// // Deploy Fractal to Netlify Branch
// gulp.task(
//   'fractal:deploy',
//   gulp.series('build', 'fractal:build', 'fractal:build:branch')
// );






// /**
//  * CONFIGURE LOCALHOST URL
//  * If no localhost url is required, or to just
//  * run on localhost, set to false
//  *
//  */
// const devUrl = 'apollo.dev';

// /**
//  * CONFIGURE AUTOPREFIXER SUPPORT
//  *
//  */
// const autoprefixSupport = [
//    'last 2 versions',
//    'safari >= 8',
//    'ie >= 10',
//    'ff >= 20',
//    'ios 6',
//    'android 4'
// ];



// /**
//  * NPM MODULES
//  *
//  */
// const argv         = require('yargs').argv;
// const del          = require('del');
// const _            = require('lodash');
// const gulp         = require('gulp');
// const gutil        = require('gulp-util');
// const plumber      = require('gulp-plumber');
// const $p           = require('gulp-load-plugins')();
// const $if          = require('gulp-if');
// const flatmap      = require('gulp-flatmap');
// const changed      = require('gulp-changed');
// const rename       = require('gulp-rename');
// const sequence     = require('gulp-sequence');
// const rev          = require('gulp-rev');

// // Sass
// const sass         = require('gulp-sass');
// const maps         = require('gulp-sourcemaps');
// const autoprefixer = require('gulp-autoprefixer');
// const cssnano      = require('gulp-cssnano');
// const mediaQuery   = require('gulp-group-css-media-queries');

// // JS
// const eslint       = require('gulp-eslint');
// const concat       = require('gulp-concat');
// const uglify       = require('gulp-uglify');

// // Images
// const imagemin     = require('gulp-imagemin');
// const optipng      = require('imagemin-optipng');
// const jpegtran     = require('imagemin-jpegtran');
// const gifsicle     = require('imagemin-gifsicle');

// // Browserify
// const source       = require('vinyl-source-stream');
// const buffer       = require('vinyl-buffer');
// const browserify   = require('browserify');
// const watchify     = require('watchify');
// const babelify     = require("babelify");
// const fs           = require('fs');

// // Browsersync
// const browsersync  = require('browser-sync');




// /**
//  * PRODUCTION FLAG
//  * Run --production after any Gulp task to perform a production build
//  *
//  */
// const production = argv.production;

// /**
//  * PATHS
//  *
//  */
// const enter_base = 'assets/';
// const src_base   = './src/';
// const dist_base  = './dist/';
// const build_base = production ? dist_base : src_base;
// const assetPath  = {
//   img: {
//     enter: enter_base + 'images/**/*',
//     dest:  dist_base + 'images/',
//   },
//   fonts: {
//     enter: enter_base + 'fonts/**/*',
//     dest:  dist_base + 'fonts/'
//   },
//   sass: {
//     enter: enter_base + 'sass/main/*.scss',
//     dest:  build_base + 'css/'
//   },
//   js: {
//     main: {
//       enter: enter_base + 'js/app.js'
//     },
//     single: {
//       base:  enter_base + 'js/single/',
//       enter: enter_base + 'js/single/*.js'
//     },
//     modules: enter_base + 'js/modules/**.js',
//     dest:    build_base + 'js/'
//   }
// }





// /**
//  * CLEAN TASK
//  * Remove `./src` & `/dist`
//  *
//  */
// gulp.task('clean', function() {
//   del([src_base, dist_base]);
// });





// /**
//  * SASS TASK
//  * Runs foreach on every file in 'sass/main'
//  *
//  */
// gulp.task('build_css', function() {
//   gulp.src( assetPath.sass.enter )
//     .pipe(flatmap( function(stream, file) {
//       return stream
//         .pipe( $if( !production, plumber() ) )
//         .pipe( changed( assetPath.sass.dest ) )
//         .pipe( $if( !production, maps.init() ) )
//           .pipe(sass().on('error', sass.logError))
//           .pipe( $if( production, mediaQuery() ) )
//           .pipe( autoprefixer({
//             browsers: autoprefixSupport,
//             add: true
//           }) )
//           .pipe( $if( production, cssnano() ) )
//           .pipe( $if( production, rename({ suffix: '.min' })) )
//         .pipe( $if( !production, maps.write('.') ) );
//     }) )
//     .pipe( gulp.dest( assetPath.sass.dest ) )
//     .pipe( browsersync.stream({match: '**/*.css'}) );
// });





// /**
//  * LINT TASKS
//  *
//  * Run single js through the linter
//  * Run main browserify file through the linter
//  */
// function commonLintTasks(inputStream) {
//   return inputStream
//     .pipe(eslint())
//     .pipe(eslint.formatEach())
//     .pipe( $if( production, eslint.failAfterError() ) )
// };

// gulp.task('lint_single', () => {
//   return commonLintTasks( gulp.src( assetPath.js.single.enter ) );
// });

// gulp.task('lint_main', () => {
//   return commonLintTasks( gulp.src([assetPath.js.main.enter, assetPath.js.modules]) );
// });





// /**
//  * BROWSERIFY CONFIGURATION
//  * Runs on primary `app.js` file and all single files
//  *
//  * @link https://gist.github.com/ramasilveyra/b4309edf809e55121385
//  *
//  */
// let isWatchify = false;
// let bundles = [
//   {
//     entries: assetPath.js.main.enter,
//     output: 'app.js',
//     destination: assetPath.js.dest
//   }
// ];

// // Make each single js file a bundle
// fs.readdir(assetPath.js.single.base, (err, files) => {
//   files.forEach(file => {
//     if ( file.includes('.js') ) {
//       let bundle = {
//         entries: [assetPath.js.single.base + file],
//         output: file,
//         destination: assetPath.js.dest
//       }
//       bundles.push(bundle);
//     }
//   });
// });

// // Setup Bundles
// const createBundle = options => {

//   // Browersify Options
//   const opts = _.assign({}, watchify.args, {
//     entries: options.entries,
//     extensions: options.extensions,
//     debug: true,
//     paths: ['./node_modules', assetPath.js.modules]
//   });

//   let b = browserify(opts);
//   b.transform(babelify.configure({
//     presets: ["env"]
//   }));

//   // Gulp tasks ran on each bundle
//   const rebundle = () =>
//     b.bundle()
//     .on('error', gutil.log.bind(gutil, 'Browserify Error'))
//     .pipe(source(options.output))
//     .pipe(buffer())
//     .pipe( $if( !production, plumber() ) )
//     .pipe( $if( !production, maps.init( {loadMaps: true} ) ) )
//     .pipe(maps.init({ loadMaps: true }))
//       .pipe( $if( production, uglify() ) )
//     .pipe( $if( !production, maps.write('.') ) )
//     .pipe( $if( production, rename({ suffix: '.min' })) )
//     .pipe(gulp.dest(assetPath.js.dest))
//     .pipe( browsersync.stream( {once: true} ) );

//   if (isWatchify) {
//     b = watchify(b);
//     b.on('update', rebundle);
//     b.on('log', gutil.log);
//   }

//   return rebundle();
// };

// let bundleBuildTask = () => {
//   bundles.forEach( bundle =>
//     createBundle({
//       entries: bundle.entries,
//       output: bundle.output,
//       extensions: bundle.extensions,
//       destination: bundle.destination
//     })
//   )
// }

// /**
//  * BROWSERIFY BUILD TASK
//  * Builds main app.js and all single scripts
//  *
//  */
// gulp.task('build_bundles', ['lint_main', 'lint_single'], () => {
//   bundleBuildTask();
// });

// /**
//  * WATCHIFY TASK
//  * Builds main app.js and all single scripts and then runs them
//  *
//  */
// gulp.task('watch_bundles', () => {
//   isWatchify = true;
//   bundleBuildTask();
// });





// /**
//  * REVISION CSS AND JS ASSETS
//  *
//  * Revision all asset names in `dist/css` and `dist/js`
//  * by appending content hash to filenames. New file names
//  * are stored in `dist/_rev-manifest.json`
//  *
//  * This task should only be used within a production run
//  * of the default gulp task: `gulp --production`
//  *
//  */
// gulp.task('build_rev', function () {
//   if ( production ) {
//     var cssPath = assetPath.sass.dest + '*.css';
//     var jsPath = assetPath.js.dest + '*.js';

//     return gulp.src([cssPath, jsPath], {base: dist_base})
//       .pipe(rev())
//       .pipe(gulp.dest(dist_base))
//       .pipe(rev.manifest('_rev-manifest.json'))
//       .pipe(gulp.dest(dist_base));
//   }
// });





// /**
//  * IMAGE TASK
//  * Process images in src folder, move to dist folder
//  *
//  */
// gulp.task('build_images', function () {
//   return gulp.src( assetPath.img.enter )
//     .pipe(imagemin([
//       imagemin.gifsicle({interlaced: true}),
//       imagemin.jpegtran({progressive: true}),
//       imagemin.optipng({optimizationLevel: 5}),
//       imagemin.svgo({
//         plugins: [
//           {removeViewBox: true},
//           {cleanupIDs: false},
//           {cleanupNumericValues: {floatPrecision: 2}}
//         ]
//       })
//     ]))
//     .pipe(gulp.dest(assetPath.img.dest));
// });





// /**
//  * COPY STATIC FILES
//  *
//  * Copy jQuery for local fallback
//  * Copy Fonts to distribution folder
//  *
//  */
// gulp.task('copy_jquery', function() {
//   return gulp.src('./node_modules/jquery/dist/jquery.min.js')
//     .pipe( gulp.dest( assetPath.js.dest ) )
// });
// gulp.task('copy_fonts', function () {
//   return gulp.src( assetPath.fonts.enter ).pipe(gulp.dest(assetPath.fonts.dest));
// });





// /**
//  * WATCH RELATED TASKS
//  * Trigger BrowserSync to reload
//  *
//  */
// gulp.task('watch_reload', function(){ browsersync.reload(); });





// /**
//  * SERVE TASK
//  * Initialize browsersync, watch for file changes
//  *
//  */
// gulp.task('serve', ['build_css', 'watch_bundles'], function(){

//   let opts = devUrl ? { proxy: devUrl } : { proxy: 'localhost' };

//   browsersync(opts);

//   // Watch tasks
//   gulp.watch([assetPath.sass.enter + '/**/*.scss'], ['build_css']);
//   gulp.watch([assetPath.fonts.enter], ['copy_fonts']);
//   gulp.watch([assetPath.img.enter], ['build_images']);
//   gulp.watch('**/*.php', ['watch_reload']);
//   gulp.watch('**/*.html', ['watch_reload']);
// });





// /**
//  * DEFAULT TASK
//  * Start the whole show. Run to start a project up.
//  *
//  */
// gulp.task('default', ['clean'], sequence(
//   ['build_bundles'],
//   ['build_css', 'build_images'],
//   ['copy_jquery', 'copy_fonts'],
//   ['build_rev']
// ));



