var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var fs = require('fs');
var pkg = require('./package.json');

gulp.task('htmlinclude', function() {
    gulp.src(['html/*.html'])
        .pipe(plugins.fileInclude())
        .pipe(gulp.dest('dist'));
});

gulp.task('spritesmith', function() {
    return gulp.src(['img/sp/**/*'])
        .pipe(plugins.spritesmith({
            imgName: 'img/sp_' + pkg.name + '_2x.png',
            cssName: 'scss/core/_sprites.scss',
            imgPath: '../img/sp_' + pkg.name + '_2x.png',
            padding: 4,
            cssSpritesheetName: 'sp-' + pkg.name,
            cssTemplate: function(params) {
                var Mustache = require('mustache');
                var template = fs.readFileSync('sprites.mustache', 'utf8');

                return Mustache.render(template, params);
            },
            cssOpts: {
                // 비 레티나용 이미지 경로를 반환하는 함수
                path: function() {
                    return function(text, render) {
                        return render(text).replace('_2x', '');
                    };
                },
                // zerounit 검증을 통과하기 위해 0px를
                // 0으로 변환하는 함수
                zerounit: function() {
                    return function(text, render) {
                        var value = render(text);
                        return value === '0px' ? '0' : value;
                    };
                },
                // 레티나 대응을 위해서
                // width, height, offset을 pixel ratio로 나눔
                retina: function() {
                    return function(text, render) {
                        var pixelRatio = 2;
                        return parseInt(render(text), 10) / pixelRatio + 'px';
                    };
                }
            }
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('imageresize', function() {
    return gulp.src(['img/sp_' + pkg.name + '_2x.png'])
        .pipe(plugins.imageResize({
            width: '50%',
            height: '50%'
        }))
        .pipe(plugins.rename('sp_' + pkg.name + '.png'))
        .pipe(gulp.dest('img'));
});

gulp.task('sasslint', function() {
    return gulp.src(['scss/**/*.scss', '!scss/core/_normalize.scss'])
        .pipe(plugins.scssLint({config: '.scss-lint.yml'}));
});

gulp.task('sass', function() {
    return gulp.src(['scss/**/*.scss']).pipe(plugins.sourcemaps.init())
        .pipe(plugins.sass().on('error', plugins.sass.logError))
        .pipe(plugins.autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(plugins.rename(pkg.name + '-' + pkg.version + '.css'))
        .pipe(plugins.sourcemaps.write('./'))
        .pipe(gulp.dest('css'))
        .pipe(plugins.minifyCss())
        .pipe(plugins.rename(pkg.name + '-' + pkg.version + '.min.css'))
        .pipe(gulp.dest('css'));
});

gulp.task('default', ['spritesmith', 'imageresize', 'sasslint', 'sass', 'htmlinclude'], function() {
    gulp.watch('scss/**/*.scss', ['sass']);
    gulp.watch('html/**/*.html', ['htmlinclude']);
});
