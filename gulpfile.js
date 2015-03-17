/*global -$ */
'use strict';

// CONFIG
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var fs = require("fs");

// Load project config file
var config = require('./gulp-config.json');

// Load AWS S3 config file
var aws = JSON.parse(fs.readFileSync('./aws-credentials.json'));


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
		.pipe($.notify("CSS compile complete"))
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


// Fonts
// gulp.task('fonts', function () {
// 	return gulp.src(require('main-bower-files')({
// 		filter: '**/*.{eot,svg,ttf,woff,woff2}'
// 	}).concat('app/fonts/**/*'))
// 		.pipe(gulp.dest('app/fonts'));
// });


// ?
// gulp.task('extras', function () {
// 	return gulp.src([
// 		'app/*.*',
// 		'!app/*.html'
// 	], {
// 		dot: true
// 	}).pipe(gulp.dest('app'));
// });


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
gulp.task('localhost', gulp.series('html', 'css', 'js', 'browser-sync'), function () {
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
	gulp.watch([
		'source/html/*.html',
		'souce/css/**/*.css',
		'source/js/**/*.js',
		'source/images/**/*'
	]).on('change', reload);

	gulp.watch('source/scss/**/*.scss', ['css']);
	gulp.watch('source/js/**/*.js', ['js']);
	gulp.watch('source/fonts/**/*', ['fonts']);
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
		'html'
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
// Push images to AWS S3
gulp.task('publish-images', function() {
	// create a new publisher 
	var publisher = awspublish.create({ bucket: '...' });
 
	return gulp.src('./source/images/**/*.*')
		.pipe(publisher.publish())
		.pipe(publisher.cache())
		.pipe(awspublish.reporter());
});


// Push HTML to AWS S3
gulp.task('publish-html', function() {
	// create a new publisher 
	var publisher = awspublish.create({ bucket: '...' });
 
	return gulp.src('./app/*.html')
		.pipe(publisher.publish())
		.pipe(publisher.cache())
		.pipe(awspublish.reporter());
});

// Push CSS to AWS S3
gulp.task('publish-css', function() {
	// create a new publisher 
	var publisher = awspublish.create({ bucket: '...' });
 
	return gulp.src('./app/css/*.css')
		.pipe(publisher.publish())
		.pipe(publisher.cache())
		.pipe(awspublish.reporter());
});


// Push JS to AWS S3
gulp.task('publish-js', function() {
	// create a new publisher 
	var publisher = awspublish.create({ bucket: '...' });
 
	return gulp.src('./app/js/*.js')
		.pipe(publisher.publish())
		.pipe(publisher.cache())
		.pipe(awspublish.reporter());
});
