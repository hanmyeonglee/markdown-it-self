const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');

// Markdown-it 인스턴스
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

// 기본 경로
const TEMPLATE_PATH = path.join(__dirname, 'template.html');
const CONTENT_DIR = path.join(__dirname, 'content');
const OUTPUT_DIR = path.join(__dirname, 'dist');

// 템플릿 로드
function loadTemplate() {
  return fs.readFileSync(TEMPLATE_PATH, 'utf-8');
}

// 메타데이터로 head 태그 생성
function buildHeadTags(meta) {
  const tags = [];
  
  if (meta.description) {
    tags.push(`<meta name="description" content="${meta.description}">`);
  }
  if (meta.author) {
    tags.push(`<meta name="author" content="${meta.author}">`);
  }
  if (meta.keywords) {
    const kw = Array.isArray(meta.keywords) ? meta.keywords.join(', ') : meta.keywords;
    tags.push(`<meta name="keywords" content="${kw}">`);
  }
  
  return tags.join('\n  ');
}

// 추가 head 요소 생성 (font, css 등)
function buildExtraHead(meta) {
  const extras = [];
  
  if (meta.css) {
    extras.push(`<link rel="stylesheet" href="${meta.css}">`);
  }
  if (meta.font) {
    extras.push(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(meta.font)}&display=swap">`);
    extras.push(`<style>body { font-family: '${meta.font}', sans-serif; }</style>`);
  }
  
  return extras.join('\n  ');
}

/**
 * 마크다운 문자열을 완성된 HTML로 빌드
 * @param {string} markdown - 마크다운 문자열
 * @param {object} options - 옵션 (title 등 기본값)
 * @returns {{ html: string, meta: object }}
 */
function build(markdown, options = {}) {
  const { data: meta, content } = matter(markdown);
  const rendered = md.render(content);
  
  const template = loadTemplate();
  const title = meta.title || options.title || 'Untitled';
  
  const html = template
    .replace('{{lang}}', meta.lang || 'ko')
    .replace('{{title}}', title)
    .replace('{{meta}}', buildHeadTags(meta))
    .replace('{{head}}', buildExtraHead(meta))
    .replace('{{content}}', rendered);
  
  return { html, meta };
}

/**
 * 마크다운 문자열을 HTML 본문만 렌더링 (템플릿 없이)
 * @param {string} markdown - 마크다운 문자열
 * @returns {string}
 */
function render(markdown) {
  const { content } = matter(markdown);
  return md.render(content);
}

/**
 * 파일에서 읽어서 빌드
 * @param {string} filePath - 마크다운 파일 경로
 * @returns {{ html: string, meta: object }}
 */
function buildFile(filePath) {
  const markdown = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath, '.md');
  return build(markdown, { title: filename });
}

/**
 * 파일 빌드 후 저장
 * @param {string} inputPath - 입력 파일 경로
 * @param {string} outputPath - 출력 파일 경로 (생략시 자동 생성)
 * @returns {string} - 저장된 파일 경로
 */
function buildAndSave(inputPath, outputPath) {
  const { html } = buildFile(inputPath);
  
  if (!outputPath) {
    const filename = path.basename(inputPath, '.md') + '.html';
    outputPath = path.join(OUTPUT_DIR, filename);
  }
  
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}

/**
 * content 폴더 전체 빌드
 * @returns {string[]} - 저장된 파일 경로 목록
 */
function buildAll() {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const outputs = [];
  
  for (const file of files) {
    const inputPath = path.join(CONTENT_DIR, file);
    const outputPath = buildAndSave(inputPath);
    outputs.push({ input: file, output: outputPath });
  }
  
  return outputs;
}

/**
 * markdown-it 인스턴스 반환 (플러그인 추가용)
 */
function getInstance() {
  return md;
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  
  console.log('📦 빌드 시작...\n');
  
  if (args.length > 0) {
    for (const file of args) {
      try {
        const inputPath = path.isAbsolute(file) ? file : path.join(CONTENT_DIR, file);
        const outputPath = buildAndSave(inputPath);
        console.log(`✅ ${path.basename(file)} → ${path.basename(outputPath)}`);
      } catch (err) {
        console.error(`❌ ${file}: ${err.message}`);
      }
    }
  } else {
    const results = buildAll();
    for (const { input, output } of results) {
      console.log(`✅ ${input} → ${path.basename(output)}`);
    }
  }
  
  console.log(`\n📁 출력: ${OUTPUT_DIR}`);
}

module.exports = {
  build,
  render,
  buildFile,
  buildAndSave,
  buildAll,
  getInstance
};