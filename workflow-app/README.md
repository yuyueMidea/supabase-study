# ⚡ FlowDesk — Vue + Supabase 工作流管理平台

企业级工作流审批系统，支持多级审批、实时状态同步、消息通知等完整功能。

---

## 功能清单

| 功能模块 | 说明 |
|---|---|
| 🔐 用户认证 | 登录/注册，多角色（管理员/主管/员工） |
| 📊 数据仪表盘 | 统计卡片、待办汇总、快速发起、最近动态 |
| ✅ 我的待办 | 分配给我的待审批任务，支持优先级过滤 |
| 📋 流程列表 | 全部流程，多维度筛选+搜索+分页 |
| 🔍 流程详情 | 步骤可视化、审批操作、驳回/转交/撤销、审批记录时间线 |
| ⚙️ 流程模板 | 可视化流程编辑器，自定义步骤/角色/超时规则 |
| 📤 发起申请 | 动态表单（请假/报销/采购等业务字段） |
| 🔔 消息通知 | 任务分配/通过/驳回实时通知，Realtime 推送 |
| 👤 个人中心 | 编辑资料，查看个人统计数据 |

---

## 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动（演示模式）

**无需配置 Supabase**，直接启动即可体验完整功能：

```bash
npm run dev
```

打开 http://localhost:5173，使用以下演示账号登录：

| 账号 | 角色 | 邮箱 |
|---|---|---|
| 张三 | 管理员 | admin@company.com |
| 李四 | 主管 | manager@company.com |
| 王五 | HR | hr@company.com |
| 赵六 | 员工 | emp@company.com |

> 演示模式数据存储在内存，刷新重置，所有流程交互均完整可用。

---

## 连接 Supabase（生产模式）

### 1. 创建项目

前往 [supabase.com](https://supabase.com) 创建项目。

### 2. 初始化数据库

在 Supabase 控制台 → SQL Editor 中，执行：

```
supabase/migrations/001_initial_schema.sql
```

### 3. 部署 Edge Function

```bash
# 安装 Supabase CLI
npm install -g supabase

supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy workflow-transition
```

### 4. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

在 Supabase Dashboard → Project Settings → API 中找到这两个值。

### 5. 启动

```bash
npm run dev
```

---

## 项目结构

```
workflow-app/
├── src/
│   ├── assets/
│   │   └── main.css              # Tailwind + 全局样式
│   ├── components/
│   │   ├── layout/
│   │   │   └── NavItem.vue       # 侧边栏导航项
│   │   ├── ui/
│   │   │   ├── AppModal.vue      # 通用弹窗
│   │   │   ├── EmptyState.vue    # 空状态占位
│   │   │   ├── PriorityBadge.vue # 优先级标签
│   │   │   ├── StatCard.vue      # 统计卡片
│   │   │   ├── StatusBadge.vue   # 状态标签
│   │   │   └── ToastContainer.vue# 消息提示
│   │   └── workflow/
│   │       ├── InstanceCard.vue  # 流程卡片（列表项）
│   │       └── WorkflowStepper.vue# 审批进度步骤条
│   ├── layout/
│   │   └── AppLayout.vue         # 主布局（侧边栏+顶栏）
│   ├── lib/
│   │   ├── mockData.ts           # 演示模式模拟数据
│   │   └── supabase.ts           # Supabase 客户端
│   ├── router/
│   │   └── index.ts              # Vue Router 路由配置
│   ├── stores/
│   │   ├── auth.ts               # 用户认证状态
│   │   ├── notification.ts       # 通知状态
│   │   ├── toast.ts              # Toast 消息
│   │   └── workflow.ts           # 核心工作流状态（含 mock 逻辑）
│   ├── types/
│   │   └── index.ts              # 全局 TypeScript 类型定义
│   ├── views/
│   │   ├── DashboardView.vue     # 仪表盘
│   │   ├── DefinitionEditView.vue# 流程模板编辑器
│   │   ├── DefinitionsView.vue   # 流程模板列表
│   │   ├── InstanceDetailView.vue# 流程详情（审批操作）
│   │   ├── InstancesView.vue     # 全部流程列表
│   │   ├── LoginView.vue         # 登录/注册
│   │   ├── NotificationsView.vue # 消息通知
│   │   ├── ProfileView.vue       # 个人中心
│   │   ├── SubmitView.vue        # 发起申请表单
│   │   └── TasksView.vue         # 我的待办
│   ├── App.vue
│   └── main.ts
├── supabase/
│   ├── functions/
│   │   └── workflow-transition/
│   │       └── index.ts          # Edge Function：状态流转引擎
│   └── migrations/
│       └── 001_initial_schema.sql# 完整数据库结构+RLS+触发器
├── .env.example                  # 环境变量模板
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 技术栈

- **Vue 3** + Composition API + `<script setup>`
- **Pinia** — 状态管理
- **Vue Router 4** — 客户端路由
- **Supabase** — 数据库、认证、Realtime、Edge Functions
- **Tailwind CSS 3** — 样式
- **TypeScript** — 类型安全
- **date-fns** — 日期处理
- **Vite** — 构建工具

---

## 架构要点

### 状态机（State Machine）

所有状态流转通过 `workflow-transition` Edge Function 处理，前端不直接写 `status` 字段，保证流转原子性和权限校验。

### 双模式设计

```
IS_DEMO = true  → 使用 mockData.ts 中的内存数据，零配置启动
IS_DEMO = false → 全量使用 Supabase，Realtime 推送变更
```

### Realtime 订阅

```typescript
supabase.channel('workflow-changes')
  .on('postgres_changes', { event: '*', table: 'workflow_instances' }, handler)
  .subscribe()
```

### RLS 安全

- 流程只对创建者、当前处理人、管理员可见
- 状态更新通过 service role Edge Function 执行，绕过前端权限限制

---

## License

MIT
