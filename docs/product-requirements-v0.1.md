# KaKaAgent Product Requirements v0.1

## Product Positioning

KaKaAgent is a desktop Agent workbench for complex tasks. It uses a growing task graph, reusable Agent ecology, and independent verification to make AI work controllable, auditable, reusable, and rejectable.

It is not a normal chatbot and not a fixed workflow tool. It is an AI work organization system.

Core belief:

> AI is strong at exploration, synthesis, candidate generation, and local tool implementation. Complex work must be advanced through verifiable, rejectable, reusable stages.

## Core Problems

1. Fixed workflow templates assume the task structure is already clear, but complex tasks usually start in uncertainty.
2. Agents can execute and explain their own completion, which creates self-verification risk.
3. Multi-Agent systems often become role-playing chats without promotion, pruning, reuse, or retirement.
4. Verification can be polluted by prior context and drift toward "good enough, finish it."
5. Failures are often discarded instead of becoming reusable learning assets.
6. Reusable Agents are usually hand-written prompts, not roles naturally discovered from real task patterns.

## Product Goals

1. Let complex goals start with exploration instead of immediate execution.
2. Let exploration branches compete by evidence, uncertainty reduction, value, and cost.
3. Promote clear paths into executable trunks.
4. Require independent verification for every stage artifact.
5. Let Agents emerge, mature, get reused, enter probation, and retire.
6. Keep verification stateless by default, without narrative contamination.
7. Turn every failure into a searchable and reusable asset.

## Core Concepts

### Goal Contract

A structured representation of the user's goal. It starts from natural language and becomes more precise through exploration.

Fields:

- Intent: what the user truly wants to achieve.
- Scope: how far this task should go in the current run.
- Constraints: time, cost, tools, privacy, stack, and permissions.
- Success Signals: signals that indicate the path is working.
- Failure Signals: signals that indicate the task should stop or pivot.
- Human Preferences: user values, style, and tradeoffs.

The Goal Contract can evolve during exploration, but must be frozen before trunk execution.

### Goal Graph

A growing task graph rooted in the user's goal. It grows exploratory branches before consolidating into execution trunks.

Node types:

- Root Goal
- Exploration Branch
- Hypothesis
- Evidence
- Candidate Plan
- Promotion Gate
- Execution Trunk
- Validation Gate
- Artifact
- Failure Record
- Agent Candidate

### Exploration Branch

A branch that exists to reduce uncertainty, not to directly deliver the final result.

Each branch declares:

- Exploration question
- Target uncertainty to reduce
- Budget
- Allowed tools
- Required output format
- Evidence requirements
- Stop condition

### Branch Energy

Every exploration branch has limited energy:

- Time budget
- Token budget
- Tool-call budget
- Money budget
- Human attention budget

The system allocates more energy to branches with stronger nutrition signals.

Nutrition signals:

- Useful evidence count
- Uncertainty reduction
- Executable path clarity
- Risk discovery value
- User interest
- Cost-benefit ratio

### Evidence Ledger

Evidence is a first-class artifact. Summaries are not enough.

Fields:

- Claim
- Source
- Source type
- Timestamp
- Confidence
- Extracted by
- Used by decision
- Contradictions
- Verification status

The purpose is to prevent fluent AI narratives from replacing traceable evidence.

### Uncertainty Map

A live map of what the system knows and does not know.

Sections:

- Known Facts
- Unknown Questions
- Key Assumptions
- Risk Assumptions
- Blocking Questions
- Validation Needs

An exploration branch is valuable only if it reduces meaningful uncertainty.

### Promotion Gate

An exploration branch cannot automatically become the main path. It must pass a promotion decision.

Promotion criteria:

- Goal is clear enough.
- Evidence is sufficient.
- Key risks are controlled or explicit.
- Next artifact is clear.
- Verification method can be defined.
- Cost is acceptable.
- User or policy confirms the promotion.

After promotion, the branch becomes an Execution Trunk and shifts from exploration to delivery.

### Execution Trunk

The main executable path. It focuses on stable delivery, not open-ended exploration.

Each trunk node defines:

- Input
- Output artifact
- Execution Agent
- Permission scope
- Validator
- Timeout rule
- Failure handling strategy
- Rollback strategy

### Validation Constitution

The system's verification rules.

Principles:

- Execution Agents cannot modify validators.
- Validator versions are frozen before stage execution.
- Validators run in isolated environments.
- Validators output structured results.
- Validator failure blocks promotion or delivery.
- Validator changes require user confirmation or independent approval.

### Clean-Room Verification

AI verification must run in a clean context by default. It must not inherit execution history.

Allowed verifier inputs:

- Current Goal Contract
- Current Artifact
- Current Validator Rule
- Current test environment

Disallowed by default:

- Execution Agent explanation
- Historical repair rounds
- User urgency
- "We already tested many times" context
- Persuasive summaries from other Agents

Verifier output:

- pass, fail, or inconclusive
- failed_rule
- evidence
- minimal_reproduction
- suggested_next_check

Principle:

> Executors may have memory. Verifiers must be stateless. Judges may see history but cannot rewrite lower-level verification results.

### Agent Lifecycle

Agents are not only pre-defined role cards. They can emerge from repeated task patterns.

Lifecycle states:

- Ephemeral Agent: temporary Agent for a single node.
- Candidate Agent: promising reusable Agent discovered from task history.
- Resident Agent: stable reusable Agent in the library.
- Probation Agent: Agent with degraded trust after failures.
- Dormant Agent: inactive but retained.
- Retired Agent: removed from active use.

Reusable Agent profile:

- Responsibility
- Applicable node types
- Input format
- Output format
- Tool permissions
- Verification method
- Success rate
- Failure modes
- Average cost
- Version history
- Typical tasks

### Agent Lineage

Every reusable Agent keeps its origin and performance history.

Fields:

- Origin task
- Origin branch
- Created from
- Prompt version
- Validator version
- Success cases
- Failure cases
- Modified by
- Retirement reason

The Agent Library is a team archive, not a prompt warehouse.

### Separation of Powers

Roles:

- Explorer: explores information.
- Planner: proposes paths.
- Builder: produces artifacts.
- Verifier: checks artifacts independently.
- Judge: decides from rules and verification results.
- User: controls goal, values, and final tradeoffs.

Rules:

- Builder cannot judge its own completion.
- Verifier does not inherit Builder context by default.
- Judge may view history but must explicitly declare accepted risk.
- User always owns goal changes and value decisions.

### Failure Asset

Failure is not only a red mark. It is future training material for the system.

Fields:

- Failed node
- Failed Agent
- Failed validator
- Failed input
- Failed artifact
- Failure reason
- Reproducibility
- Repair suggestion
- Whether it created a new rule
- Whether it changed Agent weight

## Core User Flow

### 1. Create Goal

The user enters a natural language goal. The system creates an initial Goal Contract, identifies key uncertainties, and proposes exploration directions.

### 2. Grow Exploration

The system creates several Exploration Branches. Low-cost Agents explore in parallel, produce Evidence Ledger entries, and update the Uncertainty Map. Low-value branches are pruned or put to sleep.

### 3. Promote Path

The system scores candidate paths. The user reviews evidence and risk. One or more paths pass the Promotion Gate and become Execution Trunks. The current contract and validator requirements are frozen.

### 4. Execute Trunk

The Builder Agent produces artifacts. Validators run independently. Clean-Room Verifiers review without inherited history. The Judge aggregates results. Passing nodes continue; failing nodes retry, roll back, or branch back into exploration.

### 5. Reuse and Improve

Useful temporary Agents become Candidates. Repeated high-performing Candidates become Resident Agents. Failure records affect future Agent weights. Reusable evidence, rules, and tools become long-term memory.

## MVP Scope

Version 0.1 should support:

1. Create and edit a Goal Contract.
2. Generate 3 to 5 exploration branches.
3. Bind each branch to an Ephemeral Agent.
4. Produce Evidence Ledger entries and candidate paths.
5. Promote a branch into an Execution Trunk.
6. Produce stage artifacts.
7. Run independent validator scripts.
8. Run Clean-Room AI Verification.
9. Save Agent Candidates.
10. Record failures and basic Agent scores.

Out of scope for v0.1:

- Plugin marketplace
- Enterprise permission management
- Multi-user collaboration
- Fully autonomous long-running operation
- Complex 3D visualization

## Success Criteria

Short-term:

- A user can turn a fuzzy goal into an executable trunk.
- A user can see why a path was chosen.
- A user can see which validations passed or failed.
- Failures produce useful records.
- At least one temporary Agent can become reusable.

Long-term:

- The user's Agent Library becomes stronger over time.
- Repeated task exploration cost decreases.
- Validation rules become richer.
- Failure rate decreases.
- Complex tasks become auditable evolving processes.

## Product Constitution

Exploration may diverge. Execution must converge.

Generation may keep memory. Verification must stay clean.

Agents may be born. Agents must also be demoted or retired.

