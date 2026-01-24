# Node.js 环境变量配置指南

## 问题描述

Node.js 已安装在 `C:\Program Files\nodejs\`，但未添加到系统 PATH 环境变量，导致无法在命令行直接使用 `node` 和 `npm` 命令。

## 解决方案

### 方法 1：运行自动配置脚本（推荐）

1. **双击运行**：`d:\Gomoku\configure-nodejs-path.bat`
2. 脚本会自动将 Node.js 添加到系统 PATH
3. **重新打开命令行窗口**
4. 验证安装：
   ```bash
   node --version
   npm --version
   ```

---

### 方法 2：手动配置环境变量

#### 步骤 1：打开环境变量设置

1. 右键点击"此电脑" → 属性
2. 点击"高级系统设置"
3. 点击"环境变量"按钮

#### 步骤 2：编辑 PATH 变量

1. 在"系统变量"区域，找到并选中 **Path**
2. 点击"编辑"按钮
3. 点击"新建"，添加以下两行：
   ```
   C:\Program Files\nodejs
   C:\Program Files\nodejs\node_modules\npm\bin
   ```

#### 步骤 3：保存并验证

1. 点击"确定"保存所有更改
2. **重新打开命令行窗口**（必须）
3. 运行以下命令验证：
   ```bash
   node --version
   npm --version
   ```

预期输出：
```
v20.11.1  (或其他版本号)
10.2.4    (或其他版本号)
```

---

### 方法 3：临时配置（仅当前命令行有效）

如果以上方法都不行，可以在每个命令行会话中运行：

```bash
set PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files\nodejs\node_modules\npm\bin

node --version
npm --version
```

---

## 配置完成后

配置好环境变量后，您可以在项目目录运行：

```bash
cd d:\Gomoku\frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

然后访问 http://localhost:5173 测试登录页面样式。

---

## 验证构建

如果要构建生产版本：

```bash
cd d:\Gomoku\frontend
npm run build
```

构建后的文件在 `dist` 目录，可以用 Live Server 预览。

---

## 故障排除

如果配置后仍然不行：

1. **检查多个 Node.js 安装**：
   ```bash
   where node
   where npm
   ```

2. **检查环境变量是否生效**：
   ```bash
   echo %PATH%
   ```

3. **重启电脑**：某些情况下需要重启才能生效

4. **检查权限**：确保对 `C:\Program Files\nodejs` 有读取权限

---

## 需要帮助？

如果仍然遇到问题：
1. 运行 `d:\Gomoku\configure-nodejs-path.bat` 并截图错误信息
2. 运行 `echo %PATH%` 并截图输出
3. 联系我获取帮助
