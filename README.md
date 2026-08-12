# 黧温婉粉丝站

B站主播「黧温婉」的非官方纯静态粉丝站（Vue 3 + Vite + Vue Router(hash) + Pinia，手写 CSS）。
无后端、无数据库、无用户注册；全部可变内容存放在 `public/data/*.json`，图片在 `public/uploads/`。

- 主播空间：https://space.bilibili.com/3546677879244804
- 直播间：https://live.bilibili.com/1820903035

## 本地开发

```bash
npm install
npm run dev        # 开发
npm run build      # 构建到 dist/
npm run preview    # 预览构建产物
```

## 目录说明

```
public/data/             站点内容 JSON（settings/news/gifts/songs/events/birthdays/videos/guard_honor）
public/uploads/          管理员上传的图片
public/games/guaguale/   刮刮乐静态页（由 scripts/extract-guaguale.mjs 从单文件版抽离生成）
src/config/admins.ts     写死的 3 个管理员账号（sha256(salt+password)）
scripts/gen-admin-hash.mjs     生成管理员密码哈希
scripts/extract-guaguale.mjs   刮刮乐资源抽离（sharp 重编码）
.github/workflows/deploy.yml   push main → 构建 → 部署 GitHub Pages
```

## 部署（GitHub Pages，主方案）

本仓库应作为 **项目页站点仓库** `nsfxdyj/liwenwan`（vite base 为 `/liwenwan/`）：

1. 在 GitHub 创建公开仓库 `liwenwan`，把本目录内容作为仓库根推送到 `main` 分支。
2. 仓库 Settings → Pages → Build and deployment 的 Source 选择 **GitHub Actions**。
3. push 到 `main` 后 `.github/workflows/deploy.yml` 自动 `npm ci && npm run build` 并把 `dist` 部署到 Pages，
   1–3 分钟后通过 `https://nsfxdyj.github.io/liwenwan/` 访问。
4. 可选自定义域名（当前不绑）：绑定后 GitHub 自动签发 HTTPS。
   服务器在境外，无需 ICP 备案——后台「站点设置」中备案号留空，页脚即不显示备案号。

已知限制：仓库 ≤1GB、月流量软上限 100GB、每小时 ≤10 次构建；国内访问速度一般，百度不收录 GitHub Pages。

## 后台与发布

- 后台地址：`/#/admin`。除此外全站无任何登录/注册入口。
- 3 个写死的管理员（`src/config/admins.ts`，账号 admin1 / admin2 / admin3）。
  **初始密码随部署单独交付，不写入本仓库**——明文保存在仓库目录之外的
  `初始管理员密码-勿入库.txt`（site 的上一级目录，不会被 git 追踪）。
  首次登录后请立即用 `scripts/gen-admin-hash.mjs` 改密（见下节）。
- 登录态存 sessionStorage（关闭浏览器即失效）；连续失败 5 次锁定 10 分钟。

### 管理员修改密码

```bash
node scripts/gen-admin-hash.mjs "新密码"
```

把输出的 hash 替换 `src/config/admins.ts` 中对应账号的 `hash`，提交并推送代码即可。

### 一键发布（主用）

1. 管理员到 GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens**，
   申请仅针对本仓库、权限勾选 **Contents: Read and write** 和 **Actions: Read-only** 的 Token
   （后者用于后台轮询发布结果；未授予时提交不受影响，仅无法自动显示构建状态，可到 Actions 页面手动确认）。
2. 后台「发布」页粘贴 Token，确认 owner/repo（默认 `nsfxdyj` / `liwenwan`），保存设置。
   Token 只存在该管理员自己浏览器的 localStorage，不写入代码、不进入仓库、不上传任何地方。
3. 编辑内容后点「保存并发布」：前端通过 GitHub Contents API 把改动提交为 commit，
   触发 Actions 自动构建发布，后台会轮询并显示「发布成功/失败」。

### 备用：导出 zip 手动更新

后台「发布」页点「导出全部数据」，把 zip 内 `data/` 覆盖仓库 `public/data/`、`uploads/` 复制到
`public/uploads/`，手动 git push 或在 GitHub 网页上传，效果相同。

### 备选：部署到国内 OSS（如阿里云 OSS / 腾讯云 COS）

1. `npm run build` 得到 `dist/`。
2. 全量上传，例如阿里云：`ossutil cp -r -f dist/ oss://你的bucket/`
   （或腾讯云：`coscmd upload -r dist/ /`）。
3. Bucket 开启静态网站托管，默认首页 `index.html`；路由为 hash 模式，无需配置错误页重定向。
4. 境内部署需 ICP 备案，备案号填到后台「站点设置 → 备案号」，发布后页脚自动显示。

## 安全边界说明（务必知悉）

本站是纯静态架构：**管理后台的密码校验只是前端门槛，懂技术的人可以绕过界面进入后台视图**。
但站点内容的真正发布依赖 GitHub 仓库的写权限——细粒度 Personal Access Token 仅由 3 名管理员
各自持有，存于各自浏览器的 localStorage，不写入代码、不进入仓库。绕过界面无法改动线上内容。
因此：

- 不要在后台或 JSON 内容中存放任何敏感信息（密码、密钥、隐私数据等），仓库与站点内容全部公开可见；
- Token 按最小权限申请（仅本仓库 Contents 读写），泄露后立刻到 GitHub 吊销并重新生成；
- 管理员初始密码仅用于首次登录，请尽快修改。

## 其他约定

- 全站时间显示为北京时间（`src/utils/time.ts` 统一处理）。
- 管理员上传图片限 jpg/png/webp，浏览器端 canvas 压缩：普通图 ≤300KB、壁纸 ≤800KB。
- JSON 内容一律视为不可信输入，前端全部经 Vue 模板转义渲染，不使用 v-html。
- 刮刮乐数据（奖项、登记）仅存在访客浏览器的 localStorage（键 `gualale_prizes_v2`）。
