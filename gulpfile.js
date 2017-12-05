/**
 * Gulpfile.js, functions:
 * - Browser Sync
 * - Customize && compile Bootstrap
 * - Compile SCSS + sourcemap
 * - Concat JS
 * - Build HTML
 * - Build && minify sprite
 * - Copy && minify images
 * - Copy fonts
 * - Make beep if error
 */

var gulp                    = require('gulp'),
    sass                    = require('gulp-sass'),
    prefixer                = require('gulp-autoprefixer'),
    cssmin                  = require('gulp-minify-css'),
    uglify                  = require('gulp-uglify'),
    plumber                 = require('gulp-plumber'),
    spritesmith             = require('gulp.spritesmith'),
    buffer                  = require('vinyl-buffer'),
    imagemin                = require('gulp-imagemin'),
    newer                   = require('gulp-newer'),
    watch                   = require('gulp-watch'),
    rigger                  = require('gulp-rigger'),
    gutil                   = require('gulp-util'),
    cssImageDimensions      = require("gulp-css-image-dimensions"),
    browserSync             = require('browser-sync').create(),
    fs                      = require("fs"),
    sourcemaps              = require('gulp-sourcemaps'),
    notify                  = require("gulp-notify"),
    gulpIf                  = require('gulp-if'),
    cache                   = require('gulp-cache'),
    pngquant                = require('imagemin-pngquant'),
    newer                   = require('gulp-newer'),
    gulpRemoveHtml          = require('gulp-remove-html'),
    fileinclude             = require('gulp-file-include'),
    sassInlineImage         = require('sass-inline-image');

// Запуск `NODE_ENV=production npm start [задача]` приведет к сборке без sourcemaps
var isDev = true; //!process.env.NODE_ENV || process.env.NODE_ENV == 'dev';

var path = {
    build: {
        js:         'build/js/',
        css:        'build/css/',
        images:     'build/images/',
        fonts:      'build/fonts/',
        html:       'build/',
        bootstrap:  'bower_components/bootstrap-sass/assets/stylesheets/',
        jpg:        'build/jpg',
    },
    src: {
        js:         'src/js/app.js',
        scss:       'src/scss/**/*.scss',
        images:     'src/images/**/*.*',
        sprite:     'src/sprite/**/*.*',
        fonts:      'src/fonts/**/*.*',
        html:       'src/html/*.html',
        bootstrap:  'src/bootstrap/',
        bootstrapSCSS: 'src/bootstrap/bootstrap.scss',
        bower:      'bower_components',
        jpg:        'src/jpg/**/*.*',
    },
    watch: {
        js:         'src/js/**/*.js',
        style:      ['src/scss/**/*.scss', 'src/bootstrap/bootstrap/_variables.scss'],
        bootstrap:  'src/bootstrap/**/*.scss',
        images:     'src/images/**/*.*',
        sprite:     'src/sprite/**/*.*',
        fonts:      'src/fonts/**/*.*',
        html:       'src/html/**/*.html',
        jpg:        'src/jpg/**/*.*',
    }
};

var onError = function(err) {
    notify.onError({
        title:    "Gulp",
        subtitle: "Failure!",
        message:  "Error: <%= error.message %>",
        sound:    "Beep"
    })(err);

    this.emit('end');
};


// Server
gulp.task('browser-sync', function() {
    browserSync.init({
        notify: true,
        server: {
            baseDir: "build"
        },
        open: true,
    });
});

// Copy bootstrap customization files
gulp.task('bootstrap-copy', function() {

    // 1. copy custom files
    gulp.src(path.src.bootstrap + '_bootstrap.scss')
        .pipe(gulp.dest(path.build.bootstrap));

    return gulp.src(path.src.bootstrap + 'bootstrap/**.scss')
        .pipe(gulp.dest(path.build.bootstrap + 'bootstrap/'));
});

gulp.task('bootstrap', ['bootstrap-copy'], function() {

    return gulp.src(path.src.bootstrapSCSS)
        .pipe(gulpIf(isDev, sourcemaps.init()))
        .pipe(sass({source_map: isDev}).on("error", onError))
        .pipe(gulpIf(isDev, sourcemaps.write()))
        .pipe(gulpIf(!isDev, prefixer())) // Добавим вендорные префиксы
        .pipe(gulpIf(!isDev, cssmin())) // Добавим вендорные префиксы
        .pipe(gulp.dest(path.build.css))
        .pipe(browserSync.stream());
});

// Sass
gulp.task('scss', function () {

    return gulp.src(path.src.scss)
        .pipe(gulpIf(isDev, sourcemaps.init()))
        .pipe(sass({source_map: isDev, functions: sassInlineImage({})}).on("error", onError))
        .pipe(gulpIf(isDev, sourcemaps.write()))
        .pipe(gulpIf(!isDev, prefixer())) // Добавим вендорные префиксы
        .pipe(gulpIf(!isDev, cssmin())) // Добавим вендорные префиксы
        .pipe(cssImageDimensions('build/images'))
        .pipe(gulp.dest(path.build.css))
        .pipe(browserSync.stream());
});

// JavaScript
gulp.task('js', function() {

    return gulp.src(path.src.js)
        .pipe(plumber({errorHandler: onError}))
        .pipe(rigger())
        .pipe(gulpIf(!isDev, uglify()))
        .pipe(gulp.dest(path.build.js))
        .pipe(notify({
            title: 'Gulp',
            subtitle: 'success',
            message: 'JS task',
        }))
        .pipe(browserSync.stream());
});

gulp.task('js-watch', ['js'], function() {

    return browserSync.reload();
});

// Html
gulp.task('html', function() {

    return gulp.src(path.src.html)
        //.pipe(plumber({errorHandler: onError}))
        .pipe(rigger())
        .pipe(gulpIf(!isDev, fileinclude({
            prefix: '@@',
            indent: true,
        })))
        .pipe(gulpIf(!isDev, gulpRemoveHtml()))
        .pipe(gulp.dest(path.build.html));
});

gulp.task('html-watch', ['html'], function() {

    return browserSync.reload();
});

// Fonts
gulp.task('fonts', function() {

    return gulp.src(path.src.fonts)
        .pipe(newer(path.build.fonts))
        .pipe(gulp.dest(path.build.fonts))
        .pipe(browserSync.stream());
});

// Jpg
gulp.task('jpg', function() {

    return gulp.src(path.src.jpg)
        .pipe(gulp.dest(path.build.jpg))
        .pipe(browserSync.stream());
});

// Images
gulp.task('images', function() {

    return gulp.src(path.src.images)
        .pipe(newer(path.build.images))
        .pipe(imagemin({
            interlaced: true,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(path.build.images))
        .pipe(browserSync.stream());
});

// Sprite
gulp.task('sprite', function () {

    var spriteData;

    spriteData = gulp.src(path.src.sprite)
        .pipe(spritesmith({
            imgPath: 'build/images/sprite.png',
            imgName: 'sprite.png',
            cssName: '_sprite.scss',
            padding: 5
        }));

    spriteData.css
        .pipe(gulp.dest('src/scss/'));

    return spriteData.img
        .pipe(buffer())
        .pipe(imagemin())
        .pipe(gulp.dest(path.build.images))
        .pipe(browserSync.stream());
});


// Watch
gulp.task('watch', function() {

    gulp.watch(path.watch.bootstrap,['bootstrap']);
    gulp.watch(path.watch.js,       ['js-watch']);
    gulp.watch(path.watch.fonts,    ['fonts']);
    gulp.watch(path.watch.jpg,      ['jpg']);
    gulp.watch(path.watch.images,   ['images']);
    gulp.watch(path.watch.style,    ['scss']);
    gulp.watch(path.watch.sprite,   ['sprite']);
    gulp.watch(path.watch.html,     ['html-watch']);
});

console.log(gulp.series);

gulp.task('default',    ['bootstrap', 'sprite', 'js', 'html', 'fonts', 'jpg', 'images', 'scss', 'watch', 'browser-sync']);

gulp.task('build',      ['bootstrap', 'sprite', 'js', 'html', 'fonts', 'images', 'scss']);