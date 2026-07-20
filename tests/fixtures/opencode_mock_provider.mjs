#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const host = process.env.HAKIM_SMOKE_PROVIDER_HOST || '127.0.0.1';
const port = Number(process.env.HAKIM_SMOKE_PROVIDER_PORT || '17843');
const capturePath = process.env.HAKIM_SMOKE_CAPTURE_PATH;

if (!capturePath) {
  console.error('HAKIM_SMOKE_CAPTURE_PATH is required');
  process.exit(2);
}

fs.mkdirSync(path.dirname(capturePath), { recursive: true });
const requests = [];

function persist() {
  fs.writeFileSync(capturePath, `${JSON.stringify({ requests }, null, 2)}\n`);
}

function responseText(body) {
  const serialized = JSON.stringify(body);
  const hasHakim = /Hakim activation|SMALLEST_SAFE_DIFF|smallest safe diff|evidence-bound/i.test(serialized);
  const hasCommand = /hakim-help|hakim full|Review sample\.js/i.test(serialized);
  return [
    'HAKIM_LIVE_SMOKE_OK',
    `HAKIM_SYSTEM_INSTRUCTIONS_OBSERVED=${hasHakim}`,
    `HAKIM_COMMAND_CONTEXT_OBSERVED=${hasCommand}`,
    'BOUNDED_RESULT=sample.js keeps the direct exported function; no speculative dependency or architecture change is warranted.',
  ].join('\n');
}

function sendJson(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(`${JSON.stringify(value)}\n`);
}

function sendChat(res, body) {
  const content = responseText(body);
  if (body?.stream) {
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    });
    const created = Math.floor(Date.now() / 1000);
    const chunks = [
      {
        id: 'chatcmpl-hakim-smoke',
        object: 'chat.completion.chunk',
        created,
        model: body.model || 'hakim-smoke',
        choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
      },
      {
        id: 'chatcmpl-hakim-smoke',
        object: 'chat.completion.chunk',
        created,
        model: body.model || 'hakim-smoke',
        choices: [{ index: 0, delta: { content }, finish_reason: null }],
      },
      {
        id: 'chatcmpl-hakim-smoke',
        object: 'chat.completion.chunk',
        created,
        model: body.model || 'hakim-smoke',
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      },
    ];
    for (const chunk of chunks) res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    res.end('data: [DONE]\n\n');
    return;
  }
  sendJson(res, 200, {
    id: 'chatcmpl-hakim-smoke',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: body?.model || 'hakim-smoke',
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/health' || req.url === '/v1/health')) {
    sendJson(res, 200, { status: 'ok' });
    return;
  }
  if (req.method === 'GET' && req.url === '/v1/models') {
    sendJson(res, 200, {
      object: 'list',
      data: [{ id: 'hakim-smoke', object: 'model', created: 0, owned_by: 'hakim' }],
    });
    return;
  }
  if (req.method !== 'POST' || req.url !== '/v1/chat/completions') {
    sendJson(res, 404, { error: { message: `unsupported route: ${req.method} ${req.url}` } });
    return;
  }

  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch (error) {
      sendJson(res, 400, { error: { message: `invalid JSON: ${error.message}` } });
      return;
    }
    requests.push({
      method: req.method,
      url: req.url,
      headers: req.headers,
      body,
    });
    persist();
    sendChat(res, body);
  });
});

server.listen(port, host, () => {
  console.log(`HAKIM_SMOKE_PROVIDER_READY=http://${host}:${port}/v1`);
});

function shutdown() {
  persist();
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
