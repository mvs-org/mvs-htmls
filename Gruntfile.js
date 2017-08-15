module.exports = function(grunt) {

    var package = require('./package.json');

    grunt.initConfig({
        // Watch task config
        watch: {
            sass: {
                files: "scss/*.scss",
                tasks: "sass:dev"
            }
        },
        sass: {
            dev: {
                files: {
                    'css/style.css': 'scss/style.scss'
                }
            }
        },
        browserSync: {
            default_options: {
                bsFiles: {
                    src: [
                        "css/*.css",
                        "**/*.html",
                        "**/*.js"
                    ]
                },
                options: {
                    watchTask: true,
                    proxy: "127.0.0.1:8820"
                }
            }
        },
        clean: ['dist'],
        cssmin: {
            options: {
                mergeIntoShorthands: false,
                roundingPrecision: -1
            },
            target: {
                files: {
                    './min/app.css': [
                        './node_modules/bootstrap/dist/css/bootstrap.min.css',
                        './node_modules/nprogress/nprogress.css',
                        './node_modules/font-awesome/css/font-awesome.min.css',
                        //'./css/calendar.css',
                        //'./css/mining.css',
                        './css/style.css'
                    ]
                }
            }
        },
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: { //"app" target
                files: {
                    './min-safe/js/flash.service.js': ['./app-services/flash.service.js'],
                    './min-safe/js/metaverse.service.js': ['./app-services/metaverse.service.js'],
                    './min-safe/js/login.controller.js': ['./login/login.controller.js'],
                    './min-safe/js/register.controller.js': ['./register/register.controller.js'],
                    './min-safe/js/home.controller.js': ['./home/home.controller.js'],
                    './min-safe/app.js': ['./app.js']
                }
            }
        },
        concat: {
            libs: {
                src: [
                    './node_modules/jquery/dist/jquery.min.js',
                    './node_modules/bootstrap/dist/js/bootstrap.min.js',
                    './node_modules/nprogress/nprogress.js',
                    //'./js/calendar.js',
                    './js/qrcode.min.js',
                    './js/clipboard.js',
                ],
                dest: './min/libs.min.js'
            },
            angular: {
                src: [
                    './node_modules/angular/angular.min.js',
                    './node_modules/angular-ui-router/release/angular-ui-router.min.js',
                    './node_modules/angular-cookies/angular-cookies.min.js',
                    './node_modules/angular-local-storage/dist/angular-local-storage.min.js',
                    './node_modules/angular-translate/dist/angular-translate.min.js',
                    './node_modules/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
                    './node_modules/angular-utils-pagination/dirPagination.js'
                ],
                dest: './min/framework.min.js'
            },
            app: { //target
                src: [
                    './min-safe/app.js',
                    './min-safe/js/*.js'
                ],
                dest: './min/app.js'
            }
        },
        babel: {
            options: {
                sourceMap: true,
                presets: ['es2015-ie']
            },
            dist: {
                files: {
                    './min/app.js': './min/app.js'
                }
            }
        },
        uglify: {
            js: { //target
                src: ['./min/app.js'],
                dest: './min/app.min.js'
            }
        },
        copy: {
            images: {
                expand: true,
                src: 'images/**',
                dest: 'dist'
            },
            views: {
                expand: true,
                src: '**/*.view.html',
                dest: 'dist'
            },
            lang: {
                expand: true,
                src: 'lang/*.json',
                dest: 'dist'
            },
            js: {
                expand: true,
                src: 'min/*.js',
                dest: 'dist'
            },
            css: {
                expand: true,
                src: 'min/*.css',
                dest: 'dist'
            },
            fontawesome:{
                expand: true,
                cwd: 'node_modules/font-awesome/fonts/',
                src: '**',
                dest: 'dist/fonts/'
            },
            bootstrap_fonts: {
                expand: true,
                cwd: 'node_modules/bootstrap/fonts/',
                src: '**',
                dest: 'dist/fonts/'
            },
            index: {
                src: 'build.html',
                dest: 'dist/index.html'
            }
        }, revPackage:{
            files:  'dist/*/**/*.{html,js,css,json}'
        }, 'string-replace': {
            dist: {
                files: {
                    'dist/': ['dist/min/app.min.*.js', 'dist/**/*.css', 'dist/**/*.html']
                },
                options: {
                    saveUnchanged: false,
                    replacements: [{
                        pattern: /\.view.html/g,
                        replacement: '.view.'+package.version+'.html'
                    }, {
                        pattern: /(\.css|\.js(?!on)|\.json)/g,
                        replacement: '\.'+package.version+'$1'
                    }, {
                        pattern: '<<<version>>>',
                        replacement: package.version
                    }]
                }
            }
}
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-rev-package');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browser-sync');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.registerTask('default', ['browserSync', 'sass', 'watch']);
    grunt.registerTask('build', ['clean','ngAnnotate', 'concat', 'babel', 'uglify', 'cssmin', 'copy','revPackage','string-replace']);
};
