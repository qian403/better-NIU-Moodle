#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 建置配置
const configs = {
  chrome: {
    manifest: 'manifest.json',
    output: 'dist/chrome'
  },
  firefox: {
    manifest: 'manifest-firefox.json',
    output: 'dist/firefox'
  }
};

// 需要複製的檔案
const filesToCopy = [
  'content.js',
  'background.js',
  'popup.html',
  'popup.js',
  'icons'
];

// 建立輸出目錄
function createOutputDir(outputPath) {
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
}

// 複製檔案或目錄
function copyFileOrDir(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyFileOrDir(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 建置函數
function build(browser) {
  const config = configs[browser];
  if (!config) {
    console.error(`不支援的瀏覽器: ${browser}`);
    return;
  }

  console.log(`建置 ${browser} 版本...`);
  
  // 建立輸出目錄
  createOutputDir(config.output);
  
  // 複製 manifest 檔案
  const manifestSrc = config.manifest;
  const manifestDest = path.join(config.output, 'manifest.json');
  fs.copyFileSync(manifestSrc, manifestDest);
  
  // 複製其他檔案
  filesToCopy.forEach(file => {
    const src = file;
    const dest = path.join(config.output, file);
    
    if (fs.existsSync(src)) {
      copyFileOrDir(src, dest);
      console.log(`複製: ${src} -> ${dest}`);
    } else {
      console.warn(`檔案不存在: ${src}`);
    }
  });
  
  console.log(`${browser} 版本建置完成: ${config.output}`);
}

// 主函數
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // 建置所有版本
    Object.keys(configs).forEach(browser => build(browser));
  } else {
    // 建置指定版本
    args.forEach(browser => build(browser));
  }
}

// 執行建置
main();
