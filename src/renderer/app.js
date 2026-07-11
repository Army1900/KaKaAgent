const agents = [
  { id: 'conversation', name: '会话协调员', role: '目标澄清与上下文控制', status: '默认', description: '维护目标、记忆、上下文窗口、权限和工具提案，是工作流生成的入口。', permission: '只读、审批后执行', engine: 'kaka', engineLabel: 'KaKa 会话引擎', adapter: '内置', use: '随便聊聊、目标整理、转工作流' },
  { id: 'context', name: '上下文读取器', role: '目录理解', status: '默认', description: '读取目录结构、文件摘要和项目状态，为计划和工作流节点提供证据。', permission: '只读', engine: 'kaka', engineLabel: 'KaKa 会话引擎', adapter: '内置', use: '打开目录、建立项目画像' },
  { id: 'planner', name: '规划器', role: '任务范围', status: '常用', description: '把用户请求整理成任务范围、阶段、节点、产物和失败回退。', permission: '只读', engine: 'kaka', engineLabel: 'KaKa 会话引擎', adapter: '内置', use: '任务拆解、工作流草稿' },
  { id: 'builder', name: '构建器', role: '文件与产物', status: '需确认', description: '生成文档、原型、脚本或代码变更；所有写入和命令执行先进入审批。', permission: '写入前确认', engine: 'kaka', engineLabel: 'KaKa 会话引擎', adapter: '内置', use: '产物生成、脚本化沉淀' },
  { id: 'verifier', name: '验证器', role: '独立检查', status: '启用', description: '独立检查产物、链接、规则和失败条件，不继承执行 Agent 的会话记忆。', permission: '只读、隔离上下文', engine: 'kaka', engineLabel: 'KaKa 会话引擎', adapter: '内置', use: '验证、回归、淘汰机制' },
  { id: 'claude-code', name: 'Claude Code 执行器', role: '复杂代码任务托管', status: '可接入', description: '适合把明确的代码改造、测试修复、PR 准备托管给 Claude Code CLI 或 Agent SDK。', permission: '外部审批', engine: 'claude', engineLabel: 'Claude Code', adapter: 'CLI / Agent SDK', use: '代码库修改、测试、提交建议' },
  { id: 'codex-cli', name: 'Codex 执行器', role: '本地终端编码 Agent', status: '可接入', description: '适合把当前目录中的实现、检查和补丁任务交给本地 Codex CLI。', permission: '外部审批', engine: 'codex', engineLabel: 'OpenAI Codex CLI', adapter: 'CLI / SDK', use: '代码修改、命令执行、补丁' },
  { id: 'opencode', name: 'OpenCode 执行器', role: '多模型终端 Agent', status: '可接入', description: '适合需要多模型供应商、自定义 API Key 和终端 TUI 的执行阶段。', permission: '外部审批', engine: 'opencode', engineLabel: 'OpenCode', adapter: 'CLI', use: '多模型执行、终端自动化' },
  { id: 'gemini-cli', name: 'Gemini CLI 执行器', role: '大上下文与搜索辅助', status: '可接入', description: '适合使用 Gemini 的长上下文、搜索 grounding、文件操作和 shell 工具能力。', permission: '外部审批', engine: 'gemini', engineLabel: 'Gemini CLI', adapter: 'CLI', use: '大上下文分析、搜索、自动化' },
  { id: 'aider', name: 'Aider 执行器', role: '结对编程补丁', status: '可接入', description: '适合较明确的代码补丁和 Git 工作流，偏轻量结对编程。', permission: '外部审批', engine: 'aider', engineLabel: 'Aider', adapter: 'CLI', use: '小步代码修改、提交前整理' }
];

const agentEngines = [
  { id: 'kaka', name: 'KaKa 会话引擎', kind: '内置', status: '默认', command: '内置 runtime', summary: '负责会话记忆、上下文控制、审批、Skill 和工作流生成。' },
  { id: 'claude', name: 'Claude Code', kind: '第三方', status: '可接入', command: 'claude', summary: 'CLI、桌面、Web、IDE 和 Agent SDK，适合复杂代码执行。' },
  { id: 'codex', name: 'OpenAI Codex CLI', kind: '第三方', status: '可接入', command: 'codex', summary: '本地终端编码 Agent，可使用 ChatGPT 计划或 API Key。' },
  { id: 'opencode', name: 'OpenCode', kind: '第三方', status: '可接入', command: 'opencode', summary: '终端优先、多模型供应商，Windows 推荐 WSL。' },
  { id: 'gemini', name: 'Gemini CLI', kind: '第三方', status: '可接入', command: 'gemini', summary: '开源终端 Agent，支持文件、shell、搜索 grounding 和 MCP。' },
  { id: 'aider', name: 'Aider', kind: '第三方', status: '可接入', command: 'aider', summary: '轻量 CLI 结对编程，适合小步补丁与 Git 迭代。' }
];

const fallbackSessionEngines = [
  { id: 'kaka', name: 'KaKa 内置', type: 'builtin', command: '', status: 'default', summary: '负责会话记忆、上下文、审批、Skill 和工作流沉淀。' },
  { id: 'codex', name: 'Codex CLI', type: 'cli', command: 'codex', status: 'available', summary: '适合把明确的本地实现任务交给 Codex CLI。' },
  { id: 'claude-code', name: 'Claude Code', type: 'cli', command: 'claude', status: 'available', summary: '适合复杂代码库执行任务。' },
  { id: 'opencode', name: 'OpenCode', type: 'cli', command: 'opencode', status: 'available', summary: '适合多模型终端 Agent 执行阶段。' },
  { id: 'gemini-cli', name: 'Gemini CLI', type: 'cli', command: 'gemini', status: 'available', summary: '适合长上下文分析和终端自动化。' },
  { id: 'aider', name: 'Aider', type: 'cli', command: 'aider', status: 'available', summary: '适合小步代码补丁和 Git 迭代。' }
];

const workflowNodes = [
  { id: 'start', title: '开始', body: '用户输入任务或打开目录。', badge: '入口', cls: 'n-start' },
  { id: 'read', title: '理解目录', body: '读取结构、README 和关键文件。', badge: '只读', cls: 'n-read' },
  { id: 'plan', title: '确认任务', body: '整理目标、范围、产物和风险。', badge: '当前', cls: 'n-plan active' },
  { id: 'build', title: '执行', body: '生成或修改文件，写入前确认。', badge: '等待', cls: 'n-build' },
  { id: 'branch', title: '复杂度判断', body: '任务不确定时进入探索分支。', badge: '条件', cls: 'n-branch' },
  { id: 'verify', title: '独立验证', body: '检查产物，不继承执行上下文。', badge: '验证', cls: 'n-verify' },
  { id: 'fail', title: '失败处理', body: '记录失败，回退或生成新规则。', badge: '回路', cls: 'n-fail' },
  { id: 'end', title: '结束', body: '归档结果、证据和可复用节点。', badge: '终点', cls: 'n-end', terminal: true }
];

const publicWorkflows = [
  { id: 'general', name: '通用任务流', role: '对话、规划、执行、验证', status: '公共', scope: '公共', nodes: cloneWorkflowNodes(workflowNodes) },
  { id: 'folder', name: '目录理解流', role: '读取项目并生成画像', status: '默认', scope: '公共', nodes: cloneWorkflowNodes(workflowNodes.filter((node) => ['start', 'read', 'plan', 'verify', 'end'].includes(node.id))) },
  { id: 'verify', name: '独立验证流', role: '隔离上下文检查产物', status: '公共', scope: '公共', nodes: cloneWorkflowNodes(workflowNodes.filter((node) => ['start', 'plan', 'verify', 'fail', 'end'].includes(node.id))) }
];

const workflowNodeSize = { width: 216, height: 124 };
const workflowLayoutGap = { x: 320, y: 238 };
const workflowEdgeClearance = 8;

function cloneWorkflowNodes(nodes) {
  return nodes.map((node) => ({ kind: 'ai', ...node }));
}

const skillRegistry = [
  {
    id: 'general-planning',
    name: '通用任务规划',
    triggers: ['计划', '规划', '整理', '需求', '目标', '怎么做'],
    summary: '把模糊请求整理成目标、步骤、边界和验收标准。',
    permission: 'read'
  },
  {
    id: 'project-context',
    name: '项目目录理解',
    triggers: ['目录', '项目', '代码', '文件', 'bug', '页面', '样式', '运行'],
    summary: '读取目录画像、入口线索和项目上下文。',
    permission: 'read'
  },
  {
    id: 'independent-verifier',
    name: '独立验证',
    triggers: ['验证', '测试', '检查', '校验', '风险', '确认'],
    summary: '用隔离上下文检查产物和完成条件。',
    permission: 'read-isolated'
  },
  {
    id: 'command-approval',
    name: '命令审批',
    triggers: ['执行', '命令', '安装', '运行', '构建', '删除', '写入'],
    summary: '识别命令风险级别，写入和执行前必须等待用户确认。',
    permission: 'approval-required'
  }
];

const state = {
  currentFolder: null,
  recent: [],
  conversations: [],
  currentConversationId: null,
  availableSkills: [],
  selectedWorkflowId: 'general',
  messages: [],
  pendingPrompt: '',
  intent: null,
  taskPlan: [],
  verification: [],
  assistantDraft: '',
  model: { provider: 'mock', model: 'mock', configured: false },
  settings: {
    version: 1,
    defaultSessionEngineId: 'kaka',
    skillScope: 'project-first',
    workflowDistillation: 'manual',
    engineInitMode: 'ask'
  },
  engines: fallbackSessionEngines,
  engineChecks: {},
  composer: {
    permission: 'read',
    model: 'current',
    engineId: 'kaka',
    sessionTokens: 0,
    modelStatus: ''
  },
  workflowComposer: {
    selectedNodes: [],
    mentionOpen: false,
    mentionQuery: ''
  },
  currentWorkspaceTab: 'chat',
  inspectorVisible: true,
  filesVisible: false,
  workspace: null,
  selectedAgentId: 'conversation',
  agentFilter: 'all',
  selectedEvidenceId: ''
};

let thoughtScrollActivityTimer = null;

const views = {
  home: document.querySelector('#homeView'),
  workspace: document.querySelector('#workspaceView'),
  workflow: document.querySelector('#workflowView'),
  agents: document.querySelector('#agentsView'),
  settings: document.querySelector('#settingsView')
};

function switchView(name) {
  const target = name;

  Object.entries(views).forEach(([key, element]) => {
    element.classList.toggle('active', key === target);
  });
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === target);
  });
  renderConversations();
  renderRecent();
  if (target === 'settings') renderSettings();
  updateWindowTitle(target);
}

function updateWindowTitle(viewName) {
  const title = document.querySelector('#windowTitle');
  if (!title) return;
  if (viewName === 'agents') {
    title.textContent = '智能体库';
    return;
  }
  if (viewName === 'settings') {
    title.textContent = '设置';
    return;
  }
  if (viewName === 'workflow') {
    title.textContent = state.currentFolder ? `${state.currentFolder.rootPath} / 工作流库` : '工作流库';
    return;
  }
  if (viewName === 'workspace') {
    title.textContent = state.currentFolder ? state.currentFolder.rootPath : '新对话';
    return;
  }
  title.textContent = state.currentFolder ? state.currentFolder.rootPath : '未打开目录';
}

function init() {
  bindNavigation();
  bindWorkspaceTabs();
  bindFileToggle();
  bindInspectorToggle();
  bindEvidenceBox();
  bindThoughtScroll();
  renderAgents();
  renderHomeWorkflows();
  renderWorkflow();
  renderWorkspaceWorkflow();
  renderWorkflowMini();
  renderFolderProfile(null);
  renderTaskPlan();
  renderVerification();
  renderSessionState();
  renderMessages();
  renderConversations();
  renderRecent();
  bindHomeComposer();
  bindPlanActions();
  bindFolderButtons();
  bindComposer();
  bindWorkflowActions();
  bindWorkflowComposer();
  bindSessionActions();
  bindAgentActions();
  bindSettingsActions();
  loadStartupContext();
  updateFilesVisibility();
  updateInspectorVisibility();
}

function bindNavigation() {
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.view));
  });
}

function bindWorkspaceTabs() {
  document.querySelectorAll('[data-workspace-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      switchView('workspace');
      switchWorkspaceTab(button.dataset.workspaceTab);
    });
  });
}

function bindFileToggle() {
  const button = document.querySelector('#toggleFilesButton');
  if (!button) return;
  button.addEventListener('click', () => {
    state.filesVisible = !state.filesVisible;
    updateFilesVisibility();
  });
}

function bindInspectorToggle() {
  const button = document.querySelector('#toggleInspectorButton');
  if (!button) return;
  button.addEventListener('click', () => {
    state.inspectorVisible = !state.inspectorVisible;
    updateInspectorVisibility();
  });
}

function bindEvidenceBox() {
  const box = document.querySelector('#evidenceBox');
  if (!box) return;
  box.addEventListener('click', (event) => {
    const item = event.target.closest('[data-evidence-id]');
    if (!item) return;
    state.selectedEvidenceId = item.dataset.evidenceId;
    renderFileSources();
  });
}

function bindThoughtScroll() {
  const messages = document.querySelector('#messages');
  if (!messages) return;
  messages.addEventListener('scroll', () => {
    markThoughtActivity();
    updateThoughtScroll();
  }, { passive: true });
  window.addEventListener('resize', updateThoughtScroll);
}

function updateFilesVisibility() {
  renderFileSources();
}

function updateInspectorVisibility() {
  const workbench = document.querySelector('#workspaceView .workbench');
  const inspector = document.querySelector('#workspaceInspector');
  const button = document.querySelector('#toggleInspectorButton');
  if (!workbench || !inspector || !button) return;
  workbench.classList.toggle('inspector-collapsed', !state.inspectorVisible);
  inspector.classList.toggle('collapsed', !state.inspectorVisible);
  button.textContent = state.inspectorVisible ? '›' : '‹';
  button.title = state.inspectorVisible ? '隐藏上下文栏' : '展开上下文栏';
  button.setAttribute('aria-label', button.title);
}

function switchWorkspaceTab(name) {
  state.currentWorkspaceTab = name;
  document.querySelectorAll('[data-workspace-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.workspaceTab === name);
  });
  document.querySelector('#workspaceChatPanel').classList.toggle('active', name === 'chat');
  document.querySelector('#workspaceFilesPanel').classList.toggle('active', name === 'files');
  document.querySelector('#workspaceWorkflowPanel').classList.toggle('active', name === 'workflow');
  if (name === 'workflow') {
    renderWorkspaceWorkflow();
    const title = document.querySelector('#windowTitle');
    if (title) {
      title.textContent = state.currentFolder
        ? `${state.currentFolder.rootPath} / 当前目录工作流`
        : '新对话 / 当前工作流';
    }
  } else if (name === 'files') {
    renderFileSources();
    const title = document.querySelector('#windowTitle');
    if (title) {
      title.textContent = state.currentFolder
        ? `${state.currentFolder.rootPath} / 文件`
        : '新对话 / 文件';
    }
  } else {
    updateWindowTitle('workspace');
  }
  updateInspectorStageFocus(name);
  renderSessionState();
}

function bindFolderButtons() {
  const openFolderTop = document.querySelector('#openFolderTop');
  if (openFolderTop) openFolderTop.addEventListener('click', openFolder);
  document.querySelector('#openFolderMain').addEventListener('click', openFolder);
}

function bindWorkflowActions() {
  const createButton = document.querySelector('#createWorkflowButton');
  const duplicateButton = document.querySelector('#duplicateWorkflowButton');
  const publishButton = document.querySelector('#publishWorkflowButton');
  const saveButton = document.querySelector('#saveWorkflowButton');
  const initEngineButton = document.querySelector('#initEngineButton');
  const search = document.querySelector('#workflowSearch');
  const kindToggle = document.querySelector('#selectedNodeKindToggle');

  if (createButton) createButton.addEventListener('click', createWorkflowDraft);
  if (duplicateButton) duplicateButton.addEventListener('click', duplicateSelectedWorkflow);
  if (publishButton) publishButton.addEventListener('click', publishSelectedWorkflow);
  if (saveButton) saveButton.addEventListener('click', () => addLog('工作流', '当前工作流已保存'));
  if (initEngineButton) initEngineButton.addEventListener('click', initializeCurrentProjectEngine);
  if (search) search.addEventListener('input', renderWorkflowList);
  if (kindToggle) {
    kindToggle.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-node-kind]');
      if (!button) return;
      updateSelectedWorkflowNodeKind(button.dataset.nodeKind);
    });
  }
}

function bindWorkflowComposer() {
  const form = document.querySelector('#workflowComposer');
  const input = document.querySelector('#workflowInput');
  if (!form || !input) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitWorkflowEdit();
  });
  input.addEventListener('keydown', (event) => {
    if (handleWorkflowMentionKeys(event)) return;
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submitWorkflowEdit();
    }
  });
  input.addEventListener('input', updateWorkflowMentionMenu);
  input.addEventListener('click', updateWorkflowMentionMenu);
  input.addEventListener('blur', () => {
    setTimeout(() => closeWorkflowMentionMenu(), 120);
  });
}

function submitWorkflowEdit() {
  const input = document.querySelector('#workflowInput');
  if (!input) return;
  const text = getWorkflowInputText(input).trim();
  if (!text) return;
  const workflow = getSelectedWorkflow();
  workflow.edits = Array.isArray(workflow.edits) ? workflow.edits : [];
  const mentioned = getWorkflowSelectedNodes(workflow, text);
  workflow.edits.unshift({
    id: `workflow-edit-${Date.now()}`,
    text,
    nodes: mentioned.map((node) => node.id),
    createdAt: Date.now()
  });
  workflow.edits = workflow.edits.slice(0, 12);
  if (mentioned[0]) {
    workflow.selectedNodeId = mentioned[0].id;
    selectWorkflowNode(mentioned[0]);
  }
  setWorkflowInputText(input, '');
  state.workflowComposer.selectedNodes = [];
  closeWorkflowMentionMenu();
  addLog('工作流', mentioned.length ? `调整 ${mentioned.map((node) => node.title).join('、')}` : '新增调整指令');
  persistAppState();
  renderWorkflow();
}

function getWorkflowSelectedNodes(workflow, text) {
  const selectedIds = new Set(state.workflowComposer.selectedNodes);
  findMentionedWorkflowNodes(workflow, text).forEach((node) => selectedIds.add(node.id));
  return workflow.nodes.filter((node) => selectedIds.has(node.id));
}

function findMentionedWorkflowNodes(workflow, text) {
  return workflow.nodes.filter((node) => {
    return text.includes(`@${node.title}`) || text.includes(`@${node.id}`);
  });
}

function updateWorkflowMentionMenu() {
  const input = document.querySelector('#workflowInput');
  const menu = document.querySelector('#workflowMentionMenu');
  const workflow = getSelectedWorkflow();
  if (!input || !menu || !workflow) return;
  const token = getWorkflowMentionToken(input);
  if (!token) {
    closeWorkflowMentionMenu();
    return;
  }
  const query = token.query.toLowerCase();
  const matches = workflow.nodes
    .filter((node) => `${node.title} ${node.id}`.toLowerCase().includes(query))
    .slice(0, 7);
  if (!matches.length) {
    closeWorkflowMentionMenu();
    return;
  }
  state.workflowComposer.mentionOpen = true;
  state.workflowComposer.mentionQuery = token.query;
  menu.classList.add('active');
  menu.innerHTML = matches.map((node, index) => `
    <button class="${index === 0 ? 'active' : ''}" type="button" data-node-id="${escapeHtml(node.id)}">
      <strong>${escapeHtml(node.title)}</strong>
      <span>${escapeHtml(resolveNodeAgent(node))}</span>
    </button>
  `).join('');
  menu.querySelectorAll('button').forEach((button) => {
    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      chooseWorkflowMention(button.dataset.nodeId);
    });
  });
}

function getWorkflowMentionToken(input) {
  const before = getWorkflowTextBeforeCaret(input);
  const match = before.match(/(^|\s)@([^\s@]*)$/);
  if (!match) return null;
  const query = match[2] || '';
  return {
    query,
    start: before.length - query.length - 1,
    end: before.length
  };
}

function handleWorkflowMentionKeys(event) {
  const menu = document.querySelector('#workflowMentionMenu');
  if (!menu || !menu.classList.contains('active')) return false;
  const buttons = Array.from(menu.querySelectorAll('button'));
  const current = Math.max(0, buttons.findIndex((button) => button.classList.contains('active')));
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const next = event.key === 'ArrowDown'
      ? Math.min(buttons.length - 1, current + 1)
      : Math.max(0, current - 1);
    buttons.forEach((button, index) => button.classList.toggle('active', index === next));
    return true;
  }
  if (event.key === 'Enter' || event.key === 'Tab') {
    event.preventDefault();
    const active = buttons[current] || buttons[0];
    if (active) chooseWorkflowMention(active.dataset.nodeId);
    return true;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    closeWorkflowMentionMenu();
    return true;
  }
  return false;
}

function chooseWorkflowMention(nodeId) {
  const workflow = getSelectedWorkflow();
  const node = workflow.nodes.find((item) => item.id === nodeId);
  if (!node) return;
  insertWorkflowMention(node.title);
  if (!state.workflowComposer.selectedNodes.includes(node.id)) {
    state.workflowComposer.selectedNodes.push(node.id);
  }
  workflow.selectedNodeId = node.id;
  closeWorkflowMentionMenu();
  renderWorkflow();
}

function insertWorkflowMention(title) {
  const input = document.querySelector('#workflowInput');
  if (!input) return;
  const token = getWorkflowMentionToken(input);
  const mention = `@${title} `;
  if (input.isContentEditable) {
    insertWorkflowMentionElement(input, title, token);
    return;
  }
  const start = token ? token.start : (input.selectionStart || input.value.length);
  const end = token ? token.end : (input.selectionEnd || input.value.length);
  input.value = `${input.value.slice(0, start)}${mention}${input.value.slice(end)}`;
  input.focus();
  input.selectionStart = input.selectionEnd = start + mention.length;
}

function getWorkflowInputText(input) {
  if (!input) return '';
  if (input.isContentEditable) return input.innerText.replace(/\u00a0/g, ' ');
  return input.value || '';
}

function setWorkflowInputText(input, text) {
  if (!input) return;
  if (input.isContentEditable) {
    input.innerHTML = escapeHtml(text || '');
    return;
  }
  input.value = text || '';
}

function getWorkflowTextBeforeCaret(input) {
  if (!input?.isContentEditable) {
    const cursor = input.selectionStart || 0;
    return input.value.slice(0, cursor);
  }
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return '';
  const range = selection.getRangeAt(0).cloneRange();
  const before = range.cloneRange();
  before.selectNodeContents(input);
  before.setEnd(range.endContainer, range.endOffset);
  return before.toString();
}

function insertWorkflowMentionElement(input, title, token) {
  input.focus();
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const deleteCount = token ? token.query.length + 1 : 0;
  for (let index = 0; index < deleteCount; index += 1) {
    selection.modify('extend', 'backward', 'character');
  }
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const mention = document.createElement('span');
  mention.className = 'workflow-inline-mention';
  mention.dataset.nodeTitle = title;
  mention.textContent = `@${title}`;
  const space = document.createTextNode('\u00a0');
  range.insertNode(space);
  range.insertNode(mention);
  const next = document.createRange();
  next.setStartAfter(space);
  next.collapse(true);
  selection.removeAllRanges();
  selection.addRange(next);
}

function closeWorkflowMentionMenu() {
  const menu = document.querySelector('#workflowMentionMenu');
  if (!menu) return;
  state.workflowComposer.mentionOpen = false;
  state.workflowComposer.mentionQuery = '';
  menu.classList.remove('active');
  menu.innerHTML = '';
}


function bindSessionActions() {
  ['#sessionToolList', '#approvalDock'].forEach((selector) => {
    const container = document.querySelector(selector);
    if (!container) return;
    container.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-approval-action]');
      if (!button) return;
      handleApprovalAction(button.dataset.approvalId, button.dataset.approvalAction);
    });
  });
}

async function handleApprovalAction(id, action) {
  const session = getCurrentSession();
  if (!session) return;
  const approval = (session.approvals || []).find((item) => item.id === id);
  if (!approval) return;

  if (action === 'reject') {
    approval.status = '已拒绝';
    recordSessionEvent('approval-rejected', approval.summary || approval.command);
    addLog('审批', '已拒绝');
    saveCurrentConversation();
    return;
  }

  if (action === 'approve') {
    approval.status = '已批准';
    recordSessionEvent('approval-approved', approval.summary || approval.command);
    addLog('审批', approval.command ? `允许执行 ${approval.command}` : '允许进入下一步');
    saveCurrentConversation();
    return;
  }

  if (action === 'run') {
    if (!approval.command) {
      approval.status = '无命令';
      saveCurrentConversation();
      return;
    }
    approval.status = '执行中';
    renderSessionState();
    addLog('命令', approval.command);
    const result = await window.kaka.runCommand({
      command: approval.command,
      cwd: session.projectPath || state.currentFolder?.rootPath || undefined
    });
    approval.status = result.ok ? '已完成' : '失败';
    const toolRun = {
      id: `tool-${Date.now()}`,
      type: 'CLI',
      command: approval.command,
      status: result.ok ? '成功' : '失败',
      exitCode: result.exitCode,
      durationMs: result.durationMs || 0,
      stdout: result.stdout || '',
      stderr: result.stderr || result.error || '',
      createdAt: Date.now()
    };
    session.toolRuns.unshift(toolRun);
    if (result.ok) {
      addMessage(formatCommandResult(result), 'assistant');
      addVerification('通过', `命令 ${approval.command} 已执行，退出码 ${result.exitCode || 0}。`);
      addSessionArtifact({
        type: 'command',
        title: approval.command,
        summary: createCommandArtifactSummary(result)
      }, session);
      addUnique(session.memory.decisions, `已获得命令证据：${approval.command}`, 8);
      recordSessionEvent('command-finished', approval.command);
    } else {
      addMessage(formatCommandResult(result), 'assistant');
      addVerification('失败', result.error || result.stderr || `命令 ${approval.command} 执行失败。`);
      session.memory.failures.unshift(result.error || result.stderr || approval.command);
      addSessionArtifact({
        type: 'command',
        title: `${approval.command} 失败`,
        summary: createCommandArtifactSummary(result)
      }, session);
      recordSessionEvent('command-failed', result.error || approval.command);
    }
    await runIsolatedVerification('命令执行', {
      toolRuns: [toolRun],
      criteria: [
        `命令 ${approval.command} 必须有退出码和输出证据`,
        result.ok ? '命令执行结果应为成功' : '失败命令必须进入失败记录',
        '验证输入不得包含聊天消息或会话记忆'
      ]
    });
    saveCurrentConversation();
  }
}

function formatCommandResult(result) {
  if (!result.ok && result.error) return `命令没有执行：${result.error}`;
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  const clipped = output.length > 900 ? `${output.slice(0, 900)}\n...` : output;
  return `命令：${result.command}\n退出码：${result.exitCode || 0}\n${clipped || '没有输出。'}`;
}

function createCommandArtifactSummary(result) {
  const output = [result.stdout, result.stderr, result.error].filter(Boolean).join('\n').trim();
  const clipped = output.length > 360 ? `${output.slice(0, 360)}...` : output;
  return `退出码 ${result.exitCode || 0}，耗时 ${Math.round((result.durationMs || 0) / 100) / 10}s。${clipped || '没有输出。'}`;
}

function bindPlanActions() {
  const runPlan = document.querySelector('#runPlan');
  const convertWorkflow = document.querySelector('#convertWorkflow');
  if (runPlan) runPlan.addEventListener('click', executeFirstPlanStep);
  if (convertWorkflow) convertWorkflow.addEventListener('click', () => {
    createWorkflowFromCurrentSession();
  });
  const sessionToWorkflow = document.querySelector('#sessionToWorkflow');
  if (sessionToWorkflow) sessionToWorkflow.addEventListener('click', createWorkflowFromCurrentSession);
  const lockGoalButton = document.querySelector('#lockGoalButton');
  if (lockGoalButton) lockGoalButton.addEventListener('click', toggleGoalLock);
  const markGoalDoneButton = document.querySelector('#markGoalDoneButton');
  if (markGoalDoneButton) markGoalDoneButton.addEventListener('click', markGoalDone);
  const handoffEngineButton = document.querySelector('#handoffEngineButton');
  if (handoffEngineButton) handoffEngineButton.addEventListener('click', createCurrentSessionHandoff);
  const importHandoffResultButton = document.querySelector('#importHandoffResultButton');
  if (importHandoffResultButton) importHandoffResultButton.addEventListener('click', importCurrentSessionHandoffResult);
}

function bindAgentActions() {
  const createButton = document.querySelector('#createAgentButton');
  if (createButton) createButton.addEventListener('click', createAgentDraft);
  document.querySelectorAll('#agentsView .agents-filter button').forEach((button, index) => {
    const filter = ['all', 'builtin', 'external'][index] || 'all';
    button.addEventListener('click', () => {
      state.agentFilter = filter;
      renderAgents();
    });
  });
}

function createWorkflowFromCurrentSession() {
  const session = getCurrentSession();
  const material = collectWorkflowMaterial(session);
  if (!material.ready) {
    addMessage('这段对话还没有沉淀出足够的工作流素材。你可以继续补充目标、输入、阶段或验证规则。', 'assistant');
    renderSessionState();
    return;
  }
  const plan = material.stages.length ? material.stages.map((stage, index) => ({
    title: stage,
    body: `基于当前会话素材执行阶段：${stage}`,
    agent: material.nodes[index] || 'WorkflowAgent',
    permission: '只读',
    status: index === 0 ? '当前' : '等待'
  })) : (state.taskPlan.length ? state.taskPlan : createPlan(state.pendingPrompt, state.intent, state.currentFolder));
  state.taskPlan = plan;
  if (session) {
    session.taskState = session.taskState || createTaskState('');
    session.taskState.goal = material.goal;
    session.goalState = normalizeGoalState(session.goalState, material.goal);
  }
  state.pendingPrompt = material.goal || state.pendingPrompt;
  renderTaskPlan();
  const workflow = createWorkflowDraftFromSession(session, plan);
  state.selectedWorkflowId = workflow.id;
  addSessionArtifact({
    type: 'workflow',
    title: workflow.name,
    summary: `${workflow.nodes.length} 个节点，来源于当前会话沉淀素材。`,
    workflowId: workflow.id
  });
  addLog('工作流', '当前会话已生成工作流草稿');
  addVerification('通过', '已通过内置工作流生成能力，从会话素材生成工作流草稿。');
  saveCurrentConversation();
  renderHomeWorkflows();
  renderWorkflow();
  switchView('workspace');
  switchWorkspaceTab('workflow');
}

function toggleGoalLock() {
  const session = getCurrentSession();
  if (!session) return;
  session.goalState = normalizeGoalState(session.goalState, session.memory?.goal || session.title);
  session.goalState = updateGoalState(session.goalState, {
    status: session.goalState.status === 'locked' ? 'active' : 'locked',
    source: 'manual'
  });
  addLog('目标', session.goalState.status === 'locked' ? '已锁定' : '已解锁');
  saveCurrentConversation();
}

function markGoalDone() {
  const session = getCurrentSession();
  if (!session) return;
  session.goalState = updateGoalState(normalizeGoalState(session.goalState, session.memory?.goal || session.title), {
    status: 'done',
    source: 'manual'
  });
  addVerification('通过', `目标已标记完成：${session.goalState.title}`);
  saveCurrentConversation();
}

async function createCurrentSessionHandoff() {
  const session = getCurrentSession();
  if (!session || !window.kaka.createEngineHandoff) return;
  const engine = getSessionEngine(session.engineId || state.composer.engineId || state.settings.defaultSessionEngineId);
  const material = collectWorkflowMaterial(session);
  try {
    addLog('引擎', `生成 ${engine.name} 交接包`);
    const result = await window.kaka.createEngineHandoff({
      engineId: engine.id,
      projectPath: session.projectPath || state.currentFolder?.rootPath || '',
      workspacePath: session.workspacePath || '',
      goal: session.goalState?.title || material.goal || session.memory?.goal || session.title,
      contextSummary: session.context?.summary || material.inputs.join('\n'),
      skills: (session.skills || []).map((skill) => `${skill.name || skill.id}：${skill.summary || skill.reason || ''}`),
      constraints: material.constraints,
      validation: material.validation,
      nextActions: material.stages.map((stage) => stage.title || stage)
    });
    if (!result?.ok) {
      addVerification('失败', `引擎交接失败：${result?.error || '未知错误'}`);
      renderVerification();
      return;
    }
    addSessionArtifact({
      type: 'engine-handoff',
      title: `${engine.name} 交接包`,
      summary: result.relativePath,
      path: result.path,
      command: result.suggestedCommand || ''
    }, session);
    addUnique(session.memory.decisions, `已生成 ${engine.name} 交接包：${result.relativePath}`, 8);
    recordSessionEvent('engine-handoff-created', result.relativePath);
    addMessage(`已生成 ${engine.name} 交接包：${result.relativePath}${result.suggestedCommand ? `\n建议命令：${result.suggestedCommand}` : ''}`, 'assistant');
    addVerification('通过', '已生成可审计交接包；外部引擎执行仍需单独审批和证据回收。');
    saveCurrentConversation();
  } catch (error) {
    addVerification('失败', `引擎交接失败：${formatModelError(error.message)}`);
    renderVerification();
  }
}

async function importCurrentSessionHandoffResult() {
  const session = getCurrentSession();
  if (!session || !window.kaka.importEngineHandoffResult) return;
  const engine = getSessionEngine(session.engineId || state.composer.engineId || state.settings.defaultSessionEngineId);
  try {
    addLog('引擎', `导入 ${engine.name} 结果`);
    const response = await window.kaka.importEngineHandoffResult({ engineId: engine.id });
    if (!response) return;
    if (!response.ok) {
      addVerification('失败', `导入结果失败：${response.error}`);
      renderVerification();
      return;
    }
    const result = response.result;
    const title = `${engine.name} 结果`;
    addSessionArtifact({
      type: 'engine-result',
      title,
      summary: result.summary,
      path: result.filePath,
      status: result.status,
      evidence: result.evidence
    }, session);
    if (result.status === 'failed') {
      session.memory.failures.unshift(result.summary);
      addUnique(session.memory.nextActions, '根据外部引擎失败结果调整下一轮计划', 8);
      session.goalState = updateGoalState(normalizeGoalState(session.goalState, session.memory.goal || session.title), {
        risks: [...(session.goalState?.risks || []), result.summary].slice(0, 8),
        source: 'engine-result'
      });
    } else {
      addUnique(session.memory.decisions, `已导入 ${engine.name} 结果：${result.status}`, 8);
      addUnique(session.memory.nextActions, '基于外部结果更新工作流节点和验证规则', 8);
      session.goalState = updateGoalState(normalizeGoalState(session.goalState, session.memory.goal || session.title), {
        acceptance: [...(session.goalState?.acceptance || []), `${engine.name} 结果：${formatHandoffResultStatus(result.status)}`].slice(0, 8),
        source: 'engine-result'
      });
    }
    recordSessionEvent('engine-result-imported', `${result.status} ${result.filePath}`);
    addMessage(`已导入 ${engine.name} 结果：${formatHandoffResultStatus(result.status)}\n${result.summary}`, 'assistant');
    await runIsolatedVerification('外部引擎结果导入', {
      artifacts: [{
        title,
        summary: result.summary,
        status: result.status,
        content: result.evidence
      }],
      criteria: result.validationHints || []
    });
    saveCurrentConversation();
  } catch (error) {
    addVerification('失败', `导入结果失败：${formatModelError(error.message)}`);
    renderVerification();
  }
}

function formatHandoffResultStatus(status) {
  if (status === 'completed') return '完成';
  if (status === 'failed') return '失败';
  if (status === 'empty') return '空结果';
  return '已记录';
}

function createWorkflowDraftFromSession(session, plan) {
  const id = `workflow-${Date.now()}`;
  const goal = session?.taskState?.goal || state.pendingPrompt || '未命名目标';
  const nodes = [
    { ...workflowNodes[0], kind: 'ai', title: '开始', body: goal, cls: 'n-start' },
    ...plan.slice(0, 6).map((step, index) => ({
      id: `s-${Date.now().toString(36)}-${index}`,
      title: step.title || `阶段 ${index + 1}`,
      body: step.body || '整理输入、动作和产物。',
      badge: step.status || '等待',
      cls: index === 0 ? 'n-plan active' : index % 3 === 1 ? 'n-build' : 'n-read',
      kind: step.agent && step.agent.includes('验证') ? 'ai' : 'ai',
      promptName: `${step.agent || 'Agent'} Prompt`
    })),
    { ...workflowNodes[7], kind: 'ai', cls: 'n-end' }
  ];
  const workflow = {
    id,
    name: createConversationTitle(goal),
    role: session?.projectPath ? '项目会话沉淀' : '会话沉淀工作流',
    status: '草稿',
    scope: session?.projectPath ? '当前项目' : '私有',
    selectedNodeId: nodes[1]?.id || nodes[0].id,
    nodes: cloneWorkflowNodes(nodes)
  };
  publicWorkflows.unshift(workflow);
  return workflow;
}

function bindHomeComposer() {
  const composer = document.querySelector('#homeComposer');
  const input = document.querySelector('#homePrompt');
  updateHomePromptState();

  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    analyzeHomePrompt();
  });

  input.addEventListener('input', updateHomePromptState);
  input.addEventListener('focus', updateHomePromptState);
  input.addEventListener('blur', updateHomePromptState);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      analyzeHomePrompt();
    }
  });
}

function updateHomePromptState() {
  const input = document.querySelector('#homePrompt');
  const composer = document.querySelector('#homeComposer');
  if (!input) return;
  const hasText = input.value.trim().length > 0;
  input.classList.toggle('has-text', hasText);
  if (composer) {
    composer.classList.toggle('home-prompt-focused', document.activeElement === input);
    composer.classList.toggle('home-prompt-empty', !hasText);
  }
}

function bindComposer() {
  const composer = document.querySelector('#composer');
  const input = document.querySelector('#messageInput');
  const permissionMode = document.querySelector('#permissionMode');
  const modelSelect = document.querySelector('#modelSelect');
  const engineSelect = document.querySelector('#engineSelect');
  const attachButton = document.querySelector('#attachButton');

  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    sendComposerMessage();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      sendComposerMessage();
    }
  });

  input.addEventListener('input', () => {
    resizeComposerInput();
    updateTokenUsage();
  });

  permissionMode.addEventListener('change', () => {
    state.composer.permission = permissionMode.value;
  });

  modelSelect.addEventListener('change', () => {
    state.composer.model = modelSelect.value;
    updateTokenUsage();
  });

  if (engineSelect) {
    engineSelect.addEventListener('change', () => {
      state.composer.engineId = engineSelect.value;
      const session = getCurrentSession();
      if (session) {
        session.engineId = engineSelect.value;
        session.engine = getSessionEngine(engineSelect.value);
        saveCurrentConversation();
      }
      renderSessionState();
    });
  }

  attachButton.addEventListener('click', () => {
    addLog('附件', '附件入口已预留');
  });

  resizeComposerInput();
  updateTokenUsage();
}

async function sendComposerMessage() {
  const input = document.querySelector('#messageInput');
  const text = input.value.trim();
  if (!text) return;
  state.composer.sessionTokens += estimateTokens(text);
  setModelStatus('');
  addMessage(text, 'user');
  await registerApprovalIntent(text);
  saveCurrentConversation();
  input.value = '';
  resizeComposerInput();
  updateTokenUsage();
  respondToMessage(text);
}

async function registerApprovalIntent(text) {
  const session = getCurrentSession();
  if (!session) return;
  const level = detectPermissionLevel(text);
  if (level === 'read') return;
  const command = inferCommandFromText(text);
  if (!command && level === 'execute') return;
  if (command && window.kaka.validateCommand) {
    const validation = await window.kaka.validateCommand(command);
    if (!validation.ok) {
      addApproval({
        type: '命令审批',
        permission: 'blocked',
        command,
        summary: text,
        reason: validation.error,
        risk: '高',
        status: '已拦截'
      });
      addVerification('失败', `命令提案已拦截：${validation.error}`);
      saveCurrentConversation();
      return;
    }
  }
  addApproval({
    type: command ? '命令审批' : '写入审批',
    permission: command ? 'execute' : level,
    command,
    summary: text,
    reason: command ? '根据你的输入识别到可执行命令。' : '该操作涉及写入或权限提升。'
  });
}

function addApproval(proposal) {
  const session = getCurrentSession();
  if (!session) return null;
  const command = String(proposal.command || '').trim();
  const summary = String(proposal.summary || proposal.reason || command || '待审批操作').trim();
  const exists = session.approvals.some((item) => {
    return command ? item.command === command && ['待确认', '已批准', '执行中'].includes(item.status) : item.summary === summary;
  });
  if (exists) return null;
  const approval = {
    id: `approval-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: proposal.type || (command ? '命令审批' : '操作审批'),
    permission: proposal.permission || detectPermissionLevel(`${command} ${summary}`),
    status: proposal.status || '待确认',
    command,
    summary: summary.length > 48 ? `${summary.slice(0, 48)}...` : summary,
    reason: proposal.reason || '',
    risk: proposal.risk || '',
    source: proposal.source || 'rule',
    createdAt: Date.now()
  };
  session.approvals.unshift({
    ...approval
  });
  recordSessionEvent('approval-created', command || summary);
  renderSessionState();
  return approval;
}

function inferCommandFromText(text) {
  const value = text.toLowerCase();
  const match = text.match(/`([^`]+)`/);
  if (match) return match[1].trim();
  if (value.includes('node --check')) return 'node --check src\\renderer\\app.js';
  if (value.includes('git status')) return 'git status --short';
  if (value.includes('git diff')) return 'git diff --stat';
  if (value.includes('npm test') || value.includes('跑测试') || value.includes('运行测试')) return 'npm test';
  if (value.includes('npm run dev')) return 'npm run dev';
  if (value.includes('构建') && value.includes('npm')) return 'npm run build';
  return '';
}

function detectPermissionLevel(text) {
  const value = text.toLowerCase();
  if (['删除', 'remove', 'rm ', 'reset', '清空'].some((word) => value.includes(word))) return 'danger';
  if (['安装', '联网', '下载', 'npm install', 'pip install'].some((word) => value.includes(word))) return 'network';
  if (['运行', '执行', '测试', '构建', '命令', 'npm run'].some((word) => value.includes(word))) return 'execute';
  if (['写入', '修改', '生成文件', '保存'].some((word) => value.includes(word))) return 'local-write';
  return 'read';
}

function resizeComposerInput() {
  const input = document.querySelector('#messageInput');
  if (!input) return;
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 156)}px`;
}

function estimateTokens(text) {
  const value = text.trim();
  if (!value) return 0;
  return Math.max(1, Math.ceil(value.length / 3));
}

function formatTokenCount(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function updateTokenUsage() {
  const input = document.querySelector('#messageInput');
  const output = document.querySelector('#tokenUsage');
  if (!input || !output) return;
  if (state.composer.modelStatus) {
    output.textContent = state.composer.modelStatus;
    updateThoughtScroll();
    return;
  }
  const current = estimateTokens(input.value);
  output.textContent = `本轮 ${formatTokenCount(current)} / 会话 ${formatTokenCount(state.composer.sessionTokens)} tokens`;
  updateThoughtScroll();
}

function setModelStatus(text) {
  state.composer.modelStatus = text;
  updateTokenUsage();
  updateThoughtScroll();
}

function updateThoughtScroll() {
  const messages = document.querySelector('#messages');
  const indicator = document.querySelector('#thoughtScroll');
  if (!messages || !indicator) return;

  const pressure = Math.min(1, Math.max(
    state.composer.sessionTokens / 6000,
    getCurrentSession()?.context?.estimatedTokens ? getCurrentSession().context.estimatedTokens / (getCurrentSession().context.tokenBudget || 6000) : 0
  ));
  const density = Math.min(1, Math.max(0, (state.messages.length - 4) / 24));
  const pending = state.messages.some((message) => message.status === 'pending');
  const tooling = /读取|目录|验证|命令|引擎|连接|检测|导入|初始化/.test(state.composer.modelStatus || '');
  const segments = createThoughtSegments();

  messages.style.setProperty('--thought-intensity', `${clampNumber(pressure + density * .35, .2, 1).toFixed(2)}`);
  indicator.style.setProperty('--thought-intensity', `${clampNumber(pressure + density * .35, .2, 1).toFixed(2)}`);
  indicator.innerHTML = segments.map((segment, index) => `
    <span class="thought-scroll-segment" style="--segment-width:${segment.width};--segment-weight:${segment.weight};--segment-index:${index}"></span>
  `).join('');
  indicator.classList.toggle('thinking', pending && !tooling);
  indicator.classList.toggle('tooling', tooling);
  indicator.classList.toggle('active', pending || tooling || indicator.classList.contains('active'));
}

function createThoughtSegments() {
  const maxSegments = 13;
  const messages = state.messages.slice(-maxSegments);
  const source = messages.length ? messages : [{ text: '', role: 'assistant', status: '' }];
  const maxTokens = Math.max(1, ...source.map((message) => estimateTokens(message.text || '')));
  const normalized = source.map((message) => {
    const tokens = estimateTokens(message.text || '');
    const base = message.status === 'pending' ? .44 : clampNumber(tokens / maxTokens, .16, 1);
    const roleBoost = message.role === 'user' ? .08 : 0;
    return {
      width: clampNumber(base + roleBoost, .18, 1).toFixed(2),
      weight: clampNumber(base, .18, 1).toFixed(2)
    };
  });

  while (normalized.length < 7) {
    normalized.unshift({ width: '0.22', weight: '0.18' });
  }
  return normalized.slice(-maxSegments);
}

function markThoughtActivity() {
  const indicator = document.querySelector('#thoughtScroll');
  if (!indicator) return;
  indicator.classList.add('active');
  window.clearTimeout(thoughtScrollActivityTimer);
  thoughtScrollActivityTimer = window.setTimeout(() => {
    const pending = state.messages.some((message) => message.status === 'pending');
    const tooling = /读取|目录|验证|命令|引擎|连接|检测|导入|初始化/.test(state.composer.modelStatus || '');
    if (!pending && !tooling) indicator.classList.remove('active');
  }, 1400);
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

async function loadStartupContext() {
  const startup = await window.kaka.getStartupContext();
  state.workspace = startup.workspace || null;
  state.engines = normalizeSessionEngines(startup.engines);
  state.settings = normalizeSettings(startup.settings);
  state.composer.engineId = state.settings.defaultSessionEngineId;
  state.model = startup.model || state.model;
  state.availableSkills = normalizeRuntimeSkills(startup.skills);
  mergeRuntimeSkillsIntoRegistry(state.availableSkills);
  syncModelSelect();
  syncEngineSelects();
  addLog('模型', state.model.configured ? `${state.model.provider}/${state.model.model}` : '未配置，使用本地规则');
  state.conversations = normalizeSavedConversations(startup.conversations);
  state.recent = normalizeSavedProjects(startup.recent);
  restoreSavedAgents(startup.agents);
  restoreSavedWorkflows(startup.workflows);
  renderAgents();
  renderSettings();
  renderHomeWorkflows();
  renderWorkflow();
  renderConversations();
  renderRecent();
  renderFileSources();
  persistAppState();
  testModelConnection();
}

function normalizeRuntimeSkills(items) {
  return Array.isArray(items) ? items.map((skill) => ({
    id: skill.id,
    name: skill.name || skill.id,
    summary: skill.summary || '',
    permission: skill.permission || 'read',
    triggers: Array.isArray(skill.triggers) ? skill.triggers : [],
    path: skill.path || '',
    content: skill.content || ''
  })).filter((skill) => skill.id) : [];
}

function normalizeSettings(settings = {}) {
  const engineIds = new Set((state.engines?.length ? state.engines : fallbackSessionEngines).map((engine) => engine.id));
  const defaultId = engineIds.has(settings.defaultSessionEngineId) ? settings.defaultSessionEngineId : 'kaka';
  return {
    version: 1,
    defaultSessionEngineId: defaultId,
    skillScope: ['project-first', 'public-only', 'project-only'].includes(settings.skillScope) ? settings.skillScope : 'project-first',
    workflowDistillation: ['manual', 'suggest', 'auto-draft'].includes(settings.workflowDistillation) ? settings.workflowDistillation : 'manual',
    engineInitMode: ['ask', 'auto', 'off'].includes(settings.engineInitMode) ? settings.engineInitMode : 'ask'
  };
}

function normalizeSessionEngines(items) {
  const source = Array.isArray(items) && items.length ? items : fallbackSessionEngines;
  return source.map((engine) => ({
    id: engine.id,
    name: engine.name || engine.id,
    type: engine.type || 'cli',
    command: engine.command || '',
    status: engine.status || 'available',
    summary: engine.summary || '',
    instructionFiles: Array.isArray(engine.instructionFiles) ? engine.instructionFiles : [],
    capabilities: Array.isArray(engine.capabilities) ? engine.capabilities : []
  })).filter((engine) => engine.id);
}

function getSessionEngine(id = state.composer.engineId) {
  return state.engines.find((engine) => engine.id === normalizeEngineId(id)) || state.engines[0] || fallbackSessionEngines[0];
}

function normalizeEngineId(id = 'kaka') {
  const aliases = {
    claude: 'claude-code',
    gemini: 'gemini-cli',
    'codex-cli': 'codex'
  };
  return aliases[id] || id || 'kaka';
}

function getAgentEngineRegistry() {
  return state.engines.map((engine) => ({
    id: engine.id,
    name: engine.name,
    kind: engine.type === 'builtin' ? '内置' : '第三方',
    status: engine.status === 'default' ? '默认' : '可接入',
    command: engine.command || '内置 runtime',
    summary: engine.summary
  }));
}

function mergeRuntimeSkillsIntoRegistry(skills) {
  const existing = new Set(skillRegistry.map((skill) => skill.id));
  skills.forEach((skill) => {
    if (existing.has(skill.id)) return;
    skillRegistry.push({
      id: skill.id,
      name: skill.name,
      triggers: skill.triggers,
      summary: skill.summary,
      permission: skill.permission
    });
  });
}

function normalizeSavedConversations(items) {
  return Array.isArray(items) ? items.map((item) => {
    const id = item.id;
    const workspacePath = item.workspacePath || resolveConversationWorkspacePath(id);
    return {
      id,
      title: item.title || '未命名对话',
      mode: item.mode || (item.projectPath ? 'project' : 'chat'),
      projectPath: item.projectPath || null,
      engineId: item.engineId || state.settings.defaultSessionEngineId,
      engine: getSessionEngine(item.engineId || state.settings.defaultSessionEngineId),
      engineInitializedAt: item.engineInitializedAt || '',
      engineInitFiles: Array.isArray(item.engineInitFiles) ? item.engineInitFiles : [],
      goalState: normalizeGoalState(item.goalState, item.memory?.goal || item.title),
      workspacePath,
      tempFilesPath: item.tempFilesPath || joinWorkspacePath(workspacePath, 'files'),
      artifactsPath: item.artifactsPath || joinWorkspacePath(workspacePath, 'artifacts'),
      workflowsPath: item.workflowsPath || joinWorkspacePath(workspacePath, 'workflows'),
      updatedAt: item.updatedAt || Date.now(),
      messages: Array.isArray(item.messages) ? item.messages : [],
      memory: { ...createSessionMemory(''), ...(item.memory || {}) },
      context: item.context || createSessionContext(null),
      skills: Array.isArray(item.skills) ? item.skills : [],
      approvals: Array.isArray(item.approvals) ? item.approvals : [],
      toolRuns: Array.isArray(item.toolRuns) ? item.toolRuns : [],
      artifacts: Array.isArray(item.artifacts) ? item.artifacts : [],
      taskState: item.taskState || createTaskState(''),
      taskPlan: Array.isArray(item.taskPlan) ? item.taskPlan : [],
      verification: Array.isArray(item.verification) ? item.verification : []
    };
  }).filter((item) => item.id) : [];
}

function normalizeSavedProjects(items) {
  return Array.isArray(items) ? items.map((item) => {
    if (typeof item === 'string') return createProjectRecord(item, item.split(/[\\/]/).pop() || item);
    return {
      ...createProjectRecord(item.path, item.name || String(item.path || '').split(/[\\/]/).pop() || item.path),
      ...item
    };
  }).filter((item) => item.path) : [];
}

function restoreSavedAgents(items) {
  const defaultIds = new Set(agents.map((agent) => agent.id));
  normalizeSavedAgents(items).forEach((agent) => {
    if (defaultIds.has(agent.id) || agents.some((item) => item.id === agent.id)) return;
    agents.unshift(agent);
  });
}

function normalizeSavedAgents(items) {
  return Array.isArray(items) ? items.map((item) => normalizeAgent(item)).filter((item) => item.id) : [];
}

function normalizeAgent(item = {}) {
  const engineList = getAgentEngineRegistry();
  const engine = engineList.find((entry) => entry.id === normalizeEngineId(item.engine)) || engineList[0];
  return {
    id: item.id || `agent-${Date.now()}`,
    name: item.name || '未命名智能体',
    role: item.role || '待定义职责',
    status: item.status || '草稿',
    description: item.description || '描述这个智能体负责的事情、边界和交付结果。',
    permission: item.permission || '只读',
    engine: engine.id,
    engineLabel: engine.name,
    adapter: item.adapter || (engine.id === 'kaka' ? '内置' : 'CLI'),
    use: item.use || '会话和工作流节点',
    custom: item.custom !== false && !['conversation', 'context', 'planner', 'builder', 'verifier', 'claude-code', 'codex-cli', 'opencode', 'gemini-cli', 'aider'].includes(item.id)
  };
}

function createProjectRecord(projectPath, name, folder = null) {
  return {
    id: `project-${simpleHash(projectPath || name)}`,
    name: name || String(projectPath || '').split(/[\\/]/).pop() || '未命名项目',
    path: projectPath,
    profile: folder?.summary?.profile || '',
    files: folder?.summary?.files || 0,
    folders: folder?.summary?.folders || 0,
    lastOpenedAt: new Date().toISOString()
  };
}

function simpleHash(value) {
  let hash = 0;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function restoreSavedWorkflows(items) {
  const defaults = new Set(['general', 'folder', 'verify']);
  const saved = normalizeSavedWorkflows(items).filter((workflow) => !defaults.has(workflow.id));
  if (!saved.length) return;
  const existing = new Set(publicWorkflows.map((workflow) => workflow.id));
  saved.forEach((workflow) => {
    if (!existing.has(workflow.id)) publicWorkflows.push(workflow);
  });
}

function normalizeSavedWorkflows(items) {
  return Array.isArray(items) ? items.map((item) => ({
    id: item.id,
    name: item.name || '未命名工作流',
    role: item.role || '会话沉淀工作流',
    status: item.status || '草稿',
    scope: item.scope || '私有',
    selectedNodeId: item.selectedNodeId || '',
    canvas: item.canvas || null,
    edits: Array.isArray(item.edits) ? item.edits : [],
    nodes: cloneWorkflowNodes(Array.isArray(item.nodes) && item.nodes.length ? item.nodes : workflowNodes)
  })).filter((item) => item.id) : [];
}

function persistAppState() {
  if (!window.kaka.saveState) return;
  window.kaka.saveState({
    conversations: state.conversations.map((item) => ({
      ...item,
      messages: item.messages.map((message) => ({ ...message, status: '' }))
    })),
    recentProjects: state.recent.map((project) => ({
      ...project,
      lastOpenedAt: project.lastOpenedAt || new Date().toISOString()
    })),
    agents: agents.filter((agent) => agent.custom),
    workflows: publicWorkflows
  });
}

async function testModelConnection() {
  if (!window.kaka.testModel || !state.model.configured) return;
  setModelStatus('模型连接中...');
  try {
    const result = await window.kaka.testModel();
    if (result.ok) {
      setModelStatus('');
      addLog('模型', `${result.model.provider}/${result.model.model} 可用`);
      return;
    }
    setModelStatus(`模型不可用：${formatModelError(result.error)}`);
    addLog('模型', `连接失败：${formatModelError(result.error)}`);
  } catch (error) {
    setModelStatus(`模型不可用：${formatModelError(error.message)}`);
    addLog('模型', `连接失败：${formatModelError(error.message)}`);
  }
}

function syncModelSelect() {
  const modelSelect = document.querySelector('#modelSelect');
  if (!modelSelect) return;
  const current = modelSelect.querySelector('option[value="current"]');
  current.textContent = state.model.configured ? state.model.model : '本地规则';
  state.composer.model = 'current';
  modelSelect.value = 'current';
}

function syncEngineSelects() {
  const selects = [
    document.querySelector('#engineSelect'),
    document.querySelector('#defaultEngineSelect')
  ].filter(Boolean);
  selects.forEach((select) => {
    const currentValue = select.id === 'engineSelect' ? state.composer.engineId : state.settings.defaultSessionEngineId;
    select.innerHTML = state.engines.map((engine) => (
      `<option value="${escapeAttribute(engine.id)}">${escapeHtml(engine.name)}</option>`
    )).join('');
    select.value = currentValue;
  });
}

function bindSettingsActions() {
  const engineList = document.querySelector('#settingsEngineList');
  const defaultEngine = document.querySelector('#defaultEngineSelect');
  const skillScope = document.querySelector('#skillScopeSelect');
  const workflowDistillation = document.querySelector('#workflowDistillationSelect');
  const engineInitMode = document.querySelector('#engineInitModeSelect');
  [
    defaultEngine,
    skillScope,
    workflowDistillation,
    engineInitMode
  ].filter(Boolean).forEach((select) => {
    select.addEventListener('change', () => {
      saveSettings({
        defaultSessionEngineId: defaultEngine?.value || state.settings.defaultSessionEngineId,
        skillScope: skillScope?.value || state.settings.skillScope,
        workflowDistillation: workflowDistillation?.value || state.settings.workflowDistillation,
        engineInitMode: engineInitMode?.value || state.settings.engineInitMode
      });
    });
  });
  if (engineList) {
    engineList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-check-engine]');
      if (!button) return;
      checkEngine(button.dataset.checkEngine);
    });
  }
}

async function saveSettings(nextSettings) {
  state.settings = normalizeSettings({ ...state.settings, ...(nextSettings || {}) });
  state.composer.engineId = state.settings.defaultSessionEngineId;
  syncEngineSelects();
  renderSettings();
  if (window.kaka.saveSettings) {
    try {
      state.settings = normalizeSettings(await window.kaka.saveSettings(state.settings));
      state.composer.engineId = state.settings.defaultSessionEngineId;
      syncEngineSelects();
      renderSettings();
      addLog('设置', `默认会话引擎：${getSessionEngine(state.settings.defaultSessionEngineId).name}`);
    } catch (error) {
      addLog('设置', formatModelError(error.message));
    }
  }
}

function renderSettings() {
  syncEngineSelects();
  const skillScope = document.querySelector('#skillScopeSelect');
  const workflowDistillation = document.querySelector('#workflowDistillationSelect');
  const engineInitMode = document.querySelector('#engineInitModeSelect');
  if (skillScope) skillScope.value = state.settings.skillScope;
  if (workflowDistillation) workflowDistillation.value = state.settings.workflowDistillation;
  if (engineInitMode) engineInitMode.value = state.settings.engineInitMode;

  const count = document.querySelector('#engineCount');
  if (count) count.textContent = `${state.engines.length} 个`;

  const list = document.querySelector('#settingsEngineList');
  if (!list) return;
  list.innerHTML = state.engines.map((engine) => `
    <div class="engine-line ${engine.id === state.settings.defaultSessionEngineId ? 'active' : ''}">
      <div>
        <strong>${escapeHtml(engine.name)}</strong>
        <span>${escapeHtml(engine.summary || '')}</span>
      </div>
      <div class="engine-line-meta">
        <span>${escapeHtml(resolveEngineCheckLabel(engine))}</span>
        <code>${escapeHtml(engine.command || 'built-in')}</code>
        <button class="link-button" type="button" data-check-engine="${escapeAttribute(engine.id)}">检测</button>
      </div>
    </div>
  `).join('');
}

function resolveEngineCheckLabel(engine) {
  const check = state.engineChecks[engine.id];
  if (!check) return engine.type === 'builtin' ? '内置' : '未检测';
  if (check.pending) return '检测中';
  if (check.ok) return '可用';
  return '未找到';
}

async function checkEngine(engineId) {
  const engine = getSessionEngine(engineId);
  state.engineChecks[engine.id] = { pending: true };
  renderSettings();
  if (!window.kaka.checkEngine) return;
  try {
    const result = await window.kaka.checkEngine(engine.id);
    state.engineChecks[engine.id] = result;
    addLog('引擎', result.ok ? `${engine.name} 可用` : `${engine.name} 未找到`);
  } catch (error) {
    state.engineChecks[engine.id] = { ok: false, error: error.message };
    addLog('引擎', `${engine.name} 检测失败`);
  }
  renderSettings();
}

async function openFolder() {
  const result = await window.kaka.openFolder();
  if (!result) return;
  applyFolder(result);
}

async function analyzeHomePrompt() {
  const input = document.querySelector('#homePrompt');
  const text = input.value.trim();
  if (!text) return;
  state.pendingPrompt = text;
  state.intent = classifyIntent(text);
  await beginQuickChat(text);
  const pendingId = addMessage('', 'assistant', 'pending');
  const modelResult = await analyzeWithModel(text);
  const intent = modelResult.intent || classifyIntent(text);
  state.intent = intent;
  if (shouldShowTaskPlan(text, intent, modelResult.plan)) {
    state.taskPlan = modelResult.plan || createPlan(text, intent, state.currentFolder);
  } else {
    state.taskPlan = [];
  }
  state.assistantDraft = modelResult.reply || '';
  renderTaskPlan();
  if (modelResult.source === 'model') {
    await processToolProposals(text, modelResult.toolProposals);
    updateMessage(pendingId, modelResult.reply || '', 'assistant');
    setModelStatus('');
    saveCurrentConversation();
    if (state.taskPlan.length || modelResult.toolProposals?.length) {
      addVerification('通过', `模型 ${state.model.provider}/${state.model.model} 已生成意图和计划。`);
    } else {
      renderSessionState();
    }
  } else if (modelResult.error) {
    updateMessage(pendingId, createModelFailureReply(text, modelResult.error), 'assistant');
    setModelStatus('模型请求失败');
    saveCurrentConversation();
    if (state.taskPlan.length) {
      addVerification('回退', `模型调用失败，已使用本地规则：${modelResult.error}`);
    } else {
      renderSessionState();
    }
  }
}

async function analyzeWithModel(text) {
  if (!window.kaka.analyzeTask) return { source: 'rule' };
  try {
    const response = await window.kaka.analyzeTask({
      text,
      context: buildModelContext(text),
      folder: state.currentFolder ? {
        name: state.currentFolder.name,
        rootPath: state.currentFolder.rootPath,
        summary: state.currentFolder.summary
      } : null
    });
    if (!response.ok) return { source: 'rule', error: response.error };
    return normalizeModelAnalysis(response.result, text);
  } catch (error) {
    return { source: 'rule', error: error.message || 'IPC request failed' };
  }
}

function normalizeModelAnalysis(result, text) {
  const rawIntent = result.intent || {};
  const mode = ['chat', 'folder', 'workflow'].includes(rawIntent.mode) ? rawIntent.mode : 'chat';
  const intent = {
    mode,
    label: rawIntent.label || '任务理解',
    title: rawIntent.title || '已完成任务判断',
    reason: rawIntent.reason || '模型已根据当前输入生成判断。',
    primary: rawIntent.primary || (mode === 'folder' ? 'open-folder' : mode === 'workflow' ? 'create-workflow' : 'chat')
  };

  const plan = Array.isArray(result.plan)
    ? result.plan.slice(0, 6).map((step, index) => ({
        title: step.title || `步骤 ${index + 1}`,
        body: step.body || '待补充。',
        agent: step.agent || '规划器',
        permission: step.permission || '只读',
        status: step.status || (index === 0 ? '当前' : '等待')
    }))
    : null;

  return {
    source: 'model',
    intent,
    plan,
    toolProposals: normalizeToolProposals(result.toolProposals),
    reply: normalizeReply(result.reply, text, intent, plan)
  };
}

function normalizeToolProposals(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const command = String(item.command || '').trim();
      if (!command || !isAllowedCommandProposal(command)) return null;
      return {
        type: item.type || 'cli',
        command,
        reason: String(item.reason || '模型建议执行该命令以获取证据。').trim(),
        permission: item.permission || 'execute',
        risk: item.risk || '低',
        source: 'model'
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

async function processToolProposals(text, proposals) {
  const normalized = Array.isArray(proposals) && proposals.length
    ? proposals
    : inferLocalToolProposals(text);
  const created = [];
  for (const proposal of normalized) {
    const validation = proposal.command && window.kaka.validateCommand
      ? await window.kaka.validateCommand(proposal.command)
      : { ok: true, command: proposal.command };
    if (!validation.ok) {
      const blocked = addApproval({
        type: '命令审批',
        permission: 'blocked',
        command: proposal.command,
        summary: proposal.reason || proposal.command,
        reason: validation.error,
        risk: '高',
        source: proposal.source || 'rule',
        status: '已拦截'
      });
      if (blocked) created.push(blocked);
      continue;
    }
    const approval = addApproval({
      type: '命令审批',
      permission: proposal.permission || 'execute',
      command: validation.command || proposal.command,
      summary: proposal.reason || proposal.command,
      reason: proposal.reason,
      risk: proposal.risk,
      source: proposal.source || 'rule'
    });
    if (approval) created.push(approval);
  }
  if (created.length) {
    addLog('工具提案', created.map((item) => item.command).join('、'));
    const blocked = created.filter((item) => item.status === '已拦截').length;
    addVerification(blocked ? '失败' : '待确认', blocked ? `已拦截 ${blocked} 个危险工具提案。` : `已生成 ${created.length} 个工具提案，等待用户审批。`);
  }
}

function inferLocalToolProposals(text) {
  const command = inferCommandFromText(text);
  if (!command || !isAllowedCommandProposal(command)) return [];
  return [{
    type: 'cli',
    command,
    reason: '根据当前请求生成的本地命令提案。',
    permission: 'execute',
    risk: '低',
    source: 'rule'
  }];
}

function isAllowedCommandProposal(command) {
  const lower = command.toLowerCase();
  if (/[;&|<>`]/.test(command)) return false;
  if (['rm ', 'del ', 'rmdir ', 'format ', 'shutdown', 'git reset', 'git clean', 'remove-item'].some((word) => lower.includes(word))) return false;
  return [
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
  ].some((prefix) => lower === prefix || lower.startsWith(`${prefix} `));
}

function normalizeReply(reply, text, intent, plan) {
  const value = typeof reply === 'string' ? reply.trim() : '';
  if (value) return value;
  if (plan && plan.length) {
    return `可以，我先按“${plan[0].title}”开始，把目标、边界和下一步整理清楚。`;
  }
  return createNaturalReply(text, intent) || '可以，我们继续。你把下一步想做的事直接说出来就行。';
}

function startQuickChat(forcedText) {
  const input = document.querySelector('#homePrompt');
  const text = (forcedText || input.value).trim();
  if (!text) return;
  beginQuickChat(text);
  addMessage(state.assistantDraft || createNaturalReply(text, state.intent), 'assistant');
}

async function beginQuickChat(text) {
  state.currentFolder = null;
  const conversation = createConversation(text);
  state.currentConversationId = conversation.id;
  state.messages = [];
  state.taskPlan = shouldShowTaskPlan(text, state.intent, null) ? createPlan(text, state.intent, null) : [];
  state.verification = [];
  document.querySelector('#fileCount').textContent = '0';
  document.querySelector('#fileTree').innerHTML = '<div class="active">未绑定目标目录</div>';
  renderFileSources();
  setTextIfPresent('#folderProfile', '当前是快速对话，尚未绑定本地目录。需要读取文件时再打开目录。');
  renderFolderProfile(null);
  renderTaskPlan();
  renderVerification();
  renderConversations();
  renderRecent();
  document.querySelector('#runLog').innerHTML = '';
  addLog('对话', '新建快速对话');
  addMessage(text || '开始一个新对话。', 'user');
  await registerApprovalIntent(text || '');
  saveCurrentConversation();
  switchView('workspace');
  switchWorkspaceTab('chat');
}

function shouldShowTaskPlan(text, intent, plan) {
  if (isLowValueChatPlan(plan)) return false;
  if (state.currentFolder) return true;
  if (intent?.mode === 'folder' || intent?.mode === 'workflow') return true;
  if (Array.isArray(plan) && plan.length && isActionablePrompt(text)) return true;
  return isActionablePrompt(text);
}

function isLowValueChatPlan(plan) {
  if (!Array.isArray(plan) || !plan.length) return false;
  const text = plan.map((step) => `${step.title || ''} ${step.body || ''} ${step.agent || ''}`).join(' ');
  const lowValueHits = ['回应问候', '等待具体需求', '询问有什么需要帮忙', '确认用户在场'].filter((item) => text.includes(item)).length;
  const hasRealWork = /(读取目录|修改|生成|执行|测试|提交|推送|文件|代码|页面|工作流节点|脚本|验证产物)/.test(text);
  return lowValueHits >= 2 && !hasRealWork;
}

function normalizeTaskPlan(plan, text = state.pendingPrompt, intent = state.intent) {
  if (!shouldShowTaskPlan(text, intent, plan)) return [];
  return Array.isArray(plan) ? plan : [];
}

function isActionablePrompt(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  const compact = value.replace(/\s+/g, '');
  if (/^(在吗?|在\?|你好|您好|hi|hello|hey|哈喽|嗨)[。！!?.？]*$/i.test(compact)) return false;
  if (compact.length >= 18) return true;
  return /(帮我|请|需要|想要|做|改|写|生成|整理|分析|检查|测试|运行|实现|设计|创建|修复|提交|推送|打开目录|工作流|Agent|智能体|代码|文件|项目|页面|功能)/i.test(value);
}

function createConversation(text) {
  const now = Date.now();
  const title = isActionablePrompt(text) ? createGoalConversationTitle(text) : createConversationTitle(text);
  const id = `conv-${now}-${Math.random().toString(16).slice(2)}`;
  const workspacePath = resolveConversationWorkspacePath(id);
  const conversation = {
    id,
    title,
    titleSource: isActionablePrompt(text) ? 'goal' : 'initial',
    mode: 'chat',
    projectPath: null,
    engineId: state.composer.engineId || state.settings.defaultSessionEngineId,
    engine: getSessionEngine(state.composer.engineId || state.settings.defaultSessionEngineId),
    engineInitializedAt: '',
    engineInitFiles: [],
    goalState: createGoalState(isActionablePrompt(text) ? text : ''),
    workspacePath,
    tempFilesPath: joinWorkspacePath(workspacePath, 'files'),
    artifactsPath: joinWorkspacePath(workspacePath, 'artifacts'),
    workflowsPath: joinWorkspacePath(workspacePath, 'workflows'),
    updatedAt: now,
    messages: [],
    memory: createSessionMemory(text),
    context: createSessionContext(null),
    skills: selectSkills(text, null),
    approvals: [],
    toolRuns: [],
    artifacts: [],
    taskState: createTaskState(text),
    taskPlan: [],
    verification: []
  };
  state.conversations = [
    conversation,
    ...state.conversations.filter((item) => item.id !== id)
  ].slice(0, 8);
  return conversation;
}

function resolveConversationWorkspacePath(id) {
  return state.workspace?.conversationsDir ? joinWorkspacePath(state.workspace.conversationsDir, id) : '';
}

function joinWorkspacePath(base, child) {
  if (!base) return '';
  const separator = base.includes('\\') ? '\\' : '/';
  return `${base.replace(/[\\/]+$/, '')}${separator}${child}`;
}

function createSessionMemory(text) {
  return {
    goal: isActionablePrompt(text) ? text : '',
    userPreferences: ['界面简洁精致', '不要暴露内部判断', '写入和命令执行前需要确认'],
    constraints: ['验证流程需要独立上下文', '长任务要拆阶段推进'],
    decisions: [],
    failures: [],
    nextActions: [],
    events: []
  };
}

function createSessionContext(folder) {
  return {
    tokenBudget: 6000,
    summary: folder ? buildProfileSummary(folder) : '未绑定目录。',
    folder: folder ? {
      name: folder.name,
      rootPath: folder.rootPath,
      summary: folder.summary
    } : null,
    recentWindow: 8,
    estimatedTokens: 0,
    compactedTurns: 0,
    selected: []
  };
}

function createTaskState(text) {
  const actionable = isActionablePrompt(text);
  return {
    goal: actionable ? text : '等待用户输入任务',
    status: actionable ? 'planning' : 'idle',
    currentStep: actionable ? '理解目标' : '待开始',
    doneCriteria: [],
    blockedReason: '',
    contextStatus: 'pending',
    skillStatus: 'pending',
    toolStatus: 'idle',
    verificationStatus: 'not-run'
  };
}

function selectSkills(text, folder) {
  const value = `${text || ''} ${folder ? '目录 项目 文件' : ''}`.toLowerCase();
  const selected = skillRegistry.filter((skill) => {
    if (skill.id === 'general-planning') return true;
    return (skill.triggers || []).some((trigger) => value.includes(trigger.toLowerCase()));
  });
  return selected.map((skill) => ({
    id: skill.id,
    name: skill.name,
    summary: skill.summary,
    permission: skill.permission,
    source: skill.path || 'built-in',
    instruction: createSkillInstructionExcerpt(skill),
    reason: skill.id === 'general-planning' ? '默认规划能力' : resolveSkillTriggerReason(skill, value),
    loadedAt: Date.now()
  }));
}

function createSkillInstructionExcerpt(skill) {
  const content = String(skill.content || '').trim();
  if (!content) return skill.summary || '';
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('---'))
    .slice(0, 12)
    .join('\n')
    .slice(0, 900);
}

function resolveSkillTriggerReason(skill, value) {
  const trigger = (skill.triggers || []).find((item) => value.includes(item.toLowerCase()));
  return trigger ? `命中触发词：${trigger}` : '任务语义匹配';
}

function getCurrentSession() {
  return state.conversations.find((item) => item.id === state.currentConversationId) || null;
}

function buildModelContext(text) {
  const session = getCurrentSession();
  compactSessionContext(session);
  const selectedContext = selectContextForTurn(text, session);
  if (session?.context) session.context.selected = selectedContext;
  const recentMessages = state.messages
    .filter((message) => message.status !== 'pending')
    .slice(-8)
    .map((message) => ({ role: message.role, text: message.text }));
  return {
    session: session ? {
      id: session.id,
      mode: session.mode,
      title: session.title,
      engine: getSessionEngine(session.engineId || state.composer.engineId),
      goalState: normalizeGoalState(session.goalState, session.memory?.goal || session.title),
      memory: session.memory,
      taskState: session.taskState,
      skills: session.skills,
      context: session.context,
      memoryDigest: buildMemoryDigest(session),
      approvals: session.approvals.slice(0, 5),
      toolRuns: session.toolRuns.slice(0, 5),
      selectedContext,
      activeSkillInstructions: (session.skills || []).slice(0, 4).map((skill) => ({
        name: skill.name,
        permission: skill.permission,
        reason: skill.reason,
        instruction: skill.instruction
      }))
    } : null,
    folder: state.currentFolder ? {
      name: state.currentFolder.name,
      rootPath: state.currentFolder.rootPath,
      summary: state.currentFolder.summary
    } : null,
    recentMessages,
    currentInput: text,
    engine: getSessionEngine(session?.engineId || state.composer.engineId)
  };
}

function selectContextForTurn(text, session) {
  const items = [];
  if (session?.memory?.goal || text) {
    items.push({ type: 'goal', label: '目标', value: session?.memory?.goal || text, reason: '当前任务目标' });
  }
  if (session?.context?.summary) {
    items.push({ type: 'summary', label: '摘要', value: session.context.summary, reason: '压缩上下文' });
  }
  if (state.currentFolder) {
    const hints = state.currentFolder.summary?.entryHints || [];
    hints.forEach((hint) => items.push({ type: 'file', label: hint, value: hint, reason: '目录入口线索' }));
    flattenRendererEntries(state.currentFolder.entries)
      .filter((entry) => shouldSelectEntryForText(entry, text))
      .slice(0, 6)
      .forEach((entry) => items.push({ type: entry.type, label: entry.name, value: entry.path, reason: '与输入关键词匹配' }));
  }
  (session?.context?.files || []).slice(0, 6).forEach((file) => {
    items.push({
      type: 'file-content',
      label: file.relativePath || file.name,
      value: `${file.summary || ''}\n${String(file.content || '').slice(0, 1800)}`.trim(),
      reason: '已读取文件内容'
    });
  });
  (session?.artifacts || []).slice(0, 4).forEach((artifact) => {
    items.push({ type: 'artifact', label: artifact.title, value: artifact.summary || artifact.title, reason: '会话产物' });
  });
  (session?.toolRuns || []).slice(0, 3).forEach((tool) => {
    items.push({ type: 'tool', label: tool.command, value: tool.stdout || tool.stderr || tool.status, reason: '最近工具结果' });
  });
  return dedupeContextItems(items).slice(0, 14);
}

function flattenRendererEntries(entries) {
  const result = [];
  (entries || []).forEach((entry) => {
    result.push(entry);
    if (entry.children) result.push(...flattenRendererEntries(entry.children));
  });
  return result;
}

function shouldSelectEntryForText(entry, text) {
  if (entry.type !== 'file') return false;
  const value = `${text || ''}`.toLowerCase();
  const name = entry.name.toLowerCase();
  const pathValue = String(entry.path || '').toLowerCase().replaceAll('\\', '/');
  if (['readme.md', 'package.json', 'src/main.js', 'src/renderer/app.js', 'src/renderer/index.html', 'src/renderer/styles.css'].some((hint) => pathValue.endsWith(hint))) return true;
  return value.split(/[\s，。,.、/\\:：]+/).filter((word) => word.length >= 2).some((word) => name.includes(word) || pathValue.includes(word));
}

function dedupeContextItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.type}:${item.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compactSessionContext(session) {
  if (!session) return;
  const messages = state.messages.filter((message) => message.status !== 'pending');
  const estimated = messages.reduce((total, message) => total + estimateTokens(message.text), 0);
  session.context = session.context || createSessionContext(state.currentFolder);
  session.context.estimatedTokens = estimated;
  if (estimated <= session.context.tokenBudget) return;
  const older = messages.slice(0, -session.context.recentWindow);
  if (!older.length) return;
  session.context.compactedTurns = older.length;
  session.context.summary = [
    session.context.summary,
    `已压缩 ${older.length} 条早期消息，保留目标、决策、失败和最近上下文。`
  ].filter(Boolean).join(' ');
}

function buildMemoryDigest(session) {
  if (!session?.memory) return '';
  const memory = session.memory;
  return [
    `目标：${memory.goal || session.title}`,
    `偏好：${(memory.userPreferences || []).join('；')}`,
    `约束：${(memory.constraints || []).join('；')}`,
    `决策：${(memory.decisions || []).slice(-4).join('；') || '暂无'}`,
    `失败：${(memory.failures || []).slice(-3).join('；') || '暂无'}`
  ].join('\n');
}

function createConversationTitle(text) {
  const value = String(text || '新对话').trim().replace(/\s+/g, ' ');
  return value.length > 18 ? `${value.slice(0, 18)}...` : value;
}

function createGoalConversationTitle(text) {
  const value = String(text || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(帮我|请帮我|请|我想|我需要|需要|想要)/, '')
    .replace(/[。！？!?]+$/g, '')
    .trim();
  return createConversationTitle(value || text);
}

function updateConversationTitleFromGoal(session, candidateText = '') {
  if (!session || session.titleSource === 'manual') return;
  const goal = isActionablePrompt(session.goalState?.title)
    ? session.goalState.title
    : (isActionablePrompt(session.memory?.goal) ? session.memory.goal : candidateText);
  if (!isActionablePrompt(goal)) return;

  const nextTitle = createGoalConversationTitle(goal);
  if (!nextTitle || nextTitle === session.title) return;
  if (session.titleSource === 'project' && session.mode === 'project') return;

  session.title = nextTitle;
  session.titleSource = 'goal';
}

function createGoalState(text = '') {
  const title = normalizeGoalTitle(text);
  return {
    title,
    status: title ? 'draft' : 'paused',
    source: title ? 'user' : 'system',
    updatedAt: new Date().toISOString(),
    history: [],
    subgoals: [],
    acceptance: [],
    risks: []
  };
}

function normalizeGoalState(goalState = {}, fallbackGoal = '') {
  const title = normalizeGoalTitle(goalState.title || goalState.goal || fallbackGoal);
  return {
    title,
    status: ['draft', 'active', 'locked', 'done', 'paused'].includes(goalState.status) ? goalState.status : (title ? 'draft' : 'paused'),
    source: goalState.source || (title ? 'user' : 'system'),
    updatedAt: goalState.updatedAt || new Date().toISOString(),
    history: Array.isArray(goalState.history) ? goalState.history.filter((item) => item.title).slice(0, 12) : [],
    subgoals: normalizeLocalList(goalState.subgoals).slice(0, 8),
    acceptance: normalizeLocalList(goalState.acceptance).slice(0, 8),
    risks: normalizeLocalList(goalState.risks).slice(0, 8)
  };
}

function updateGoalState(goalState = {}, patch = {}) {
  const current = normalizeGoalState(goalState);
  const nextTitle = normalizeGoalTitle(patch.title || patch.goal || '');
  const locked = current.status === 'locked';
  const next = {
    ...current,
    status: ['draft', 'active', 'locked', 'done', 'paused'].includes(patch.status) ? patch.status : current.status,
    source: patch.source || current.source,
    updatedAt: new Date().toISOString(),
    history: [...current.history]
  };
  if (patch.acceptance) next.acceptance = normalizeLocalList(patch.acceptance).slice(0, 8);
  if (patch.subgoals) next.subgoals = normalizeLocalList(patch.subgoals).slice(0, 8);
  if (patch.risks) next.risks = normalizeLocalList(patch.risks).slice(0, 8);
  if (nextTitle && nextTitle !== current.title) {
    if (locked && !patch.force) {
      const alreadyProposed = next.history.some((item) => item.title === nextTitle && item.status === 'proposed');
      if (!alreadyProposed) {
        next.history.unshift({ title: nextTitle, status: 'proposed', changedAt: next.updatedAt, reason: patch.reason || '目标变更提议' });
      }
    } else {
      if (current.title) next.history.unshift({ title: current.title, status: current.status, changedAt: next.updatedAt, reason: patch.reason || '目标调整' });
      next.title = nextTitle;
      if (next.status === 'paused') next.status = 'draft';
    }
  }
  next.history = next.history.slice(0, 12);
  return next;
}

function normalizeGoalTitle(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 160);
}

function normalizeLocalList(items) {
  return (Array.isArray(items) ? items : [items]).map((item) => String(item || '').trim()).filter(Boolean);
}

function saveCurrentConversation() {
  if (!state.currentConversationId) return;
  const conversation = state.conversations.find((item) => item.id === state.currentConversationId);
  if (!conversation) return;
  conversation.messages = state.messages.map((message) => ({ ...message, status: '' }));
  conversation.engineId = state.composer.engineId || conversation.engineId || state.settings.defaultSessionEngineId;
  conversation.engine = getSessionEngine(conversation.engineId);
  const fallbackGoal = isActionablePrompt(conversation.memory?.goal)
    ? conversation.memory.goal
    : (isActionablePrompt(state.pendingPrompt) ? state.pendingPrompt : '');
  conversation.goalState = normalizeGoalState(conversation.goalState, fallbackGoal);
  state.taskPlan = normalizeTaskPlan(state.taskPlan);
  conversation.taskPlan = state.taskPlan.map((step) => ({ ...step }));
  conversation.verification = state.verification.map((item) => ({ ...item }));
  conversation.context = conversation.context || createSessionContext(state.currentFolder);
  if (state.currentFolder) {
    const folderContext = createSessionContext(state.currentFolder);
    conversation.context = {
      ...conversation.context,
      folder: folderContext.folder,
      summary: conversation.context.summary || folderContext.summary
    };
  }
  compactSessionContext(conversation);
  conversation.skills = mergeSessionSkills(conversation.skills, selectSkills(state.pendingPrompt, state.currentFolder));
  updateSessionFromTurn(conversation, state.pendingPrompt, state.intent, state.taskPlan);
  conversation.updatedAt = Date.now();
  renderSessionState();
  renderConversations();
  persistAppState();
}

function updateSessionFromTurn(session, text, intent, plan) {
  if (!session) return;
  session.memory = session.memory || createSessionMemory(text);
  session.taskState = updateTaskStateFromSession(session.taskState, text);
  const fallbackGoal = isActionablePrompt(session.memory.goal)
    ? session.memory.goal
    : (isActionablePrompt(text) ? text : '');
  session.goalState = normalizeGoalState(session.goalState, fallbackGoal);
  if (isActionablePrompt(text)) {
    session.goalState = updateGoalState(session.goalState, {
      title: text,
      source: 'user',
      status: session.goalState.status === 'paused' ? 'draft' : session.goalState.status,
      reason: '用户输入'
    });
  }
  if (isActionablePrompt(text) && (!session.memory.goal || session.memory.goal === session.title)) {
    session.memory.goal = text;
  }
  updateConversationTitleFromGoal(session, text);
  if (intent?.mode === 'workflow') addUnique(session.memory.decisions, '这个目标适合沉淀为可复用工作流。', 8);
  if (intent?.mode === 'folder') addUnique(session.memory.constraints, '继续执行前需要绑定或读取本地目录。', 8);
  (plan || []).slice(0, 4).forEach((step) => addUnique(session.memory.nextActions, step.title, 6));
  if (plan?.length) {
    addSessionArtifact({
      type: 'plan',
      title: '任务计划',
      summary: plan.map((step) => step.title).join(' / ')
    }, session);
  }
}

function addUnique(list, value, limit = 8) {
  if (!Array.isArray(list) || !value) return;
  const text = String(value).trim();
  if (!text || list.includes(text)) return;
  list.unshift(text);
  list.splice(limit);
}

function addSessionArtifact(artifact, targetSession) {
  const session = targetSession || getCurrentSession();
  if (!session) return;
  session.artifacts = Array.isArray(session.artifacts) ? session.artifacts : [];
  const key = `${artifact.type}:${artifact.title}`;
  const exists = session.artifacts.some((item) => `${item.type}:${item.title}` === key);
  if (exists) return;
  session.artifacts.unshift({
    id: `artifact-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: artifact.type || 'note',
    title: artifact.title || '会话产物',
    summary: artifact.summary || '',
    source: artifact.source || '',
    status: artifact.status || '',
    path: artifact.path || '',
    evidence: artifact.evidence || '',
    command: artifact.command || '',
    workflowId: artifact.workflowId || '',
    createdAt: Date.now()
  });
  session.artifacts = session.artifacts.slice(0, 12);
}

function recordSessionEvent(type, detail) {
  const session = getCurrentSession();
  if (!session) return;
  session.memory = session.memory || createSessionMemory('');
  session.memory.events = Array.isArray(session.memory.events) ? session.memory.events : [];
  session.memory.events.unshift({
    type,
    detail,
    at: new Date().toISOString()
  });
  session.memory.events = session.memory.events.slice(0, 40);
}

function mergeSessionSkills(existing, next) {
  const map = new Map();
  [...(existing || []), ...(next || [])].forEach((skill) => {
    map.set(skill.id, { ...skill });
  });
  return Array.from(map.values());
}

function updateTaskStateFromSession(taskState, text) {
  const next = taskState || createTaskState(text);
  if (text && (!next.goal || next.goal === '等待用户输入任务')) next.goal = text;
  if (state.taskPlan.length) {
    const current = state.taskPlan.find((step) => step.status === '当前') || state.taskPlan[0];
    next.status = 'planning';
    next.currentStep = current.title;
    next.doneCriteria = state.taskPlan.map((step) => step.title).slice(0, 4);
  }
  const session = getCurrentSession();
  if (session?.context?.selected?.length) next.contextStatus = `已选 ${session.context.selected.length} 项`;
  if (session?.skills?.length) next.skillStatus = `已加载 ${session.skills.length} 个`;
  if (session?.approvals?.some((item) => item.status === '待确认')) next.toolStatus = '等待审批';
  if (session?.toolRuns?.length) next.toolStatus = session.toolRuns[0].status || '已运行';
  if (state.verification.length) {
    next.verificationStatus = state.verification[0].status;
  }
  return next;
}

function restoreConversation(id) {
  const conversation = state.conversations.find((item) => item.id === id);
  if (!conversation) return;
  state.currentFolder = null;
  state.currentConversationId = id;
  state.composer.engineId = conversation.engineId || state.settings.defaultSessionEngineId;
  syncEngineSelects();
  state.messages = conversation.messages.map((message) => ({ ...message }));
  state.taskPlan = normalizeTaskPlan(conversation.taskPlan, conversation.memory?.goal || conversation.title, null).map((step) => ({ ...step }));
  conversation.taskPlan = state.taskPlan.map((step) => ({ ...step }));
  state.verification = conversation.verification.map((item) => ({ ...item }));
  document.querySelector('#fileCount').textContent = '0';
  document.querySelector('#fileTree').innerHTML = '<div class="active">未绑定目标目录</div>';
  renderFileSources();
  setTextIfPresent('#folderProfile', '当前对话未绑定本地目录。');
  renderFolderProfile(null);
  renderMessages();
  renderTaskPlan();
  renderVerification();
  renderSessionState();
  renderConversations();
  renderRecent();
  switchView('workspace');
  switchWorkspaceTab('chat');
}

function createNaturalReply(text, intent) {
  const trimmed = text.length > 42 ? `${text.slice(0, 42)}...` : text;
  if (intent && intent.mode === 'folder') {
    return `这件事需要结合项目上下文。先打开目录，我会基于真实文件结构继续处理“${trimmed}”。`;
  }
  if (intent && intent.mode === 'workflow') {
    return `这更像一个可复用流程。我会把它整理成工作流节点、Agent 分工和独立验证规则。`;
  }
  return '';
}

async function initializeCurrentProjectEngine() {
  const session = getCurrentSession();
  const projectPath = session?.projectPath || state.currentFolder?.rootPath;
  if (!projectPath) {
    addLog('引擎', '未绑定目标目录');
    addVerification('待补充', '需要先打开目录，才能初始化会话引擎规则。');
    renderVerification();
    return;
  }
  const engine = getSessionEngine(session?.engineId || state.composer.engineId || state.settings.defaultSessionEngineId);
  addLog('引擎', `初始化 ${engine.name}`);
  try {
    const result = await window.kaka.initializeProjectEngine({
      projectPath,
      engineId: engine.id,
      goal: session?.memory?.goal || state.pendingPrompt || session?.title || '',
      skills: (session?.skills || []).map((skill) => skill.name || skill.id)
    });
    if (!result.ok) {
      addVerification('失败', `目录初始化失败：${result.error}`);
      renderVerification();
      return;
    }
    if (session) {
      session.engineId = engine.id;
      session.engine = engine;
      session.engineInitializedAt = new Date().toISOString();
      session.engineInitFiles = [
        ...(result.written || []).map((file) => ({ relativePath: file.relativePath, path: file.path, status: 'written' })),
        ...(result.skipped || []).map((file) => ({ relativePath: file.relativePath, path: file.path, status: 'skipped' }))
      ];
      addSessionArtifact({
        type: 'engine-init',
        title: `${engine.name} 初始化`,
        summary: session.engineInitFiles.map((file) => `${file.relativePath} ${file.status}`).join(' / ')
      }, session);
    }
    addMessage(`已为 ${engine.name} 准备目录规则：${[
      ...(result.written || []),
      ...(result.skipped || [])
    ].map((file) => file.relativePath).join('、')}。`, 'assistant');
    addVerification('通过', `已初始化引擎目录，写入 ${result.written.length} 个文件，跳过 ${result.skipped.length} 个已存在文件。`);
    saveCurrentConversation();
    renderSessionState();
  } catch (error) {
    addVerification('失败', `目录初始化失败：${formatModelError(error.message)}`);
    renderVerification();
  }
}

function applyFolder(folder) {
  state.currentFolder = folder;
  const session = getCurrentSession();
  if (session) {
    session.mode = 'project';
    session.projectPath = folder.rootPath;
    session.titleSource = session.titleSource || 'project';
    session.engineId = session.engineId || state.composer.engineId || state.settings.defaultSessionEngineId;
    session.engine = getSessionEngine(session.engineId);
    session.context = createSessionContext(folder);
    session.skills = mergeSessionSkills(session.skills, selectSkills(state.pendingPrompt, folder));
  } else {
    const conversation = createConversation(state.pendingPrompt || `打开 ${folder.name}`);
    conversation.mode = 'project';
    conversation.projectPath = folder.rootPath;
    conversation.engineId = state.composer.engineId || state.settings.defaultSessionEngineId;
    conversation.engine = getSessionEngine(conversation.engineId);
    conversation.context = createSessionContext(folder);
    conversation.skills = mergeSessionSkills(conversation.skills, selectSkills(state.pendingPrompt, folder));
    conversation.title = folder.name;
    conversation.titleSource = 'project';
    state.currentConversationId = conversation.id;
    state.messages = [];
  }
  state.taskPlan = createPlan(state.pendingPrompt || '理解并处理当前目录', state.intent, folder);
  state.verification = [];
  const projectRecord = createProjectRecord(folder.rootPath, folder.name, folder);
  if (!state.recent.some((item) => item.path === folder.rootPath)) {
    state.recent.unshift(projectRecord);
  } else {
    state.recent = state.recent.map((item) => item.path === folder.rootPath ? { ...item, ...projectRecord } : item);
  }
  state.recent = state.recent.filter((item, index, items) => items.findIndex((candidate) => candidate.path === item.path) === index).slice(0, 20);
  document.querySelector('#fileCount').textContent = String(folder.summary.files);
  setTextIfPresent('#folderProfile', buildProfileSummary(folder));
  renderFolderProfile(folder);
  renderTaskPlan();
  renderVerification();
  renderSessionState();
  renderTree(folder.entries);
  renderFileSources();
  renderRecent();
  persistAppState();
  addLog('打开', folder.name);
  addLog('画像', folder.summary.profile);
  addVerification('通过', `上下文读取器只读扫描目录：${folder.summary.files} 个文件、${folder.summary.folders} 个文件夹。`);
  addMessage(`已打开 ${folder.name}。我识别为 ${folder.summary.profile}。`, 'assistant');
  addMessage('我已经生成目录画像和初始任务计划。你可以先确认计划，也可以把它转成当前目录工作流。', 'assistant');
  saveCurrentConversation();
  switchView('workspace');
  switchWorkspaceTab('chat');
  if (state.settings.engineInitMode === 'auto') {
    initializeCurrentProjectEngine();
  }
}

function classifyIntent(text) {
  const value = text.toLowerCase();
  const needsFolderWords = ['目录', '文件', '项目', '代码', '重构', '修复', '检查', '运行', 'app', '页面', '样式', 'bug'];
  const workflowWords = ['工作流', '流程', '长期', '复用', '自动化', '规范', '团队', 'agent'];
  const verifyWords = ['验证', '测试', '检查', '校验', '风险'];
  const needsFolder = needsFolderWords.some((word) => value.includes(word.toLowerCase()));
  const workflow = workflowWords.some((word) => value.includes(word.toLowerCase()));
  const verify = verifyWords.some((word) => value.includes(word.toLowerCase()));

  if (workflow && !needsFolder) {
    return {
      mode: 'workflow',
      label: '公共工作流任务',
      title: '适合先生成可复用工作流',
      reason: '你的描述更像长期流程或团队能力沉淀，可以先生成公共工作流草稿，再绑定到目录。',
      primary: 'create-workflow'
    };
  }

  if (needsFolder || verify) {
    return {
      mode: 'folder',
      label: verify ? '验证型项目任务' : '项目型任务',
      title: '建议打开目录后继续',
      reason: '这个任务需要读取本地结构、文件或运行上下文。打开目录后可以生成画像、计划和独立验证。',
      primary: 'open-folder'
    };
  }

  return {
    mode: 'chat',
    label: '临时对话',
    title: '可以直接开始对话',
    reason: '当前描述不依赖本地文件。我会先整理目标、拆下一步，需要目录时再提示。',
    primary: 'chat'
  };
}

function createPlan(text, intent, folder) {
  const target = text || '处理当前任务';
  const base = [
    { title: '理解任务', body: `整理目标和边界：${target}`, agent: '规划器', permission: '只读', status: '当前' },
    { title: folder ? '读取目录画像' : '判断是否需要目录', body: folder ? buildProfileSummary(folder) : '临时对话先不读取文件。', agent: '上下文读取器', permission: '只读', status: folder ? '完成' : '等待' },
    { title: '生成执行方案', body: '拆成可确认的阶段，每阶段有明确产物。', agent: '规划器', permission: '只读', status: '等待' },
    { title: '执行第一步', body: '写入、命令、联网都需要用户确认。', agent: '构建器', permission: '写入前确认', status: '等待' },
    { title: '独立验证', body: '验证器使用隔离上下文检查证据，不继承执行对话。', agent: '验证器', permission: '只读、隔离上下文', status: '等待' }
  ];

  if (intent && intent.mode === 'workflow') {
    base.splice(3, 0, { title: '沉淀为公共工作流', body: '抽象节点、输入输出、失败回退和复用条件。', agent: '沉淀 Agent', permission: '只读', status: '等待' });
  }

  return base;
}

function renderTaskPlan() {
  const plan = document.querySelector('#taskPlan');
  const status = document.querySelector('#planStatus');
  state.taskPlan = normalizeTaskPlan(state.taskPlan);
  if (state.taskPlan.length === 0) {
    status.textContent = '待生成';
    status.className = 'badge amber';
    plan.innerHTML = '<div class="empty-state">输入任务或打开目录后生成计划。</div>';
    return;
  }

  const isRunning = state.taskPlan.some((step) => step.status === '当前') && state.taskPlan.some((step) => step.status === '完成');
  status.textContent = isRunning ? '执行中' : '待确认';
  status.className = isRunning ? 'badge green' : 'badge amber';
  plan.innerHTML = state.taskPlan.map((step, index) => `
    <div class="plan-step">
      <span>${index + 1}</span>
      <div><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.body)}</p></div>
      <em>${escapeHtml(step.agent)}</em>
    </div>
  `).join('');
}

function executeFirstPlanStep() {
  if (state.taskPlan.length === 0) {
    state.taskPlan = createPlan(state.pendingPrompt || '处理当前任务', state.intent, state.currentFolder);
  }
  state.taskPlan = state.taskPlan.map((step, index) => ({
    ...step,
    status: index === 0 ? '完成' : index === 1 ? '当前' : step.status
  }));
  renderTaskPlan();
  addLog('执行', state.taskPlan[0].title);
  addMessage(`已执行第一步：${state.taskPlan[0].title}。下一步会进入${state.currentFolder ? '目录画像确认' : '是否需要目录判断'}。`);
  addVerification('通过', '验证器独立检查：任务目标、权限边界、下一步条件已记录。');
  recordSessionEvent('plan-step-finished', state.taskPlan[0].title);
  saveCurrentConversation();
}

function renderFolderProfile(folder) {
  const grid = document.querySelector('#folderProfileGrid');
  if (!grid) return;
  if (!folder) {
    grid.innerHTML = `
      <div><span>上下文</span><strong>未绑定目录</strong></div>
      <div><span>权限</span><strong>只读待授权</strong></div>
      <div><span>建议</span><strong>先对话</strong></div>
    `;
    return;
  }

  const summary = folder.summary;
  grid.innerHTML = [
    ['项目类型', summary.profile],
    ['文件', `${summary.files}`],
    ['文件夹', `${summary.folders}`],
    ['Git', summary.hasGit ? '已启用' : '未检测'],
    ['入口线索', summary.entryHints && summary.entryHints.length ? summary.entryHints.join(' / ') : '待确认'],
    ['建议流', suggestWorkflow(summary)]
  ].map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
}

function setTextIfPresent(selector, text) {
  const element = document.querySelector(selector);
  if (element) element.textContent = text;
}

function buildProfileSummary(folder) {
  const summary = folder.summary;
  const hints = summary.entryHints && summary.entryHints.length ? `入口线索：${summary.entryHints.join('、')}。` : '';
  return `${summary.profile}，${summary.files} 个文件，${summary.folders} 个文件夹。${hints}`;
}

function suggestWorkflow(summary) {
  if (summary.profile.includes('JavaScript')) return '桌面 / Web 项目迭代流';
  if (summary.profile.includes('Python')) return '脚本任务验证流';
  if (summary.profile.includes('文档')) return '资料整理流';
  return '通用任务流';
}

function addVerification(status, text, meta = {}) {
  const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  state.verification.unshift({ status, text, time: now, ...meta });
  const session = getCurrentSession();
  if (session) {
    session.taskState = session.taskState || createTaskState('');
    session.taskState.verificationStatus = status;
    session.verification = state.verification.map((item) => ({ ...item }));
  }
  renderVerification();
  renderSessionState();
}

function renderVerification() {
  const log = document.querySelector('#verifyLog');
  if (state.verification.length === 0) {
    log.innerHTML = '<div class="log"><time>待运行</time><span>独立上下文、产物证据、失败处理。</span></div>';
    return;
  }
  log.innerHTML = state.verification.map((item) => `
    <div class="log"><time>${item.time}</time><span>${escapeHtml(item.status)}：${item.isolated ? '隔离验证 · ' : ''}${escapeHtml(item.text)}</span></div>
  `).join('');
}

function renderSessionState() {
  const session = getCurrentSession();
  state.taskPlan = normalizeTaskPlan(state.taskPlan);
  const readinessBadge = document.querySelector('#workflowReadinessBadge');
  const readinessText = document.querySelector('#workflowReadinessText');
  const readinessBar = document.querySelector('#workflowReadinessBar');
  const readinessGaps = document.querySelector('#workflowReadinessGaps');
  const mode = document.querySelector('#sessionMode');
  const goalBadge = document.querySelector('#goalStateBadge');
  const materialGoal = document.querySelector('#workflowMaterialGoal');
  const goalAcceptanceList = document.querySelector('#goalAcceptanceList');
  const lockGoalButton = document.querySelector('#lockGoalButton');
  const markGoalDoneButton = document.querySelector('#markGoalDoneButton');
  const materialInputs = document.querySelector('#workflowMaterialInputs');
  const materialNodes = document.querySelector('#workflowMaterialNodes');
  const materialConstraints = document.querySelector('#workflowMaterialConstraints');
  const materialValidation = document.querySelector('#workflowMaterialValidation');
  const generateButton = document.querySelector('#sessionToWorkflow');
  const handoffEngineButton = document.querySelector('#handoffEngineButton');
  const importHandoffResultButton = document.querySelector('#importHandoffResultButton');
  const folder = document.querySelector('#sessionFolder');
  const sessionEngine = document.querySelector('#sessionEngine');
  const permission = document.querySelector('#sessionPermission');
  const contextSummary = document.querySelector('#sessionContextSummary');
  const toolList = document.querySelector('#sessionToolList');
  const planCard = document.querySelector('#planCard');
  const workflowMiniCard = document.querySelector('#workflowMiniCard');
  const inspectorDetails = document.querySelector('#inspectorDetails');
  if (!mode || !materialGoal || !materialInputs || !materialNodes || !materialConstraints || !materialValidation || !toolList) return;

  const material = collectWorkflowMaterial(session);
  const hasWorkflowDraft = (session?.artifacts || []).some((item) => item.type === 'workflow');

  setPanelVisible(planCard, material.stages.length > 0);
  setPanelVisible(workflowMiniCard, hasWorkflowDraft || state.currentWorkspaceTab === 'workflow');
  setPanelVisible(inspectorDetails, Boolean(session?.approvals?.length || session?.toolRuns?.length || session?.projectPath || state.currentFolder));

  mode.textContent = session?.mode === 'project' ? '项目' : '会话';
  const goalState = normalizeGoalState(session?.goalState, material.goal || session?.memory?.goal || '');
  if (!isActionablePrompt(goalState.title)) {
    goalState.title = '';
    goalState.status = 'paused';
  }
  if (goalBadge) {
    goalBadge.textContent = renderGoalStatus(goalState.status);
    goalBadge.className = goalState.status === 'locked' || goalState.status === 'done' ? 'badge green' : 'badge amber';
  }
  materialGoal.textContent = material.goal || '还没有形成可沉淀目标。';
  if (goalAcceptanceList) goalAcceptanceList.innerHTML = renderGoalMiniList(goalState);
  if (lockGoalButton) lockGoalButton.textContent = goalState.status === 'locked' ? '解锁目标' : '锁定目标';
  if (lockGoalButton) lockGoalButton.disabled = !goalState.title;
  if (markGoalDoneButton) markGoalDoneButton.disabled = !goalState.title || goalState.status === 'done';
  materialInputs.innerHTML = renderMaterialList(material.inputs, '暂无明确输入。');
  materialNodes.innerHTML = renderMaterialList(material.nodes, '暂无可复用节点。');
  materialConstraints.innerHTML = renderMaterialList(material.constraints, '暂无额外约束。');
  materialValidation.innerHTML = renderMaterialList(material.validation, '暂无验证规则。');
  if (readinessText) readinessText.textContent = `${material.score} / ${material.maxScore}`;
  if (readinessBar) readinessBar.style.width = `${Math.round((material.score / material.maxScore) * 100)}%`;
  if (readinessGaps) readinessGaps.innerHTML = renderReadinessGaps(material);
  if (readinessBadge) {
    readinessBadge.textContent = material.ready ? '已就绪' : '积累中';
    readinessBadge.className = material.ready ? 'badge green' : 'badge amber';
  }
  if (generateButton) {
    generateButton.disabled = !material.ready;
    generateButton.textContent = material.ready ? '生成工作流' : '继续积累';
  }
  if (handoffEngineButton) handoffEngineButton.disabled = !isActionablePrompt(material.goal);
  if (importHandoffResultButton) importHandoffResultButton.disabled = !session;
  if (folder) folder.textContent = session?.projectPath || state.currentFolder?.rootPath || '未绑定';
  if (sessionEngine) sessionEngine.textContent = getSessionEngine(session?.engineId || state.composer.engineId).name;
  if (permission) permission.textContent = resolveSessionPermission(session);
  if (contextSummary) contextSummary.textContent = `${formatTokenCount(session?.context?.estimatedTokens || 0)} / ${formatTokenCount(session?.context?.tokenBudget || 6000)}`;

  const approvals = session?.approvals || [];
  const toolRuns = session?.toolRuns || [];
  const toolItems = [...approvals, ...toolRuns].slice(0, 6);
  toolList.innerHTML = toolItems.length
    ? toolItems.map((item) => renderToolItem(item)).join('')
    : '<div class="empty-state">暂无审批或工具调用。</div>';
  renderInspectorStageSummaries(session, material);
  renderApprovalDock(session);
}

function updateInspectorStageFocus(activeStage = state.currentWorkspaceTab || 'chat') {
  document.querySelectorAll('[data-inspector-stage]').forEach((stage) => {
    const isActive = stage.dataset.inspectorStage === activeStage;
    stage.classList.toggle('active', isActive);
    stage.open = isActive;
  });
}

function renderInspectorStageSummaries(session = getCurrentSession(), material = collectWorkflowMaterial(session)) {
  const chatSummary = document.querySelector('#chatStageSummary');
  const filesSummary = document.querySelector('#filesStageSummary');
  const workflowSummary = document.querySelector('#workflowStageSummary');
  const filesBar = document.querySelector('#filesStageBar');
  const workflowBar = document.querySelector('#workflowStageBar');
  const fileContext = document.querySelector('#fileStageContext');
  const fileEvidence = document.querySelector('#fileStageEvidence');
  const workflow = getSelectedWorkflow();
  const evidence = collectEvidenceBox(session);
  const contextFiles = session?.context?.files || [];
  const targetPath = session?.projectPath || state.currentFolder?.rootPath || '';
  const artifacts = session?.artifacts || [];
  const hasWorkflowDraft = artifacts.some((item) => item.type === 'workflow');

  if (chatSummary) {
    chatSummary.textContent = material.ready
      ? '可生成'
      : material.goal
        ? '目标形成中'
        : '等待目标';
  }

  const contextItems = compactMaterialItems([
    targetPath ? `目标目录：${targetPath}` : '',
    session?.tempFilesPath ? `临时目录：${session.tempFilesPath}` : '',
    ...contextFiles.slice(0, 4).map((file) => `文件：${file.relativePath || file.name || file.path}`),
    artifacts.length ? `会话产物：${artifacts.length} 项` : ''
  ]);
  if (fileContext) fileContext.innerHTML = renderMaterialList(contextItems, '还没有绑定目录或读取文件。');
  if (fileEvidence) {
    fileEvidence.innerHTML = renderMaterialList(
      evidence.slice(0, 6).map((item) => `${item.title}${item.status ? ` · ${renderEvidenceStatus(item.status)}` : ''}`),
      '证据箱暂时为空。'
    );
  }
  if (filesSummary) {
    filesSummary.textContent = evidence.length ? `${evidence.length} 条证据` : contextItems.length ? '有上下文' : '暂无证据';
  }
  if (filesBar) {
    const fileProgress = Math.min(100, evidence.length * 18 + contextItems.length * 12);
    filesBar.style.width = `${fileProgress}%`;
  }

  if (workflowSummary) {
    workflowSummary.textContent = hasWorkflowDraft || workflow
      ? `${workflow?.nodes?.length || 0} 个节点`
      : material.ready
        ? '可生成'
        : '尚未生成';
  }
  if (workflowBar) {
    const workflowProgress = hasWorkflowDraft
      ? 100
      : Math.min(80, Math.round((material.score / material.maxScore) * 70));
    workflowBar.style.width = `${workflowProgress}%`;
  }
}

function renderGoalStatus(status) {
  const labels = { draft: '草稿', active: '进行中', locked: '已锁定', done: '完成', paused: '未形成' };
  return labels[status] || '草稿';
}

function renderGoalMiniList(goalState) {
  const acceptance = normalizeLocalList(goalState.acceptance).slice(0, 3);
  const subgoals = normalizeLocalList(goalState.subgoals).slice(0, 3);
  const rows = [
    ...acceptance.map((item) => ['验收', item]),
    ...subgoals.map((item) => ['子目标', item])
  ].slice(0, 4);
  if (!rows.length) return '<div class="empty-state">继续对话后沉淀验收条件。</div>';
  return rows.map(([label, item]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(item)}</strong></div>`).join('');
}

function collectWorkflowMaterial(session) {
  const memory = session?.memory || createSessionMemory('');
  const messages = state.messages.filter((message) => message.role === 'user').map((message) => message.text);
  const lastMeaningful = [...messages].reverse().find(isActionablePrompt) || '';
  const plan = normalizeTaskPlan(state.taskPlan, lastMeaningful || state.pendingPrompt, state.intent);
  const artifacts = session?.artifacts || [];
  const engineResults = artifacts.filter((item) => item.type === 'engine-result');
  const engineHandoffs = artifacts.filter((item) => item.type === 'engine-handoff');
  const hasEvidence = Boolean(
    session?.projectPath ||
    state.currentFolder?.rootPath ||
    session?.context?.files?.length ||
    session?.toolRuns?.length ||
    engineResults.length ||
    engineHandoffs.length ||
    artifacts.some((item) => ['workflow', 'plan', 'command', 'engine-init'].includes(item.type))
  );
  const hasWorkflowIntent = state.intent?.mode === 'workflow' || /工作流|流程|复用|自动化|脚本化|验证/.test(messages.join(' '));
  const goalState = normalizeGoalState(session?.goalState, memory.goal || lastMeaningful);
  const goal = isActionablePrompt(goalState.title)
    ? goalState.title
    : (isActionablePrompt(memory.goal) ? memory.goal : lastMeaningful);
  const inputs = compactMaterialItems([
    session?.projectPath || state.currentFolder?.rootPath ? `本地目录：${session?.projectPath || state.currentFolder?.rootPath}` : '',
    engineHandoffs.length ? `交接包：${engineHandoffs[0].summary}` : '',
    engineResults.length ? `外部结果：${engineResults[0].status || '已导入'}` : '',
    goalState.status === 'locked' ? '锁定目标' : '',
    hasWorkflowIntent ? '明确工作流意图' : ''
  ]);
  const stages = compactMaterialItems([
    ...plan.map((step) => step.title),
    ...extractWorkflowStages(messages.join('\n'))
  ]).slice(0, 6);
  const constraints = compactMaterialItems([
    ...(isActionablePrompt(goal) || hasWorkflowIntent ? (memory.constraints || []) : []),
    ...(goalState.risks || []),
    ...extractConstraintHints(messages.join('\n'))
  ]).slice(0, 5);
  const validation = compactMaterialItems([
    ...(goalState.acceptance || []).map((item) => `验收：${item}`),
    ...constraints.filter((item) => /验证|校验|独立|证据|不可/.test(item)),
    ...engineResults.map((item) => `${item.title} 需要独立验证：${item.status || '已记录'}`),
    ...(state.verification || []).map((item) => item.text)
  ]).slice(0, 5);
  const nodes = compactMaterialItems([
    ...(hasWorkflowIntent || stages.length >= 2 || hasEvidence ? plan.map((step) => step.agent).filter(Boolean) : []),
    ...extractAgentHints(messages.join('\n')),
    ...engineResults.map((item) => `${item.title}回收节点`),
    ...(hasWorkflowIntent ? ['WorkflowGeneratorSkill'] : [])
  ]).slice(0, 6);
  const readiness = assessWorkflowReadiness({
    goal,
    goalStatus: goalState.status,
    inputs,
    stages,
    nodes,
    constraints,
    validation,
    hasActionableGoal: isActionablePrompt(goal),
    hasEvidence,
    hasWorkflowIntent
  });
  return {
    goal,
    inputs,
    stages,
    constraints,
    validation,
    nodes,
    score: readiness.score,
    maxScore: readiness.maxScore,
    ready: readiness.ready,
    checks: readiness.checks,
    missing: readiness.missing
  };
}

function assessWorkflowReadiness(input = {}) {
  const goal = String(input.goal || '').trim();
  const goalStatus = String(input.goalStatus || '');
  const inputs = normalizeLocalList(input.inputs);
  const stages = normalizeLocalList(input.stages);
  const nodes = normalizeLocalList(input.nodes);
  const constraints = normalizeLocalList(input.constraints);
  const validation = normalizeLocalList(input.validation);
  const hasActionableGoal = Boolean(input.hasActionableGoal ?? isActionablePrompt(goal));
  const hasConfirmedGoal = hasActionableGoal && ['active', 'locked', 'done'].includes(goalStatus);
  const hasEvidence = Boolean(input.hasEvidence) || inputs.some((item) => /目录|文件|交接包|外部结果|产物|命令|证据/.test(item));
  const hasWorkflowIntent = Boolean(input.hasWorkflowIntent);
  const hasStageStructure = stages.length >= 2;
  const hasNodeCandidates = nodes.length > 0 && (hasWorkflowIntent || hasStageStructure || hasEvidence);
  const hasValidation = validation.length > 0 || constraints.some((item) => /验证|独立|校验|证据|验收|不可/.test(item));
  const checks = [
    { id: 'goal', label: '明确任务目标', passed: hasActionableGoal, missing: '先形成一个可执行目标' },
    { id: 'input', label: '真实输入或上下文', passed: hasEvidence, missing: '补充目录、文件、产物或外部结果' },
    { id: 'stages', label: '阶段结构', passed: hasStageStructure, missing: '拆出至少两个有意义阶段' },
    { id: 'nodes', label: '节点候选', passed: hasNodeCandidates, missing: '识别可复用节点或 Agent 分工' },
    { id: 'validation', label: '验收或验证方式', passed: hasValidation, missing: '明确怎么验证结果' }
  ];
  const score = checks.filter((item) => item.passed).length;
  return {
    score,
    maxScore: checks.length,
    ready: hasActionableGoal && score >= 4 && (hasConfirmedGoal || hasWorkflowIntent || hasEvidence),
    checks,
    missing: checks.filter((item) => !item.passed).map((item) => item.missing)
  };
}

function renderReadinessGaps(material) {
  if (material.ready) return '<div class="readiness-ok">素材已能生成一个可编辑工作流草稿。</div>';
  const gaps = (material.missing || []).slice(0, 3);
  if (!gaps.length) return '<div class="readiness-ok muted">继续补充关键材料。</div>';
  return gaps.map((gap) => `<span>${escapeHtml(gap)}</span>`).join('');
}

function compactMaterialItems(items) {
  const seen = new Set();
  return items
    .map((item) => String(item || '').trim())
    .filter((item) => item && !isLowValueMaterial(item))
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function isLowValueMaterial(text) {
  return /^(暂无|待开始|等待具体需求|回应问候|独立验证|判断是否需要目录)$/.test(text);
}

function extractWorkflowStages(text) {
  const candidates = [
    ['探索', '探索路径'],
    ['确认', '确认主路径'],
    ['脚本', '脚本化稳定步骤'],
    ['工程化', '工程化封装'],
    ['验证', '独立验证'],
    ['复用', '沉淀为可复用节点']
  ];
  return candidates.filter(([word]) => text.includes(word)).map(([, label]) => label);
}

function extractConstraintHints(text) {
  const hints = [];
  if (/独立上下文|独立.*验证|验证.*独立/.test(text)) hints.push('验证流程必须使用独立上下文');
  if (/不能|不可.*修改|不可干预/.test(text)) hints.push('验证机制不可被执行阶段干预');
  if (/脚本化|工程化/.test(text)) hints.push('稳定步骤需要逐步脚本化');
  if (/多Agent|多 Agent|智能体/.test(text)) hints.push('节点可由不同 Agent 承担');
  return hints;
}

function extractAgentHints(text) {
  const hints = [];
  if (/目录|文件|项目/.test(text)) hints.push('目录理解 Agent');
  if (/探索|路径/.test(text)) hints.push('路径探索 Agent');
  if (/脚本|代码|工程化/.test(text)) hints.push('脚本化 Agent');
  if (/验证|校验/.test(text)) hints.push('独立验证 Agent');
  return hints;
}

function renderMaterialList(items, emptyText) {
  if (!items.length) return `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
  return items.map((item, index) => `<div><span>${index + 1}</span><strong title="${escapeHtml(item)}">${escapeHtml(item)}</strong></div>`).join('');
}

function setPanelVisible(element, visible) {
  if (!element) return;
  element.hidden = !visible;
}

function renderContextSummaryRows(session) {
  const current = session || getCurrentSession();
  const rows = [
    ['模式', current?.mode === 'project' || state.currentFolder ? '项目会话' : '随便聊聊'],
    ['窗口', `${formatTokenCount(current?.context?.estimatedTokens || 0)} / ${formatTokenCount(current?.context?.tokenBudget || 6000)}`]
  ];
  const summary = current?.context?.summary;
  if (summary && summary !== '未绑定目录。') rows.push(['摘要', summary]);
  if (current?.context?.compactedTurns) rows.push(['压缩', `${current.context.compactedTurns} 条早期消息`]);
  return rows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong title="${escapeHtml(value)}">${escapeHtml(value)}</strong></div>`).join('');
}

function resolveSessionPermission(session) {
  if ((session?.approvals || []).some((item) => item.status === '待确认')) return '等待确认';
  if ((session?.toolRuns || []).some((item) => item.status === '已执行')) return '工具已授权';
  return session?.projectPath ? '读取目录' : '只读';
}

function renderSelectedContextSummary(items) {
  if (!items.length) return '等待选择';
  const groups = items.reduce((map, item) => {
    map[item.type] = (map[item.type] || 0) + 1;
    return map;
  }, {});
  return Object.entries(groups).map(([type, count]) => `${renderContextType(type)} ${count}`).join(' / ');
}

function renderContextType(type) {
  const labels = {
    goal: '目标',
    summary: '摘要',
    file: '文件',
    directory: '目录',
    artifact: '产物',
    tool: '工具'
  };
  return labels[type] || '上下文';
}

function renderArtifactType(type) {
  const labels = {
    plan: '计划',
    workflow: '工作流',
    command: '命令',
    context: '上下文',
    'engine-handoff': '交接包',
    'engine-result': '外部结果',
    'engine-init': '初始化',
    verification: '验证',
    note: '记录'
  };
  return labels[type] || '产物';
}

function collectEvidenceBox(session = getCurrentSession()) {
  if (!session) return [];
  const items = [];
  const push = (item) => {
    const normalized = normalizeEvidenceItem(item);
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
    ...artifact,
    source: artifact.source || renderEvidenceSource(artifact.type),
    status: artifact.status || inferEvidenceStatus(artifact)
  }));
  (session.toolRuns || []).forEach((tool) => push({
    type: 'command',
    title: tool.command || '命令输出',
    summary: tool.stdout || tool.stderr || tool.status || '',
    source: '命令执行',
    status: /失败|failed|error/i.test(`${tool.status || ''} ${tool.stderr || ''}`) ? 'failed' : 'passed',
    createdAt: tool.createdAt
  }));
  (session.verification || []).forEach((item) => push({
    type: 'verification',
    title: item.isolated ? '隔离验证' : '验证记录',
    summary: item.text || item.summary || '',
    source: '验证器',
    status: item.status === '通过' ? 'passed' : item.status === '失败' ? 'failed' : 'pending',
    createdAt: item.createdAt || item.time
  }));
  return dedupeEvidenceItems(items).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function normalizeEvidenceItem(item = {}) {
  return {
    id: item.id || `evidence-${simpleHash(`${item.type}:${item.title}:${item.path || ''}:${item.summary || ''}`)}`,
    type: item.type || 'note',
    title: item.title || item.command || '会话证据',
    summary: String(item.summary || item.evidence || '').slice(0, 1200),
    source: item.source || renderEvidenceSource(item.type),
    status: normalizeEvidenceStatus(item.status),
    path: item.path || '',
    createdAt: item.createdAt || Date.now()
  };
}

function inferEvidenceStatus(item = {}) {
  const value = `${item.status || ''} ${item.summary || ''} ${item.evidence || ''}`.toLowerCase();
  if (/失败|failed|error|exception|blocked/.test(value)) return 'failed';
  if (/通过|success|completed|done|passed|完成/.test(value)) return 'passed';
  if (/导入|import/.test(value) || item.path) return 'imported';
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

function renderApprovalDock(session) {
  const dock = document.querySelector('#approvalDock');
  if (!dock) return;
  const approvals = (session?.approvals || []).filter((item) => ['待确认', '已批准', '执行中', '失败', '已拦截'].includes(item.status));
  if (!approvals.length) {
    dock.classList.remove('active');
    dock.innerHTML = '';
    return;
  }
  dock.classList.add('active');
  dock.innerHTML = approvals.slice(0, 3).map((item) => `
    <div class="approval-item">
      <div>
        <strong>${escapeHtml(item.command || item.summary || '待审批操作')}</strong>
        <span>${escapeHtml(item.permission)} · ${escapeHtml(item.status || '待确认')}</span>
      </div>
      ${item.status === '已拦截' ? '<div class="approval-actions"><span>已拦截</span></div>' : `<div class="approval-actions">
        <button type="button" data-approval-id="${escapeHtml(item.id)}" data-approval-action="approve">批准</button>
        ${item.command ? `<button type="button" data-approval-id="${escapeHtml(item.id)}" data-approval-action="run">运行</button>` : ''}
        <button type="button" data-approval-id="${escapeHtml(item.id)}" data-approval-action="reject">拒绝</button>
      </div>`}
    </div>
  `).join('');
}

function renderToolItem(item) {
  if (item.id && String(item.id).startsWith('approval-')) {
    const canRun = item.command && ['待确认', '已批准', '失败'].includes(item.status);
    const blocked = item.status === '已拦截';
    return `
      <div class="session-tool-row">
        <span>${escapeHtml(item.type || '审批')}</span>
        <strong>${escapeHtml(item.command || item.summary || item.status)}</strong>
        <em>${escapeHtml(item.status || '待确认')}</em>
        ${blocked ? '<div class="session-tool-actions"><span>不可运行</span></div>' : `<div class="session-tool-actions">
          <button type="button" data-approval-id="${escapeHtml(item.id)}" data-approval-action="approve">批准</button>
          ${canRun ? `<button type="button" data-approval-id="${escapeHtml(item.id)}" data-approval-action="run">运行</button>` : ''}
          <button type="button" data-approval-id="${escapeHtml(item.id)}" data-approval-action="reject">拒绝</button>
        </div>`}
      </div>
    `;
  }
  return `
    <div>
      <span>${escapeHtml(item.type || '工具')}</span>
      <strong title="${escapeHtml(item.command || '')}">${escapeHtml(item.status || item.command || '已记录')}</strong>
    </div>
  `;
}

function renderConversations() {
  const list = document.querySelector('#conversationList');
  if (!list) return;
  list.innerHTML = '';
  if (state.conversations.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sidebar-empty';
    empty.textContent = '暂无对话';
    list.appendChild(empty);
    return;
  }

  state.conversations.forEach((conversation) => {
    const item = document.createElement('button');
    item.textContent = conversation.title;
    item.classList.toggle('active', conversation.id === state.currentConversationId);
    item.title = conversation.title;
    item.addEventListener('click', () => restoreConversation(conversation.id));
    list.appendChild(item);
  });
}

function renderRecent() {
  const sidebar = document.querySelector('#recentList');
  const cards = document.querySelector('#recentCards');
  const count = document.querySelector('#recentCount');
  sidebar.innerHTML = '';
  cards.innerHTML = '';
  count.textContent = `${state.recent.length} 项`;

  if (state.recent.length === 0) {
    cards.innerHTML = `<div class="row"><div class="file-icon">+</div><div><strong>暂无最近目标</strong><span>从一次对话或目录开始。</span></div><span class="badge">空</span></div>`;
    return;
  }

  state.recent.forEach((item) => {
    const nav = document.createElement('button');
    nav.textContent = item.name;
    nav.classList.toggle('active', Boolean(state.currentFolder && state.currentFolder.rootPath === item.path));
    nav.addEventListener('click', async () => {
      const folder = await window.kaka.scanFolder(item.path);
      applyFolder(folder);
    });
    sidebar.appendChild(nav);

    const row = document.createElement('button');
    row.className = 'row';
    row.innerHTML = `<div class="file-icon">${item.name.slice(0, 1).toUpperCase()}</div>
      <div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.path)}</span></div>
      <span class="badge green">打开</span>`;
    row.addEventListener('click', async () => {
      const folder = await window.kaka.scanFolder(item.path);
      applyFolder(folder);
    });
    cards.appendChild(row);
  });
}

function renderTree(entries) {
  const tree = document.querySelector('#fileTree');
  tree.innerHTML = '';
  const add = (items, depth = 0) => {
    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = index === 0 && depth === 0 ? 'active' : '';
      row.textContent = `${'  '.repeat(depth)}${item.type === 'directory' ? '▾' : ' '} ${item.name}`;
      tree.appendChild(row);
      if (item.children) add(item.children, depth + 1);
    });
  };
  add(entries);
}

function renderFileSources() {
  const sources = document.querySelector('#fileSources');
  const evidenceBox = document.querySelector('#evidenceBox');
  const tree = document.querySelector('#fileTree');
  const count = document.querySelector('#fileCount');
  if (!sources || !tree || !count) return;
  const session = getCurrentSession();
  const artifacts = (session?.artifacts || []).filter((item) => item.type !== 'plan');
  const evidence = collectEvidenceBox(session);
  const targetPath = session?.projectPath || state.currentFolder?.rootPath || '';
  const tempPath = session?.tempFilesPath || (session?.workspacePath ? joinWorkspacePath(session.workspacePath, 'files') : state.workspace?.conversationsDir || '');
  const targetCount = state.currentFolder?.summary?.files || 0;
  count.textContent = String(targetCount);
  sources.innerHTML = `
    <section class="file-source-card">
      <div><strong>临时会话目录</strong><span>${escapeHtml(tempPath || '等待创建会话')}</span></div>
      <em>${artifacts.length ? `${artifacts.length} 个会话产物` : '暂无临时文件'}</em>
    </section>
    <section class="file-source-card ${targetPath ? 'active' : ''}">
      <div><strong>目标目录</strong><span>${escapeHtml(targetPath || '未绑定')}</span></div>
      <em>${targetPath ? `${targetCount} 个文件` : '打开目录后显示'}</em>
    </section>
  `;
  if (evidenceBox) {
    evidenceBox.innerHTML = renderEvidenceBox(evidence);
  }
  if (!targetPath) {
    tree.innerHTML = artifacts.length
      ? artifacts.map((item) => `<div>${escapeHtml(renderArtifactType(item.type))} ${escapeHtml(item.title)}</div>`).join('')
      : '<div class="active">未绑定目标目录，临时会话暂无文件。</div>';
  } else if (!state.currentFolder) {
    tree.innerHTML = '<div class="active">目标目录已绑定，重新打开目录后显示文件树。</div>';
  }
  renderInspectorStageSummaries(session);
}

function renderEvidenceBox(evidence) {
  if (!evidence.length) {
    return '<section class="evidence-panel"><div class="evidence-head"><strong>证据箱</strong><span>暂无证据</span></div><div class="empty-state">交接包、外部结果、命令输出和验证记录会出现在这里。</div></section>';
  }
  const groups = [
    ['会话产物', evidence.filter((item) => ['engine-handoff', 'engine-result', 'workflow', 'engine-init'].includes(item.type))],
    ['执行证据', evidence.filter((item) => ['command', 'context'].includes(item.type))],
    ['验证记录', evidence.filter((item) => item.type === 'verification')]
  ].filter(([, items]) => items.length);
  return `
    <section class="evidence-panel">
      <div class="evidence-head"><strong>证据箱</strong><span>${evidence.length} 项</span></div>
      ${groups.map(([label, items]) => `
        <div class="evidence-group">
          <h4>${escapeHtml(label)}</h4>
          ${items.slice(0, 6).map((item) => renderEvidenceItem(item)).join('')}
        </div>
      `).join('')}
    </section>
  `;
}

function renderEvidenceItem(item) {
  return `
    <button class="evidence-item ${item.id === state.selectedEvidenceId ? 'active' : ''}" type="button" data-evidence-id="${escapeHtml(item.id)}" title="${escapeHtml(item.summary || item.path || item.title)}">
      <span class="evidence-status ${escapeHtml(item.status)}">${escapeHtml(renderEvidenceStatus(item.status))}</span>
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <em>${escapeHtml(item.source)}${item.path ? ` · ${escapeHtml(item.path)}` : ''}</em>
      </div>
    </button>
  `;
}

function renderEvidenceStatus(status) {
  const labels = { passed: '通过', failed: '失败', pending: '待验', imported: '导入' };
  return labels[status] || '待验';
}

function renderAgents() {
  const home = document.querySelector('#homeAgents');
  const grid = document.querySelector('#agentsGrid');
  const detail = document.querySelector('#agentDetail');
  if (home) home.innerHTML = '';
  if (grid) grid.innerHTML = '';
  document.querySelectorAll('#agentsView .agents-filter button').forEach((button, index) => {
    const filter = ['all', 'builtin', 'external'][index] || 'all';
    button.classList.toggle('active', state.agentFilter === filter);
  });

  agents.filter((agent) => agent.engine === 'kaka').slice(0, 3).forEach((agent) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div class="avatar">${escapeHtml(agent.name.slice(0, 1))}</div>
      <div><strong>${escapeHtml(agent.name)}</strong><span>${escapeHtml(agent.role)}</span></div>
      <span class="badge green">${escapeHtml(agent.status)}</span>`;
    if (home) home.appendChild(row);
  });

  getFilteredAgents().forEach((agent) => {
    if (!grid) return;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `agent-card agent-list-item agent-engine-${agent.engine} ${agent.id === state.selectedAgentId ? 'active' : ''}`;
    card.innerHTML = `
      <div class="agent-head">
        <div class="avatar">${escapeHtml(agent.name.slice(0, 1))}</div>
        <div>
          <h3>${escapeHtml(agent.name)}</h3>
          <p>${escapeHtml(agent.role)}</p>
        </div>
        <span class="badge ${agent.engine === 'kaka' ? 'green' : 'amber'}">${escapeHtml(agent.status)}</span>
      </div>
      <p>${escapeHtml(agent.description)}</p>
      <div class="agent-line-meta">
        <span>${escapeHtml(agent.engineLabel)}</span>
        <span>${escapeHtml(agent.permission)}</span>
      </div>
    `;
    card.addEventListener('click', () => {
      state.selectedAgentId = agent.id;
      renderAgents();
    });
    grid.appendChild(card);
  });

  if (detail) renderAgentDetail();
}

function getFilteredAgents() {
  if (state.agentFilter === 'builtin') return agents.filter((agent) => agent.engine === 'kaka');
  if (state.agentFilter === 'external') return agents.filter((agent) => agent.engine !== 'kaka');
  return agents;
}

function renderAgentDetail() {
  const detail = document.querySelector('#agentDetail');
  if (!detail) return;
  const agent = getSelectedAgent();
  if (!agent) {
    detail.innerHTML = '<div class="empty-state">选择一个智能体查看配置。</div>';
    return;
  }
  const engineList = getAgentEngineRegistry();
  const engine = engineList.find((item) => item.id === normalizeEngineId(agent.engine)) || engineList[0];
  detail.innerHTML = `
    <div class="agent-detail-head">
      <div class="avatar large">${escapeHtml(agent.name.slice(0, 1))}</div>
      <div>
        <strong>${escapeHtml(agent.name)}</strong>
        <span>${escapeHtml(agent.role)}</span>
      </div>
      <span class="badge ${agent.engine === 'kaka' ? 'green' : 'amber'}">${escapeHtml(agent.status)}</span>
    </div>
    <div class="agent-form">
      <label><span>名称</span><input data-agent-field="name" value="${escapeAttribute(agent.name)}"></label>
      <label><span>负责的事情</span><input data-agent-field="role" value="${escapeAttribute(agent.role)}"></label>
      <label><span>说明</span><textarea data-agent-field="description" rows="4">${escapeHtml(agent.description)}</textarea></label>
      <div class="agent-form-row">
        <label><span>驱动引擎</span><select data-agent-field="engine">${engineList.map((item) => `<option value="${escapeAttribute(item.id)}" ${item.id === normalizeEngineId(agent.engine) ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}</select></label>
        <label><span>状态</span><select data-agent-field="status">
          ${['默认', '常用', '启用', '需确认', '可接入', '草稿'].map((status) => `<option value="${escapeAttribute(status)}" ${status === agent.status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}
        </select></label>
      </div>
      <div class="agent-form-row">
        <label><span>接入方式</span><input data-agent-field="adapter" value="${escapeAttribute(agent.adapter)}"></label>
        <label><span>权限边界</span><input data-agent-field="permission" value="${escapeAttribute(agent.permission)}"></label>
      </div>
      <label><span>适合场景</span><input data-agent-field="use" value="${escapeAttribute(agent.use)}"></label>
    </div>
    <section class="agent-engine-summary">
      <div>
        <strong>${escapeHtml(engine.name)}</strong>
        <span>${escapeHtml(engine.kind)} · ${escapeHtml(engine.command)}</span>
      </div>
      <p>${escapeHtml(engine.summary)}</p>
    </section>
  `;
  detail.querySelectorAll('[data-agent-field]').forEach((field) => {
    field.addEventListener('input', () => updateSelectedAgentField(field.dataset.agentField, field.value));
    field.addEventListener('change', () => updateSelectedAgentField(field.dataset.agentField, field.value, true));
  });
}

function getSelectedAgent() {
  return agents.find((agent) => agent.id === state.selectedAgentId) || agents[0] || null;
}

function createAgentDraft() {
  const now = Date.now();
  const agent = normalizeAgent({
    id: `agent-${now}`,
    name: '新智能体',
    role: '待定义职责',
    status: '草稿',
    description: '描述这个智能体负责的任务、边界和产出。',
    permission: '只读',
    engine: 'kaka',
    adapter: '内置',
    use: '会话和工作流节点',
    custom: true
  });
  agents.unshift(agent);
  state.selectedAgentId = agent.id;
  state.agentFilter = 'all';
  renderAgents();
  persistAppState();
}

function updateSelectedAgentField(field, value, rerender = false) {
  const agent = getSelectedAgent();
  if (!agent || !field) return;
  agent[field] = value;
  if (field === 'engine') {
    const engineList = getAgentEngineRegistry();
    const engine = engineList.find((item) => item.id === normalizeEngineId(value)) || engineList[0];
    agent.engine = engine.id;
    agent.engineLabel = engine.name;
    if (!agent.adapter || agent.adapter === '内置' || agent.adapter === 'CLI') {
      agent.adapter = engine.id === 'kaka' ? '内置' : 'CLI';
    }
    rerender = true;
  }
  if (['status', 'engine'].includes(field)) rerender = true;
  if (rerender) renderAgents();
  persistAppState();
}

function renderHomeWorkflows() {
  const home = document.querySelector('#homeWorkflows');
  home.innerHTML = '';

  publicWorkflows.slice(0, 3).forEach((workflow) => {
    const row = document.createElement('button');
    row.className = 'row';
    row.innerHTML = `<div class="file-icon">${workflow.name.slice(0, 1)}</div>
      <div><strong>${workflow.name}</strong><span>${workflow.role}</span></div>
      <span class="badge green">${workflow.status}</span>`;
    row.addEventListener('click', () => {
      state.selectedWorkflowId = workflow.id;
      renderWorkflow();
      switchView('workflow');
    });
    home.appendChild(row);
  });
}

function renderWorkflowMini() {
  const mini = document.querySelector('#workflowMini');
  mini.innerHTML = ['理解目录', '确认任务', '执行', '验证'].map((name, index) => {
    const status = index === 0 ? '完成' : index === 1 ? '当前' : '等待';
    return `<div class="flow-step"><div class="flow-num">${index + 1}</div><strong>${name}</strong><span>${status}</span></div>`;
  }).join('');
}

function renderWorkflow() {
  renderWorkflowList();
  const workflow = getSelectedWorkflow();
  document.querySelector('#workflowTitle').textContent = workflow.name;
  document.querySelector('#workflowSubtitle').textContent = workflow.role;
  document.querySelector('#selectedWorkflowScope').textContent = workflow.scope;
  document.querySelector('#selectedWorkflowNodeCount').textContent = `${workflow.nodes.length}`;
  document.querySelector('#selectedWorkflowStatus').textContent = workflow.status;

  renderWorkflowCanvas(workflow, {
    canvasSelector: '#workflowCanvas',
    shellSelector: '#workflowView .workflow-canvas-shell',
    controlsSelector: '#workflowView .canvas-controls',
    surface: 'main',
    onNodeSelect: selectWorkflowNode
  });
  renderWorkflowEdits(workflow);
  selectWorkflowNode(workflow.nodes.find((node) => node.id === workflow.selectedNodeId) || workflow.nodes[0] || workflowNodes[0]);
  if (document.querySelector('#workspaceWorkflowPanel')?.classList.contains('active')) {
    renderWorkspaceWorkflow();
  }
}

function renderWorkflowCanvas(workflow, options = {}) {
  const canvasOptions = { ...options, workflow };
  const canvas = document.querySelector(canvasOptions.canvasSelector || '#workflowCanvas');
  if (!canvas || !workflow) return;
  const layout = createWorkflowLayout(workflow);
  canvas.className = 'canvas workflow-builder-canvas';
  canvas.innerHTML = renderWorkflowEdges(layout);
  applyWorkflowViewport(workflow, canvasOptions);
  workflow.nodes.forEach((node, index) => {
    const position = layout.positions[node.id] || { x: 80 + index * 230, y: 120 };
    const element = document.createElement('article');
    const isSelected = workflow.selectedNodeId === node.id || state.workflowComposer.selectedNodes.includes(node.id);
    element.dataset.nodeId = node.id;
    element.className = `workflow-node ${(node.cls || '').includes('active') || isSelected ? 'active' : ''} ${isSelected ? 'mentioned' : ''}`;
    element.style.left = `${position.x}px`;
    element.style.top = `${position.y}px`;
    element.innerHTML = `
      ${canConnectInto(node) ? '<span class="node-port in"></span>' : ''}
      ${canConnectOut(node) ? '<span class="node-port out"></span>' : ''}
      ${canAddAfterNode(node) ? '<button class="node-add-button" type="button" aria-label="添加后续节点">+</button>' : ''}
      <div class="workflow-node-head">
        <span class="workflow-node-icon">${escapeHtml(getWorkflowNodeIcon(node))}</span>
        <div><h3>${escapeHtml(node.title)}</h3><em>${escapeHtml(resolveNodeAgent(node))}</em></div>
        <span class="node-kind-badge ${escapeHtml(getWorkflowNodeKind(node))}">${escapeHtml(getWorkflowNodeKindLabel(node))}</span>
      </div>
      <p>${escapeHtml(node.body)}</p>
      <div class="workflow-node-foot"><span>${escapeHtml(node.kind === 'js' ? '脚本' : '提示词')}</span><strong>${escapeHtml(resolveNodeRuntime(node))}</strong></div>
    `;
    element.addEventListener('click', () => {
      workflow.selectedNodeId = node.id;
      if (canvasOptions.onNodeSelect) canvasOptions.onNodeSelect(node);
      renderWorkflowCanvas(workflow, canvasOptions);
    });
    const addButton = element.querySelector('.node-add-button');
    if (addButton) {
      addButton.addEventListener('click', (event) => {
        event.stopPropagation();
        addWorkflowNodeAfter(workflow, node, canvasOptions);
      });
    }
    bindWorkflowNodeDrag(element, workflow, node, canvasOptions);
    canvas.appendChild(element);
  });
  bindWorkflowCanvasPanZoom(workflow, canvasOptions);
  updateWorkflowCanvasChrome(workflow, canvasOptions);
}

function renderWorkflowEdits(workflow) {
  const status = document.querySelector('#selectedWorkflowStatus');
  if (!status) return;
  const count = Array.isArray(workflow.edits) ? workflow.edits.length : 0;
  status.textContent = count ? `${workflow.status} · ${count} 条指令` : workflow.status;
}

function createWorkflowLayout(workflow) {
  const nodes = workflow.nodes;
  const canvasState = ensureWorkflowCanvasState(workflow);
  const positions = { ...canvasState.positions };
  const defaultPositions = {
    start: { x: 72, y: 128 },
    read: { x: 392, y: 128 },
    plan: { x: 712, y: 128 },
    build: { x: 1032, y: 128 },
    branch: { x: 712, y: 366 },
    verify: { x: 1032, y: 366 },
    fail: { x: 712, y: 604 },
    end: { x: 1352, y: 366 }
  };
  nodes.forEach((node, index) => {
    if (!positions[node.id]) {
      positions[node.id] = defaultPositions[node.id] || {
        x: 72 + (index % 4) * workflowLayoutGap.x,
        y: 128 + Math.floor(index / 4) * workflowLayoutGap.y
      };
    }
  });
  expandLegacyWorkflowPositions(nodes, positions, defaultPositions);
  canvasState.positions = positions;

  const has = (id) => Boolean(positions[id]);
  const baseEdges = [
    ['start', 'read', 'green'],
    ['read', 'plan', 'green'],
    ['plan', 'build', 'green'],
    ['plan', 'branch', 'amber'],
    ['branch', 'verify', 'green'],
    ['verify', 'fail', 'red'],
    ['verify', 'end', 'green'],
    ['fail', 'plan', 'gray'],
    ['build', 'end', 'green']
  ].filter(([from, to]) => has(from) && has(to) && canConnectNodes(nodes, from, to));

  const edgeKeys = new Set(baseEdges.map(([from, to]) => `${from}:${to}`));
  const sequenceEdges = [];
  nodes.forEach((node, index) => {
    const next = nodes[index + 1];
    if (!next) return;
    const key = `${node.id}:${next.id}`;
    if (edgeKeys.has(key)) return;
    if (canConnectNodes(nodes, node.id, next.id)) sequenceEdges.push([node.id, next.id, 'green']);
  });

  return { positions, edges: [...baseEdges, ...sequenceEdges] };
}

function expandLegacyWorkflowPositions(nodes, positions, defaultPositions) {
  if (!nodes.length || nodes.some((node) => node.id.startsWith('s-') || node.id.startsWith('node-'))) return;
  const start = positions.start;
  const read = positions.read;
  const plan = positions.plan;
  if (!start || !read || !plan) return;
  const compact = Math.abs(read.x - start.x) < 290 || Math.abs(plan.x - read.x) < 290;
  if (!compact) return;
  nodes.forEach((node) => {
    if (defaultPositions[node.id]) positions[node.id] = { ...defaultPositions[node.id] };
  });
}

function canConnectInto(node) {
  return node.id !== 'start';
}

function canConnectOut(node) {
  return node.id !== 'end' && !node.terminal;
}

function canAddAfterNode(node) {
  return canConnectOut(node);
}

function canConnectNodes(nodes, fromId, toId) {
  const from = nodes.find((node) => node.id === fromId);
  const to = nodes.find((node) => node.id === toId);
  if (!from || !to) return false;
  return canConnectOut(from) && canConnectInto(to);
}

function addWorkflowNodeAfter(workflow, sourceNode, options = {}) {
  if (!canAddAfterNode(sourceNode)) return;
  const id = `node-${Date.now().toString(36)}`;
  const node = {
    id,
    title: '新节点',
    body: '描述这个阶段的输入、动作和产物。',
    badge: '草稿',
    kind: 'ai',
    cls: 'n-draft'
  };
  const index = workflow.nodes.findIndex((item) => item.id === sourceNode.id);
  workflow.nodes.splice(index + 1, 0, node);
  const canvasState = ensureWorkflowCanvasState(workflow);
  const sourcePosition = canvasState.positions[sourceNode.id] || { x: 80, y: 120 };
  canvasState.positions[id] = {
    x: sourcePosition.x + workflowLayoutGap.x,
    y: sourcePosition.y
  };
  workflow.selectedNodeId = id;
  addLog('工作流', `从 ${sourceNode.title} 添加新节点`);
  persistAppState();
  renderWorkflow();
  if (options.surface === 'workspace') renderWorkspaceWorkflow();
}

function renderWorkflowEdges(layout) {
  const paths = layout.edges.map(([from, to, tone]) => {
    const start = layout.positions[from];
    const end = layout.positions[to];
    const anchor = createEdgeAnchor(start, end);
    const path = createEdgePath(anchor);
    return `<path class="workflow-edge ${tone}" d="${path}" marker-end="url(#workflowArrow)"></path>`;
  }).join('');
  return `
    <svg class="workflow-edge-layer" width="2200" height="1400" viewBox="0 0 2200 1400" aria-hidden="true">
      <defs>
        <marker id="workflowArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M 0 0 L 8 4 L 0 8 z"></path>
        </marker>
      </defs>
      ${paths}
    </svg>
  `;
}

function ensureWorkflowCanvasState(workflow) {
  workflow.canvas = workflow.canvas || {};
  workflow.canvas.zoom = workflow.canvas.zoom || 1;
  workflow.canvas.panX = typeof workflow.canvas.panX === 'number' ? workflow.canvas.panX : 0;
  workflow.canvas.panY = typeof workflow.canvas.panY === 'number' ? workflow.canvas.panY : 0;
  workflow.canvas.positions = workflow.canvas.positions || {};
  return workflow.canvas;
}

function applyWorkflowViewport(workflow, options = {}) {
  const canvas = document.querySelector(options.canvasSelector || '#workflowCanvas');
  if (!canvas) return;
  const canvasState = ensureWorkflowCanvasState(workflow);
  canvas.style.transform = `translate(${canvasState.panX}px, ${canvasState.panY}px) scale(${canvasState.zoom})`;
}

function updateWorkflowCanvasChrome(workflow, options = {}) {
  const shell = document.querySelector(options.shellSelector || '.workflow-canvas-shell');
  const controls = document.querySelector(options.controlsSelector || '.canvas-controls');
  if (!shell || !controls) return;
  shell.__workflow = workflow;
  shell.__workflowOptions = options;
  const canvasState = ensureWorkflowCanvasState(workflow);
  shell.style.setProperty('--workflow-grid-size', `${22 * canvasState.zoom}px`);
  const zoomText = controls.querySelector('span');
  if (zoomText) zoomText.textContent = `${Math.round(canvasState.zoom * 100)}%`;
  const buttons = controls.querySelectorAll('button');
  buttons.forEach((button) => {
    button.__workflowShell = shell;
  });
  if (buttons[0] && !buttons[0].dataset.bound) {
    buttons[0].dataset.bound = 'true';
    buttons[0].addEventListener('click', () => fitWorkflowCanvas(getWorkflowSurfaceOptions(buttons[0])));
  }
  if (buttons[1] && !buttons[1].dataset.bound) {
    buttons[1].dataset.bound = 'true';
    buttons[1].addEventListener('click', () => zoomWorkflowCanvas(-0.12, null, getWorkflowSurfaceOptions(buttons[1])));
  }
  if (buttons[2] && !buttons[2].dataset.bound) {
    buttons[2].dataset.bound = 'true';
    buttons[2].addEventListener('click', () => zoomWorkflowCanvas(0.12, null, getWorkflowSurfaceOptions(buttons[2])));
  }
}

function getWorkflowSurfaceOptions(element) {
  const shell = element?.__workflowShell || element?.closest?.('.workflow-canvas-shell');
  if (!shell) return {};
  return { ...(shell.__workflowOptions || {}), workflow: shell.__workflow };
}

function bindWorkflowCanvasPanZoom(workflow, options = {}) {
  const shell = document.querySelector(options.shellSelector || '.workflow-canvas-shell');
  if (!shell || shell.dataset.workflowPanBound === 'true') return;
  shell.dataset.workflowPanBound = 'true';
  shell.addEventListener('wheel', (event) => {
    const activeOptions = getWorkflowSurfaceOptions(shell);
    if (!isWorkflowSurfaceVisible(activeOptions)) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    zoomWorkflowCanvas(delta, event, activeOptions);
  }, { passive: false });
  shell.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('.workflow-node') || event.target.closest('.canvas-controls')) return;
    const activeOptions = getWorkflowSurfaceOptions(shell);
    const activeWorkflow = activeOptions.workflow || workflow;
    const canvasState = ensureWorkflowCanvasState(activeWorkflow);
    const start = { x: event.clientX, y: event.clientY, panX: canvasState.panX, panY: canvasState.panY };
    shell.classList.add('panning');
    shell.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      canvasState.panX = start.panX + moveEvent.clientX - start.x;
      canvasState.panY = start.panY + moveEvent.clientY - start.y;
      applyWorkflowViewport(activeWorkflow, activeOptions);
      updateWorkflowCanvasChrome(activeWorkflow, activeOptions);
    };
    const up = () => {
      shell.classList.remove('panning');
      shell.removeEventListener('pointermove', move);
      shell.removeEventListener('pointerup', up);
      shell.removeEventListener('pointercancel', up);
    };
    shell.addEventListener('pointermove', move);
    shell.addEventListener('pointerup', up);
    shell.addEventListener('pointercancel', up);
  });
}

function isWorkflowSurfaceVisible(options = {}) {
  if (options.surface === 'workspace') {
    return document.querySelector('#workspaceView')?.classList.contains('active') &&
      document.querySelector('#workspaceWorkflowPanel')?.classList.contains('active');
  }
  return document.querySelector('#workflowView')?.classList.contains('active');
}

function bindWorkflowNodeDrag(element, workflow, node, options = {}) {
  element.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const activeWorkflow = workflow;
    const canvasState = ensureWorkflowCanvasState(activeWorkflow);
    const position = canvasState.positions[node.id] || { x: 0, y: 0 };
    const start = { x: event.clientX, y: event.clientY, nodeX: position.x, nodeY: position.y };
    let hasMoved = false;
    element.classList.add('dragging');
    element.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      const dx = (moveEvent.clientX - start.x) / canvasState.zoom;
      const dy = (moveEvent.clientY - start.y) / canvasState.zoom;
      if (Math.abs(moveEvent.clientX - start.x) > 3 || Math.abs(moveEvent.clientY - start.y) > 3) {
        hasMoved = true;
      }
      const next = {
        x: Math.max(24, Math.round((start.nodeX + dx) / 8) * 8),
        y: Math.max(24, Math.round((start.nodeY + dy) / 8) * 8)
      };
      canvasState.positions[node.id] = next;
      element.style.left = `${next.x}px`;
      element.style.top = `${next.y}px`;
      refreshWorkflowEdges(activeWorkflow, options);
    };
    const up = () => {
      element.classList.remove('dragging');
      if (!hasMoved) {
        activeWorkflow.selectedNodeId = node.id;
        if (options.onNodeSelect) options.onNodeSelect(node);
      }
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
    };
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);
  });
}

function refreshWorkflowEdges(workflow, options = {}) {
  const edgeLayer = document.querySelector(`${options.canvasSelector || '#workflowCanvas'} .workflow-edge-layer`);
  if (!edgeLayer) return;
  const layout = createWorkflowLayout(workflow);
  edgeLayer.outerHTML = renderWorkflowEdges(layout);
}

function zoomWorkflowCanvas(delta, event, options = {}) {
  const workflow = options.workflow || getSelectedWorkflow();
  const shell = document.querySelector(options.shellSelector || '.workflow-canvas-shell');
  if (!workflow || !shell) return;
  const canvasState = ensureWorkflowCanvasState(workflow);
  const previous = canvasState.zoom;
  const next = clamp(previous + delta, 0.55, 1.6);
  if (next === previous) return;
  if (event) {
    const rect = shell.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const worldX = (localX - canvasState.panX) / previous;
    const worldY = (localY - canvasState.panY) / previous;
    canvasState.panX = localX - worldX * next;
    canvasState.panY = localY - worldY * next;
  }
  canvasState.zoom = next;
  applyWorkflowViewport(workflow, options);
  updateWorkflowCanvasChrome(workflow, options);
}

function fitWorkflowCanvas(options = {}) {
  const workflow = options.workflow || getSelectedWorkflow();
  const shell = document.querySelector(options.shellSelector || '.workflow-canvas-shell');
  if (!workflow || !shell) return;
  const layout = createWorkflowLayout(workflow);
  const positions = Object.values(layout.positions);
  if (!positions.length) return;
  const minX = Math.min(...positions.map((item) => item.x));
  const minY = Math.min(...positions.map((item) => item.y));
  const maxX = Math.max(...positions.map((item) => item.x + workflowNodeSize.width));
  const maxY = Math.max(...positions.map((item) => item.y + workflowNodeSize.height));
  const rect = shell.getBoundingClientRect();
  const zoom = clamp(Math.min((rect.width - 72) / (maxX - minX), (rect.height - 72) / (maxY - minY)), 0.55, 1.15);
  const canvasState = ensureWorkflowCanvasState(workflow);
  canvasState.zoom = zoom;
  canvasState.panX = Math.round((rect.width - (maxX - minX) * zoom) / 2 - minX * zoom);
  canvasState.panY = Math.round((rect.height - (maxY - minY) * zoom) / 2 - minY * zoom);
  applyWorkflowViewport(workflow, options);
  updateWorkflowCanvasChrome(workflow, options);
}

function createEdgeAnchor(start, end) {
  const startCenter = {
    x: start.x + workflowNodeSize.width / 2,
    y: start.y + workflowNodeSize.height / 2
  };
  const endCenter = {
    x: end.x + workflowNodeSize.width / 2,
    y: end.y + workflowNodeSize.height / 2
  };
  const horizontal = Math.abs(endCenter.x - startCenter.x) >= Math.abs(endCenter.y - startCenter.y);
  if (horizontal) {
    const forward = endCenter.x >= startCenter.x;
    return {
      x1: forward ? start.x + workflowNodeSize.width + workflowEdgeClearance : start.x - workflowEdgeClearance,
      y1: startCenter.y,
      x2: forward ? end.x - workflowEdgeClearance : end.x + workflowNodeSize.width + workflowEdgeClearance,
      y2: endCenter.y,
      axis: 'x'
    };
  }
  const down = endCenter.y >= startCenter.y;
  return {
    x1: startCenter.x,
    y1: down ? start.y + workflowNodeSize.height + workflowEdgeClearance : start.y - workflowEdgeClearance,
    x2: endCenter.x,
    y2: down ? end.y - workflowEdgeClearance : end.y + workflowNodeSize.height + workflowEdgeClearance,
    axis: 'y'
  };
}

function createEdgePath(anchor) {
  if (anchor.axis === 'x') {
    const midX = Math.round((anchor.x1 + anchor.x2) / 2);
    return `M ${anchor.x1} ${anchor.y1} C ${midX} ${anchor.y1}, ${midX} ${anchor.y2}, ${anchor.x2} ${anchor.y2}`;
  }
  const midY = Math.round((anchor.y1 + anchor.y2) / 2);
  return `M ${anchor.x1} ${anchor.y1} C ${anchor.x1} ${midY}, ${anchor.x2} ${midY}, ${anchor.x2} ${anchor.y2}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getWorkflowNodeIcon(node) {
  const icons = {
    start: '▶',
    read: '⌕',
    plan: '◇',
    build: '⚙',
    branch: '?',
    verify: '✓',
    fail: '!',
    end: '■'
  };
  return icons[node.id] || '•';
}

function getWorkflowNodeKind(node) {
  return node.kind === 'js' ? 'js' : 'ai';
}

function getWorkflowNodeKindLabel(node) {
  return getWorkflowNodeKind(node) === 'js' ? 'JS 脚本' : 'AI 提示词';
}

function resolveNodeRuntime(node) {
  if (getWorkflowNodeKind(node) === 'js') {
    return node.scriptName || `${node.id || 'node'}.js`;
  }
  return node.promptName || 'Prompt';
}

function resolveNodeAgent(node) {
  if (node.id === 'verify') return '验证器';
  if (node.id === 'build') return '构建器';
  if (node.id === 'read') return '上下文读取器';
  if (node.id === 'branch') return '分支控制';
  if (node.id === 'end') return '归档器';
  return '规划器';
}

function resolveNodeInput(node) {
  if (node.id === 'start') return '用户输入';
  if (node.id === 'read') return '目录路径';
  if (node.id === 'verify') return '产物证据';
  if (node.id === 'fail') return '失败记录';
  if (node.id === 'end') return '验收结果';
  return '上游输出';
}

function renderWorkflowList() {
  const list = document.querySelector('#workflowList');
  if (!list) return;
  const search = document.querySelector('#workflowSearch');
  const keyword = search ? search.value.trim().toLowerCase() : '';
  const items = publicWorkflows.filter((workflow) => {
    if (!keyword) return true;
    return `${workflow.name} ${workflow.role} ${workflow.scope}`.toLowerCase().includes(keyword);
  });

  list.innerHTML = '';
  items.forEach((workflow) => {
    const item = document.createElement('button');
    item.className = 'workflow-list-item';
    item.classList.toggle('active', workflow.id === state.selectedWorkflowId);
    item.innerHTML = `<strong>${escapeHtml(workflow.name)}</strong><span>${escapeHtml(workflow.role)}</span><em>${escapeHtml(workflow.scope)}</em>`;
    item.addEventListener('click', () => {
      state.selectedWorkflowId = workflow.id;
      renderWorkflow();
    });
    list.appendChild(item);
  });
}

function getSelectedWorkflow() {
  return publicWorkflows.find((workflow) => workflow.id === state.selectedWorkflowId) || publicWorkflows[0];
}

function createWorkflowDraft() {
  const id = `workflow-${Date.now()}`;
  publicWorkflows.unshift({
    id,
    name: '未命名工作流',
    role: '从空白草稿开始',
    status: '草稿',
    scope: state.currentFolder ? '当前项目' : '私有',
    nodes: cloneWorkflowNodes([workflowNodes[0], workflowNodes[2], workflowNodes[5], workflowNodes[7]])
  });
  state.selectedWorkflowId = id;
  renderHomeWorkflows();
  renderWorkflow();
  persistAppState();
  switchView('workflow');
}

function duplicateSelectedWorkflow() {
  const workflow = getSelectedWorkflow();
  const id = `workflow-${Date.now()}`;
  publicWorkflows.unshift({
    ...workflow,
    id,
    name: `${workflow.name} 副本`,
    status: '草稿',
    scope: '私有',
    nodes: cloneWorkflowNodes(workflow.nodes)
  });
  state.selectedWorkflowId = id;
  renderHomeWorkflows();
  renderWorkflow();
  persistAppState();
}

function publishSelectedWorkflow() {
  const workflow = getSelectedWorkflow();
  workflow.scope = '公共';
  workflow.status = '公共';
  renderHomeWorkflows();
  renderWorkflow();
  persistAppState();
}

function renderWorkspaceWorkflow() {
  const workflow = getSelectedWorkflow();
  const title = document.querySelector('#workspaceWorkflowPanel .workspace-flow-head strong');
  const subtitle = document.querySelector('#workspaceWorkflowPanel .workspace-flow-head span');
  if (title) title.textContent = state.currentFolder ? '当前目录工作流' : workflow.name;
  if (subtitle) subtitle.textContent = state.currentFolder ? `${workflow.name} · 可沉淀为公共工作流` : workflow.role;
  renderWorkflowCanvas(workflow, {
    canvasSelector: '#workspaceWorkflowCanvas',
    shellSelector: '#workspaceWorkflowPanel .workflow-canvas-shell',
    controlsSelector: '#workspaceWorkflowPanel .canvas-controls',
    surface: 'workspace',
    onNodeSelect: (node) => {
      selectWorkflowNode(node);
      renderWorkflowCanvas(workflow, {
        canvasSelector: '#workflowCanvas',
        shellSelector: '#workflowView .workflow-canvas-shell',
        controlsSelector: '#workflowView .canvas-controls',
        surface: 'main',
        onNodeSelect: selectWorkflowNode
      });
    }
  });
  renderInspectorStageSummaries();
}

function selectWorkflowNode(node) {
  const workflow = getSelectedWorkflow();
  if (workflow) workflow.selectedNodeId = node.id;
  document.querySelectorAll('#workflowCanvas .workflow-node').forEach((element) => {
    const selected = element.dataset.nodeId === node.id;
    element.classList.toggle('active', selected);
    element.classList.toggle('mentioned', selected || state.workflowComposer.selectedNodes.includes(element.dataset.nodeId));
  });
  document.querySelector('#selectedNodeName').textContent = node.title;
  const kind = document.querySelector('#selectedNodeKind');
  const kindToggle = document.querySelector('#selectedNodeKindToggle');
  if (kind) {
    kind.textContent = getWorkflowNodeKindLabel(node);
    kind.className = `node-kind-text ${getWorkflowNodeKind(node)}`;
  }
  if (kindToggle) {
    kindToggle.querySelectorAll('button').forEach((button) => {
      button.classList.toggle('active', button.dataset.nodeKind === getWorkflowNodeKind(node));
    });
  }
  document.querySelector('#selectedNodeAgent').textContent = resolveNodeAgent(node);
}

function updateSelectedWorkflowNodeKind(kind) {
  const workflow = getSelectedWorkflow();
  if (!workflow) return;
  const node = workflow.nodes.find((item) => item.id === workflow.selectedNodeId) || workflow.nodes[0];
  if (!node) return;
  node.kind = kind === 'js' ? 'js' : 'ai';
  if (node.kind === 'js') {
    node.scriptName = node.scriptName || `${node.id}.js`;
    node.body = node.body || '把稳定动作沉淀为可审计脚本。';
  } else {
    node.promptName = node.promptName || 'Prompt';
  }
  addLog('工作流', `${node.title} 切换为 ${getWorkflowNodeKindLabel(node)}`);
  persistAppState();
  renderWorkflow();
}

function renderMessages() {
  const messages = document.querySelector('#messages');
  messages.innerHTML = '';
  state.messages.forEach((message) => {
    const element = document.createElement('div');
    element.className = `msg ${message.role === 'user' ? 'user' : ''} ${message.status === 'pending' ? 'pending' : ''}`;
    if (message.status === 'pending') {
      element.innerHTML = '<span></span><span></span><span></span>';
    } else {
      element.textContent = message.text;
    }
    messages.appendChild(element);
  });
  messages.scrollTop = messages.scrollHeight;
  markThoughtActivity();
  updateThoughtScroll();
}

function addMessage(text, role = 'assistant', status = '') {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.messages.push({ id, text, role, status });
  renderMessages();
  return id;
}

function updateMessage(id, text, role = 'assistant') {
  const message = state.messages.find((item) => item.id === id);
  if (!message) return;
  if (!text) {
    removeMessage(id);
    return;
  }
  message.text = text;
  message.role = role;
  message.status = '';
  renderMessages();
}

function removeMessage(id) {
  state.messages = state.messages.filter((message) => message.id !== id);
  renderMessages();
}

async function respondToMessage(text) {
  state.pendingPrompt = text;
  const pendingId = addMessage('', 'assistant', 'pending');
  await maybeLoadProjectContextForTurn(text);
  const modelResult = await analyzeWithModel(text);
  state.intent = modelResult.intent || classifyIntent(text);
  if (shouldShowTaskPlan(text, state.intent, modelResult.plan)) {
    state.taskPlan = modelResult.plan || createPlan(text, state.intent, state.currentFolder);
  } else {
    state.taskPlan = [];
  }
  renderTaskPlan();
  if (state.taskPlan.length) addLog('计划', state.intent.label);
  if (modelResult.source === 'model') {
    await processToolProposals(text, modelResult.toolProposals);
    updateMessage(pendingId, modelResult.reply || '', 'assistant');
    setModelStatus('');
    saveCurrentConversation();
    if (state.taskPlan.length || modelResult.toolProposals?.length) {
      addVerification('通过', `模型 ${state.model.provider}/${state.model.model} 已更新对话计划。`);
    } else {
      renderSessionState();
    }
    return;
  }
  updateMessage(pendingId, createModelFailureReply(text, modelResult.error), 'assistant');
  setModelStatus('模型请求失败');
  saveCurrentConversation();
  renderSessionState();
}

async function maybeLoadProjectContextForTurn(text) {
  const session = getCurrentSession();
  const rootPath = session?.projectPath || state.currentFolder?.rootPath;
  if (!session || !rootPath || !window.kaka.readProjectContext) return null;
  if (!shouldReadProjectContextForTurn(text)) return null;

  try {
    setModelStatus('读取目录上下文...');
    const result = await window.kaka.readProjectContext({
      rootPath,
      text,
      limit: 6
    });
    if (!result?.ok) {
      addLog('目录', result?.error || '读取失败');
      return null;
    }
    if (result.folder) state.currentFolder = result.folder;
    mergeProjectContextIntoSession(session, result);
    addLog('目录', result.files.length ? `已读取 ${result.files.length} 个上下文文件` : '已更新目录画像');
    recordSessionEvent('context-loaded', result.files.map((file) => file.relativePath).join('、') || '目录画像');
    await runIsolatedVerification('目录上下文读取', {
      contextFiles: result.files,
      toolRuns: session.toolRuns.slice(0, 1),
      criteria: [
        '目录读取必须是只读操作',
        '验证输入不得包含聊天消息或会话记忆',
        '至少保留一个可审计证据'
      ]
    });
    saveCurrentConversation();
    return result;
  } catch (error) {
    addLog('目录', formatModelError(error.message));
    return null;
  } finally {
    setModelStatus('');
  }
}

async function runIsolatedVerification(reason, overrides = {}) {
  const session = getCurrentSession();
  if (!session || !window.kaka.runIndependentVerification) return null;
  const payload = {
    goal: session.taskState?.goal || session.memory?.goal || state.pendingPrompt,
    criteria: [
      ...extractVerificationCriteria(session),
      ...(overrides.criteria || [])
    ],
    contextFiles: overrides.contextFiles || session.context?.files || [],
    artifacts: overrides.artifacts || session.artifacts || [],
    toolRuns: overrides.toolRuns || session.toolRuns || []
  };
  const result = await window.kaka.runIndependentVerification(payload);
  const status = result?.status || '待补充';
  const notes = Array.isArray(result?.notes) ? result.notes.join('；') : '验证已运行';
  addVerification(status, `${reason}：${notes}`, {
    isolated: true,
    evidenceCount: result?.input?.evidence?.length || 0,
    criteriaCount: result?.input?.criteria?.length || 0
  });
  session.verification = state.verification.map((item) => ({ ...item }));
  recordSessionEvent('isolated-verification', `${reason} ${status}`);
  return result;
}

function extractVerificationCriteria(session) {
  const criteria = [];
  (state.taskPlan || []).forEach((step) => {
    if (/验证|检查|测试|确认|只读|权限|证据/.test(`${step.title || ''} ${step.body || ''} ${step.permission || ''}`)) {
      criteria.push(`${step.title || '步骤'}：${step.body || step.permission || '需要验证'}`);
    }
  });
  (session?.memory?.constraints || []).forEach((item) => criteria.push(item));
  return criteria.filter(Boolean).slice(0, 8);
}

function shouldReadProjectContextForTurn(text) {
  return /(目录|项目|代码|文件|仓库|结构|读取|理解|总结|分析|检查|修改|实现|页面|功能|bug|运行|测试|package|readme|src)/i.test(text);
}

function mergeProjectContextIntoSession(session, result) {
  session.context = session.context || createSessionContext(result.folder || state.currentFolder);
  session.context.folder = result.folder ? {
    name: result.folder.name,
    rootPath: result.folder.rootPath,
    summary: result.folder.summary
  } : session.context.folder;
  session.context.summary = result.digest || session.context.summary;
  session.context.files = dedupeContextFiles([
    ...(result.files || []),
    ...(session.context.files || [])
  ]).slice(0, 12);
  session.context.selected = (result.files || []).map((file) => ({
    type: 'file',
    label: file.relativePath || file.name,
    value: file.summary || file.content,
    reason: '本轮读取'
  }));
  session.toolRuns.unshift({
    id: `tool-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: '目录读取',
    command: 'read-project-context',
    status: '成功',
    stdout: result.digest || '',
    stderr: '',
    durationMs: 0,
    createdAt: Date.now()
  });
  addUnique(session.memory.decisions, `已读取目录上下文：${(result.files || []).map((file) => file.relativePath).join('、') || result.folder?.name}`, 8);
  if (result.digest) {
    addSessionArtifact({
      type: 'context',
      title: '目录上下文',
      summary: result.digest
    }, session);
  }
}

function dedupeContextFiles(files) {
  const seen = new Set();
  return files.filter((file) => {
    const key = file.relativePath || file.path || file.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createModelFailureReply(text, error) {
  console.warn('[model]', error);
  const intent = classifyIntent(text);
  return createNaturalReply(text, intent) || createRuleBasedReply(text, intent);
}

function createRuleBasedReply(text, intent) {
  if (!isActionablePrompt(text)) {
    return '在。你直接说就行，我听着。';
  }
  if (intent?.mode === 'workflow') {
    return '可以，这个更像一条可以沉淀的流程。我会先把目标拆成阶段，再把稳定部分逐步转成工作流节点。';
  }
  if (intent?.mode === 'folder') {
    return '这件事需要项目上下文。你可以先打开目录，我会读取结构后再继续拆任务和验证路径。';
  }
  if (/(能做什么|可以做什么|功能)/.test(text)) {
    return '我可以陪你整理想法、拆任务、读取项目目录、提出执行计划，并在需要时把会话沉淀成可复用工作流。';
  }
  return '可以，我们先把目标和下一步理清楚。你继续说，我会把关键约束和可沉淀的流程记录下来。';
}

function formatModelError(error) {
  const value = String(error || 'unknown error');
  if (value.includes('fetch failed')) return '网络请求失败';
  if (value.includes('Model provider is not configured')) return '未配置 API Key';
  if (value.length > 52) return `${value.slice(0, 52)}...`;
  return value;
}

function addLog(kind, text) {
  const log = document.querySelector('#runLog');
  const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const row = document.createElement('div');
  row.className = 'log';
  row.innerHTML = `<time>${now}</time><span>${kind}：${escapeHtml(text)}</span>`;
  log.prepend(row);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", '&#39;');
}

init();
