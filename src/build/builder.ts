import fs from 'fs';
import path from 'path';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import { attrs } from '@mdit/plugin-attrs';
import { container } from '@mdit/plugin-container';
import texmath from 'markdown-it-texmath';
import katex from 'katex';
import matter from 'gray-matter';
import { createHighlighter, Highlighter } from 'shiki';
import bspans from 'markdown-it-bracketed-spans';
import { full as emoji } from 'markdown-it-emoji'

// 기본 경로
const ROOT_DIR = path.join(__dirname, '..', '..');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'public', 'template.html');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const OUTPUT_DIR = path.join(ROOT_DIR, 'dist');

// Shiki 하이라이터 (싱글톤)
let highlighter: Highlighter | null = null;
let currentTheme = 'github-dark'; // 현재 설정된 테마 추적

async function ensureHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: [
        'andromeeda', 'aurora-x', 'ayu-dark', 
        'catppuccin-frappe', 'catppuccin-latte', 'catppuccin-macchiato', 'catppuccin-mocha', 
        'dark-plus', 'dracula', 'dracula-soft', 'everforest-dark', 'everforest-light', 
        'github-dark', 'github-dark-default', 'github-dark-dimmed', 'github-dark-high-contrast', 
        'github-light', 'github-light-default', 'github-light-high-contrast', 
        'gruvbox-dark-hard', 'gruvbox-dark-medium', 'gruvbox-dark-soft', 'gruvbox-light-hard', 
        'gruvbox-light-medium', 'gruvbox-light-soft', 
        'houston', 'kanagawa-dragon', 'kanagawa-lotus', 'kanagawa-wave', 'laserwave', 'light-plus', 
        'material-theme', 'material-theme-darker', 'material-theme-lighter', 'material-theme-ocean', 
        'material-theme-palenight', 'min-dark', 'min-light', 'monokai', 'night-owl', 'nord', 
        'one-dark-pro', 'one-light', 'plastic', 'poimandres', 'red', 
        'rose-pine', 'rose-pine-dawn', 'rose-pine-moon', 'slack-dark', 'slack-ochin', 
        'snazzy-light', 'solarized-dark', 'solarized-light', 'synthwave-84', 'tokyo-night', 
        'vesper', 'vitesse-black', 'vitesse-dark', 'vitesse-light'
      ],
      langs: [
        'abap', 'actionscript-3', 'ada', 'angular-html', 'angular-ts', 'apache', 'apex', 'apl', 'applescript', 'ara', 'asciidoc', 'asm', 'astro', 'awk', 'ballerina', 'bat', 'beancount', 'berry', 'bibtex', 'bicep', 'blade', 'bsl', 'c', 'c3', 'cadence', 'cairo', 'clarity', 'clojure', 'cmake', 'cobol', 'codeowners', 'codeql', 'coffee', 'common-lisp', 'coq', 'cpp', 'crystal', 'csharp', 'css', 'csv', 'cue', 'cypher', 'd', 'dart', 'dax', 'desktop', 'diff', 'docker', 'dotenv', 'dream-maker', 'edge', 'elixir', 'elm', 'emacs-lisp', 'erb', 'erlang', 'fennel', 'fish', 'fluent', 'fortran-fixed-form', 'fortran-free-form', 'fsharp', 'gdresource', 'gdscript', 'gdshader', 'genie', 'gherkin', 'git-commit', 'git-rebase', 'gleam', 'glimmer-js', 'glimmer-ts', 'glsl', 'gn', 'gnuplot', 'go', 'graphql', 'groovy', 'hack', 'haml', 'handlebars', 'haskell', 'haxe', 'hcl', 'hjson', 'hlsl', 'html', 'html-derivative', 'http', 'hurl', 'hxml', 'hy', 'imba', 'ini', 'java', 'javascript', 'jinja', 'jison', 'json', 'json5', 'jsonc', 'jsonl', 'jsonnet', 'jssm', 'jsx', 'julia', 'kdl', 'kotlin', 'kusto', 'latex', 'lean', 'less', 'liquid', 'llvm', 'log', 'logo', 'lua', 'luau', 'make', 'markdown', 'marko', 'matlab', 'mdc', 'mdx', 'mermaid', 'mipsasm', 'mojo', 'moonbit', 'move', 'narrat', 'nextflow', 'nginx', 'nim', 'nix', 'nushell', 'objective-c', 'objective-cpp', 'ocaml', 'openscad', 'pascal', 'perl', 'php', 'pkl', 'plsql', 'po', 'polar', 'postcss', 'powerquery', 'powershell', 'prisma', 'prolog', 'proto', 'pug', 'puppet', 'purescript', 'python', 'qml', 'qmldir', 'qss', 'r', 'racket', 'raku', 'razor', 'reg', 'regexp', 'rel', 'riscv', 'rosmsg', 'rst', 'ruby', 'rust', 'sas', 'sass', 'scala', 'scheme', 'scss', 'sdbl', 'shaderlab', 'shellscript', 'shellsession', 'smalltalk', 'solidity', 'soy', 'sparql', 'splunk', 'sql', 'ssh-config', 'stata', 'stylus', 'svelte', 'swift', 'system-verilog', 'systemd', 'talonscript', 'tasl', 'tcl', 'templ', 'terraform', 'tex', 'toml', 'ts-tags', 'tsv', 'tsx', 'turtle', 'twig', 'typescript', 'typespec', 'typst', 'v', 'vala', 'vb', 'verilog', 'vhdl', 'viml', 'vue', 'vue-html', 'vue-vine', 'vyper', 'wasm', 'wenyan', 'wgsl', 'wikitext', 'wit', 'wolfram', 'xml', 'xsl', 'yaml', 'zenscript', 'zig'
      ]
    });
  }
  return highlighter;
}

// Markdown-it 인스턴스 설정
// Shiki 하이라이터를 markdown-it의 highlight 옵션으로 직접 통합 (Regex 후처리 제거)
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: (code, lang) => {
    if (!highlighter) return ''; // 아직 로드 안됨 -> 기본 escape 처리됨

    try {
      const loadedLangs = highlighter.getLoadedLanguages();
      const langToUse = loadedLangs.includes(lang) ? lang : 'plaintext';
      let highlighted = highlighter.codeToHtml(code, { lang: langToUse, theme: currentTheme });

      // light 테마의 흰 배경을 연한 회색으로 변경 (CSS 보정)
      if (currentTheme.includes('light') || currentTheme.includes('latte') || currentTheme === 'slack-ochin' || currentTheme === 'nord') {
        highlighted = highlighted
          .replace(/background-color:#fff([;"])/gi, 'background-color:#f6f8fa$1')
          .replace(/background-color:#ffffff([;"])/gi, 'background-color:#f6f8fa$1')
          .replace(/background-color:#fafafa([;"])/gi, 'background-color:#f0f0f0$1');
      }
      return highlighted;
    } catch (e) {
      console.warn('Highlight checking error:', e);
      return ''; // markdown-it이 기본 escape 수행
    }
  }
}).use(
  anchor, {
    permalink: false,
    slugify: (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'))
  }
).use(
  container, {
    name: 'div',
  }
).use(
  container, {
    name: 'nothing',
    openRender: () => '',
    closeRender: () => ''
  }
).use(
  texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: { throwOnError: false }
  }
).use(
  bspans
).use(
  emoji
).use(
  attrs
);

// Mermaid 펜스 룰 오버라이드
const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules);
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (token.info.trim() === 'mermaid') {
    // client-side 렌더링을 위해 div.mermaid로 감싸서 출력
    const code = token.content.trim();
    return `<div class="mermaid">${md.utils.escapeHtml(code)}</div>`;
  }
  // 일반 코드는 markdown-it의 highlight 옵션을 통해 처리됨
  return defaultFence(tokens, idx, options, env, self);
};

export interface BuildResult {
  html: string;
  meta: Record<string, unknown>;
}

export interface BuildOptions {
  title?: string;
  theme?: string;
}

// 템플릿 로드
function loadTemplate(): string {
  return fs.readFileSync(TEMPLATE_PATH, 'utf-8');
}

// 메타데이터로 head 태그 생성
function buildHeadTags(meta: Record<string, unknown>): string {
  const tags: string[] = [];
  if (meta.description) tags.push(`<meta name="description" content="${meta.description}">`);
  if (meta.author) tags.push(`<meta name="author" content="${meta.author}">`);
  if (meta.keywords) {
    const kw = Array.isArray(meta.keywords) ? meta.keywords.join(', ') : meta.keywords;
    tags.push(`<meta name="keywords" content="${kw}">`);
  }
  return tags.join('\n  ');
}

// 추가 head 요소 생성 (css, font, script, katex 등)
function buildExtraHead(meta: Record<string, unknown>): string {
  const extras: string[] = [];

  if (meta.tailwind === true) {
    extras.push(`<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>`);
  }

  if (meta.css) {
    const cssUrls = Array.isArray(meta.css) ? meta.css : [meta.css];
    for (const url of cssUrls) {
      extras.push(`<link rel="stylesheet" href="${url}">`);
    }
  }

  // Mermaid.js CDN 및 초기화 스크립트 추가
  extras.push(`
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ 
        startOnLoad: false, 
        theme: '${currentTheme.includes('light') || currentTheme.includes('latte') ? 'default' : 'dark'}',
        securityLevel: 'loose'
      });
      await mermaid.run();
    </script>
  `);

  if (meta.font) {
    extras.push(`<style>body { font-family: '${meta.font}', sans-serif; }</style>`);
  }

  return extras.join('\n  ');
}

async function renderContent(markdown: string, options: BuildOptions = {}): Promise<{ html: string; meta: Record<string, unknown> }> {
  // 1. Shiki 하이라이터 준비 (싱글톤)
  await ensureHighlighter();
  
  const { data: meta, content } = matter(markdown);
  
  // 2. 테마 설정 (md.highlight 콜백에서 사용됨)
  currentTheme = options.theme || (meta.theme as string) || 'github-dark';
  
  // 3. 렌더링 환경 객체
  const env: { mermaidBlocks?: Array<{ idx: number; code: string; placeholder: string }> } = {};

  // 4. 마크다운 -> HTML 변환 (하이라이팅은 highlight 옵션에 의해 내부 수행됨)
  const html = md.render(content, env);

  return { html, meta };
}

/**
 * 마크다운 문자열을 완성된 HTML로 빌드 (템플릿 포함)
 */
export async function build(markdown: string, options: BuildOptions = {}): Promise<BuildResult> {
  const { html: contentHtml, meta } = await renderContent(markdown, options);
  const template = loadTemplate();
  const title = (meta.title as string) || options.title || 'Untitled';

  const html = template
    .replace('{{lang}}', (meta.lang as string) || 'ko')
    .replace('{{title}}', title)
    .replace('{{meta}}', buildHeadTags(meta))
    .replace('{{head}}', buildExtraHead(meta))
    .replace('{{content}}', contentHtml)
    .replace('{{bodyScripts}}', '');

  return { html, meta };
}

/**
 * 마크다운 문자열을 HTML 본문만 렌더링
 */
export async function render(markdown: string, themeOverride?: string): Promise<string> {
  const { html } = await renderContent(markdown, { theme: themeOverride });
  return html;
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
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}

/**
 * img 폴더를 dist로 복사
 */
export function copyImgFolder(): { copied: number; skipped: boolean } {
  const srcImg = path.join(CONTENT_DIR, 'img');
  const destImg = path.join(OUTPUT_DIR, 'img');

  if (!fs.existsSync(srcImg)) return { copied: 0, skipped: true };
  if (!fs.existsSync(destImg)) fs.mkdirSync(destImg, { recursive: true });

  let copied = 0;
  function copyDir(src: string, dest: string) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
        copied++;
      }
    }
  }

  copyDir(srcImg, destImg);
  return { copied, skipped: false };
}

/**
 * content 폴더 전체 빌드
 */
export async function buildAll(): Promise<Array<{ input: string; output: string }>> {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  
  // 병렬 빌드 처리
  const buildPromises = files.map(async (file) => {
    const inputPath = path.join(CONTENT_DIR, file);
    const outputPath = await buildAndSave(inputPath);
    return { input: file, output: outputPath };
  });

  const outputs = await Promise.all(buildPromises);

  const imgResult = copyImgFolder();
  if (!imgResult.skipped) {
    console.log(`🖼️  이미지 ${imgResult.copied}개 복사됨`);
  }

  return outputs;
}

export function getInstance(): MarkdownIt {
  return md;
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  console.log('📦 빌드 시작...\n');

  try {
    if (args.length > 0) {
      for (const file of args) {
        const inputPath = path.isAbsolute(file) ? file : path.join(CONTENT_DIR, file);
        const outputPath = await buildAndSave(inputPath);
        console.log(`✅ ${path.basename(file)} → ${path.basename(outputPath)}`);
      }
      copyImgFolder();
    } else {
      const results = await buildAll();
      for (const { input, output } of results) {
        console.log(`✅ ${input} → ${path.basename(output)}`);
      }
    }
    console.log(`\n📁 출력: ${OUTPUT_DIR}`);
  } catch (err) {
    console.error(`❌ 오류 발생: ${(err as Error).message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}