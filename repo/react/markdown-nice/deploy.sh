#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

rm -rf build

# 生成静态文件
yarn build

# 进入生成的文件夹
cd ./build

# 如果是发布到自定义域名
echo 'wechat.jeffjade.com' > CNAME

git init
git add -A
git commit -m 'deploy update 🎉'

git push -f git@github.com:nicejade/markdown-nice.git main:gh-pages
cd -
