const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const builder = require('../build/builder');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 정적 파일 제공
app.use(express.static('public'));

// 마크다운 파일 경로
const CONTENT_DIR = path.join(__dirname, 'content');
const DEFAULT_FILE = 'sample.md';

// 마크다운 파일 읽기 및 렌더링
function getRenderedContent(filename = DEFAULT_FILE) {
  const filePath = path.join(CONTENT_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return { html: '<p>파일을 찾을 수 없습니다.</p>', error: true };
  }
  
  const markdown = fs.readFileSync(filePath, 'utf-8');
  const html = builder.render(markdown);
  
  return { html, filename };
}

// API: 마크다운 렌더링
app.get('/api/render', (req, res) => {
  const filename = req.query.file || DEFAULT_FILE;
  const result = getRenderedContent(filename);
  res.json(result);
});

// API: 파일 목록
app.get('/api/files', (req, res) => {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }
  
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md'));
  res.json(files);
});

// WebSocket 연결 처리
wss.on('connection', (ws) => {
  console.log('🔌 클라이언트 연결됨');
  
  // 초기 렌더링 전송
  const result = getRenderedContent();
  ws.send(JSON.stringify({ type: 'render', data: result }));
  
  ws.on('close', () => {
    console.log('🔌 클라이언트 연결 해제');
  });
});

// 파일 변경 감지
const watcher = chokidar.watch(CONTENT_DIR, {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

watcher.on('change', (filePath) => {
  const filename = path.basename(filePath);
  console.log(`📝 파일 변경 감지: ${filename}`);
  
  const result = getRenderedContent(filename);
  
  // 모든 연결된 클라이언트에게 업데이트 전송
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'update', data: result }));
    }
  });
});

watcher.on('add', (filePath) => {
  const filename = path.basename(filePath);
  console.log(`➕ 새 파일 추가: ${filename}`);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'file-added', data: { filename } }));
    }
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
🚀 마크다운 렌더러 서버 시작!
📍 http://localhost:${PORT}
📁 마크다운 파일 위치: ${CONTENT_DIR}
🔥 핫로드 활성화됨 - 파일 수정시 자동 반영
  `);
});
