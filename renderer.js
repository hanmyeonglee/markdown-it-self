const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');

// Markdown-it 인스턴스 생성
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

/**
 * 마크다운 문자열을 HTML로 렌더링 (front matter 제외)
 * @param {string} markdown - 마크다운 문자열
 * @returns {string} - 렌더링된 HTML
 */
function render(markdown) {
  const { content } = matter(markdown);
  return md.render(content);
}

/**
 * 마크다운 문자열을 파싱하여 front matter와 HTML을 반환
 * @param {string} markdown - 마크다운 문자열
 * @returns {{ html: string, meta: object, content: string }}
 */
function parse(markdown) {
  const { data, content } = matter(markdown);
  const html = md.render(content);
  return {
    html,
    meta: data,
    content
  };
}

/**
 * front matter만 추출
 * @param {string} markdown - 마크다운 문자열
 * @returns {object} - front matter 데이터
 */
function getFrontMatter(markdown) {
  const { data } = matter(markdown);
  return data;
}

/**
 * markdown-it 인스턴스 반환 (플러그인 추가 등 커스터마이징용)
 * @returns {MarkdownIt}
 */
function getInstance() {
  return md;
}

module.exports = {
  render,
  parse,
  getFrontMatter,
  getInstance
};
