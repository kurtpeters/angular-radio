var gulp = require('gulp'),
    uglify = require('gulp-uglify');

gulp.task('default', function() {
  return gulp.src('src/angular-radio.js')
    .pipe(uglify())
    .pipe(gulp.dest('build'));
});