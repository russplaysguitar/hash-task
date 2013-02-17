/*global require,module:false*/
(function () {
    'use strict';

  module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
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
      Grunt task using to build gh-pages.
      1. git checkout gh-pages
      2. move source into root
      3. git add
      4. git commit
      5. git checkout master
    */
    grunt.registerTask( "gh-pages", "Generate gh-pages", function() {
      var _ = require('underscore'),
          $ = require('jquery');

      var done = this.async();

      var dfd_spawn = function (opts) {
        var dfd = new $.Deferred();
        grunt.util.spawn(opts, function (err, result) {
          if (err) {
            dfd.reject(err);
            return done(false);
          }
          dfd.resolve(result);
        });
        return dfd.promise();
      };

      var git_checkout_gh_pages = _.partial(dfd_spawn, {
        cmd: "git",
        args: ["checkout", "gh-pages"]
      });
      var cp_dist = _.partial(dfd_spawn, {
        cmd: "cp",
        args: ["-R", "dist/", "./"]
      });
      var git_add = _.partial(dfd_spawn, {
        cmd: "git",
        args: ["add", "."]
      });
      var git_commit = _.partial(dfd_spawn, {
        cmd: "git",
        args: ["commit", "-am", "Update gh-pages"]
      });
      var git_checkout_master = _.partial(dfd_spawn, {
        cmd: "git",
        args: ["checkout", "master"]
      });

      $.when(git_checkout_gh_pages())
        .then(cp_dist())
        .then(git_add())
        .then(git_commit())
        .then(git_checkout_master())
        .done(function () {
          done();
        });
    });


    // Default task.
    grunt.registerTask('default', 'lint jasmine concat min');

  };
}());