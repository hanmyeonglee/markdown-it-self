const MarkdownIt = require('markdown-it');

// Markdown-it 인스턴스 생성
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

/**
 * 마크다운 문자열을 HTML로 렌더링
 * @param {string} markdown - 마크다운 문자열
 * @returns {string} - 렌더링된 HTML
 */
function render(markdown) {
  return md.render(markdown);
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
  getInstance
};
