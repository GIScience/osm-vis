#!/bin/bash

npm run dist

cd www-dist
git init
git remote add deploy "git@github.com:GIScience/osm-vis.git"
git checkout -b "gh-pages"
rm src/components/leaflet/docs/ -r
git add .
git commit -m "deploy" -S

git push --set-upstream deploy gh-pages -f
