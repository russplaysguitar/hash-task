#!/bin/bash

cp -R dist ../tmp
git checkout gh-pages
mv ../tmp/* .
git add .
git commit -am "Update gh-pages"
git checkout master