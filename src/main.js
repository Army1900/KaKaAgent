const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const nodeFs = require('fs');

let mainWindow;
const rootDir = path.join(__dirname, '..');

function getStatePath() {
  return path.join(app.getPath('userData'), 'state.json');
}

function readAppState() {
  try {
    const content = nodeFs.readFileSync(getStatePath(), 'utf8');
    const parsed = JSON.parse(content);
    return {
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      recentProjects: Array.isArray(parsed.recentProjects) ? parsed.recentProjects : [],
      workflows: Array.isArray(parsed.workflows) ? parsed.workflows : []
    };
  } catch {
    return { conversations: [], recentProjects: [], workflows: [] };
  }
}

function saveAppState(state) {
  const safeState = {
    conversations: Array.isArray(state.conversations) ? state.conversations.slice(0, 40) : [],
    recentProjects: Array.isArray(state.recentProjects) ? state.recentProjects.slice(0, 20) : [],
    workflows: Array.isArray(state.workflows) ? state.workflows.slice(0, 40) : []
  };
  nodeFs.mkdirSync(path.dirname(getStatePath()), { recursive: true });
  nodeFs.writeFileSync(getStatePath(), JSON.stringify(safeState, null, 2), 'utf8');
  return safeState;
}

async function listSkills() {
  const skillsDir = path.join(rootDir, 'skills');
  let entries;
  try {
    entries = await fs.readdir(skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const skills = [];
  for (const entry of entries.filter((item) => item.isDirectory())) {
    const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
    try {
      const content = await fs.readFile(skillPath, 'utf8');
      skills.push(parseSkill(entry.name, skillPath, content));
    } catch {
      // Ignore incomplete skill directories.
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

function parseSkill(id, skillPath, content) {
  const meta = {};
  const lines = content.split(/\r?\n/);
  const titleLine = lines.find((line) => line.startsWith('# '));
  for (const line of lines.slice(0, 40)) {
    const match = line.match(/^-\s*([a-zA-Z][\w-]*):\s*(.+)$/);
    if (match) meta[match[1]] = match[2].trim();
  }
  return {
    id,
    path: skillPath,
    name: meta.name || (titleLine ? titleLine.replace(/^#\s*/, '').trim() : id),
    summary: meta.summary || '',
    permission: meta.permission || 'read',
    triggers: meta.triggers ? meta.triggers.split(',').map((item) => item.trim()).filter(Boolean) : [],
    content
  };
}

function runCommand({ command, cwd }) {
  const safe = validateCommand(command, cwd);
  if (!safe.ok) return Promise.resolve({ ok: false, error: safe.error });

  const startedAt = Date.now();
  return new Promise((resolve) => {
    exec(command, {
      cwd: safe.cwd,
      timeout: 120000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
      env: { ...process.env }
    }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        command,
        cwd: safe.cwd,
        exitCode: typeof error?.code === 'number' ? error.code : 0,
        stdout: String(stdout || '').slice(-12000),
        stderr: String(stderr || '').slice(-12000),
        durationMs: Date.now() - startedAt
      });
    });
  });
}

function validateCommand(command, cwd) {
  const value = String(command || '').trim();
  if (!value) return { ok: false, error: '命令为空' };
  if (value.length > 240) return { ok: false, error: '命令过长' };
  if (/[;&|<>`]/.test(value)) return { ok: false, error: '第一版暂不支持链式命令、管道或重定向' };
  const lower = value.toLowerCase();
  const dangerous = ['rm ', 'del ', 'rmdir ', 'format ', 'shutdown', 'git reset', 'git clean', 'remove-item', 'set-executionpolicy'];
  if (dangerous.some((token) => lower.includes(token))) return { ok: false, error: '危险命令已拦截' };

  const allowedPrefixes = [
    'git status',
    'git diff',
    'git log',
    'npm test',
    'npm run',
    'node --check',
    'node -v',
    'npm -v',
    'python --version',
    'py --version'
  ];
  if (!allowedPrefixes.some((prefix) => lower === prefix || lower.startsWith(`${prefix} `))) {
    return { ok: false, error: '命令不在第一版白名单内' };
  }

  const resolvedCwd = path.resolve(cwd || rootDir);
  return { ok: true, cwd: resolvedCwd };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 720,
    minHeight: 660,
    title: 'KaKaAgent',
    icon: path.join(__dirname, '..', 'logo.png'),
    backgroundColor: '#eef1ef',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function loadLocalEnv() {
  const envPath = path.join(rootDir, '.env');
  try {
    const content = nodeFs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) return;
      const index = line.indexOf('=');
      if (index === -1) return;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      if (key && value) process.env[key] = value;
    });
  } catch {
    // Optional local configuration.
  }
}

function writeModelLog(status, detail) {
  const logDir = path.join(rootDir, 'logs');
  const logPath = path.join(logDir, 'model.log');
  const safeDetail = {
    ...detail,
    hasKey: Boolean(detail.hasKey),
    apiKey: undefined
  };
  try {
    nodeFs.mkdirSync(logDir, { recursive: true });
    nodeFs.appendFileSync(logPath, `${new Date().toISOString()} ${status} ${JSON.stringify(safeDetail)}\n`, 'utf8');
  } catch {
    // Logging must never break the app.
  }
}

async function scanDirectory(rootPath) {
  const entries = await readEntries(rootPath, 0, 2);
  const flat = flattenEntries(entries);
  const files = flat.filter((entry) => entry.type === 'file');
  const folders = flat.filter((entry) => entry.type === 'directory');
  const names = new Set(flat.map((entry) => entry.name.toLowerCase()));

  const profile = detectProfile(names, files);
  const entryHints = detectEntryHints(names, files);
  return {
    rootPath,
    name: path.basename(rootPath),
    entries,
    summary: {
      files: files.length,
      folders: folders.length,
      profile,
      entryHints,
      hasPackageJson: names.has('package.json'),
      hasReadme: names.has('readme.md'),
      hasGit: names.has('.git')
    }
  };
}

async function readEntries(dirPath, depth, maxDepth) {
  let dirents;
  try {
    dirents = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const visible = dirents
    .filter((entry) => !entry.name.startsWith('.') || entry.name === '.git')
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 80);

  const result = [];
  for (const entry of visible) {
    const fullPath = path.join(dirPath, entry.name);
    const item = {
      name: entry.name,
      path: fullPath,
      type: entry.isDirectory() ? 'directory' : 'file'
    };

    if (entry.isDirectory() && depth < maxDepth && entry.name !== '.git' && entry.name !== 'node_modules') {
      item.children = await readEntries(fullPath, depth + 1, maxDepth);
    }

    result.push(item);
  }

  return result;
}

function flattenEntries(entries) {
  const result = [];
  for (const entry of entries) {
    result.push(entry);
    if (entry.children) result.push(...flattenEntries(entry.children));
  }
  return result;
}

function detectProfile(names, files) {
  if (names.has('package.json')) return 'JavaScript / Node 项目';
  if (names.has('pyproject.toml') || names.has('requirements.txt')) return 'Python 项目';
  if (names.has('cargo.toml')) return 'Rust 项目';
  if (files.some((file) => file.name.toLowerCase().endsWith('.md'))) return '文档 / 资料目录';
  return '通用文件夹';
}

function detectEntryHints(names, files) {
  const hints = [];
  const lowerPaths = files.map((file) => file.path.toLowerCase().replaceAll('\\', '/'));
  if (names.has('package.json')) hints.push('package.json');
  if (names.has('readme.md')) hints.push('README.md');
  if (lowerPaths.some((filePath) => filePath.endsWith('/src/main.js'))) hints.push('src/main.js');
  if (lowerPaths.some((filePath) => filePath.endsWith('/src/renderer/app.js'))) hints.push('src/renderer/app.js');
  if (lowerPaths.some((filePath) => filePath.endsWith('/src/renderer/index.html'))) hints.push('src/renderer/index.html');
  if (names.has('pyproject.toml')) hints.push('pyproject.toml');
  if (names.has('requirements.txt')) hints.push('requirements.txt');
  if (names.has('cargo.toml')) hints.push('Cargo.toml');
  return hints.slice(0, 5);
}

function getModelConfig() {
  const provider = (process.env.KAKA_MODEL_PROVIDER || 'mock').toLowerCase();
  const configMap = {
    openai: {
      provider,
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4.1',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    },
    deepseek: {
      provider,
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
    },
    anthropic: {
      provider,
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
    },
    gemini: {
      provider,
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
      baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com'
    }
  };
  return configMap[provider] || { provider: 'mock' };
}

function getSafeModelConfig() {
  const model = getModelConfig();
  return {
    provider: model.provider,
    model: model.model || 'mock',
    baseUrl: model.baseUrl || '',
    hasKey: Boolean(model.apiKey),
    configured: Boolean(model.apiKey)
  };
}

function buildTaskAnalysisPrompt(payload) {
  const folder = payload.folder
    ? `当前目录画像：${JSON.stringify(payload.folder.summary)}，目录名：${payload.folder.name}`
    : '当前没有绑定目录。';
  const context = payload.context
    ? `\n会话上下文：${JSON.stringify(payload.context)}`
    : '';
  return `你是 KaKaAgent 的任务理解器。请只输出 JSON，不要 Markdown。
用户输入：${payload.text}
${folder}
${context}

输出 schema：
{
  "intent": {
    "mode": "chat|folder|workflow",
    "label": "短标签",
    "title": "一句判断",
    "reason": "为什么这样判断",
    "primary": "chat|open-folder|create-workflow"
  },
  "plan": [
    {"title":"步骤名","body":"步骤说明","agent":"Agent 名","permission":"权限","status":"当前|等待|完成"}
  ],
  "toolProposals": [
    {"type":"cli","command":"白名单命令","reason":"为什么需要执行","permission":"execute|network|local-write","risk":"低|中|高"}
  ],
  "reply": "像真正 AI 助手一样直接接用户话的一小段中文响应"
}

约束：
- 如果任务需要读取、修改、验证本地文件，mode 用 folder，primary 用 open-folder。
- 如果任务是长期流程、复用能力、团队分工，mode 用 workflow，primary 用 create-workflow。
- 如果只是讨论、解释、整理想法，mode 用 chat，primary 用 chat。
- plan 控制在 4 到 6 步，每步必须体现权限或验证边界。
- 只有当用户明确需要运行、测试、检查、构建、git 状态、语法检查时，才返回 toolProposals。
- toolProposals 只允许建议这些命令前缀：git status、git diff、git log、npm test、npm run、node --check、node -v、npm -v、python --version、py --version。
- toolProposals 只是待审批提案，不代表已经执行。不要建议删除、重置、清空、链式命令、管道或重定向。
- 验证步骤必须独立上下文，不继承执行 Agent 的会话记忆。
- reply 不要解释分类，不要说“我判断这是...”，不要像系统提示。直接回应用户，语气自然、简洁、像优秀 AI 助手。`;
}

async function callModel(prompt) {
  const config = getModelConfig();
  if (!config.apiKey || config.provider === 'mock') {
    throw new Error('Model provider is not configured');
  }

  if (config.provider === 'anthropic') {
    const url = `${config.baseUrl.replace(/\/$/, '')}/v1/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    writeModelLog('response', { provider: config.provider, model: config.model, baseUrl: config.baseUrl, status: response.status, ok: response.ok, hasKey: config.apiKey });
    return readModelResponse(response, (json) => json.content?.map((item) => item.text).join('\n'));
  }

  if (config.provider === 'gemini') {
    const url = `${config.baseUrl.replace(/\/$/, '')}/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });
    writeModelLog('response', { provider: config.provider, model: config.model, baseUrl: config.baseUrl, status: response.status, ok: response.ok, hasKey: config.apiKey });
    return readModelResponse(response, (json) => json.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n'));
  }

  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: '你是 KaKaAgent 的任务理解器，只输出 JSON。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  });
  writeModelLog('response', { provider: config.provider, model: config.model, baseUrl: config.baseUrl, status: response.status, ok: response.ok, hasKey: config.apiKey });
  return readModelResponse(response, (json) => json.choices?.[0]?.message?.content);
}

async function readModelResponse(response, pickText) {
  const body = await response.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`Model returned non-JSON HTTP body: ${body.slice(0, 180)}`);
  }
  if (!response.ok) {
    throw new Error(json.error?.message || `Model request failed with ${response.status}`);
  }
  const text = pickText(json);
  if (!text) throw new Error('Model response did not contain text');
  return text;
}

function parseModelJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const match = candidate.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Model response did not contain JSON');
    return JSON.parse(match[0]);
  }
}

function cleanModelText(text) {
  return String(text || '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();
}

ipcMain.handle('dialog:open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  return scanDirectory(result.filePaths[0]);
});

ipcMain.handle('fs:scan-folder', async (_event, folderPath) => {
  return scanDirectory(folderPath);
});

ipcMain.handle('app:get-startup-context', async () => {
  const saved = readAppState();
  return {
    cwd: process.cwd(),
    model: getSafeModelConfig(),
    skills: await listSkills(),
    recent: saved.recentProjects,
    conversations: saved.conversations,
    workflows: saved.workflows
  };
});

ipcMain.handle('app:save-state', async (_event, state) => {
  return saveAppState(state || {});
});

ipcMain.handle('skills:list', async () => {
  return listSkills();
});

ipcMain.handle('command:run', async (_event, payload) => {
  return runCommand(payload || {});
});

ipcMain.handle('model:test', async () => {
  const model = getSafeModelConfig();
  try {
    const text = await callModel('请只回复一个 JSON：{"reply":"ok"}');
    return {
      ok: true,
      model,
      sample: cleanModelText(text).slice(0, 120)
    };
  } catch (error) {
    writeModelLog('error', { ...model, error: error.message });
    return {
      ok: false,
      model,
      error: error.message
    };
  }
});

ipcMain.handle('model:analyze-task', async (_event, payload) => {
  const model = getModelConfig();
  try {
    const prompt = buildTaskAnalysisPrompt(payload);
    const text = await callModel(prompt);
    let result;
    try {
      result = parseModelJson(text);
    } catch {
      result = {
        intent: {
          mode: 'chat',
          label: '对话',
          title: '继续对话',
          reason: '模型返回了自然语言响应。',
          primary: 'chat'
        },
        plan: [],
        reply: cleanModelText(text)
      };
    }
    return {
      ok: true,
      source: model.provider,
      model: model.model,
      result
    };
  } catch (error) {
    writeModelLog('error', { provider: model.provider, model: model.model || 'mock', baseUrl: model.baseUrl || '', hasKey: model.apiKey, error: error.message });
    console.error('[model:analyze-task]', error);
    return {
      ok: false,
      source: model.provider,
      model: model.model || 'mock',
      error: error.message
    };
  }
});

loadLocalEnv();

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
