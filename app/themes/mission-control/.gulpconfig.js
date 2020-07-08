module.exports = {
  paths: {
    sass: {
      src: 'assets/src/sass/*.scss',
      dist: 'assets/dist/css',
    },
    js: {
      src: 'assets/src/js/*.js',
      dist: 'assets/dist/js',
    },
    images: {
      src: '/assets/src/images/*',
      dist: '/assets/dist/images'
    }
  },
  browsersyncOpts: {
    ghostMode: false,
    notify: true,
    proxy: false,
  }
}
