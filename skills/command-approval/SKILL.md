# 命令审批

- name: 命令审批
- summary: 将本地 CLI 操作转为可审批、可记录、可回放的工具调用。
- permission: approval-required
- triggers: 命令,执行,运行,测试,构建,npm,git,node,python

## 使用方式

当任务需要执行本地命令时，先生成命令提案，不直接执行：

1. 说明命令用途。
2. 给出工作目录。
3. 标记权限等级。
4. 等待用户批准。
5. 执行后记录 stdout、stderr、退出码和耗时。

## 第一版白名单

- `git status`
- `git diff`
- `git log`
- `npm test`
- `npm run ...`
- `node --check ...`
- `node -v`
- `npm -v`
- `python --version`
- `py --version`

## 禁止

删除、清空、重置、管道、重定向、链式命令在第一版都不自动执行。
