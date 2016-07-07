const    gulp        = require('gulp');
const    plumber     = require('gulp-plumber');
const    browserSync = require('browser-sync');
const    stylus      = require('gulp-stylus');
const    uglify      = require('gulp-uglify');
const    concat      = require('gulp-concat');
const    jeet        = require('jeet');
const    rupture     = require('rupture');
const    koutoSwiss  = require('kouto-swiss');
const    prefixer    = require('autoprefixer-stylus');
const    imagemin    = require('gulp-imagemin');
const    cp          = require('child_process');

const messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

gulp.task('jekyll-build', (done) => {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn('jekyll', ['build'], {stdio: 'inherit'})
        .on('close', done);
});

gulp.task('jekyll-rebuild', ['jekyll-build'], () => {
    browserSync.reload();
});

gulp.task('browser-sync', ['jekyll-build'], () => {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

gulp.task('stylus', () => {
        gulp.src('src/styl/main.styl')
        .pipe(plumber())
        .pipe(stylus({
            use:[koutoSwiss(), prefixer(), jeet(),rupture()],
            compress: true
        }))
        .pipe(gulp.dest('_site/assets/css/'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('assets/css'));
});

gulp.task('js', () => {
    return gulp.src('src/js/**/*.js')
        .pipe(plumber())
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(gulp.dest('assets/js/'));
});

gulp.task('imagemin', () => {
    return gulp.src('src/img/**/*')
        .pipe(plumber())
        .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
        .pipe(gulp.dest('assets/img/'));
});

gulp.task('watch', () => {
    gulp.watch('src/styl/**/*.styl', ['stylus']);
    gulp.watch('src/js/**/*.js', ['js']);
     gulp.watch('src/img/**/*.{jpg,png,gif}', ['imagemin']);
    gulp.watch(['index.html', '_includes/*.html', '_layouts/*.html', '_posts/*'], ['jekyll-rebuild']);
});

gulp.task('default', ['js', 'stylus', 'imagemin', 'browser-sync', 'watch']);
