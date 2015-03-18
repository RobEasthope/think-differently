/*global -$ */
'use strict';

// GULP CONFIG
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


// TASKS
// HTML
gulp.task('html', function () {
	return gulp.src('./source/html/*.html')
		.pipe(gulp.dest('./app'))
		.pipe($.notify("HTML processing complete"));
});


// CSS
gulp.task('css', function () {
	return gulp.src('source/scss/app.scss')
		// .pipe($.watch('./source/scss/**/*.scss'))
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
	return gulp.src('source/js/**/*.js')
		.pipe(reload({stream: true, once: true}))
		.pipe($.jshint())
		.pipe($.jshint.reporter('jshint-stylish'))
		.pipe($.if(!browserSync.active, $.jshint.reporter('fail')))
		.pipe($.concat('app.js'))
		.pipe(gulp.dest('./app/js'))
		.pipe(browserSync.reload({stream:true}))
		.pipe($.notify("JS compile complete"));

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


// PARKED TASKS
// Clean task
// gulp.task('clean', require('del').bind(null, ['app']));


// // Inject bower components
// gulp.task('wiredep', function () {
// 	var wiredep = require('wiredep').stream;

// 	gulp.src('source/scss/*.scss')
// 		.pipe(wiredep({
// 			ignorePath: /^(\.\.\/)+/
// 		}))
// 		.pipe(gulp.dest('app/css'));

// 	gulp.src('source/html/**/*.html')
// 		.pipe(wiredep({
// 			exclude: ['bootstrap-sass-official'],
// 			ignorePath: /^(\.\.\/)*\.\./
// 		}))
// 		.pipe(gulp.dest('app'));
// });


// *


// LOCALHOST
// Browser-Sync task
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


gulp.task('watch', function() {
	gulp.watch('source/scss/**/*.*', gulp.parallel('css'));
	gulp.watch('source/js/hacks.js', gulp.parallel('js'));
});

// Localhost server
gulp.task('localhost', gulp.series('html', 'css', 'js', 'watch', 'browser-sync'), function () {

});


// *


// BUILD TASKS
// Build task
gulp.task('build', gulp.series(
		'css',
		'js',
		'html'
	), function () {
		.pipe($.notify("App build complete"));
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
