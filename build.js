const fs = require('fs');
const path = require('path');
const renderer = require('./renderer');

const CONTENT_DIR = path.join(__dirname, 'content');
const OUTPUT_DIR = path.join(__dirname, 'dist');

// HTML 템플릿
function htmlTemplate(content, meta = {}) {
  const title = meta.title || 'Markdown';
  const description = meta.description ? `\n  <meta name="description" content="${meta.description}">` : '';
  const author = meta.author ? `\n  <meta name="author" content="${meta.author}">` : '';
  const keywords = meta.keywords ? `\n  <meta name="keywords" content="${meta.keywords.join(', ')}">` : '';
  const customCss = meta.css ? `\n  <link rel="stylesheet" href="${meta.css}">` : '';
  const customFont = meta.font ? `\n  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(meta.font)}&display=swap">\n  <style>body { font-family: '${meta.font}', sans-serif; }</style>` : '';
  
  return `<!DOCTYPE html>
<html lang="${meta.lang || 'ko'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">${description}${author}${keywords}
  <title>${title}</title>${customCss}${customFont}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fff;
      color: #333;
      line-height: 1.7;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5rem; margin-bottom: 0.75rem; font-weight: 600; }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    p { margin-bottom: 1rem; }
    a { color: #0066cc; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; font-family: Consolas, monospace; font-size: 0.9em; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; margin: 1rem 0; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 3px solid #ccc; padding-left: 1rem; margin: 1rem 0; color: #666; }
    ul, ol { margin: 1rem 0; padding-left: 2rem; }
    li { margin-bottom: 0.25rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background: #f4f4f4; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2rem 0; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
}

/**
 * 단일 마크다운 파일 빌드
 * @param {string} filename - 마크다운 파일명
 * @returns {string} - 출력 파일 경로
 */
function buildFile(filename) {
  const inputPath = path.join(CONTENT_DIR, filename);
  
  if (!fs.existsSync(inputPath)) {
    throw new Error(`파일을 찾을 수 없습니다: ${filename}`);
  }
  
  const markdown = fs.readFileSync(inputPath, 'utf-8');
  const { html, meta } = renderer.parse(markdown);
  
  // title이 없으면 파일명 사용
  if (!meta.title) {
    meta.title = path.basename(filename, '.md');
  }
  
  const fullHtml = htmlTemplate(html, meta);
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const outputFilename = filename.replace('.md', '.html');
  const outputPath = path.join(OUTPUT_DIR, outputFilename);
  
  fs.writeFileSync(outputPath, fullHtml, 'utf-8');
  
  return outputPath;
}

/**
 * content 폴더의 모든 마크다운 파일 빌드
 * @returns {string[]} - 출력 파일 경로 목록
 */
function buildAll() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('content 폴더가 없습니다.');
    return [];
  }
  
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const outputs = [];
  
  for (const file of files) {
    try {
      const outputPath = buildFile(file);
      outputs.push(outputPath);
      console.log(`✅ ${file} → ${path.basename(outputPath)}`);
    } catch (err) {
      console.error(`❌ ${file}: ${err.message}`);
    }
  }
  
  return outputs;
}

// CLI로 실행시
if (require.main === module) {
  const args = process.argv.slice(2);
  
  console.log('📦 마크다운 빌드 시작...\n');
  
  if (args.length > 0) {
    // 특정 파일만 빌드
    for (const file of args) {
      try {
        const outputPath = buildFile(file);
        console.log(`✅ ${file} → ${outputPath}`);
      } catch (err) {
        console.error(`❌ ${file}: ${err.message}`);
      }
    }
  } else {
    // 전체 빌드
    buildAll();
  }
  
  console.log(`\n📁 출력 폴더: ${OUTPUT_DIR}`);
}

module.exports = {
  buildFile,
  buildAll,
  htmlTemplate
};
