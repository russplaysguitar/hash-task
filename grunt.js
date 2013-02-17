/*global module:false*/
(function () {
    'use strict';

  module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
      pkg: '<json:package.json>',
      meta: {
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
          '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
          '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
          '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
          ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
      },
      lint: {
        files: ['grunt.js', 'src/js/*.js', 'test/**/*.js']
      },
      jasmine : {
        src : ['src/js/libs/jquery.js','src/js/libs/underscore.js','src/js/libs/backbone.js','src/js/*.js'],
        specs : 'test/*.js'
      },
      growl : {
        jasmine : {
          title : 'Jasmine',
          message : 'Tests passed successfully'
        }
      },
      concat: {
        dist: {
          src: ['<banner:meta.banner>', '<file_strip_banner:src/js/app.js>'],
          dest: 'dist/<%= pkg.name %>.js'
        }
      },
      min: {
        dist: {
          src: ['src/js/**/*.js'],
          dest: 'dist/<%= pkg.name %>.min.js'
        }
      },
      watch: {
        files: '<config:lint.files>',
        tasks: 'lint jasmine'
      },
      jshint: {
        options: {
          curly: true,
          eqeqeq: true,
          immed: true,
          latedef: true,
          newcap: true,
          noarg: true,
          sub: true,
          undef: true,
          boss: true,
          eqnull: true,
          browser: true
        },
        globals: {}
      },
      uglify: {},
      server: {
        port: 8000,
        base: 'src/'
      }
    });

    grunt.loadNpmTasks('grunt-growl');
    grunt.loadNpmTasks('grunt-jasmine-runner');

    grunt.registerTask('run', 'server watch');

    /*
      TODO: setup a grunt task using grunt.util.spawn() to build gh-pages.
      (example: https://github.com/scottgonzalez/grunt-git-authors/blob/master/tasks/git-authors.js)
      (see: https://github.com/gruntjs/grunt/wiki/grunt.util#wiki-grunt-util-spawn)
      1. compile source
      2. copy source to tmp directory
      3. git checkout gh-pages
      4. move source into root
      5. delete tmp files
      6. git commit
      7. git checkout master
    */

    // Default task.
    grunt.registerTask('default', 'lint jasmine concat min');

  };
}());