// Config object
const CONFIG                 = require('./.gulpconfig.js');
const localgulpConfig        = '.local-gulpconfig.json';
const localgulpConfigDefault = '.ex-local-gulpconfig.json';


// Util
const gulp        = require('gulp');
const browsersync = require('browser-sync').create('bc_server');
const yargs       = require('yargs').argv;
const fs          = require('fs');
const path        = require('path');
const log         = require('fancy-log');
const flatmap     = require('gulp-flatmap');
const sourcemaps  = require('gulp-sourcemaps');
const gulpIf      = require('gulp-if');
const colors      = require('colors');
const using       = require('gulp-using');
const del         = require('del');
// const util = require('util');

// Sass
const sass            = require('gulp-sass');
const autoprefixer    = require('gulp-autoprefixer');
const cssnano         = require('gulp-cssnano');
const sassGlob        = require('gulp-sass-glob');
const gulpStylelint   = require('gulp-stylelint');
const postcss         = require('gulp-postcss');
const objectFit       = require('postcss-object-fit-images');
const easingGradients = require('postcss-easing-gradients');
// const mediaQuery   = require('gulp-group-css-media-queries');

// Rollup and Scripts
const rollup        = require('rollup');
const rollupEach    = require('gulp-rollup-each');
const rollupBabel   = require('rollup-plugin-babel');
const rollupResolve = require('rollup-plugin-node-resolve');
const rollupCommon  = require('rollup-plugin-commonjs');
const rollupESLint  = require('rollup-plugin-eslint');
const uglify        = require('gulp-uglify');
const imagemin      = require('gulp-imagemin');


// Definitions
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
const checkGulpConfig = done => {
  if (!CONFIG.useProxy) {
    return false;
  }

  fs.access(localgulpConfig, fs.constants.F_OK, err => {
    if (err) {
      let source = fs.createReadStream(localgulpConfigDefault);
      let dest = fs.createWriteStream(localgulpConfig);
      source.pipe(dest);
      source.on('end', () => {
        log(
          `Edit the proxy value in ${localgulpConfig} to match your virtual host. \n`
            .underline.red
        );
        process.exit(1);
      });
      source.on('error', err => {
        log(
          `Copy ${localgulpConfigDefault} to ${localgulpConfig} and edit the proxy value  to match your virtual host. \n`
            .underline.red
        );
        process.exit(1);
      });
    }
  });
  done();
};

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
      .pipe(gulpIf(!production, sourcemaps.init()))
      .pipe(
        gulpStylelint({
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
        return compileSass(stream, CONFIG.paths.sass.dist);
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
        imagemin.mozjpeg({ progressive: true }),
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


// ----------
// CLEAN TASK
// ----------
gulp.task('clean', () => {
  return del([
    `${CONFIG.paths.sass.dist}/*`,
    `${CONFIG.paths.js.dist}/*`,
    `${CONFIG.paths.images.dist}/*`
  ]);
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
});

// ------------
// SERVE TASKS
// ------------

//
// Init CMS Browsersync Server
//
gulp.task('startsync:cms', cb => {
  // Check for local gulpconfig proxy
  if (CONFIG.useProxy) {
    const g_config = JSON.parse(fs.readFileSync(localConfig));

    if (g_config.proxy == null) {
      log(`Edit the proxy value in ${localConfig} \n`.underline.red);
      process.exit(1);
    }

    CONFIG.browsersyncOpts['proxy'] = g_config.proxy;
  }

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
    'clean',
    'default',
  )
);
