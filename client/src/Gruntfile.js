module.exports = function(grunt) {

const PACKAGE = require("./package.json");

const SRC_DIR = "./";
const BUILD_DIR = "../build/";

const WWW_SRC = SRC_DIR + "www/"
const WWW_BUILD = BUILD_DIR + "www/";

const CORDOVA_SRC = SRC_DIR + "cordova/";
const CORDOVA_WWW_SRC = CORDOVA_SRC + "www_src/";
const CORDOVA_WWW = CORDOVA_SRC + "www/";

// The below warning is only meant for Cordova's "config.xml".
// Edit this file (Gruntfile.js) all you wish.

const CORDOVA_WARNING = `<!--
	~ WARNING! ~

	This file will be overwritten by Grunt.
	Please edit "config.src.xml" to make any changes.
-->`;

var config = {};

config.buildnumber = {
	package : {}
};

config.sass = {};
config.sass.www = {
	options: {
		style: "compressed",
	},
	src: WWW_SRC + "css/style.scss",
	dest: WWW_BUILD + "css/style.min.css"
};


config.htmlmin = {};
config.htmlmin.www = {
	options: {
		removeComments: true,
		collapseWhitespace: true,
		conservativeCollapse: true,
		removeEmptyAttributes: true
	},
	src: WWW_SRC + "index.html",
	dest: WWW_BUILD + "index.html"
};


config.imagemin = {};
config.imagemin.build_www = {
	files: [{
		expand: true,
		cwd: WWW_SRC + 'img/',
		src: '**/*.{png,jpg,gif}',
		dest: WWW_BUILD + "img/"
	}]
};


config.uglify = {};
config.uglify.www = {
	src: WWW_SRC + 'js/**/*.js',
	dest: WWW_BUILD + "js/script.min.js"
};


config.copy = {};
config.copy.www = {
	files: [{
		expand: true,
		cwd: WWW_SRC + 'font/',
		src: '**/*',
		dest: WWW_BUILD + 'font/'
	}, {
		expand: true,
		cwd: WWW_SRC + 'icons/',
		src: '**/*',
		dest: WWW_BUILD + 'icons/'
	}, {
		expand: true,
		cwd: WWW_SRC + 'img/',
		src: '**/*.svg',
		dest: WWW_BUILD + "img/"
	}]
};
config.copy.test_www = {
	files: [{
		expand: true,
		cwd: WWW_SRC + 'img/',
		src: '**/*.{png,jpg,gif}',
		dest: WWW_BUILD + "img/"
	}]
};
config.copy.cordova = {
	files: [{
		expand: true,
		cwd: WWW_BUILD,
		src: '**/*',
		dest: CORDOVA_WWW
	}, {
		expand: true,
		cwd: CORDOVA_WWW_SRC,
		src: '**/*',
		dest: CORDOVA_WWW				
	}]
};


config["string-replace"] = {};
config["string-replace"].www = {
	src: WWW_BUILD + "js/script.min.js", 
	dest: WWW_BUILD + "js/script.min.js", 
	options: {
		replacements: [{
			pattern: "{{VERSION}}",
			replacement: PACKAGE.version
		}, {
			pattern: "{{BUILD}}",
			replacement: PACKAGE.build
		}]
	}
};
config["string-replace"].build_www = {
	src: WWW_BUILD + "js/script.min.js", 
	dest: WWW_BUILD + "js/script.min.js", 
	options: {
		replacements: [{
			pattern: "{{DATA_URL}}",
			replacement: PACKAGE.urlDataBuild
		}]
	}
};
config["string-replace"].test_www = {
	src: WWW_BUILD + "js/script.min.js", 
	dest: WWW_BUILD + "js/script.min.js", 
	options: {
		replacements: [{
			pattern: "{{DATA_URL}}",
			replacement: PACKAGE.urlDataTest
		}]
	}
};
config["string-replace"].cordova = {
	files: [{
		src: CORDOVA_SRC + "config.src.xml",
		dest: CORDOVA_SRC + "config.xml"
	}],
	options: {
		replacements: [{
			pattern: '{{VERSION}}',
			replacement: PACKAGE.version
		}, {
			pattern: '{{WARNING}}',
			replacement: CORDOVA_WARNING
		}]
	}
};

grunt.initConfig(config);

grunt.loadNpmTasks('grunt-build-number');
grunt.loadNpmTasks('grunt-contrib-sass');
grunt.loadNpmTasks('grunt-contrib-htmlmin');
grunt.loadNpmTasks('grunt-contrib-imagemin');
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-string-replace');

grunt.registerTask('www', [
	'buildnumber',
	'sass:www',
	'htmlmin:www',
	'uglify:www',
	'copy:www',
	'string-replace:www'
]);


grunt.registerTask('test_www',[
	'www',
	'copy:test_www',
	'string-replace:test_www'
]);

grunt.registerTask('build_www',[
	'www',
	'imagemin:build_www',
	'string-replace:build_www'
]);


grunt.registerTask('cordova', [
	"copy:cordova",
	'string-replace:cordova',
]);

grunt.registerTask('test_cordova', [
	"test_www",
	"cordova"
]);

grunt.registerTask('build_cordova', [
	"build_www",
	"cordova"
]);


grunt.registerTask('default', ['test_www']);

};