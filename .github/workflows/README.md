# Workflows (fork)

GitHub Actions chỉ chạy file trong thư mục này.

Các workflow gốc từ upstream đã được chuyển sang [../workflows-upstream/](../workflows-upstream/) để không tự chạy trên fork này.

## Active workflows

- `docs-lint.yml` — kiểm tra link và pattern trong markdown docs
- `poc-publish-packages.yml` — publish npm packages lên GitHub Packages (push khi `package.json` đổi, hoặc manual)

### Publishable packages

`@haywork/types`, `@haywork/harness`, `@haywork/adapter-jam`, `@haywork/recorder`, `@haywork/spec-gen`, `@haywork/mcp-local`

Các workflow gốc từ upstream vẫn nằm ở [../workflows-upstream/](../workflows-upstream/).
