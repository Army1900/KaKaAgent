const path = require('path');

const TEXT_FILE_EXTENSIONS = new Set([
  '.c',
  '.cc',
  '.config',
  '.cpp',
  '.cs',
  '.css',
  '.csv',
  '.env',
  '.go',
  '.h',
  '.html',
  '.java',
  '.js',
  '.json',
  '.jsx',
  '.less',
  '.log',
  '.md',
  '.mjs',
  '.py',
  '.rs',
  '.scss',
  '.sh',
  '.sql',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.vue',
  '.xml',
  '.yaml',
  '.yml'
]);

const IMPORTANT_FILENAMES = new Set([
  'readme.md',
  'package.json',
  'pyproject.toml',
  'requirements.txt',
  'cargo.toml',
  'tsconfig.json',
  'vite.config.js',
  'webpack.config.js',
  'electron-builder.json'
]);

const ALLOWED_COMMAND_PREFIXES = [
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

const DANGEROUS_COMMAND_MARKERS = [
  'rm ',
  'del ',
  'rmdir ',
  'format ',
  'shutdown',
  'git reset',
  'git clean',
  'remove-item',
  'set-executionpolicy'
];

const DEFAULT_SESSION_ENGINE_ID = 'kaka';

const ENGINE_REGISTRY = [
  {
    id: 'kaka',
    name: 'KaKa 内置',
    type: 'builtin',
    command: '',
    status: 'default',
    summary: '使用本项目内置会话能力，负责记忆、上下文、审批、Skill 和工作流沉淀。',
    instructionFiles: ['.kaka/session-rules.md'],
    capabilities: ['chat', 'context', 'approval', 'skill', 'workflow']
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    type: 'cli',
    command: 'codex',
    status: 'available',
    summary: '把明确的本地实现任务交给 Codex CLI，KaKa 负责目标整理和工作流沉淀。',
    instructionFiles: ['AGENTS.md', '.kaka/session-rules.md'],
    capabilities: ['chat', 'readFiles', 'writeFiles', 'runCommands', 'stream']
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    type: 'cli',
    command: 'claude',
    status: 'available',
    summary: '适合复杂代码库执行任务，KaKa 为它准备项目规则和默认 Skill。',
    instructionFiles: ['CLAUDE.md', '.kaka/session-rules.md'],
    capabilities: ['chat', 'readFiles', 'writeFiles', 'runCommands', 'stream']
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    type: 'cli',
    command: 'opencode',
    status: 'available',
    summary: '适合多模型终端 Agent 执行阶段，第一版先写入 KaKa 通用引擎规则。',
    instructionFiles: ['.kaka/engines/opencode.md', '.kaka/session-rules.md'],
    capabilities: ['chat', 'readFiles', 'writeFiles', 'runCommands']
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    type: 'cli',
    command: 'gemini',
    status: 'available',
    summary: '适合长上下文分析和终端自动化，第一版通过通用规则接入。',
    instructionFiles: ['GEMINI.md', '.kaka/session-rules.md'],
    capabilities: ['chat', 'readFiles', 'writeFiles', 'runCommands']
  },
  {
    id: 'aider',
    name: 'Aider',
    type: 'cli',
    command: 'aider',
    status: 'available',
    summary: '适合小步代码补丁和 Git 迭代，第一版通过 KaKa 规则约束输出。',
    instructionFiles: ['.kaka/engines/aider.md', '.kaka/session-rules.md'],
    capabilities: ['chat', 'readFiles', 'writeFiles']
  }
];

const DEFAULT_SESSION_SETTINGS = {
  version: 1,
  defaultSessionEngineId: DEFAULT_SESSION_ENGINE_ID,
  skillScope: 'project-first',
  workflowDistillation: 'manual',
  engineInitMode: 'ask'
};

const GOAL_STATUSES = new Set(['draft', 'active', 'locked', 'done', 'paused']);

function flattenEntries(entries = []) {
  const result = [];
  entries.forEach((entry) => {
    result.push(entry);
    if (Array.isArray(entry.children)) result.push(...flattenEntries(entry.children));
  });
  return result;
}

function createGoalState(input = {}) {
  const title = normalizeGoalTitle(typeof input === 'string' ? input : input.title || input.goal || '');
  const now = input.updatedAt || new Date().toISOString();
  return {
    title,
    status: GOAL_STATUSES.has(input.status) ? input.status : (title ? 'draft' : 'paused'),
    source: input.source || (title ? 'user' : 'system'),
    updatedAt: now,
    history: normalizeGoalHistory(input.history),
    subgoals: normalizeTextList(input.subgoals).slice(0, 8),
    acceptance: normalizeTextList(input.acceptance).slice(0, 8),
    risks: normalizeTextList(input.risks).slice(0, 8)
  };
}

function normalizeGoalState(input = {}, fallbackGoal = '') {
  const base = createGoalState({
    title: input.title || input.goal || fallbackGoal,
    status: input.status,
    source: input.source,
    updatedAt: input.updatedAt,
    history: input.history,
    subgoals: input.subgoals,
    acceptance: input.acceptance,
    risks: input.risks
  });
  if (!base.title && fallbackGoal) {
    base.title = normalizeGoalTitle(fallbackGoal);
    base.status = 'draft';
    base.source = 'user';
  }
  return base;
}

function updateGoalState(goalState = {}, patch = {}) {
  const current = normalizeGoalState(goalState);
  const nextTitle = normalizeGoalTitle(patch.title || patch.goal || '');
  const isLocked = current.status === 'locked';
  const shouldChangeTitle = nextTitle && nextTitle !== current.title && (!isLocked || patch.force);
  const next = {
    ...current,
    status: GOAL_STATUSES.has(patch.status) ? patch.status : current.status,
    source: patch.source || current.source,
    updatedAt: new Date().toISOString(),
    subgoals: patch.subgoals ? normalizeTextList(patch.subgoals).slice(0, 8) : current.subgoals,
    acceptance: patch.acceptance ? normalizeTextList(patch.acceptance).slice(0, 8) : current.acceptance,
    risks: patch.risks ? normalizeTextList(patch.risks).slice(0, 8) : current.risks,
    history: [...current.history]
  };

  if (shouldChangeTitle) {
    if (current.title) {
      next.history.unshift({
        title: current.title,
        status: current.status,
        changedAt: next.updatedAt,
        reason: patch.reason || '目标调整'
      });
    }
    next.title = nextTitle;
    if (next.status === 'paused') next.status = 'draft';
  } else if (nextTitle && nextTitle !== current.title && isLocked) {
    const alreadyProposed = next.history.some((item) => item.title === nextTitle && item.status === 'proposed');
    if (!alreadyProposed) {
      next.history.unshift({
        title: nextTitle,
        status: 'proposed',
        changedAt: next.updatedAt,
        reason: patch.reason || '锁定目标下的变更提议'
      });
    }
  }

  next.history = normalizeGoalHistory(next.history).slice(0, 12);
  return next;
}

function lockGoalState(goalState = {}) {
  return updateGoalState(goalState, { status: 'locked', source: 'manual' });
}

function normalizeGoalTitle(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 160);
}

function normalizeGoalHistory(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      title: normalizeGoalTitle(item.title),
      status: item.status || 'draft',
      changedAt: item.changedAt || item.updatedAt || new Date().toISOString(),
      reason: String(item.reason || '').slice(0, 160)
    }))
    .filter((item) => item.title);
}

function collectEvidenceBox(session = {}) {
  const items = [];
  const push = (item) => {
    const normalized = normalizeEvidenceBoxItem(item);
    if (normalized.title || normalized.summary) items.push(normalized);
  };

  (session.context?.files || []).forEach((file) => push({
    type: 'context',
    title: file.relativePath || file.name || '上下文文件',
    summary: file.summary || file.content || '',
    source: '目录读取',
    status: 'imported',
    path: file.path || file.relativePath || '',
    createdAt: file.createdAt
  }));

  (session.artifacts || []).forEach((artifact) => push({
    type: artifact.type || 'artifact',
    title: artifact.title || '会话产物',
    summary: artifact.summary || artifact.evidence || '',
    source: artifact.source || renderEvidenceSource(artifact.type),
    status: artifact.status || inferEvidenceStatus(artifact),
    path: artifact.path || '',
    createdAt: artifact.createdAt
  }));

  (session.toolRuns || []).forEach((tool) => push({
    type: 'command',
    title: tool.command || '命令输出',
    summary: tool.stdout || tool.stderr || tool.status || '',
    source: '命令执行',
    status: /失败|failed|error/i.test(`${tool.status || ''} ${tool.stderr || ''}`) ? 'failed' : 'passed',
    path: '',
    createdAt: tool.createdAt
  }));

  (session.verification || []).forEach((item) => push({
    type: 'verification',
    title: item.isolated ? '隔离验证' : '验证记录',
    summary: item.text || item.summary || '',
    source: '验证器',
    status: item.status === '通过' ? 'passed' : item.status === '失败' ? 'failed' : 'pending',
    path: '',
    createdAt: item.createdAt || item.time
  }));

  return dedupeEvidenceItems(items)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function normalizeEvidenceBoxItem(item = {}) {
  return {
    id: item.id || `evidence-${simpleEvidenceHash(`${item.type}:${item.title}:${item.summary}:${item.path}`)}`,
    type: item.type || 'note',
    title: String(item.title || '').trim(),
    summary: String(item.summary || '').trim().slice(0, 1200),
    source: item.source || renderEvidenceSource(item.type),
    status: normalizeEvidenceStatus(item.status),
    path: String(item.path || ''),
    createdAt: item.createdAt || Date.now()
  };
}

function inferEvidenceStatus(item = {}) {
  const value = `${item.status || ''} ${item.summary || ''} ${item.evidence || ''}`.toLowerCase();
  if (/失败|failed|error|exception|blocked/.test(value)) return 'failed';
  if (/通过|success|completed|done|passed|完成/.test(value)) return 'passed';
  if (/导入|imported/.test(value) || item.path) return 'imported';
  return 'pending';
}

function normalizeEvidenceStatus(value = '') {
  const normalized = String(value || '').toLowerCase();
  if (['passed', 'failed', 'pending', 'imported'].includes(normalized)) return normalized;
  if (/通过|成功|完成|completed|passed/.test(normalized)) return 'passed';
  if (/失败|failed|error|blocked/.test(normalized)) return 'failed';
  if (/导入|import/.test(normalized)) return 'imported';
  return 'pending';
}

function renderEvidenceSource(type = '') {
  const sources = {
    context: '目录读取',
    command: '命令执行',
    'engine-handoff': '引擎交接',
    'engine-result': '外部结果',
    verification: '验证器',
    workflow: '工作流生成',
    plan: '任务计划'
  };
  return sources[type] || '会话';
}

function dedupeEvidenceItems(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.type}:${item.title}:${item.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function simpleEvidenceHash(value = '') {
  let hash = 0;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function shouldLoadDirectoryContext(text = '', folder = null) {
  if (!folder?.rootPath) return false;
  const value = String(text).toLowerCase();
  return /(目录|项目|代码|文件|仓库|结构|读取|理解|总结|分析|检查|修改|实现|页面|功能|bug|运行|测试|package|readme|src)/i.test(value);
}

function detectPermissionLevel(text = '') {
  const value = String(text || '').toLowerCase();
  if (['删除', 'remove', 'rm ', 'reset', '清空'].some((word) => value.includes(word))) return 'danger';
  if (['安装', '联网', '下载', 'npm install', 'pip install'].some((word) => value.includes(word))) return 'network';
  if (['运行', '执行', '测试', '构建', '命令', 'npm run'].some((word) => value.includes(word))) return 'execute';
  if (['写入', '修改', '生成文件', '保存'].some((word) => value.includes(word))) return 'local-write';
  return 'read';
}

function inferCommandFromText(text = '') {
  const value = String(text || '').toLowerCase();
  const match = String(text || '').match(/`([^`]+)`/);
  if (match) return match[1].trim();
  if (value.includes('node --check')) return 'node --check src\\renderer\\app.js';
  if (value.includes('git status')) return 'git status --short';
  if (value.includes('git diff')) return 'git diff --stat';
  if (value.includes('npm test') || value.includes('跑测试') || value.includes('运行测试')) return 'npm test';
  if (value.includes('npm run dev')) return 'npm run dev';
  if (value.includes('构建') && value.includes('npm')) return 'npm run build';
  return '';
}

function validateCommandProposal(command = '') {
  const value = String(command || '').trim();
  if (!value) return { ok: false, error: '命令为空' };
  if (value.length > 240) return { ok: false, error: '命令过长' };
  if (/[;&|<>`]/.test(value)) return { ok: false, error: '第一版暂不支持链式命令、管道或重定向' };
  const lower = value.toLowerCase();
  if (DANGEROUS_COMMAND_MARKERS.some((token) => lower.includes(token))) return { ok: false, error: '危险命令已拦截' };
  if (!ALLOWED_COMMAND_PREFIXES.some((prefix) => lower === prefix || lower.startsWith(`${prefix} `))) {
    return { ok: false, error: '命令不在第一版白名单内' };
  }
  return { ok: true, command: value };
}

function createApprovalProposalFromText(text = '') {
  const level = detectPermissionLevel(text);
  if (level === 'read') return null;
  const command = inferCommandFromText(text);
  if (level === 'execute' && !command) return null;
  const validation = command ? validateCommandProposal(command) : { ok: true };
  if (!validation.ok && level === 'execute') {
    return {
      type: '命令审批',
      permission: 'blocked',
      command,
      summary: text,
      reason: validation.error,
      risk: '高',
      blocked: true
    };
  }
  return {
    type: command ? '命令审批' : '写入审批',
    permission: command ? 'execute' : level,
    command: validation.command || command,
    summary: text,
    reason: command ? '根据你的输入识别到可执行命令。' : '该操作涉及写入或权限提升。',
    risk: level === 'danger' ? '高' : level === 'network' ? '中' : '低'
  };
}

function getEngineRegistry() {
  return ENGINE_REGISTRY.map((engine) => ({
    ...engine,
    instructionFiles: [...engine.instructionFiles],
    capabilities: [...engine.capabilities]
  }));
}

function getEngineById(id = DEFAULT_SESSION_ENGINE_ID) {
  return getEngineRegistry().find((engine) => engine.id === id) || getEngineRegistry()[0];
}

function normalizeSessionSettings(settings = {}) {
  const engine = getEngineById(settings.defaultSessionEngineId);
  const skillScopes = new Set(['project-first', 'public-only', 'project-only']);
  const distillationModes = new Set(['manual', 'suggest', 'auto-draft']);
  const initModes = new Set(['ask', 'auto', 'off']);
  return {
    ...DEFAULT_SESSION_SETTINGS,
    ...settings,
    defaultSessionEngineId: engine.id,
    skillScope: skillScopes.has(settings.skillScope) ? settings.skillScope : DEFAULT_SESSION_SETTINGS.skillScope,
    workflowDistillation: distillationModes.has(settings.workflowDistillation)
      ? settings.workflowDistillation
      : DEFAULT_SESSION_SETTINGS.workflowDistillation,
    engineInitMode: initModes.has(settings.engineInitMode) ? settings.engineInitMode : DEFAULT_SESSION_SETTINGS.engineInitMode
  };
}

function createEngineInitPlan({ engineId = DEFAULT_SESSION_ENGINE_ID, projectPath = '', goal = '', skills = [] } = {}) {
  const engine = getEngineById(engineId);
  const safeProjectPath = String(projectPath || '').trim();
  const selectedSkills = normalizeTextList(skills).slice(0, 8);
  const files = uniqueList([
    '.kaka/session-rules.md',
    '.kaka/skills/README.md',
    ...engine.instructionFiles
  ]).map((relativePath) => ({
    relativePath,
    content: createEngineInitFileContent(relativePath, engine, goal, selectedSkills)
  }));

  return {
    engine,
    projectPath: safeProjectPath,
    files,
    summary: `${engine.name} 初始化：${files.map((file) => file.relativePath).join('、')}`
  };
}

function createEngineHandoffPlan({
  engineId = DEFAULT_SESSION_ENGINE_ID,
  goal = '',
  projectPath = '',
  contextSummary = '',
  skills = [],
  constraints = [],
  validation = [],
  nextActions = []
} = {}) {
  const engine = getEngineById(engineId);
  const safeGoal = String(goal || 'Continue the current KaKaAgent session.').trim();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `handoff-${engine.id}-${timestamp}.md`;
  const relativePath = projectPath ? `.kaka/handoffs/${fileName}` : `handoffs/${fileName}`;
  const content = createEngineHandoffContent({
    engine,
    goal: safeGoal,
    projectPath,
    contextSummary,
    skills,
    constraints,
    validation,
    nextActions
  });
  return {
    engine,
    relativePath,
    fileName,
    content,
    suggestedCommand: createEngineSuggestedCommand(engine, relativePath),
    summary: `${engine.name} 交接包：${safeGoal}`
  };
}

function normalizeEngineHandoffResult({ engineId = DEFAULT_SESSION_ENGINE_ID, filePath = '', content = '' } = {}) {
  const engine = getEngineById(engineId);
  const text = String(content || '').trim();
  const status = inferHandoffResultStatus(text);
  const summary = summarizeHandoffResult(text);
  return {
    engine,
    filePath: String(filePath || ''),
    status,
    summary,
    evidence: text.slice(0, 4000),
    importedAt: new Date().toISOString(),
    validationHints: createHandoffValidationHints(status, text)
  };
}

function inferHandoffResultStatus(text = '') {
  const value = String(text || '').toLowerCase();
  if (!value.trim()) return 'empty';
  if (/failed|failure|error|exception|失败|报错|未完成|blocked|阻塞/.test(value)) return 'failed';
  if (/pass|passed|success|done|completed|完成|通过|成功|fixed|修复/.test(value)) return 'completed';
  return 'reported';
}

function summarizeHandoffResult(text = '') {
  const clean = String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .join(' ');
  if (!clean) return '外部引擎结果为空。';
  return clean.length > 500 ? `${clean.slice(0, 500)}...` : clean;
}

function createHandoffValidationHints(status, text = '') {
  const hints = [
    '结果必须来自交接包后的独立输出文件',
    '必须保留外部引擎输出作为证据',
    '不能仅凭会话记忆判断任务完成'
  ];
  if (status === 'failed') hints.push('失败结果必须进入失败记录并触发下一轮调整');
  if (status === 'completed') hints.push('完成结果仍需独立验证产物和验收条件');
  if (!String(text || '').trim()) hints.push('空结果不能视为完成');
  return hints;
}

function createEngineHandoffContent({
  engine,
  goal,
  projectPath,
  contextSummary,
  skills,
  constraints,
  validation,
  nextActions
}) {
  const lines = [
    `# KaKaAgent Handoff - ${engine.name}`,
    '',
    'This file is a handoff package generated by KaKaAgent.',
    '',
    '## Goal',
    goal || 'Continue the current task.',
    '',
    '## Target',
    projectPath ? `Project: ${projectPath}` : 'Temporary conversation workspace',
    '',
    '## Context Summary',
    String(contextSummary || 'No compact context summary yet.').trim(),
    ''
  ];
  appendListSection(lines, 'Skills', skills, 'No explicit skills selected.');
  appendListSection(lines, 'Constraints', constraints, 'No extra constraints recorded.');
  appendListSection(lines, 'Validation Rules', validation, 'Run independent verification before marking complete.');
  appendListSection(lines, 'Next Actions', nextActions, 'Clarify the next actionable step with the user.');
  lines.push('## Engine Contract');
  lines.push(`- Engine: ${engine.name}`);
  lines.push(`- Command: ${engine.command || 'built-in'}`);
  lines.push('- Do not claim completion without evidence.');
  lines.push('- Any file write, command execution, install, network use, or destructive action requires approval.');
  lines.push('- Stable repeated steps should be proposed as workflow nodes, and eventually as JS scripts when reliable.');
  lines.push('');
  return lines.join('\n');
}

function appendListSection(lines, title, items, fallback) {
  lines.push(`## ${title}`);
  const normalized = normalizeTextList(items).slice(0, 12);
  if (!normalized.length) {
    lines.push(`- ${fallback}`);
  } else {
    normalized.forEach((item) => lines.push(`- ${item}`));
  }
  lines.push('');
}

function createEngineSuggestedCommand(engine, handoffPath) {
  if (engine.id === 'kaka') return '';
  const quoted = handoffPath.includes(' ') ? `"${handoffPath}"` : handoffPath;
  if (engine.id === 'codex') return `codex ${quoted}`;
  if (engine.id === 'claude-code') return `claude ${quoted}`;
  if (engine.id === 'gemini-cli') return `gemini ${quoted}`;
  if (engine.id === 'opencode') return `opencode ${quoted}`;
  if (engine.id === 'aider') return `aider ${quoted}`;
  return engine.command ? `${engine.command} ${quoted}` : '';
}

function createEngineInitFileContent(relativePath, engine, goal = '', skills = []) {
  const title = relativePath.endsWith('README.md')
    ? 'KaKaAgent Skills'
    : `${engine.name} Project Rules`;
  const lines = [
    `# ${title}`,
    '',
    'This project is orchestrated by KaKaAgent.',
    '',
    '## Goal',
    goal ? String(goal).trim() : 'Convert useful conversations into verifiable, reusable workflows.',
    '',
    '## Operating Rules',
    '- Keep exploration, execution, and verification as separate stages.',
    '- Do not treat repeated success as proof; verification must use independent context and explicit evidence.',
    '- Prefer stable scripts for repeated steps after the AI path is understood.',
    '- Ask for approval before writing files, running commands, installing dependencies, or using network access.',
    '- Leave concise evidence for every important decision, output, and failure.',
    '',
    '## Workflow Distillation',
    '- Capture reusable steps as workflow nodes.',
    '- Mark each node as either AI prompt or JS script when it becomes stable.',
    '- Promote reusable nodes to public workflows only after verification passes.',
    ''
  ];

  if (skills.length) {
    lines.push('## Default Skills');
    skills.forEach((skill) => lines.push(`- ${skill}`));
    lines.push('');
  }

  lines.push('## Engine');
  lines.push(`- Engine: ${engine.name}`);
  lines.push(`- Command: ${engine.command || 'built-in'}`);
  lines.push(`- Capabilities: ${engine.capabilities.join(', ')}`);
  lines.push('');
  return lines.join('\n');
}

function uniqueList(items = []) {
  return Array.from(new Set(items.filter(Boolean)));
}

function normalizePath(value = '') {
  return String(value).replaceAll('\\', '/').toLowerCase();
}

function isTextEntry(entry) {
  if (!entry || entry.type !== 'file') return false;
  const name = String(entry.name || '').toLowerCase();
  if (IMPORTANT_FILENAMES.has(name)) return true;
  return TEXT_FILE_EXTENSIONS.has(path.extname(name));
}

function scoreEntry(entry, text = '', hints = []) {
  const normalizedText = normalizePath(text);
  const normalizedPath = normalizePath(entry.path || entry.name || '');
  const name = String(entry.name || '').toLowerCase();
  let score = 0;

  if (IMPORTANT_FILENAMES.has(name)) score += 10;
  if (hints.some((hint) => normalizePath(hint) === normalizePath(entry.name) || normalizedPath.endsWith(normalizePath(hint)))) score += 9;
  if (name && normalizedText.includes(name)) score += 8;
  if (normalizedPath.includes('/src/')) score += 3;
  if (normalizedPath.includes('/test') || normalizedPath.includes('/spec')) score += 2;

  normalizedText
    .split(/[^a-z0-9_\-\u4e00-\u9fa5]+/i)
    .filter((part) => part.length >= 2)
    .forEach((part) => {
      if (normalizedPath.includes(part)) score += 4;
    });

  return score;
}

function selectDirectoryContext({ folder, text = '', limit = 6 } = {}) {
  if (!shouldLoadDirectoryContext(text, folder)) {
    return { shouldLoad: false, files: [], reason: 'no-directory-intent' };
  }

  const hints = folder?.summary?.entryHints || [];
  const files = flattenEntries(folder?.entries || [])
    .filter(isTextEntry)
    .map((entry) => ({
      name: entry.name,
      path: entry.path,
      type: entry.type,
      score: scoreEntry(entry, text, hints)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || String(a.path).localeCompare(String(b.path)))
    .slice(0, limit);

  return {
    shouldLoad: files.length > 0,
    reason: files.length ? 'matched-directory-context' : 'no-readable-match',
    files
  };
}

function buildDirectoryDigest({ folder, files = [] } = {}) {
  const summary = folder?.summary || {};
  const lines = [
    `目录：${folder?.name || '未命名'} (${folder?.rootPath || '未知路径'})`,
    `画像：${summary.profile || '通用文件夹'}，文件 ${summary.files || 0}，文件夹 ${summary.folders || 0}`,
    `入口：${(summary.entryHints || []).join('、') || '暂无'}`
  ];

  if (files.length) {
    lines.push('已读取：');
    files.forEach((file) => {
      lines.push(`- ${file.relativePath || file.name}: ${file.summary || `${String(file.content || '').length} 字符`}`);
    });
  }

  return lines.join('\n');
}

function createIndependentVerificationInput({
  goal = '',
  criteria = [],
  contextFiles = [],
  artifacts = [],
  toolRuns = []
} = {}) {
  return {
    goal: String(goal || '').trim(),
    criteria: normalizeTextList(criteria).slice(0, 8),
    evidence: [
      ...normalizeEvidence(contextFiles, 'file'),
      ...normalizeEvidence(artifacts, 'artifact'),
      ...normalizeEvidence(toolRuns, 'tool')
    ].slice(0, 16),
    isolation: {
      includesConversationMemory: false,
      includesChatMessages: false,
      allowedInputs: ['goal', 'criteria', 'contextFiles', 'artifacts', 'toolRuns']
    }
  };
}

function runIndependentVerification(input = {}) {
  const verificationInput = createIndependentVerificationInput(input);
  const evidenceCount = verificationInput.evidence.length;
  const criteriaCount = verificationInput.criteria.length;
  const failures = verificationInput.evidence
    .filter((item) => /失败|error|failed|exception/i.test(`${item.status || ''} ${item.summary || ''}`))
    .map((item) => item.label);

  let status = '待补充';
  const notes = [];

  if (!verificationInput.goal) notes.push('缺少目标');
  if (!criteriaCount) notes.push('缺少验收标准');
  if (!evidenceCount) notes.push('缺少证据');
  if (failures.length) notes.push(`发现失败证据：${failures.join('、')}`);

  if (verificationInput.goal && evidenceCount && criteriaCount && !failures.length) {
    status = '通过';
    notes.push('目标、验收标准和证据已在隔离输入中对齐');
  } else if (failures.length) {
    status = '失败';
  }

  return {
    status,
    notes,
    input: verificationInput
  };
}

function sanitizeModelContext(context = {}, options = {}) {
  const maxText = options.maxText || 1200;
  const maxSelected = options.maxSelected || 8;
  const session = context.session || null;
  return {
    ...context,
    session: session ? {
      id: session.id,
      mode: session.mode,
      title: session.title,
      engine: compactEngine(session.engine),
      goalState: session.goalState ? {
        title: session.goalState.title,
        status: session.goalState.status,
        acceptance: normalizeTextList(session.goalState.acceptance).slice(0, 6),
        risks: normalizeTextList(session.goalState.risks).slice(0, 6)
      } : null,
      taskState: session.taskState,
      memoryDigest: truncateText(session.memoryDigest || '', maxText),
      skills: compactSkillList(session.skills),
      context: compactSessionContextForModel(session.context, maxText),
      approvals: compactEvidenceList(session.approvals, 5, maxText),
      toolRuns: compactEvidenceList(session.toolRuns, 5, maxText),
      selectedContext: compactSelectedContext(session.selectedContext, maxSelected, maxText),
      activeSkillInstructions: compactSkillList(session.activeSkillInstructions, 4, maxText)
    } : null,
    recentMessages: (context.recentMessages || []).slice(-6).map((message) => ({
      role: message.role,
      text: truncateText(message.text, maxText)
    })),
    selectedContext: compactSelectedContext(context.selectedContext, maxSelected, maxText)
  };
}

function compactEngine(engine = null) {
  if (!engine) return null;
  return {
    id: engine.id,
    name: engine.name,
    type: engine.type,
    command: engine.command || '',
    capabilities: Array.isArray(engine.capabilities) ? engine.capabilities.slice(0, 8) : []
  };
}

function compactSessionContextForModel(context = {}, maxText = 1200) {
  return {
    tokenBudget: context.tokenBudget,
    summary: truncateText(context.summary || '', maxText),
    folder: context.folder || null,
    recentWindow: context.recentWindow,
    estimatedTokens: context.estimatedTokens,
    compactedTurns: context.compactedTurns,
    selected: compactSelectedContext(context.selected, 8, maxText),
    files: (context.files || []).slice(0, 8).map((file) => ({
      name: file.name,
      relativePath: file.relativePath,
      size: file.size,
      truncated: file.truncated,
      summary: truncateText(file.summary || '', maxText)
    }))
  };
}

function compactSelectedContext(items = [], limit = 8, maxText = 1200) {
  return (Array.isArray(items) ? items : []).slice(0, limit).map((item) => ({
    type: item.type,
    label: item.label,
    reason: item.reason,
    value: truncateText(item.value || item.summary || '', maxText)
  }));
}

function compactEvidenceList(items = [], limit = 5, maxText = 1200) {
  return (Array.isArray(items) ? items : []).slice(0, limit).map((item) => ({
    type: item.type,
    command: item.command,
    status: item.status,
    summary: truncateText(item.summary || item.stdout || item.stderr || item.reason || '', maxText)
  }));
}

function compactSkillList(items = [], limit = 6, maxText = 1200) {
  return (Array.isArray(items) ? items : []).slice(0, limit).map((item) => ({
    id: item.id,
    name: item.name,
    permission: item.permission,
    reason: item.reason,
    summary: truncateText(item.summary || item.instruction || '', maxText),
    instruction: item.instruction ? truncateText(item.instruction, maxText) : undefined
  }));
}

function truncateText(value = '', maxLength = 1200) {
  const text = String(value || '');
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function normalizeTextList(items) {
  return (Array.isArray(items) ? items : [items])
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function isActionableGoalText(text = '') {
  const value = String(text || '').trim();
  if (!value) return false;
  const compact = value.replace(/\s+/g, '');
  if (/^(在吗?|在\?|你好|您好|hi|hello|hey|哈喽|嗨)[。！!?.？]*$/i.test(compact)) return false;
  if (compact.length >= 18) return true;
  return /(帮我|请|需要|想要|做|改|写|生成|整理|分析|检查|测试|运行|实现|设计|创建|修复|提交|推送|打开目录|工作流|Agent|智能体|代码|文件|项目|页面|功能)/i.test(value);
}

function assessWorkflowReadiness(input = {}) {
  const goal = String(input.goal || '').trim();
  const goalStatus = String(input.goalStatus || '');
  const inputs = normalizeTextList(input.inputs);
  const stages = normalizeTextList(input.stages);
  const nodes = normalizeTextList(input.nodes);
  const constraints = normalizeTextList(input.constraints);
  const validation = normalizeTextList(input.validation);
  const hasActionableGoal = Boolean(input.hasActionableGoal ?? isActionableGoalText(goal));
  const hasConfirmedGoal = hasActionableGoal && ['active', 'locked', 'done'].includes(goalStatus);
  const hasEvidence = Boolean(input.hasEvidence) || inputs.some((item) => /目录|文件|交接包|外部结果|产物|命令|证据/.test(item));
  const hasWorkflowIntent = Boolean(input.hasWorkflowIntent);
  const hasStageStructure = stages.length >= 2;
  const hasNodeCandidates = nodes.length > 0 && (hasWorkflowIntent || hasStageStructure || hasEvidence);
  const hasValidation = validation.length > 0 || constraints.some((item) => /验证|独立|校验|证据|验收|不可/.test(item));

  const checks = [
    { id: 'goal', label: '明确任务目标', passed: hasActionableGoal, missing: '需要先形成一个可执行目标' },
    { id: 'input', label: '真实输入或上下文', passed: hasEvidence, missing: '需要目录、文件、产物、外部结果或明确输入材料' },
    { id: 'stages', label: '阶段结构', passed: hasStageStructure, missing: '需要至少两个有意义的阶段' },
    { id: 'nodes', label: '节点候选', passed: hasNodeCandidates, missing: '需要能复用的节点或 Agent 分工' },
    { id: 'validation', label: '验收或验证方式', passed: hasValidation, missing: '需要明确怎么验证结果' }
  ];
  const score = checks.filter((item) => item.passed).length;
  const ready = hasActionableGoal && score >= 4 && (hasConfirmedGoal || hasWorkflowIntent || hasEvidence);

  return {
    score,
    maxScore: checks.length,
    ready,
    checks,
    missing: checks.filter((item) => !item.passed).map((item) => item.missing)
  };
}

function normalizeEvidence(items, type) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const label = item.relativePath || item.title || item.command || item.name || item.id || type;
      const summary = item.summary || item.stdout || item.stderr || item.content || item.status || '';
      return {
        type,
        label: String(label || type),
        status: String(item.status || ''),
        summary: String(summary || '').slice(0, 1200)
      };
    })
    .filter((item) => item.label || item.summary);
}

module.exports = {
  ALLOWED_COMMAND_PREFIXES,
  DEFAULT_SESSION_ENGINE_ID,
  DEFAULT_SESSION_SETTINGS,
  createApprovalProposalFromText,
  createEngineHandoffPlan,
  createEngineInitPlan,
  DANGEROUS_COMMAND_MARKERS,
  ENGINE_REGISTRY,
  TEXT_FILE_EXTENSIONS,
  buildDirectoryDigest,
  collectEvidenceBox,
  createIndependentVerificationInput,
  createGoalState,
  assessWorkflowReadiness,
  detectPermissionLevel,
  flattenEntries,
  getEngineById,
  getEngineRegistry,
  inferCommandFromText,
  isActionableGoalText,
  isTextEntry,
  normalizeEngineHandoffResult,
  normalizeGoalState,
  normalizeSessionSettings,
  normalizePath,
  runIndependentVerification,
  sanitizeModelContext,
  scoreEntry,
  selectDirectoryContext,
  shouldLoadDirectoryContext,
  lockGoalState,
  updateGoalState,
  validateCommandProposal
};
