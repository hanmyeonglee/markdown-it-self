import fs from 'fs';
import path from 'path';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import texmath from 'markdown-it-texmath';
import katex from 'katex';
import matter from 'gray-matter';
import { createHighlighter, Highlighter } from 'shiki';

// Shiki 하이라이터 (싱글톤)
let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: [
        'github-dark', 'github-light',
        'dracula', 'dracula-soft',
        'nord',
        'one-dark-pro',
        'monokai',
        'vitesse-dark', 'vitesse-light',
        'catppuccin-mocha', 'catppuccin-latte',
        'tokyo-night',
        'slack-dark', 'slack-ochin',
        'min-dark', 'min-light'
      ],
      langs: [
        'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
        'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
        'html', 'css', 'scss', 'json', 'yaml', 'xml', 'markdown',
        'sql', 'graphql', 'bash', 'powershell', 'dockerfile',
        'plaintext'
      ]
    });
  }
  return highlighter;
}

// Markdown-it 인스턴스
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

// 헤더 앵커 플러그인 (id만 추가, 링크 없음)
md.use(anchor, {
  permalink: false,
  slugify: (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'))
});

// KaTeX 수식 플러그인
md.use(texmath, {
  engine: katex,
  delimiters: 'dollars',  // $...$ 인라인, $$...$$ 블록
  katexOptions: { throwOnError: false }
});

// Mermaid 코드 블록 처리 (클라이언트 사이드 렌더링)
const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules);
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (token.info.trim() === 'mermaid') {
    // mermaid 블록은 <pre class="mermaid">로 변환하여 클라이언트에서 렌더링
    const code = token.content.trim();
    return `<pre class="mermaid">${md.utils.escapeHtml(code)}</pre>\n`;
  }
  return defaultFence(tokens, idx, options, env, self);
};

// 기본 경로
const ROOT_DIR = path.join(__dirname, '..', '..');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'public', 'template.html');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const OUTPUT_DIR = path.join(ROOT_DIR, 'dist');

export interface BuildResult {
  html: string;
  meta: Record<string, unknown>;
}

export interface BuildOptions {
  title?: string;
  theme?: 'github-dark' | 'github-light';
}

// 템플릿 로드
function loadTemplate(): string {
  return fs.readFileSync(TEMPLATE_PATH, 'utf-8');
}

// 메타데이터로 head 태그 생성
function buildHeadTags(meta: Record<string, unknown>): string {
  const tags: string[] = [];

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

// 추가 head 요소 생성 (css, font, script, katex 등)
function buildExtraHead(meta: Record<string, unknown>): string {
  const extras: string[] = [];

  // katex: true일 때 KaTeX CSS 추가 (기본값 false)
  if (meta.katex === true) {
    extras.push(`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css">`);
  }

  // css: 문자열 또는 배열로 여러 CSS URL 지원
  if (meta.css) {
    const cssUrls = Array.isArray(meta.css) ? meta.css : [meta.css];
    for (const url of cssUrls) {
      extras.push(`<link rel="stylesheet" href="${url}">`);
    }
  }

  // font: 기본 폰트 패밀리 설정 (URL 요청 없이 로컬/시스템 폰트)
  if (meta.font) {
    extras.push(`<style>body { font-family: '${meta.font}', sans-serif; }</style>`);
  }

  // script: 외부 스크립트 URL 지원 (문자열 또는 배열)
  if (meta.script) {
    const scriptUrls = Array.isArray(meta.script) ? meta.script : [meta.script];
    for (const url of scriptUrls) {
      extras.push(`<script src="${url}"></script>`);
    }
  }

  return extras.join('\n  ');
}

// body 끝에 들어갈 스크립트 생성 (mermaid 초기화 등)
function buildBodyScripts(meta: Record<string, unknown>): string {
  const scripts: string[] = [];

  // mermaid: true일 때 mermaid.js 추가 (기본값 false)
  if (meta.mermaid === true) {
    scripts.push(`<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>`);
    scripts.push(`<script>mermaid.initialize({ startOnLoad: true, theme: 'default' });</script>`);
  }

  return scripts.join('\n');
}

/**
 * 코드 블록에 Shiki 하이라이팅 적용
 */
async function highlightCodeBlocks(html: string, theme: string): Promise<string> {
  const hl = await getHighlighter();
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
  
  const matches = [...html.matchAll(codeBlockRegex)];
  let result = html;
  
  for (const match of matches) {
    const [fullMatch, lang, code] = match;
    const decodedCode = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    try {
      const loadedLangs = hl.getLoadedLanguages();
      const langToUse = loadedLangs.includes(lang) ? lang : 'plaintext';
      let highlighted = hl.codeToHtml(decodedCode.trim(), { lang: langToUse, theme });
      
      // light 테마의 흰 배경을 연한 회색으로 변경
      if (theme.includes('light') || theme.includes('latte') || theme === 'slack-ochin' || theme === 'nord') {
        highlighted = highlighted
          .replace(/background-color:#fff([;"])/gi, 'background-color:#f6f8fa$1')
          .replace(/background-color:#ffffff([;"])/gi, 'background-color:#f6f8fa$1')
          .replace(/background-color:#fafafa([;"])/gi, 'background-color:#f0f0f0$1');
      }
      
      result = result.replace(fullMatch, highlighted);
    } catch {
      // 하이라이팅 실패시 원본 유지
    }
  }
  
  return result;
}

/**
 * 마크다운 문자열을 완성된 HTML로 빌드
 */
export async function build(markdown: string, options: BuildOptions = {}): Promise<BuildResult> {
  const { data: meta, content } = matter(markdown);
  const rendered = md.render(content);
  const theme = options.theme || (meta.theme as string) || 'github-dark';
  const highlighted = await highlightCodeBlocks(rendered, theme);

  const template = loadTemplate();
  const title = (meta.title as string) || options.title || 'Untitled';

  const html = template
    .replace('{{lang}}', (meta.lang as string) || 'ko')
    .replace('{{title}}', title)
    .replace('{{meta}}', buildHeadTags(meta))
    .replace('{{head}}', buildExtraHead(meta))
    .replace('{{content}}', highlighted)
    .replace('{{bodyScripts}}', buildBodyScripts(meta));

  return { html, meta };
}

/**
 * 마크다운 문자열을 HTML 본문만 렌더링 (템플릿 없이)
 */
export async function render(markdown: string, themeOverride?: string): Promise<string> {
  const { data: meta, content } = matter(markdown);
  const theme = themeOverride || (meta.theme as string) || 'github-dark';
  const rendered = md.render(content);
  return highlightCodeBlocks(rendered, theme);
}

/**
 * 파일에서 읽어서 빌드
 */
export async function buildFile(filePath: string): Promise<BuildResult> {
  const markdown = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath, '.md');
  return build(markdown, { title: filename });
}

/**
 * 파일 빌드 후 저장
 */
export async function buildAndSave(inputPath: string, outputPath?: string): Promise<string> {
  const { html } = await buildFile(inputPath);

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
 */
export async function buildAll(): Promise<Array<{ input: string; output: string }>> {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const outputs: Array<{ input: string; output: string }> = [];

  for (const file of files) {
    const inputPath = path.join(CONTENT_DIR, file);
    const outputPath = await buildAndSave(inputPath);
    outputs.push({ input: file, output: outputPath });
  }

  return outputs;
}

/**
 * markdown-it 인스턴스 반환 (플러그인 추가용)
 */
export function getInstance(): MarkdownIt {
  return md;
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);

  console.log('📦 빌드 시작...\n');

  if (args.length > 0) {
    for (const file of args) {
      try {
        const inputPath = path.isAbsolute(file) ? file : path.join(CONTENT_DIR, file);
        const outputPath = await buildAndSave(inputPath);
        console.log(`✅ ${path.basename(file)} → ${path.basename(outputPath)}`);
      } catch (err) {
        console.error(`❌ ${file}: ${(err as Error).message}`);
      }
    }
  } else {
    const results = await buildAll();
    for (const { input, output } of results) {
      console.log(`✅ ${input} → ${path.basename(output)}`);
    }
  }

  console.log(`\n📁 출력: ${OUTPUT_DIR}`);
}

if (require.main === module) {
  main();
}
