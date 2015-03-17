/*global -$ */
'use strict';

// CONFIG
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var awspublish = require('gulp-awspublish');
var fs = require("fs");

// Load project config file
var appConfig = require('./gulp-config.json');
var aws = require('./aws-credentials.json');


// *


// COMPILE TASKS
// CSS
gulp.task('css', function () {
	return gulp.src('./source/scss/app.scss')
		.pipe($.sourcemaps.init())
		.pipe($.sass({
			outputStyle: 'nested', // libsass doesn't support expanded yet
			precision: 10,
			includePaths: ['.'],
			onError: console.error.bind(console, 'Sass error:')
		}))
		.pipe($.postcss([
			require('autoprefixer-core')({browsers: ['last 2 version']})
		]))
		.pipe($.sourcemaps.write())
		.pipe(gulp.dest('./app/css'))
		.pipe(browserSync.reload({stream:true}))
		.pipe($.notify("CSS compile complete"));
});


// JS
gulp.task('js', function () {
	return gulp.src('./source/js/**/*.js')
		.pipe(reload({stream: true, once: true}))
		.pipe($.jshint())
		.pipe($.jshint.reporter('jshint-stylish'))
		.pipe($.if(!browserSync.active, $.jshint.reporter('fail')))
		.pipe($.concat('app.js'))
		.pipe(gulp.dest('./app/js'))
		.pipe(browserSync.reload({stream:true}))
		.pipe($.notify("JS compile complete"));

});


// HTML
gulp.task('html', function () {
	return gulp.src('./source/html/*.html')
		.pipe(gulp.dest('./app'))
		.pipe($.notify("HTML processing complete"));
});


// Images
gulp.task('images', function () {
	return gulp.src('app/images/**/*')
		.pipe($.cache($.imagemin({
			progressive: true,
			interlaced: true,
			// don't remove IDs from SVGs, they are often used
			// as hooks for embedding and styling
			svgoPlugins: [{cleanupIDs: false}]
		})))
		.pipe(gulp.dest('app/images'))
		.pipe(browserSync.reload({stream:true}))
		.pipe($.notify("Image processing complete"));
});

gulp.task('watch', function() {
	gulp.watch('source/scss/**/*.scss'.css, 'css');
	gulp.watch('source/js/**/*.js'.js, 'js');
	gulp.watch('source/html/**/*.html'.html, 'html');
});


// Clean task
gulp.task('clean', require('del').bind(null, ['app']));


gulp.task('browser-sync', function () {
	var files = [
		'./app/index.html'
	];

	browserSync.init(files, {
		server: {
			 baseDir: './app'
		}
	});
});

// Localhost server
gulp.task('localhost', gulp.series('html', 'css', 'js', 'watch', 'browser-sync'), function () {
// 	browserSync({
// 		notify: false,
// 		port: 3000,
// 		server: {
// 			baseDir: ['./app'],
// 			directory: true,
// 			index: "index.html",
// 			routes: {
// 				'/bower_components': './source/repos'
// 			}
// 		}
// 	});

	// watch for changes
	// gulp.watch([
	// 	'source/html/*.html',
	// 	'souce/css/**/*.css',
	// 	'source/js/**/*.js',
	// 	'source/images/**/*'
	// ]).on('change', reload);

	// gulp.watch('source/scss/**/*.scss'.css, 'css');
	// gulp.watch('source/js/**/*.js'.js, 'js');
	// gulp.watch('source/html/**/*.html'.html, 'html');
	// gulp.watch('source/fonts/**/*', ['fonts']);
	// gulp.watch('bower.json', ['wiredep', 'fonts']);
});




// Inject bower components
gulp.task('wiredep', function () {
	var wiredep = require('wiredep').stream;

	gulp.src('source/scss/*.scss')
		.pipe(wiredep({
			ignorePath: /^(\.\.\/)+/
		}))
		.pipe(gulp.dest('app/css'));

	gulp.src('source/html/**/*.html')
		.pipe(wiredep({
			exclude: ['bootstrap-sass-official'],
			ignorePath: /^(\.\.\/)*\.\./
		}))
		.pipe(gulp.dest('app'));
});


// *


// BUILD TASKS
// Build task
gulp.task('build', gulp.series(
		'css',
		'js',
		'html',
		'watch'
		// 'images'
		// 'fonts',
		// 'extras'
	), function () {
	return gulp.src('app/**/*').pipe($.size({title: 'build', gzip: true}));
});


// Clean & build
gulp.task('default', gulp.series('clean'), function () {
	gulp.start('build');
});


// *


// PUBLISH TASKS
// Publish the app to S3
gulp.task('publish-app', function() {
	// create a new publisher 
	var publisher = awspublish.create({
		"bucket": 'aws.bucket',
		"region": "aws.region",
		"key": "aws.key",
  	"secret": "aws.secret"
  });
 
	return gulp.src('./app/**/*.*')
		.pipe(publisher.publish())
		.pipe(publisher.cache())
		.pipe($.awspublish.reporter());
});

// Push images to AWS S3
gulp.task('publish-images', function() {
	// create a new publisher 
	var publisher = awspublish.create({
		"bucket": 'aws.bucket',
		"region": "aws.region",
		"key": "aws.key",
  	"secret": "aws.secret"
  });
 
	return gulp.src('./source/images/**/*.*')
		.pipe(publisher.publish())
		.pipe(publisher.cache())
		.pipe($.awspublish.reporter());
});
