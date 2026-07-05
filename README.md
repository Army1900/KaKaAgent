# KaKaAgent

KaKaAgent 是一个通用桌面 Agent 工作台。第一版先支持：

- 打开本地目录
- 扫描目录结构
- 和 Agent 对话
- 查看当前目录工作流
- 查看基础 Agent 库

## 开发运行

```bash
npm install
npm run dev
```

如果 Electron 下载较慢，可以使用镜像：

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
npm install
```
