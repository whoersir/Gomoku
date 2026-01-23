# 测试调试指南

## 问题
第二个玩家加入房间后，第一个玩家仍显示"等待第二名玩家加入"

## 需要的日志

### 后端日志（运行后端的 cmd 窗口）
当第二个玩家加入时，应该看到以下日志：
```
[handleJoinRoom] Player <playerName> joined room <roomId>, color: 2
[handleJoinRoom] gameState: {...}
[handleJoinRoom] roomInfo: {...}
[handleJoinRoom] Emitted playerJoined to room <roomId>
[handleJoinRoom] Emitting gameStateUpdate: {...} 或 Emitting waiting gameStateUpdate: {...}
[handleJoinRoom] Emitted roomInfo to room <roomId>
```

### 前端日志（浏览器控制台 F12）
当第二个玩家加入时，第一个玩家应该看到以下事件：
```
[socketService] Listening to event: gameStateUpdate
[useGameState] gameStateUpdate received: {...}
[useGameState] gameState status: playing
[useGameState] gameState players: {...}
[useGameState] gameState currentPlayer: 1
```
或者
```
[socketService] Listening to event: playerJoined
[useGameState] Player joined: {...}
[useGameState] Current gameState before update: {...}
[useGameState] New gameState after playerJoined: {...}
```

## 测试步骤

1. **重启后端服务**
   - 在运行后端的 cmd 窗口按 Ctrl+C 停止
   - 重新运行：`npm run dev` 或直接运行 `start.bat`

2. **打开浏览器开发者工具**
   - 按 F12 打开控制台
   - 切换到 Console 标签
   - 清空之前的日志

3. **测试加入房间**
   - 第一个浏览器标签：创建房间（玩家A，黑棋）
   - 第二个浏览器标签：加入同一房间（玩家B，白棋）

4. **观察日志**
   - 后端日志：确认发送了哪些事件
   - 前端日志：确认接收了哪些事件

5. **分享日志**
   - 如果问题仍然存在，复制以下内容给我：
     * 后端日志（从第二个玩家加入到游戏开始的部分）
     * 第一个玩家的前端控制台日志
     * 第二个玩家的前端控制台日志

## 可能的问题

1. **事件未发送**
   - 后端日志中没有 "Emitted gameStateUpdate"
   - 原因：gameState 为 null 或其他逻辑问题

2. **事件未接收**
   - 前端控制台没有 "gameStateUpdate received"
   - 原因：socket 连接问题或事件监听器未注册

3. **状态未更新**
   - 前端接收到事件但界面未更新
   - 原因：状态更新逻辑或 React 渲染问题
