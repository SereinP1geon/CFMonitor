# CFMonitor 上游同步指南

本指南针对 `SereinP1geon/CFMonitor` fork。上游为
[`huilang-me/CF-Server-Monitor`](https://github.com/huilang-me/CF-Server-Monitor)，开发分支为
`main`。本仓库的 MYNT 主题源码在 `theme-src/mynt/`，发布产物在 `themes/mynt/`。

当前部署约定如下，合并上游时必须保留这些本地配置：

| 项目 | 值 |
| --- | --- |
| Worker | `cfmonitor-mynt` |
| D1 | `cfmonitor-mynt-db` |
| 根域名 | `836917.xyz` |
| 备用入口 | `https://cfmonitor-mynt.spppp.workers.dev` |
| Wrangler 配置 | `wrangler.toml` |

## 推荐的分支策略

建议在 GitHub 的 Settings → Branches 为 `main` 设置保护规则：必须通过 Pull Request 合并，至少通过构建/测试检查，并禁止强制推送。同步上游不要直接改公开的 `main`。

每次同步前，在仓库目录执行以下 PowerShell：

```powershell
Set-Location 'D:\CodexProject\Monitor-Theme-CF\CFMonitor'

if (git status --porcelain) {
  throw '工作区有未提交变更。请先提交或另存这些变更，再开始同步。'
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$syncBranch = "sync/upstream-$stamp"
$backupBranch = "backup/main-$stamp"

git fetch origin --prune
git switch main
git pull --ff-only origin main
git branch $backupBranch
git push --set-upstream origin $backupBranch
git switch -c $syncBranch
```

`backup/main-*` 是本次同步前的可恢复指针；同步通过 PR 合并后仍可保留一段时间。不要为了“追平”上游而对已经公开的 `main` 使用 `rebase` 或强制推送；本指南默认使用普通 merge，保留可审计的合并提交。

## 获取并合并上游

首次使用时添加上游 remote，已有时不要重复添加：

```powershell
$upstreamUrl = git remote get-url upstream 2>$null
if (-not $upstreamUrl) {
  git remote add upstream 'https://github.com/huilang-me/CF-Server-Monitor.git'
}

git fetch upstream --prune
git log --oneline --decorate main..upstream/main
git merge --no-ff upstream/main -m 'Merge upstream main'
```

如果没有冲突，继续执行“构建与验证”。如果有冲突，先查看清单：

```powershell
git status
git diff --name-only --diff-filter=U
```

解决冲突后只添加已经人工检查过的文件，再完成 merge：

```powershell
git add <已确认的文件路径>
git diff --check
git commit
```

如果决定放弃本次尚未完成的 merge，可使用 `git merge --abort` 返回 merge 前状态；不要使用 `git reset --hard` 或强制推送来“清理”问题。

## 常见冲突与取舍

| 冲突位置 | 推荐取舍 |
| --- | --- |
| `src/database/`、`src/handlers/`、`src/middleware/`、`src/durable/` | 优先保留上游的 API、数据库迁移、鉴权和 Durable Objects 修复；确认没有误删本仓库已有配置兼容逻辑。主题不应改变后端接口。 |
| `src/frontend/views/Dashboard.vue`、`src/frontend/views/ServerDetail.vue`、`src/frontend/utils/i18n.js` | 优先吸收上游的数据字段、鉴权、实时更新和多 Worker 兼容改动，再把 MYNT 所需的最小适配重新套回去。不要仅按“ours/theirs”整文件覆盖。 |
| `theme-src/mynt/**` | 这是 MYNT 主题的源代码和许可证材料；除非上游明确提供了主题修复，否则保留本地实现，逐项检查接口变化。 |
| `themes/mynt/**` | 这是构建产物，不手工合并压缩后的 JS/CSS。先解决 `theme-src/mynt/`，再重新构建并检查产物。 |
| `wrangler.toml` | 保留 `name = "cfmonitor-mynt"`、`account_id`、`workers_dev = true`、`cfmonitor-mynt-db` 的 `database_id`、`[[routes]]` 中 `836917.xyz` 的 `custom_domain = true`，同时手工吸收上游新增的 bindings、迁移和兼容性设置。不要把任何 secret 写进该文件。 |
| `package.json`、`package-lock.json` | 先人工合并 `package.json` 的脚本和依赖；不要手工拼接 lockfile。随后运行 `npm install` 重新生成 lockfile，再用 `npm ci` 验证可重复安装。 |

如果上游修改了 `theme-develop.md` 或主题代理协议，先核对主题的 API 约定和 `NOTICE`，再决定是否调整 MYNT；不要因为文档冲突而删除本地许可证文件。

## 依赖、主题产物与完整验证

在同步分支上运行：

```powershell
npm install
npm ci

npm test
npm run test:all
npm run build:frontend
npm run test:theme:mynt

# 独立重复检查，便于在 CI 或审查日志中定位问题
npm run build:theme:mynt
node scripts/verify-mynt-theme.js

# 允许仓库现有 CRLF 行尾，不允许新增空白错误
git -c core.whitespace=cr-at-eol diff --check
git status --short
```

主题构建后，检查 `themes/mynt/` 仍只有 `index.html` 和 `assets/`（包括 `assets/licenses/`）这类发布内容，不要把 `node_modules/`、`.wrangler/`、本地 `.env`、证书或临时数据库文件加入提交。构建产物如果被仓库跟踪，应与对应源代码一起提交，不能只提交压缩后的 `themes/mynt/assets/`。

提交前建议审阅变更范围：

```powershell
git diff --stat main...HEAD
git diff --name-status main...HEAD
git status --short
```

任何出现以下内容的文件都不要提交，先移除并轮换凭据：`API_SECRET`、Cloudflare API Token、GitHub Token、Webhook 密钥、私钥/证书（尤其是 `-----BEGIN ... PRIVATE KEY-----`）。凭据只放在 Cloudflare Secrets、GitHub Actions Secrets 或本机未跟踪的 `.env` 中；不要把 secret 作为命令行参数、提交信息或聊天内容传递。

## 安全推送与合并

确认测试和差异无误后，把同步分支推到 fork，开 Pull Request `sync/...` → `main`：

```powershell
git diff --check
git push --set-upstream origin $syncBranch
```

可在 GitHub 网页创建 PR；如果本机已安装并登录 GitHub CLI，也可以使用：

```powershell
gh pr create --base main --head $syncBranch --title "Sync upstream main" --body "已完成上游同步、MYNT 构建和本地测试；请检查 Wrangler 配置与主题变更。"
```

PR 合并后更新本地 `main`，不要把同步分支强推到 `main`：

```powershell
git switch main
git pull --ff-only origin main
git branch --merged
```

确认不再需要某个同步分支后，优先在 GitHub 网页删除它；备份分支至少保留到线上部署验证完成。删除远程备份前先确认已经有另一个可用备份，避免误删唯一恢复点。

## 部署、验证与回滚

本仓库生产入口是 Cloudflare Worker，不是 GitHub Pages。合并 PR 前后都可以先做一次 D1 备份；导出的 SQL 可能包含站点设置、Webhook 等敏感数据，只保存在受保护的临时目录，绝不要提交或上传：

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dbBackup = Join-Path $env:TEMP "cfmonitor-mynt-db-$stamp.sql"
npx wrangler d1 export cfmonitor-mynt-db --remote --output $dbBackup
Write-Output "D1 备份已写入 $dbBackup；请按自己的保留策略安全保存。"
```

主题更新必须先生成产物，再部署 Worker：

```powershell
npm run build:theme:mynt
npm run build:frontend
npx wrangler deploy --name cfmonitor-mynt
```

`API_SECRET` 只能通过 Cloudflare Secret 配置；需要更新时使用隐藏输入提示，命令中不要写值：

```powershell
npx wrangler secret put API_SECRET --name cfmonitor-mynt
```

修改 `API_SECRET` 后要重新部署，并在所有 Agent 上重新执行后台生成的安装/更新命令。部署后做不含凭据的基本检查：

```powershell
$response = Invoke-WebRequest -Uri 'https://836917.xyz/' -UseBasicParsing
$response.StatusCode
Invoke-WebRequest -Uri 'https://836917.xyz/api/config' -UseBasicParsing | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -Uri 'https://cfmonitor-mynt.spppp.workers.dev/' -UseBasicParsing | Select-Object -ExpandProperty StatusCode
npx wrangler deployments list --name cfmonitor-mynt --json
```

如果只更新了主题，`theme_url` 应固定到已审查的 fork commit 对应的 `themes/mynt` tree，而不是未固定的 `main`；这样上游同步不会在不部署 Worker 的情况下改变线上主题。主题 URL、站点标题等 D1 设置不会随 Worker 版本回滚自动恢复，必要时在 `/admin#/admin` 中手动改回已记录的旧值。

Worker 代码出现问题时，先从部署列表选择已验证的旧版本 ID，再执行回滚：

```powershell
npx wrangler deployments list --name cfmonitor-mynt --json
npx wrangler rollback <VERSION_ID> --name cfmonitor-mynt --message 'Rollback to last known good version'
```

回滚后再次检查 `https://836917.xyz/`、`/api/config` 和后台。Worker 回滚不会撤销已经执行的 D1 schema 迁移，也不会恢复被修改或删除的数据；涉及数据库变更时必须先评估向前兼容性，并使用 Cloudflare D1 的备份/恢复能力，不要把代码回滚当作数据库回滚。

## 现有自动同步工作流的行为与风险

`.github/workflows/sync.yml` 当前配置为：

- 每天 UTC 00:00，或手动 `workflow_dispatch` 运行；
- 只在 GitHub 仍将仓库标记为 fork 时运行；
- 使用第三方 `aormsby/Fork-Sync-With-Upstream-action@v3.4`，从上游 `main` 直接同步到本仓库 `main`；
- 使用自动生成的 `GITHUB_TOKEN` 并声明 `contents: write`；
- 不在同步前运行本指南中的测试，也不创建待审查的 PR；同步成功后可能立即触发 `.github/workflows/deploy.yml`。

因此，MYNT 主题仓库默认不建议让它无人审查地写入生产 `main`。更安全的做法是先在 Actions 页面禁用定时运行，只按本指南手动建 `sync/upstream-*` 分支和 PR；如果必须保留自动同步，至少在每次运行后检查提交、完整执行测试，并在 Cloudflare 部署前保留 D1 备份。该 Action 使用可变 tag 而不是 commit SHA，也存在第三方 Action 供应链风险。

如果上游更改了 workflow，GitHub 可能暂停自动同步；工作流中的 `Sync check` 会提示在仓库页面手动执行 Sync fork。此时以人工 fetch/merge 为准，不要为了让自动任务通过而覆盖本地主题或许可证文件。

`.github/workflows/deploy.yml` 仅在推送 `main` 且变更未被 `paths-ignore` 排除时尝试部署，并且只有配置了 `CF_API_TOKEN` 才会进入部署 job；它使用仓库的 `wrangler.toml`，所以合并前必须确认 Worker、D1 和根域路由仍是本仓库值。README 中关于 `server-monitor-db`、通用 Worker 名称或 GitHub Pages 的示例是上游通用说明，不应覆盖本部署的 `cfmonitor-mynt`、`cfmonitor-mynt-db` 和 `836917.xyz`。

## 许可证边界

- 上游 CFMonitor/CF-Server-Monitor 的原始文件继续按其 MIT（Expat）许可证发布；保留原版权和许可证声明。
- `theme-src/mynt/` 以及组合后的 MYNT 发布包 `themes/mynt/` 按仓库当前声明使用 `GPL-3.0-or-later`，应保留 `theme-src/mynt/COPYING`、`NOTICE.md` 和产物中的 `assets/licenses/GPL-3.0.txt`、`NOTICE.txt`。
- Poppins 字体保持 SIL OFL-1.1；Material Design Icons 和其他第三方材料继续遵守各自清单中的许可证，不要把它们误标成 GPL 或 MIT。
- 不要把 GPL MYNT 主题代码不加审查地搬进仍按 MIT 发布的 Worker/内置前台部分；需要跨边界复用时，重新检查来源、版权头、`NOTICE` 和整个组合发布物的许可证要求。

详细主题接口仍以 [`theme-develop.md`](theme-develop.md) 为准。许可证问题如超出上述仓库声明，应在发布前单独取得法律意见。
