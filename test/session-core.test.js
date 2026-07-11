const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildDirectoryDigest,
  assessWorkflowReadiness,
  collectEvidenceBox,
  createApprovalProposalFromText,
  createEngineHandoffPlan,
  createEngineInitPlan,
  createGoalState,
  createIndependentVerificationInput,
  detectPermissionLevel,
  flattenEntries,
  getEngineById,
  getEngineRegistry,
  inferCommandFromText,
  isActionableGoalText,
  isTextEntry,
  normalizeEngineHandoffResult,
  lockGoalState,
  normalizeGoalState,
  normalizeSessionSettings,
  runIndependentVerification,
  sanitizeModelContext,
  selectDirectoryContext,
  shouldLoadDirectoryContext,
  updateGoalState,
  validateCommandProposal
} = require('../src/core/session-core');

const folder = {
  rootPath: 'D:\\Projects\\Demo',
  name: 'Demo',
  entries: [
    { name: 'README.md', path: 'D:\\Projects\\Demo\\README.md', type: 'file' },
    { name: 'package.json', path: 'D:\\Projects\\Demo\\package.json', type: 'file' },
    {
      name: 'src',
      path: 'D:\\Projects\\Demo\\src',
      type: 'directory',
      children: [
        { name: 'main.js', path: 'D:\\Projects\\Demo\\src\\main.js', type: 'file' },
        { name: 'logo.png', path: 'D:\\Projects\\Demo\\src\\logo.png', type: 'file' }
      ]
    }
  ],
  summary: {
    files: 4,
    folders: 1,
    profile: 'JavaScript / Node 项目',
    entryHints: ['package.json', 'README.md', 'src/main.js']
  }
};

test('detects when a turn needs project context', () => {
  assert.equal(shouldLoadDirectoryContext('帮我理解这个项目结构', folder), true);
  assert.equal(shouldLoadDirectoryContext('随便聊聊周末吃什么', folder), false);
  assert.equal(shouldLoadDirectoryContext('分析 package 入口', null), false);
});

test('flattens nested directory entries', () => {
  const entries = flattenEntries(folder.entries);
  assert.equal(entries.length, 5);
  assert.equal(entries.some((entry) => entry.name === 'main.js'), true);
});

test('filters non-text entries', () => {
  assert.equal(isTextEntry({ name: 'README.md', type: 'file' }), true);
  assert.equal(isTextEntry({ name: 'logo.png', type: 'file' }), false);
  assert.equal(isTextEntry({ name: 'src', type: 'directory' }), false);
});

test('selects important and relevant context files', () => {
  const result = selectDirectoryContext({ folder, text: '帮我看看 src/main.js 和 package', limit: 3 });
  assert.equal(result.shouldLoad, true);
  assert.deepEqual(
    result.files.map((file) => file.name),
    ['main.js', 'package.json', 'README.md']
  );
});

test('builds a compact digest from read files', () => {
  const digest = buildDirectoryDigest({
    folder,
    files: [
      { relativePath: 'README.md', summary: '项目说明' },
      { relativePath: 'package.json', summary: 'npm 配置' }
    ]
  });
  assert.match(digest, /JavaScript \/ Node 项目/);
  assert.match(digest, /README\.md: 项目说明/);
});

test('builds isolated verification input without chat memory', () => {
  const input = createIndependentVerificationInput({
    goal: '理解项目',
    criteria: ['必须只读', '要有证据'],
    contextFiles: [{ relativePath: 'README.md', summary: '项目说明' }],
    artifacts: [{ title: '目录上下文', summary: '读取结果' }],
    toolRuns: [{ command: 'read-project-context', status: '成功', stdout: 'ok' }],
    messages: [{ role: 'user', text: '这不应该进入验证' }],
    memory: { decisions: ['这也不应该进入验证'] }
  });

  assert.equal(input.isolation.includesChatMessages, false);
  assert.equal(input.isolation.includesConversationMemory, false);
  assert.equal(input.evidence.length, 3);
  assert.equal(JSON.stringify(input).includes('这不应该进入验证'), false);
});

test('runs independent verification from evidence and criteria', () => {
  const passed = runIndependentVerification({
    goal: '理解项目',
    criteria: ['必须只读'],
    contextFiles: [{ relativePath: 'README.md', summary: '项目说明' }]
  });
  assert.equal(passed.status, '通过');

  const failed = runIndependentVerification({
    goal: '执行检查',
    criteria: ['命令必须成功'],
    toolRuns: [{ command: 'npm test', status: '失败', stderr: 'failed' }]
  });
  assert.equal(failed.status, '失败');
});

test('classifies permission level from user text', () => {
  assert.equal(detectPermissionLevel('帮我读取 README'), 'read');
  assert.equal(detectPermissionLevel('运行测试'), 'execute');
  assert.equal(detectPermissionLevel('修改这个文件'), 'local-write');
  assert.equal(detectPermissionLevel('删除这些文件'), 'danger');
});

test('infers safe command proposals from natural language', () => {
  assert.equal(inferCommandFromText('帮我跑测试'), 'npm test');
  assert.equal(inferCommandFromText('看下 git status'), 'git status --short');
  assert.equal(inferCommandFromText('执行 `node --check src\\main.js`'), 'node --check src\\main.js');
});

test('validates command allowlist and blocks dangerous commands', () => {
  assert.equal(validateCommandProposal('npm test').ok, true);
  assert.equal(validateCommandProposal('git status --short').ok, true);
  assert.equal(validateCommandProposal('npm test && del package.json').ok, false);
  assert.equal(validateCommandProposal('git reset --hard').ok, false);
  assert.equal(validateCommandProposal('powershell Get-ChildItem').ok, false);
});

test('creates approval proposal from text', () => {
  const proposal = createApprovalProposalFromText('请运行测试');
  assert.equal(proposal.command, 'npm test');
  assert.equal(proposal.permission, 'execute');

  const writeProposal = createApprovalProposalFromText('修改 README 并保存');
  assert.equal(writeProposal.permission, 'local-write');

  assert.equal(createApprovalProposalFromText('只是聊聊'), null);
});

test('sanitizes model context before prompt construction', () => {
  const longText = 'a'.repeat(3000);
  const context = sanitizeModelContext({
    session: {
      id: 's1',
      mode: 'project',
      title: 'Demo',
      engine: { id: 'codex', name: 'Codex CLI', type: 'cli', command: 'codex', capabilities: ['chat', 'runCommands'] },
      memory: { decisions: [longText] },
      memoryDigest: longText,
      context: {
        summary: longText,
        files: [{ name: 'main.js', relativePath: 'src/main.js', content: longText, summary: longText }]
      },
      selectedContext: [{ type: 'file-content', label: 'main.js', value: longText, reason: 'test' }],
      skills: [{ id: 'skill', name: 'Skill', instruction: longText }],
      approvals: [],
      toolRuns: [{ command: 'npm test', stdout: longText, status: '成功' }]
    },
    recentMessages: [{ role: 'user', text: longText }],
    selectedContext: [{ type: 'file-content', label: 'main.js', value: longText, reason: 'test' }]
  }, { maxText: 80, maxSelected: 1 });

  assert.equal(context.session.context.files[0].content, undefined);
  assert.equal(context.session.engine.id, 'codex');
  assert.equal(context.session.context.files[0].summary.length <= 83, true);
  assert.equal(context.session.memory, undefined);
  assert.equal(context.session.selectedContext.length, 1);
  assert.equal(context.recentMessages[0].text.length <= 83, true);
});

test('normalizes session settings with a valid default engine', () => {
  const settings = normalizeSessionSettings({
    defaultSessionEngineId: 'codex',
    skillScope: 'project-only',
    workflowDistillation: 'auto-draft',
    engineInitMode: 'auto'
  });

  assert.equal(settings.defaultSessionEngineId, 'codex');
  assert.equal(settings.skillScope, 'project-only');
  assert.equal(settings.workflowDistillation, 'auto-draft');
  assert.equal(settings.engineInitMode, 'auto');

  const fallback = normalizeSessionSettings({ defaultSessionEngineId: 'missing', skillScope: 'weird' });
  assert.equal(fallback.defaultSessionEngineId, 'kaka');
  assert.equal(fallback.skillScope, 'project-first');
});

test('provides known session engines', () => {
  const engines = getEngineRegistry();
  assert.equal(engines.some((engine) => engine.id === 'kaka'), true);
  assert.equal(engines.some((engine) => engine.id === 'codex'), true);
  assert.equal(getEngineById('claude-code').command, 'claude');
  assert.equal(getEngineById('missing').id, 'kaka');
});

test('creates engine initialization plan for codex projects', () => {
  const plan = createEngineInitPlan({
    engineId: 'codex',
    projectPath: 'D:\\Projects\\Demo',
    goal: '把会话沉淀成工作流',
    skills: ['工作流生成', '独立验证']
  });

  assert.equal(plan.engine.id, 'codex');
  assert.equal(plan.files.some((file) => file.relativePath === 'AGENTS.md'), true);
  assert.equal(plan.files.some((file) => file.relativePath === '.kaka/session-rules.md'), true);
  assert.equal(plan.files.some((file) => file.relativePath === '.kaka/skills/README.md'), true);
  assert.equal(plan.files.find((file) => file.relativePath === 'AGENTS.md').content.includes('把会话沉淀成工作流'), true);
  assert.equal(plan.files.find((file) => file.relativePath === 'AGENTS.md').content.includes('工作流生成'), true);
});

test('creates auditable engine handoff package', () => {
  const plan = createEngineHandoffPlan({
    engineId: 'claude-code',
    projectPath: 'D:\\Projects\\Demo',
    goal: '修复会话持久化并沉淀工作流',
    contextSummary: '当前会话已经读取目录摘要。',
    skills: ['项目目录理解'],
    constraints: ['写入前确认'],
    validation: ['独立验证必须不继承会话记忆'],
    nextActions: ['定位持久化入口']
  });

  assert.equal(plan.engine.id, 'claude-code');
  assert.match(plan.relativePath, /^\.kaka\/handoffs\/handoff-claude-code-/);
  assert.equal(plan.content.includes('修复会话持久化并沉淀工作流'), true);
  assert.equal(plan.content.includes('独立验证必须不继承会话记忆'), true);
  assert.match(plan.suggestedCommand, /^claude /);
});

test('normalizes imported engine handoff result', () => {
  const passed = normalizeEngineHandoffResult({
    engineId: 'codex',
    filePath: 'D:\\Projects\\Demo\\.kaka\\handoffs\\result.md',
    content: 'Completed\nTests passed\nEvidence: npm test output'
  });
  assert.equal(passed.engine.id, 'codex');
  assert.equal(passed.status, 'completed');
  assert.match(passed.summary, /Completed/);
  assert.equal(passed.validationHints.some((hint) => hint.includes('证据')), true);

  const failed = normalizeEngineHandoffResult({
    engineId: 'codex',
    content: 'Error: build failed'
  });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.validationHints.some((hint) => hint.includes('失败')), true);
});

test('locks goal state and records proposed changes', () => {
  const draft = createGoalState('生成一个可验证工作流');
  const locked = lockGoalState(draft);
  const proposed = updateGoalState(locked, {
    title: '改成只做聊天',
    reason: '用户临时发散'
  });

  assert.equal(locked.status, 'locked');
  assert.equal(proposed.title, '生成一个可验证工作流');
  assert.equal(proposed.history[0].title, '改成只做聊天');
  assert.equal(proposed.history[0].status, 'proposed');

  const forced = updateGoalState(proposed, { title: '改成只做聊天', force: true });
  assert.equal(forced.title, '改成只做聊天');
});

test('normalizes fallback goal state', () => {
  const goal = normalizeGoalState({}, '整理会话目标');
  assert.equal(goal.title, '整理会话目标');
  assert.equal(goal.status, 'draft');
});

test('does not treat greetings as workflow-ready material', () => {
  assert.equal(isActionableGoalText('在？'), false);
  const readiness = assessWorkflowReadiness({
    goal: '在？',
    inputs: ['执行引擎：KaKa 内置'],
    stages: ['回应问候', '等待具体需求'],
    nodes: ['ChatAgent'],
    constraints: ['验证流程需要独立上下文'],
    validation: ['独立验证'],
    hasWorkflowIntent: false,
    hasEvidence: false
  });

  assert.equal(readiness.ready, false);
  assert.equal(readiness.score < readiness.maxScore, true);
  assert.equal(readiness.missing.includes('需要先形成一个可执行目标'), true);
});

test('marks workflow material ready only after goal, evidence, stages, nodes, and validation exist', () => {
  const readiness = assessWorkflowReadiness({
    goal: '把会话沉淀成可验证工作流',
    goalStatus: 'locked',
    inputs: ['本地目录：D:\\Projects\\Demo', '交接包：.kaka/handoffs/demo.md'],
    stages: ['理解目标', '生成节点'],
    nodes: ['规划器', '独立验证 Agent'],
    constraints: ['验证流程必须使用独立上下文'],
    validation: ['验收：生成的工作流必须能编辑'],
    hasWorkflowIntent: true,
    hasEvidence: true
  });

  assert.equal(readiness.ready, true);
  assert.equal(readiness.score, readiness.maxScore);
});

test('collects evidence box from session outputs', () => {
  const evidence = collectEvidenceBox({
    context: {
      files: [{ relativePath: 'README.md', summary: '项目说明' }]
    },
    artifacts: [
      { type: 'engine-result', title: 'Codex 结果', summary: 'Completed', status: 'completed', path: '.kaka/handoffs/result.md' },
      { type: 'workflow', title: '工作流草稿', summary: '4 个节点' }
    ],
    toolRuns: [{ command: 'npm test', status: '成功', stdout: 'passed' }],
    verification: [{ status: '通过', text: '隔离验证通过', isolated: true }]
  });

  assert.equal(evidence.some((item) => item.type === 'context'), true);
  assert.equal(evidence.some((item) => item.type === 'engine-result' && item.status === 'passed'), true);
  assert.equal(evidence.some((item) => item.type === 'verification' && item.status === 'passed'), true);
});
