# CFMonitor MYNT 主题

CFMonitor MYNT 是一个独立的 Vue/Vite 第三方主题：复用 CFMonitor 已有的公共前台数据、API、实时连接、鉴权与路由约定，但拥有独立的 Material You（MYNT）视觉、组件和动效实现。它通过 CFMonitor 的 `theme_url` 加载，不替换内置前台或 Admin。

## 目录与命令

- 源码：`theme-src/mynt/`
- 构建产物：`themes/mynt/`
- 本地开发：`npm run dev:theme:mynt`
- 构建：`npm run build:theme:mynt`
- 预览构建结果：`npm run preview:theme:mynt`
- 偏好工具测试：`node --test test/mynt-theme.test.js`
- 主题完整测试（测试、构建、产物检查）：`npm run test:theme:mynt`

开发服务器默认将 `/api`、`/admin/api`、`/flags`、`/os-icons` 和 `/files` 代理到 `https://localhost:8787`。如需连接其他本地 Worker，可设置 `VITE_DEV_PROXY_TARGET`，例如：

```powershell
$env:VITE_DEV_PROXY_TARGET = 'https://localhost:8788'
npm run dev:theme:mynt
```

## 路由与配置

主题使用 Hash 路由，兼容以下地址：

- `/#/`：Dashboard
- `/#/server/:id`：服务器详情
- `/admin#admin`：返回 CFMonitor Admin

站点配置从 `/api/config` 的 `theme_options.mynt` 读取，当前 schema 为：

```json
{
  "schema": 1,
  "accent": "#4382EC",
  "colorMode": "system"
}
```

`accent` 只接受 `#RRGGBB`，保存和使用时会规范为大写；`colorMode` 只接受 `system`、`light` 或 `dark`。偏好优先级为：本机 localStorage（`cfmonitor-mynt-preferences-v1`）> 站点 `theme_options.mynt` > 内置默认值。无效或无法解析的旧 JSON 会安全回退，并不会阻塞主题加载。

用户在设置抽屉中的选择只写入当前浏览器。已通过 JWT 鉴权的管理员可以使用主题提供的保存操作写回 `POST /api/theme_options`；启用全局 Turnstile 时还需携带有效的 Turnstile 凭证。保存只更新 `theme_options.mynt`，保留其他主题配置。

## 产物

发布目录保持可直接由主题代理提供的结构：

```text
themes/mynt/
├── index.html
└── assets/
    ├── app-*.js
    ├── *.css
    └── licenses/
```

除 `index.html` 外，运行时资源全部位于 `assets/`；许可证和来源说明也会随产物复制到 `assets/licenses/`，不依赖仓库根目录文件。

## 许可证与来源

- MYNT 主题源码及其组合后的主题产物：GNU GPL-3.0-or-later，完整文本见 [`COPYING`](./COPYING)。
- Poppins 字体：SIL Open Font License 1.1（OFL-1.1）。
- Material Design Icons（MDI）路径：Pictogrammers Apache License 2.0；相关 `@mdi/js` 包代码按其 MIT 条款提供。
- CFMonitor 未参与组合的 Worker 与内置前台继续按上游 MIT 许可提供。

具体版权、修改日期和第三方清单见 [`NOTICE.md`](./NOTICE.md) 及 `public/licenses/` 中随包提供的许可证文本。

Cloudflare 挂载、正式部署、固定 commit 的 `theme_url` 配置和缓存验证留到下一阶段；本阶段只负责主题源码、构建产物和本地验证。
