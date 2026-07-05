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
  composer: {
    permission: 'read',
    model: 'current',
    sessionTokens: 0,
    modelStatus: ''
  },
  workflowComposer: {
    selectedNodes: [],
    mentionOpen: false,
    mentionQuery: ''
  },
  filesVisible: false
};

const views = {
  home: document.querySelector('#homeView'),
  workspace: document.querySelector('#workspaceView'),
  workflow: document.querySelector('#workflowView'),
  agents: document.querySelector('#agentsView')
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
  updateWindowTitle(target);
}

function updateWindowTitle(viewName) {
  const title = document.querySelector('#windowTitle');
  if (!title) return;
  if (viewName === 'agents') {
    title.textContent = '智能体库';
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
  loadStartupContext();
  updateFilesVisibility();
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

function updateFilesVisibility() {
  const workbench = document.querySelector('.workbench');
  const button = document.querySelector('#toggleFilesButton');
  if (!workbench) return;
  workbench.classList.toggle('files-collapsed', !state.filesVisible);
  if (button) button.classList.toggle('active', state.filesVisible);
}

function switchWorkspaceTab(name) {
  document.querySelectorAll('[data-workspace-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.workspaceTab === name);
  });
  document.querySelector('#workspaceChatPanel').classList.toggle('active', name === 'chat');
  document.querySelector('#workspaceWorkflowPanel').classList.toggle('active', name === 'workflow');
  if (name === 'workflow') {
    const title = document.querySelector('#windowTitle');
    if (title) {
      title.textContent = state.currentFolder
        ? `${state.currentFolder.rootPath} / 当前目录工作流`
        : '新对话 / 当前工作流';
    }
  } else {
    updateWindowTitle('workspace');
  }
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
  const search = document.querySelector('#workflowSearch');
  const kindToggle = document.querySelector('#selectedNodeKindToggle');

  if (createButton) createButton.addEventListener('click', createWorkflowDraft);
  if (duplicateButton) duplicateButton.addEventListener('click', duplicateSelectedWorkflow);
  if (publishButton) publishButton.addEventListener('click', publishSelectedWorkflow);
  if (saveButton) saveButton.addEventListener('click', () => addLog('工作流', '当前工作流已保存'));
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
    session.toolRuns.unshift({
      id: `tool-${Date.now()}`,
      type: 'CLI',
      command: approval.command,
      status: result.ok ? '成功' : '失败',
      exitCode: result.exitCode,
      durationMs: result.durationMs || 0,
      stdout: result.stdout || '',
      stderr: result.stderr || result.error || '',
      createdAt: Date.now()
    });
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
  document.querySelector('#runPlan').addEventListener('click', executeFirstPlanStep);
  document.querySelector('#convertWorkflow').addEventListener('click', () => {
    createWorkflowFromCurrentSession();
  });
  const sessionToWorkflow = document.querySelector('#sessionToWorkflow');
  if (sessionToWorkflow) sessionToWorkflow.addEventListener('click', createWorkflowFromCurrentSession);
}

function createWorkflowFromCurrentSession() {
  const session = getCurrentSession();
  const plan = state.taskPlan.length ? state.taskPlan : createPlan(state.pendingPrompt, state.intent, state.currentFolder);
  state.taskPlan = plan;
  renderTaskPlan();
  const workflow = createWorkflowDraftFromSession(session, plan);
  state.selectedWorkflowId = workflow.id;
  addSessionArtifact({
    type: 'workflow',
    title: workflow.name,
    summary: `${workflow.nodes.length} 个节点，来源于当前会话计划。`,
    workflowId: workflow.id
  });
  addLog('工作流', '当前会话已生成工作流草稿');
  addVerification('通过', '已从会话目标、计划和权限边界生成工作流草稿。');
  saveCurrentConversation();
  renderHomeWorkflows();
  renderWorkflow();
  switchView('workflow');
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

  attachButton.addEventListener('click', () => {
    addLog('附件', '附件入口已预留');
  });

  resizeComposerInput();
  updateTokenUsage();
}

function sendComposerMessage() {
  const input = document.querySelector('#messageInput');
  const text = input.value.trim();
  if (!text) return;
  state.composer.sessionTokens += estimateTokens(text);
  setModelStatus('');
  addMessage(text, 'user');
  registerApprovalIntent(text);
  saveCurrentConversation();
  input.value = '';
  resizeComposerInput();
  updateTokenUsage();
  respondToMessage(text);
}

function registerApprovalIntent(text) {
  const session = getCurrentSession();
  if (!session) return;
  const level = detectPermissionLevel(text);
  if (level === 'read') return;
  const command = inferCommandFromText(text);
  if (!command && level === 'execute') return;
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
    status: '待确认',
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
    return;
  }
  const current = estimateTokens(input.value);
  output.textContent = `本轮 ${formatTokenCount(current)} / 会话 ${formatTokenCount(state.composer.sessionTokens)} tokens`;
}

function setModelStatus(text) {
  state.composer.modelStatus = text;
  updateTokenUsage();
}

async function loadStartupContext() {
  const startup = await window.kaka.getStartupContext();
  state.model = startup.model || state.model;
  state.availableSkills = normalizeRuntimeSkills(startup.skills);
  mergeRuntimeSkillsIntoRegistry(state.availableSkills);
  syncModelSelect();
  addLog('模型', state.model.configured ? `${state.model.provider}/${state.model.model}` : '未配置，使用本地规则');
  state.conversations = normalizeSavedConversations(startup.conversations);
  state.recent = normalizeSavedProjects(startup.recent);
  restoreSavedWorkflows(startup.workflows);
  renderAgents();
  renderHomeWorkflows();
  renderWorkflow();
  renderConversations();
  renderRecent();
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
  return Array.isArray(items) ? items.map((item) => ({
    id: item.id,
    title: item.title || '未命名对话',
    mode: item.mode || (item.projectPath ? 'project' : 'chat'),
    projectPath: item.projectPath || null,
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
  })).filter((item) => item.id) : [];
}

function normalizeSavedProjects(items) {
  return Array.isArray(items) ? items.map((item) => {
    if (typeof item === 'string') return { path: item, name: item.split(/[\\/]/).pop() || item };
    return { path: item.path, name: item.name || String(item.path || '').split(/[\\/]/).pop() || item.path };
  }).filter((item) => item.path) : [];
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
    recentProjects: state.recent,
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
  beginQuickChat(text);
  const pendingId = addMessage('', 'assistant', 'pending');
  const modelResult = await analyzeWithModel(text);
  const intent = modelResult.intent || classifyIntent(text);
  state.intent = intent;
  if (modelResult.plan) state.taskPlan = modelResult.plan;
  state.assistantDraft = modelResult.reply || '';
  renderTaskPlan();
  if (modelResult.source === 'model') {
    processToolProposals(text, modelResult.toolProposals);
    updateMessage(pendingId, modelResult.reply || '', 'assistant');
    setModelStatus('');
    saveCurrentConversation();
    addVerification('通过', `模型 ${state.model.provider}/${state.model.model} 已生成意图和计划。`);
  } else if (modelResult.error) {
    updateMessage(pendingId, createModelFailureReply(text, modelResult.error), 'assistant');
    setModelStatus('模型请求失败');
    saveCurrentConversation();
    addVerification('回退', `模型调用失败，已使用本地规则：${modelResult.error}`);
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

function processToolProposals(text, proposals) {
  const normalized = Array.isArray(proposals) && proposals.length
    ? proposals
    : inferLocalToolProposals(text);
  const created = normalized
    .map((proposal) => addApproval({
      type: '命令审批',
      permission: proposal.permission || 'execute',
      command: proposal.command,
      summary: proposal.reason || proposal.command,
      reason: proposal.reason,
      risk: proposal.risk,
      source: proposal.source || 'rule'
    }))
    .filter(Boolean);
  if (created.length) {
    addLog('工具提案', created.map((item) => item.command).join('、'));
    addVerification('待确认', `已生成 ${created.length} 个工具提案，等待用户审批。`);
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

function beginQuickChat(text) {
  state.currentFolder = null;
  const conversation = createConversation(text);
  state.currentConversationId = conversation.id;
  state.messages = [];
  state.taskPlan = createPlan(text, state.intent, null);
  state.verification = [];
  document.querySelector('#fileCount').textContent = '0';
  document.querySelector('#fileTree').innerHTML = '<div class="active">未绑定目录</div>';
  document.querySelector('#folderProfile').textContent = '当前是快速对话，尚未绑定本地目录。需要读取文件时再打开目录。';
  renderFolderProfile(null);
  renderTaskPlan();
  renderVerification();
  renderConversations();
  renderRecent();
  document.querySelector('#runLog').innerHTML = '';
  addLog('对话', '新建快速对话');
  addMessage(text || '开始一个新对话。', 'user');
  registerApprovalIntent(text || '');
  saveCurrentConversation();
  switchView('workspace');
  switchWorkspaceTab('chat');
}

function createConversation(text) {
  const now = Date.now();
  const title = createConversationTitle(text);
  const conversation = {
    id: `conv-${now}-${Math.random().toString(16).slice(2)}`,
    title,
    mode: 'chat',
    projectPath: null,
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
    ...state.conversations.filter((item) => item.title !== title)
  ].slice(0, 8);
  return conversation;
}

function createSessionMemory(text) {
  return {
    goal: text || '',
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
  return {
    goal: text || '等待用户输入任务',
    status: text ? 'planning' : 'idle',
    currentStep: text ? '理解目标' : '待开始',
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
    currentInput: text
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

function saveCurrentConversation() {
  if (!state.currentConversationId) return;
  const conversation = state.conversations.find((item) => item.id === state.currentConversationId);
  if (!conversation) return;
  conversation.messages = state.messages.map((message) => ({ ...message, status: '' }));
  conversation.taskPlan = state.taskPlan.map((step) => ({ ...step }));
  conversation.verification = state.verification.map((item) => ({ ...item }));
  conversation.context = conversation.context || createSessionContext(state.currentFolder);
  conversation.context = { ...conversation.context, ...(state.currentFolder ? createSessionContext(state.currentFolder) : {}) };
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
  if (text && (!session.memory.goal || session.memory.goal === session.title)) {
    session.memory.goal = text;
  }
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
  state.messages = conversation.messages.map((message) => ({ ...message }));
  state.taskPlan = conversation.taskPlan.map((step) => ({ ...step }));
  state.verification = conversation.verification.map((item) => ({ ...item }));
  document.querySelector('#fileCount').textContent = '0';
  document.querySelector('#fileTree').innerHTML = '<div class="active">未绑定目录</div>';
  document.querySelector('#folderProfile').textContent = '当前对话未绑定本地目录。';
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

function applyFolder(folder) {
  state.currentFolder = folder;
  const session = getCurrentSession();
  if (session) {
    session.mode = 'project';
    session.projectPath = folder.rootPath;
    session.context = createSessionContext(folder);
    session.skills = mergeSessionSkills(session.skills, selectSkills(state.pendingPrompt, folder));
  } else {
    const conversation = createConversation(state.pendingPrompt || `打开 ${folder.name}`);
    conversation.mode = 'project';
    conversation.projectPath = folder.rootPath;
    conversation.context = createSessionContext(folder);
    conversation.skills = mergeSessionSkills(conversation.skills, selectSkills(state.pendingPrompt, folder));
    conversation.title = folder.name;
    state.currentConversationId = conversation.id;
    state.messages = [];
  }
  state.taskPlan = createPlan(state.pendingPrompt || '理解并处理当前目录', state.intent, folder);
  state.verification = [];
  if (!state.recent.some((item) => item.path === folder.rootPath)) {
    state.recent.unshift({ name: folder.name, path: folder.rootPath });
  }
  state.recent = state.recent.filter((item, index, items) => items.findIndex((candidate) => candidate.path === item.path) === index).slice(0, 20);
  document.querySelector('#fileCount').textContent = String(folder.summary.files);
  document.querySelector('#folderProfile').textContent = buildProfileSummary(folder);
  renderFolderProfile(folder);
  renderTaskPlan();
  renderVerification();
  renderSessionState();
  renderTree(folder.entries);
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

function addVerification(status, text) {
  const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  state.verification.unshift({ status, text, time: now });
  const session = getCurrentSession();
  if (session) {
    session.taskState = session.taskState || createTaskState('');
    session.taskState.verificationStatus = status;
  }
  renderVerification();
}

function renderVerification() {
  const log = document.querySelector('#verifyLog');
  if (state.verification.length === 0) {
    log.innerHTML = '<div class="log"><time>待运行</time><span>独立上下文、产物证据、失败处理。</span></div>';
    return;
  }
  log.innerHTML = state.verification.map((item) => `
    <div class="log"><time>${item.time}</time><span>${escapeHtml(item.status)}：${escapeHtml(item.text)}</span></div>
  `).join('');
}

function renderSessionState() {
  const session = getCurrentSession();
  const mode = document.querySelector('#sessionMode');
  const goal = document.querySelector('#sessionGoal');
  const step = document.querySelector('#sessionStep');
  const verification = document.querySelector('#sessionVerification');
  const contextList = document.querySelector('#sessionContextList');
  const memoryList = document.querySelector('#sessionMemoryList');
  const skillList = document.querySelector('#sessionSkillList');
  const artifactList = document.querySelector('#sessionArtifactList');
  const toolList = document.querySelector('#sessionToolList');
  if (!mode || !goal || !step || !verification || !contextList || !memoryList || !skillList || !artifactList || !toolList) return;

  if (!session) {
    mode.textContent = state.currentFolder ? '项目' : '对话';
    goal.textContent = state.pendingPrompt || '待开始';
    step.textContent = state.taskPlan[0]?.title || '待开始';
    verification.textContent = state.verification[0]?.status || '未运行';
    contextList.innerHTML = '<div class="empty-state">开始对话后生成上下文。</div>';
    memoryList.innerHTML = '<div class="empty-state">暂无记忆。</div>';
    skillList.innerHTML = '<div class="empty-state">按任务自动加载。</div>';
    artifactList.innerHTML = '<div class="empty-state">暂无产物。</div>';
    toolList.innerHTML = '<div class="empty-state">暂无工具调用。</div>';
    renderApprovalDock(null);
    return;
  }

  const task = session.taskState || createTaskState('');
  mode.textContent = session.mode === 'project' ? '项目' : '对话';
  goal.textContent = task.goal || session.title;
  step.textContent = task.currentStep || '待开始';
  verification.textContent = task.verificationStatus || '未运行';

  const contextItems = [
    ['目录', session.projectPath || '未绑定'],
    ['窗口', `${formatTokenCount(session.context?.estimatedTokens || 0)} / ${formatTokenCount(session.context?.tokenBudget || 6000)}`],
    ['压缩', session.context?.compactedTurns ? `${session.context.compactedTurns} 条早期消息` : '未触发'],
    ['摘要', session.context?.summary || '待生成'],
    ['本轮', renderSelectedContextSummary(session.context?.selected || [])]
  ];
  contextList.innerHTML = contextItems.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');

  const memory = session.memory || createSessionMemory('');
  const memoryItems = [
    ['约束', (memory.constraints || []).slice(0, 3).join('；') || '暂无'],
    ['决策', (memory.decisions || []).slice(0, 3).join('；') || '暂无'],
    ['下一步', (memory.nextActions || []).slice(0, 3).join('；') || '暂无']
  ];
  memoryList.innerHTML = memoryItems.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');

  skillList.innerHTML = session.skills.length
    ? session.skills.map((skill) => `<div><span>${escapeHtml(skill.name)}</span><strong title="${escapeHtml(skill.reason || skill.summary || '')}">${escapeHtml(skill.reason || skill.permission)}</strong></div>`).join('')
    : '<div class="empty-state">未加载 Skill。</div>';

  const artifacts = session.artifacts || [];
  artifactList.innerHTML = artifacts.length
    ? artifacts.slice(0, 5).map((artifact) => `<div><span>${escapeHtml(renderArtifactType(artifact.type))}</span><strong title="${escapeHtml(artifact.summary || '')}">${escapeHtml(artifact.title)}</strong></div>`).join('')
    : '<div class="empty-state">暂无产物。</div>';

  const approvals = session.approvals || [];
  const toolRuns = session.toolRuns || [];
  const toolItems = [...approvals, ...toolRuns].slice(0, 6);
  toolList.innerHTML = toolItems.length
    ? toolItems.map((item) => renderToolItem(item)).join('')
    : '<div class="empty-state">暂无审批或工具调用。</div>';
  renderApprovalDock(session);
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
    note: '记录'
  };
  return labels[type] || '产物';
}

function renderApprovalDock(session) {
  const dock = document.querySelector('#approvalDock');
  if (!dock) return;
  const approvals = (session?.approvals || []).filter((item) => ['待确认', '已批准', '执行中', '失败'].includes(item.status));
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
      <div class="approval-actions">
        <button type="button" data-approval-id="${escapeHtml(item.id)}" data-approval-action="approve">批准</button>
        ${item.command ? `<button type="button" data-approval-id="${escapeHtml(item.id)}" data-approval-action="run">运行</button>` : ''}
        <button type="button" data-approval-id="${escapeHtml(item.id)}" data-approval-action="reject">拒绝</button>
      </div>
    </div>
  `).join('');
}

function renderToolItem(item) {
  if (item.id && String(item.id).startsWith('approval-')) {
    const canRun = item.command && ['待确认', '已批准', '失败'].includes(item.status);
    return `
      <div class="session-tool-row">
        <span>${escapeHtml(item.type || '审批')}</span>
        <strong>${escapeHtml(item.command || item.summary || item.status)}</strong>
        <em>${escapeHtml(item.status || '待确认')}</em>
        <div class="session-tool-actions">
          <button type="button" data-approval-id="${escapeHtml(item.id)}" data-approval-action="approve">批准</button>
          ${canRun ? `<button type="button" data-approval-id="${escapeHtml(item.id)}" data-approval-action="run">运行</button>` : ''}
          <button type="button" data-approval-id="${escapeHtml(item.id)}" data-approval-action="reject">拒绝</button>
        </div>
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

function renderAgents() {
  const home = document.querySelector('#homeAgents');
  const grid = document.querySelector('#agentsGrid');
  const engineGrid = document.querySelector('#agentEngineGrid');
  home.innerHTML = '';
  grid.innerHTML = '';
  if (engineGrid) engineGrid.innerHTML = '';

  agents.filter((agent) => agent.engine === 'kaka').slice(0, 3).forEach((agent) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div class="avatar">${escapeHtml(agent.name.slice(0, 1))}</div>
      <div><strong>${escapeHtml(agent.name)}</strong><span>${escapeHtml(agent.role)}</span></div>
      <span class="badge green">${escapeHtml(agent.status)}</span>`;
    home.appendChild(row);
  });

  if (engineGrid) {
    agentEngines.forEach((engine) => {
      const card = document.createElement('article');
      card.className = `engine-card ${engine.id === 'kaka' ? 'active' : ''}`;
      card.innerHTML = `
        <div class="engine-card-head">
          <strong>${escapeHtml(engine.name)}</strong>
          <span class="engine-kind">${escapeHtml(engine.kind)}</span>
        </div>
        <p>${escapeHtml(engine.summary)}</p>
        <div class="engine-meta">
          <span>${escapeHtml(engine.command)}</span>
          <em>${escapeHtml(engine.status)}</em>
        </div>
      `;
      engineGrid.appendChild(card);
    });
  }

  agents.forEach((agent) => {
    const card = document.createElement('article');
    card.className = `agent-card agent-engine-${agent.engine}`;
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
      <div class="agent-meta">
        <div><span>引擎</span><strong>${escapeHtml(agent.engineLabel)}</strong></div>
        <div><span>接入</span><strong>${escapeHtml(agent.adapter)}</strong></div>
        <div><span>权限</span><strong>${escapeHtml(agent.permission)}</strong></div>
        <div><span>适合</span><strong>${escapeHtml(agent.use)}</strong></div>
      </div>
    `;
    grid.appendChild(card);
  });

  if (state.availableSkills.length) {
    state.availableSkills.forEach((skill) => {
      const card = document.createElement('article');
      card.className = 'agent-card skill-agent-card';
      card.innerHTML = `<div class="agent-head">
        <div class="avatar">S</div>
        <div><h3>${escapeHtml(skill.name)}</h3><p>${escapeHtml(skill.summary || '本地 Skill')}</p></div>
        <span class="badge green">Skill</span>
      </div>
      <div class="agent-meta">
        <div><span>引擎</span><strong>KaKa Skill</strong></div>
        <div><span>接入</span><strong>本地目录</strong></div>
        <div><span>权限</span><strong>${escapeHtml(skill.permission)}</strong></div>
        <div><span>适合</span><strong>可复用能力包</strong></div>
      </div>`;
      grid.appendChild(card);
    });
  }
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

  const canvas = document.querySelector('#workflowCanvas');
  const layout = createWorkflowLayout(workflow);
  canvas.className = 'canvas workflow-builder-canvas';
  canvas.innerHTML = renderWorkflowEdges(layout);
  applyWorkflowViewport(workflow);
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
    element.addEventListener('click', () => selectWorkflowNode(node));
    const addButton = element.querySelector('.node-add-button');
    if (addButton) {
      addButton.addEventListener('click', (event) => {
        event.stopPropagation();
        addWorkflowNodeAfter(workflow, node);
      });
    }
    bindWorkflowNodeDrag(element, workflow, node);
    canvas.appendChild(element);
  });
  bindWorkflowCanvasPanZoom(workflow);
  renderWorkflowEdits(workflow);
  selectWorkflowNode(workflow.nodes.find((node) => node.id === workflow.selectedNodeId) || workflow.nodes[0] || workflowNodes[0]);
  updateWorkflowCanvasChrome(workflow);
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

function addWorkflowNodeAfter(workflow, sourceNode) {
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

function applyWorkflowViewport(workflow) {
  const canvas = document.querySelector('#workflowCanvas');
  if (!canvas) return;
  const canvasState = ensureWorkflowCanvasState(workflow);
  canvas.style.transform = `translate(${canvasState.panX}px, ${canvasState.panY}px) scale(${canvasState.zoom})`;
}

function updateWorkflowCanvasChrome(workflow) {
  const shell = document.querySelector('.workflow-canvas-shell');
  const controls = document.querySelector('.canvas-controls');
  if (!shell || !controls) return;
  const canvasState = ensureWorkflowCanvasState(workflow);
  shell.style.setProperty('--workflow-grid-size', `${22 * canvasState.zoom}px`);
  const zoomText = controls.querySelector('span');
  if (zoomText) zoomText.textContent = `${Math.round(canvasState.zoom * 100)}%`;
  const buttons = controls.querySelectorAll('button');
  if (buttons[0] && !buttons[0].dataset.bound) {
    buttons[0].dataset.bound = 'true';
    buttons[0].addEventListener('click', fitWorkflowCanvas);
  }
  if (buttons[1] && !buttons[1].dataset.bound) {
    buttons[1].dataset.bound = 'true';
    buttons[1].addEventListener('click', () => zoomWorkflowCanvas(-0.12));
  }
  if (buttons[2] && !buttons[2].dataset.bound) {
    buttons[2].dataset.bound = 'true';
    buttons[2].addEventListener('click', () => zoomWorkflowCanvas(0.12));
  }
}

function bindWorkflowCanvasPanZoom(workflow) {
  const shell = document.querySelector('.workflow-canvas-shell');
  if (!shell || shell.dataset.workflowPanBound === 'true') return;
  shell.dataset.workflowPanBound = 'true';
  shell.addEventListener('wheel', (event) => {
    if (!document.querySelector('#workflowView')?.classList.contains('active')) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    zoomWorkflowCanvas(delta, event);
  }, { passive: false });
  shell.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('.workflow-node') || event.target.closest('.canvas-controls')) return;
    const activeWorkflow = getSelectedWorkflow();
    const canvasState = ensureWorkflowCanvasState(activeWorkflow);
    const start = { x: event.clientX, y: event.clientY, panX: canvasState.panX, panY: canvasState.panY };
    shell.classList.add('panning');
    shell.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      canvasState.panX = start.panX + moveEvent.clientX - start.x;
      canvasState.panY = start.panY + moveEvent.clientY - start.y;
      applyWorkflowViewport(activeWorkflow);
      updateWorkflowCanvasChrome(activeWorkflow);
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

function bindWorkflowNodeDrag(element, workflow, node) {
  element.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const activeWorkflow = getSelectedWorkflow();
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
      refreshWorkflowEdges(activeWorkflow);
    };
    const up = () => {
      element.classList.remove('dragging');
      if (!hasMoved) selectWorkflowNode(node);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
    };
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);
  });
}

function refreshWorkflowEdges(workflow) {
  const edgeLayer = document.querySelector('#workflowCanvas .workflow-edge-layer');
  if (!edgeLayer) return;
  const layout = createWorkflowLayout(workflow);
  edgeLayer.outerHTML = renderWorkflowEdges(layout);
}

function zoomWorkflowCanvas(delta, event) {
  const workflow = getSelectedWorkflow();
  const shell = document.querySelector('.workflow-canvas-shell');
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
  applyWorkflowViewport(workflow);
  updateWorkflowCanvasChrome(workflow);
}

function fitWorkflowCanvas() {
  const workflow = getSelectedWorkflow();
  const shell = document.querySelector('.workflow-canvas-shell');
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
  applyWorkflowViewport(workflow);
  updateWorkflowCanvasChrome(workflow);
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
  const canvas = document.querySelector('#workspaceWorkflowCanvas');
  canvas.innerHTML = `
    <div class="edge e1 green"></div><div class="edge e2 green"></div><div class="edge e3 green"></div>
    <div class="edge e4 amber"></div><div class="edge e5"></div><div class="edge e6 green"></div><div class="edge e7 red"></div>
  `;
  workflowNodes.forEach((node) => {
    const element = document.createElement('article');
    element.className = `canvas-node ${node.cls}`;
    element.innerHTML = `<h3>${node.title}</h3><p>${node.body}</p><span class="badge">${node.badge}</span>`;
    element.addEventListener('click', () => selectWorkflowNode(node));
    canvas.appendChild(element);
  });
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
  const modelResult = await analyzeWithModel(text);
  state.intent = modelResult.intent || classifyIntent(text);
  state.taskPlan = modelResult.plan || createPlan(text, state.intent, state.currentFolder);
  renderTaskPlan();
  addLog('计划', state.intent.label);
  if (modelResult.source === 'model') {
    processToolProposals(text, modelResult.toolProposals);
    updateMessage(pendingId, modelResult.reply || '', 'assistant');
    setModelStatus('');
    saveCurrentConversation();
    addVerification('通过', `模型 ${state.model.provider}/${state.model.model} 已更新对话计划。`);
    return;
  }
  updateMessage(pendingId, createModelFailureReply(text, modelResult.error), 'assistant');
  setModelStatus('模型请求失败');
  saveCurrentConversation();
}

function createModelFailureReply(text, error) {
  console.warn('[model]', error);
  const intent = classifyIntent(text);
  return createNaturalReply(text, intent) || createRuleBasedReply(text, intent);
}

function createRuleBasedReply(text, intent) {
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

init();
