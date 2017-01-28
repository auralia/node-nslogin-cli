/**
 * Copyright (C) 2016-2017 Auralia
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

var del = require("del");
var gulp = require("gulp");
var merge2 = require("merge2");
var sourcemaps = require("gulp-sourcemaps");
var typescript = require("gulp-typescript");

gulp.task("default", ["prod"]);

gulp.task("clean", function() {
    return del("lib");
});

var project = typescript.createProject("tsconfig.json");
gulp.task("prod", ["clean"], function() {
    return project.src()
                  .pipe(project(typescript.reporter.defaultReporter()))
                  .on("error", function() {
                      this.on("finish", function() {
                          process.exit(1);
                      });
                  })
                  .js
                  .pipe(gulp.dest("lib"));
});
gulp.task("dev", ["clean"], function() {
    return project.src()
                  .pipe(sourcemaps.init())
                  .pipe(project(typescript.reporter.defaultReporter()))
                  .on("error", function() {
                      this.on("finish", function() {
                          process.exit(1);
                      });
                  })
                  .js
                  .pipe(sourcemaps.write())
                  .pipe(gulp.dest("lib"));
});
