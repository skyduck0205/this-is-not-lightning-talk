var gulp = require('gulp');
var $ = require('gulp-load-plugins')({
  overridePattern: false,
  pattern: ['browser-sync']
});

gulp.task('serve', function() {
  $.browserSync.init({
    server: '.'
  });
  gulp.watch(['src/js/**'], ['jshint']);
  gulp.watch(['src/**/*.js', '*.html'])
    .on('change', $.browserSync.reload);
  gulp.watch(['src/**/*.css'], ['reloadStyles']);
});

gulp.task('jshint', function() {
  return gulp.src(['src/js/*.js'])
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('reloadStyles', function() {
  return gulp.src(['src/**/*.css'])
    .pipe($.browserSync.stream());
})

gulp.task('default', ['serve']);
