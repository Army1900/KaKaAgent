const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { exec, execFile } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const nodeFs = require('fs');
const {
  buildDirectoryDigest,
  createEngineHandoffPlan,
  createEngineInitPlan,
  getEngineById,
  getEngineRegistry,
  normalizeEngineHandoffResult,
  normalizeSessionSettings,
  runIndependentVerification,
  sanitizeModelContext,
  selectDirectoryContext,
  validateCommandProposal
} = require('./core/session-core');

let mainWindow;
const rootDir = path.join(__dirname, '..');

function getStatePath() {
  return path.join(getWorkspaceRoot(), 'state.json');
}

function getWorkspaceRoot() {
  return path.join(app.getPath('home'), '.kakaAgent');
}

function getWorkspacePaths() {
  const root = getWorkspaceRoot();
  return {
    root,
    conversations: path.join(root, 'conversations'),
    projects: path.join(root, 'projects'),
    workflows: path.join(root, 'workflows'),
    agents: path.join(root, 'agents'),
    skills: path.join(root, 'skills'),
    cache: path.join(root, 'cache'),
    settings: path.join(root, 'settings.json'),
    projectsIndex: path.join(root, 'projects', 'index.json'),
    workflowsIndex: path.join(root, 'workflows', 'index.json'),
    agentsIndex: path.join(root, 'agents', 'index.json')
  };
}

function ensureWorkspace() {
  const paths = getWorkspacePaths();
  [
    paths.root,
    paths.conversations,
    paths.projects,
    paths.workflows,
    paths.agents,
    paths.skills,
    paths.cache
  ].forEach((dirPath) => nodeFs.mkdirSync(dirPath, { recursive: true }));
  if (!nodeFs.existsSync(paths.settings)) {
    nodeFs.writeFileSync(paths.settings, JSON.stringify(normalizeSessionSettings({
      layout: 'home-dot-directory',
      createdAt: new Date().toISOString()
    }), null, 2), 'utf8');
  }
  if (!nodeFs.existsSync(paths.projectsIndex)) nodeFs.writeFileSync(paths.projectsIndex, '[]', 'utf8');
  if (!nodeFs.existsSync(paths.workflowsIndex)) nodeFs.writeFileSync(paths.workflowsIndex, '[]', 'utf8');
  if (!nodeFs.existsSync(paths.agentsIndex)) nodeFs.writeFileSync(paths.agentsIndex, '[]', 'utf8');
  return paths;
}

function readSettings() {
  const paths = ensureWorkspace();
  return normalizeSessionSettings(readJsonFile(paths.settings, {}));
}

function saveSettings(settings) {
  const paths = ensureWorkspace();
  const safeSettings = normalizeSessionSettings({
    ...readSettings(),
    ...(settings || {})
  });
  nodeFs.writeFileSync(paths.settings, JSON.stringify(safeSettings, null, 2), 'utf8');
  return safeSettings;
}

function safeFileName(value, fallback = 'item') {
  return String(value || fallback).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').slice(0, 96);
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(nodeFs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function readAppState() {
  try {
    ensureWorkspace();
    const content = nodeFs.readFileSync(getStatePath(), 'utf8');
    const parsed = JSON.parse(content);
    return {
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      recentProjects: Array.isArray(parsed.recentProjects) ? parsed.recentProjects : [],
      agents: Array.isArray(parsed.agents) ? parsed.agents : [],
      workflows: Array.isArray(parsed.workflows) ? parsed.workflows : []
    };
  } catch {
    ensureWorkspace();
    return { conversations: [], recentProjects: [], agents: [], workflows: [] };
  }
}

function saveAppState(state) {
  const workspace = ensureWorkspace();
  const safeState = {
    conversations: Array.isArray(state.conversations) ? state.conversations.slice(0, 40) : [],
    recentProjects: Array.isArray(state.recentProjects) ? state.recentProjects.slice(0, 20) : [],
    agents: Array.isArray(state.agents) ? state.agents.slice(0, 80) : [],
    workflows: Array.isArray(state.workflows) ? state.workflows.slice(0, 40) : []
  };
  nodeFs.mkdirSync(path.dirname(getStatePath()), { recursive: true });
  nodeFs.writeFileSync(getStatePath(), JSON.stringify(safeState, null, 2), 'utf8');
  writeWorkspaceState(workspace, safeState);
  return safeState;
}

function writeWorkspaceState(workspace, safeState) {
  safeState.conversations.forEach((conversation) => {
    const conversationDir = path.join(workspace.conversations, safeFileName(conversation.id, 'conversation'));
    nodeFs.mkdirSync(path.join(conversationDir, 'files'), { recursive: true });
    nodeFs.mkdirSync(path.join(conversationDir, 'artifacts'), { recursive: true });
    nodeFs.mkdirSync(path.join(conversationDir, 'workflows'), { recursive: true });
    nodeFs.writeFileSync(path.join(conversationDir, 'messages.json'), JSON.stringify(conversation, null, 2), 'utf8');
  });
  const projects = safeState.recentProjects.map((project) => ({
    id: project.id || safeFileName(project.path || project.name, 'project'),
    name: project.name || path.basename(project.path || ''),
    path: project.path,
    lastOpenedAt: project.lastOpenedAt || new Date().toISOString()
  })).filter((project) => project.path);
  nodeFs.writeFileSync(workspace.projectsIndex, JSON.stringify(projects, null, 2), 'utf8');
  nodeFs.writeFileSync(workspace.agentsIndex, JSON.stringify(safeState.agents, null, 2), 'utf8');
  nodeFs.writeFileSync(workspace.workflowsIndex, JSON.stringify(safeState.workflows, null, 2), 'utf8');
}

function getWorkspaceInfo() {
  const paths = ensureWorkspace();
  return {
    root: paths.root,
    conversationsDir: paths.conversations,
    projectsDir: paths.projects,
    workflowsDir: paths.workflows,
    agentsDir: paths.agents,
    cacheDir: paths.cache,
    skillsDir: paths.skills,
    projects: readJsonFile(paths.projectsIndex, []),
    agents: readJsonFile(paths.agentsIndex, []),
    workflows: readJsonFile(paths.workflowsIndex, [])
  };
}

async function initializeProjectEngine(payload = {}) {
  const projectPath = path.resolve(String(payload.projectPath || ''));
  const rootPath = path.resolve(String(payload.projectPath || ''));
  if (!projectPath || !nodeFs.existsSync(projectPath)) {
    return { ok: false, error: '项目目录不存在' };
  }
  const stats = nodeFs.statSync(projectPath);
  if (!stats.isDirectory()) {
    return { ok: false, error: '目标不是目录' };
  }

  const plan = createEngineInitPlan({
    engineId: payload.engineId,
    projectPath,
    goal: payload.goal,
    skills: payload.skills
  });
  const written = [];
  const skipped = [];

  for (const file of plan.files) {
    const targetPath = path.resolve(projectPath, file.relativePath);
    if (!targetPath.startsWith(`${rootPath}${path.sep}`) && targetPath !== rootPath) {
      return { ok: false, error: `路径越界：${file.relativePath}` };
    }
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    if (nodeFs.existsSync(targetPath) && !payload.overwrite) {
      skipped.push({ ...file, path: targetPath, reason: '已存在' });
      continue;
    }
    await fs.writeFile(targetPath, file.content, 'utf8');
    written.push({ ...file, path: targetPath });
  }

  return {
    ok: true,
    engine: plan.engine,
    projectPath,
    written,
    skipped,
    summary: plan.summary
  };
}

async function createEngineHandoff(payload = {}) {
  const projectPath = String(payload.projectPath || '').trim();
  const workspacePath = String(payload.workspacePath || '').trim();
  const targetRoot = projectPath || workspacePath;
  if (!targetRoot) return { ok: false, error: '缺少交接目标目录' };

  const resolvedRoot = path.resolve(targetRoot);
  await fs.mkdir(resolvedRoot, { recursive: true });
  const plan = createEngineHandoffPlan({
    engineId: payload.engineId,
    goal: payload.goal,
    projectPath,
    contextSummary: payload.contextSummary,
    skills: payload.skills,
    constraints: payload.constraints,
    validation: payload.validation,
    nextActions: payload.nextActions
  });
  const targetPath = path.resolve(resolvedRoot, plan.relativePath);
  if (!targetPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    return { ok: false, error: `路径越界：${plan.relativePath}` };
  }
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, plan.content, 'utf8');
  return {
    ok: true,
    engine: plan.engine,
    relativePath: plan.relativePath,
    path: targetPath,
    suggestedCommand: plan.suggestedCommand,
    summary: plan.summary
  };
}

function checkEngineAvailability(engineId) {
  const engine = getEngineById(engineId);
  if (engine.type === 'builtin') {
    return Promise.resolve({
      ok: true,
      engine,
      status: 'available',
      version: 'built-in'
    });
  }
  if (!engine.command) {
    return Promise.resolve({
      ok: false,
      engine,
      status: 'missing-command',
      error: '未配置命令'
    });
  }

  return new Promise((resolve) => {
    execFile(engine.command, ['--version'], {
      timeout: 10000,
      windowsHide: true,
      maxBuffer: 256 * 1024
    }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          ok: false,
          engine,
          status: 'not-found',
          error: error.message
        });
        return;
      }
      resolve({
        ok: true,
        engine,
        status: 'available',
        version: String(stdout || stderr || '').trim().slice(0, 300) || 'available'
      });
    });
  });
}

async function importEngineHandoffResult(payload = {}) {
  const engineId = payload.engineId;
  let filePath = payload.filePath;
  if (!filePath) {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '导入引擎结果',
      properties: ['openFile'],
      filters: [
        { name: 'Result files', extensions: ['md', 'txt', 'json', 'log'] },
        { name: 'All files', extensions: ['*'] }
      ]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    filePath = result.filePaths[0];
  }
  const stats = await fs.stat(filePath);
  if (!stats.isFile()) return { ok: false, error: '请选择结果文件' };
  if (stats.size > 1024 * 1024) return { ok: false, error: '结果文件超过 1MB，第一版先不导入' };
  const content = await fs.readFile(filePath, 'utf8');
  return {
    ok: true,
    result: normalizeEngineHandoffResult({
      engineId,
      filePath,
      content
    })
  };
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
  const validation = validateCommandProposal(command);
  if (!validation.ok) return validation;
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

async function readProjectContext(payload = {}) {
  const rootPath = String(payload.rootPath || '');
  if (!rootPath) return { ok: false, error: '缺少目录路径' };
  const folder = await scanDirectory(rootPath);
  const selection = selectDirectoryContext({
    folder,
    text: payload.text || '',
    limit: payload.limit || 6
  });
  const files = [];

  for (const entry of selection.files) {
    const safePath = resolveInsideRoot(rootPath, entry.path);
    if (!safePath.ok) continue;
    const file = await readTextFilePreview(rootPath, safePath.path);
    if (file) files.push(file);
  }

  return {
    ok: true,
    folder,
    selection,
    files,
    digest: buildDirectoryDigest({ folder, files })
  };
}

function resolveInsideRoot(rootPath, targetPath) {
  const root = path.resolve(rootPath);
  const target = path.resolve(targetPath);
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { ok: false, error: '路径不在目录内' };
  }
  return { ok: true, path: target };
}

async function readTextFilePreview(rootPath, filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size > 512 * 1024) return null;
    const buffer = await fs.readFile(filePath);
    if (buffer.includes(0)) return null;
    const content = buffer.toString('utf8').slice(0, 6000);
    const relativePath = path.relative(rootPath, filePath);
    return {
      name: path.basename(filePath),
      path: filePath,
      relativePath,
      size: stat.size,
      truncated: buffer.length > 6000,
      content,
      summary: summarizeFileContent(content, relativePath)
    };
  } catch {
    return null;
  }
}

function summarizeFileContent(content, relativePath) {
  const text = String(content || '').replace(/\s+/g, ' ').trim();
  if (!text) return `${relativePath} 为空文件`;
  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
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
  const safeContext = payload.context ? sanitizeModelContext(payload.context) : null;
  const context = safeContext
    ? `\n会话上下文：${JSON.stringify(safeContext)}`
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
- 如果上下文里有 engine，它代表当前会话的执行引擎。外部 CLI 引擎只能作为可托管执行器提出计划或命令提案，不要声称已经调用。
- KaKaAgent 的目标是把会话探索沉淀成可验证、可复用工作流；当用户讨论方法、流程、复用、自动化时，要帮助积累工作流素材。
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

ipcMain.handle('fs:read-project-context', async (_event, payload) => {
  return readProjectContext(payload || {});
});

ipcMain.handle('app:get-startup-context', async () => {
  const saved = readAppState();
  return {
    cwd: process.cwd(),
    workspace: getWorkspaceInfo(),
    settings: readSettings(),
    engines: getEngineRegistry(),
    model: getSafeModelConfig(),
    skills: await listSkills(),
    recent: saved.recentProjects,
    conversations: saved.conversations,
    agents: saved.agents,
    workflows: saved.workflows
  };
});

ipcMain.handle('app:save-state', async (_event, state) => {
  return saveAppState(state || {});
});

ipcMain.handle('app:get-settings', async () => {
  return readSettings();
});

ipcMain.handle('app:save-settings', async (_event, settings) => {
  return saveSettings(settings || {});
});

ipcMain.handle('app:get-workspace-info', async () => {
  return getWorkspaceInfo();
});

ipcMain.handle('engine:init-project', async (_event, payload) => {
  return initializeProjectEngine(payload || {});
});

ipcMain.handle('engine:create-handoff', async (_event, payload) => {
  return createEngineHandoff(payload || {});
});

ipcMain.handle('engine:import-handoff-result', async (_event, payload) => {
  return importEngineHandoffResult(payload || {});
});

ipcMain.handle('engine:check', async (_event, engineId) => {
  return checkEngineAvailability(engineId);
});

ipcMain.handle('skills:list', async () => {
  return listSkills();
});

ipcMain.handle('command:run', async (_event, payload) => {
  return runCommand(payload || {});
});

ipcMain.handle('command:validate', async (_event, command) => {
  return validateCommandProposal(command);
});

ipcMain.handle('verification:independent', async (_event, payload) => {
  return runIndependentVerification(payload || {});
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
