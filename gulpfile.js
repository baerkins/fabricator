const assembler = require('refabricator-assemble');
const browserSync = require('browser-sync');
const csso = require('gulp-csso');
const del = require('del');
const gulp = require('gulp');
const gutil = require('gulp-util');
const gulpif = require('gulp-if');
const imagemin = require('gulp-imagemin');
const prefix = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const reload = browserSync.reload;
const runSequence = require('run-sequence');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const webpack = require('webpack');
const sassGlob = require('gulp-sass-glob');

// configuration
const config = {
  dev: gutil.env.dev,
  styles: {
    browsers: 'last 1 version',
    fabricator: {
      src: 'src/assets/fabricator/styles/fabricator.scss',
      dest: 'dist/assets/fabricator/styles',
      watch: 'src/assets/fabricator/styles/**/*.scss',
    },
    toolkit: {
      src: 'src/assets/toolkit/styles/toolkit.scss',
      dest: 'dist/assets/toolkit/styles',
      watch: 'src/assets/toolkit/styles/**/*.scss',
    },
  },
  scripts: {
    fabricator: {
      src: './src/assets/fabricator/scripts/fabricator.js',
      dest: 'dist/assets/fabricator/scripts',
      watch: 'src/assets/fabricator/scripts/**/*',
    },
    toolkit: {
      src: './src/assets/toolkit/scripts/toolkit.js',
      dest: 'dist/assets/toolkit/scripts',
      watch: 'src/assets/toolkit/scripts/**/*',
    },
  },
  images: {
    toolkit: {
      src: ['src/assets/toolkit/images/**/*', 'src/favicon.ico'],
      dest: 'dist/assets/toolkit/images',
      watch: 'src/assets/toolkit/images/**/*',
    },
  },
  fonts: {
    toolkit: {
      src: './src/assets/toolkit/fonts/*.*',
      dest: 'dist/assets/toolkit/fonts',
      watch: 'src/assets/toolkit/fonts/**/*',
    },
  },
  video: {
    toolkit: {
      src: './src/assets/toolkit/video/*.*',
      dest: 'dist/assets/toolkit/video',
      watch: 'src/assets/toolkit/video/**/*',
    },
  },
  templates: {
    watch: 'src/**/*.{html,md,json,yml}',
  },
  dest: 'dist',
};


// clean
gulp.task('clean', del.bind(null, [config.dest]));


// styles
gulp.task('styles:fabricator', () => {
  gulp.src(config.styles.fabricator.src)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(prefix(config.styles.browsers))
    .pipe(gulpif(!config.dev, csso()))
    .pipe(rename('f.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.styles.fabricator.dest))
    .pipe(browserSync.stream({ match: '**/*.css' }));
});

gulp.task('styles:toolkit', () => {
  gulp.src(config.styles.toolkit.src)
    .pipe(gulpif(config.dev, sourcemaps.init()))
    .pipe(sassGlob())
    .pipe(sass({
      includePaths: './node_modules',
    }).on('error', sass.logError))
    .pipe(prefix(config.styles.browsers))
    .pipe(gulpif(!config.dev, csso()))
    .pipe(gulpif(config.dev, sourcemaps.write()))
    .pipe(gulp.dest(config.styles.toolkit.dest))
    .pipe(browserSync.stream({ match: '**/*.css' }));
});

gulp.task('styles', ['styles:fabricator', 'styles:toolkit']);


// Fonts
gulp.task('fonts', () => {
  gulp.src(config.fonts.toolkit.src)
    .pipe(gulp.dest(config.fonts.toolkit.dest));
});

// Video
gulp.task('video', () => {
  gulp.src(config.video.toolkit.src)
    .pipe(gulp.dest(config.video.toolkit.dest));
});


// scripts
const webpackConfig = require('./webpack.config')(config);

gulp.task('scripts', (done) => {
  webpack(webpackConfig, (err, stats) => {
    if (err) {
      gutil.log(gutil.colors.red(err()));
    }
    const result = stats.toJson();
    if (result.errors.length) {
      result.errors.forEach((error) => {
        gutil.log(gutil.colors.red(error));
      });
    }
    done();
  });
});


// images
gulp.task('images', ['favicon'], () => {
  return gulp.src(config.images.toolkit.src)
    .pipe(imagemin())
    .pipe(gulp.dest(config.images.toolkit.dest));
});

gulp.task('favicon', () => {
  return gulp.src('src/favicon.ico')
    .pipe(gulp.dest(config.dest));
});


// assembler
gulp.task('assembler', (done) => {
  assembler({
    logErrors: config.dev,
    dest: config.dest,
  });
  done();
});


// server
gulp.task('serve', () => {

  browserSync({
    server: {
      baseDir: config.dest,
    },
    notify: false,
    logPrefix: 'FABRICATOR',
  });

  gulp.task('assembler:watch', ['assembler'], browserSync.reload);
  gulp.watch(config.templates.watch, ['assembler:watch']);

  gulp.task('styles:watch', ['styles']);
  gulp.watch([config.styles.fabricator.watch, config.styles.toolkit.watch], ['styles:watch']);

  gulp.task('scripts:watch', ['scripts'], browserSync.reload);
  gulp.watch([config.scripts.fabricator.watch, config.scripts.toolkit.watch], ['scripts:watch']);

  gulp.task('images:watch', ['images'], browserSync.reload);
  gulp.watch(config.images.toolkit.watch, ['images:watch']);

  gulp.task('fonts:watch', ['fonts'], browserSync.reload);
  gulp.watch(config.fonts.toolkit.watch, ['fonts:watch']);

  gulp.task('video:watch', ['video'], browserSync.reload);
  gulp.watch(config.video.toolkit.watch, ['video:watch']);

});


// default build task
gulp.task('default', ['clean'], () => {

  // define build tasks
  const tasks = [
    'styles',
    'scripts',
    'images',
    'fonts',
    'video',
    'assembler',
  ];

  // run build
  runSequence(tasks, () => {
    if (config.dev) {
      gulp.start('serve');
    }
  });

});
