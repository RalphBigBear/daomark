# Contributing to DaoMark / 参与贡献道韵笔记

Thank you for your interest in contributing! 感谢您有兴趣参与贡献！

## Development Setup / 开发环境

```bash
git clone https://github.com/RalphBigBear/daomark.git
cd daomark
npm install
npm run dev
```

For native development / 原生开发:

```bash
# Ensure Rust is installed / 确保已安装 Rust
# https://rustup.rs
npm run tauri:dev
```

## Guidelines / 准则

1. **Keep it simple / 至简** — Before adding a feature, ask: does this align with the Dao of simplicity? 添加功能前请自问：这符合至简之道吗？
2. **i18n** — All user-facing strings must be in both `src/locales/zh.json` and `src/locales/en.json`. 所有面向用户的文字必须同时存在于中英文 locale 文件中。
3. **No frameworks / 无框架** — We use vanilla JS intentionally. 我们有意使用原生 JS。
4. **Test before PR / 提交前测试** — Run `npm run build` to verify. 请运行 `npm run build` 验证。

## Commit Messages / 提交信息

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code refactoring
```

## License / 许可

By contributing, you agree that your contributions will be licensed under the MIT License.

参与贡献即表示您同意您的贡献将以 MIT 许可证授权。
