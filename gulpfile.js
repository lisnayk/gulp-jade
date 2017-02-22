const gulp = require('gulp');
const sass = require('gulp-sass');
const stylus = require('gulp-stylus');
const browserSync = require('browser-sync').create();
const useref = require('gulp-useref');
const gulpLoadPlugins = require('gulp-load-plugins');
const $ = gulpLoadPlugins();
const del = require('del');
const openURL = require("open");
var wiredep = require('wiredep').stream;
const gulpSequence = require('gulp-sequence');
const runSequence = require('run-sequence');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');
const sftp = require('gulp-sftp');
var GulpSSH = require('gulp-ssh');

var ssh_options = {
	username: 'sysadmin',
	password: '1qazse4',
	port: '22',
	host: '10.1.100.98',
	path: '/var/www/html/mmodel/ttp/'

};
var gulpSSH = new GulpSSH({
	ignoreErrors: false,
	sshConfig: ssh_options
});

//-------------------------------------------------
// APP DIRECTORY STRUCTURE AND OPTIONS
//-------------------------------------------------
var config = {
	appPath: "src",
	tmpPath: ".tmp",
	distPath: "dist",
	cssPath: "styles",
	isDev: true,
	isReload: true
}

//-------------------------------------------------
// GULP SUBTASKS
//-------------------------------------------------
//----------------------------------
// Clean the tmp and dist directorys
//----------------------------------
gulp.task('clean:tmp', function(cb) {
	return del(config.tmpPath + '/*', cb);
});
gulp.task('clean:dist', function(cb) {
	return del(config.distPath + '/*', cb);
});
//-----------------------------------------
// Compile scss files to css with gulp-sass 
//-----------------------------------------
gulp.task('sass', function() {
	return gulp.src(config.appPath + '/' + config.cssPath + '/*.scss')
		.pipe(sass())
		.pipe($.plumber())
		.pipe($.if(!config.isDev, cleanCSS({
			compatibility: 'ie8'
		})))
		//.pipe($.if(!config.isDev, gulp.dest(config.distPath + "/" + config.cssPath)))
		.pipe(gulp.dest(config.tmpPath + "/" + config.cssPath))
		.pipe($.connect.reload());
});
//-------------------------------------------
// Compile styl files to css with gulp-stylus 
//-------------------------------------------
gulp.task('stylus', function() {
	return gulp.src(config.appPath + '/' + config.cssPath + '/*.styl')
		.pipe(stylus({
			compress: !config.isDev
		}))
		.pipe($.plumber())
		.pipe(gulp.dest(config.tmpPath + "/" + config.cssPath))
		.pipe($.connect.reload());
});
//--------------------------------------------------------
// Compile Jade templates from appPath and save to tmpPath
//--------------------------------------------------------
gulp.task('jade', function() {
	return gulp.src(config.appPath + '/*.jade')
		.pipe($.jade({
			pretty: true
		}))
		.pipe($.plumber())
		.pipe(gulp.dest(config.tmpPath))
		
});


gulp.task('bower:inject', function() {
	var injectStyles = gulp.src([
		// selects all css files from the .tmp and src
		config.tmpPath + '/' + config.cssPath + '/*.css',
		config.appPath + '/' + config.cssPath + '/*.css'
	], {
		read: false
	}, {
		relative: false
	});
	var injectScripts = gulp.src([
		// selects all js files from .tmp dir
		config.appPath + '/**/*.js',
	]);
	var injectOptions = {
		ignorePath: [config.appPath, config.tmpPath]
	};
	var wiredepOptions = {
		directory: './bower_components',
		ignorePath: '..',
		bowerJson: require('./bower.json'),
	};
	return gulp.src(config.tmpPath + '/*.html')
		.pipe(wiredep(wiredepOptions))
		.pipe($.inject(injectStyles, injectOptions))
		.pipe($.inject(injectScripts, injectOptions))
		.pipe(gulp.dest(config.tmpPath))
		.pipe($.connect.reload());
});

gulp.task('jade:bower:inject', function() {
	gulpSequence('jade', 'bower:inject', function() {
		$.connect.reload()
	})
});

gulp.task('watch', function() {
	gulp.watch(config.appPath + "/**/*.scss", ['sass']);
	gulp.watch(config.appPath + "/**/*.styl", ['stylus']);
	gulp.watch(config.appPath + "/**/*.jade", ['jade:bower:inject']);
	
	$.watch(config.appPath + "/**/*.{js}")
		.pipe($.plumber())
		.pipe($.connect.reload());
	gulp.watch('bower.json', ['bower:inject']);
});

gulp.task('dev:server', function() {
	$.connect.server({
		root: [config.tmpPath, config.appPath],
		livereload: true,
		port: 9000,
		middleware: function(connect, opt) {
			return [
				['/bower_components', connect["static"]('./bower_components')]
			]
		}
	});
});
gulp.task('dist:server', function() {
	$.connect.server({
		root: [config.distPath],
		livereload: true,
		port: 3000
	});
});

gulp.task('copy:images', function() {
	return gulp.src(config.appPath + '/images/**/*')
		.pipe(gulp.dest(config.distPath + '/images'));
});
gulp.task('copy:cssimages', function() {
	return gulp.src(config.appPath + '/' + config.cssPath + '/**/*.{png,gif,svg,jpeg,jpg,woff,eot,ttf}')
		.pipe(gulp.dest(config.distPath + '/' + config.cssPath));
});
gulp.task('copy:fonts', function() {
	return gulp.src('./bower_components/bootstrap/dist/fonts/**/*')
		.pipe(gulp.dest(config.distPath + '/fonts'));
});
gulp.task('copy:favicon', function() {
	return gulp.src(config.appPath + '/favicon.ico')
		.pipe(gulp.dest(config.distPath));
});
gulp.task('useref', function() {
	var jsFilter = $.filter('**/*.js');
	var cssFilter = $.filter('**/*.css');

	return gulp.src(config.tmpPath + "/*.html")
		.pipe(useref({
			searchPath: ['src', '.tmp']
		}))
		.pipe(jsFilter)
		.pipe($.minify({
			ext: {
				src: '.src.js',
				min: '.js'
			},
			noSource: true
		}))
		.pipe(jsFilter.restore())
		.pipe(cssFilter)
		.pipe(cleanCSS({
			compatibility: 'ie8'
		}))
		.pipe(cssFilter.restore())
		.pipe(gulp.dest(config.distPath));
});
//-----------------------------------------------------
// TASK TO RUN
//-----------------------------------------------------
gulp.task('build', ['clean:tmp', 'clean:dist'], function(cb) {
	runSequence(['sass', 'stylus', 'jade'], ['copy:images', 'copy:favicon', 'copy:fonts', 'copy:cssimages'], 'bower:inject', 'useref', function(cb) {
		console.log("BUILD HAS FINIFED! RUN gulp serve:dist to view project");
	});
});

gulp.task('server:test', ['clean:tmp'], function() {
	gulpSequence(['sass', 'stylus', 'jade'], 'bower:inject', 'dev:server', 'watch', function() {
		openURL('http://localhost:9000');
	})
});

gulp.task('server:dist', ['dist:server'], function() {
	openURL('http://localhost:3000');
});

gulp.task('deploy', function() {
	return gulp.src(config.distPath + "/**/*")
		.pipe(gulpSSH.dest(ssh_options.path));

});


gulp.task('default', ['build']);