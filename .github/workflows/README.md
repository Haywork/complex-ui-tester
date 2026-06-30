# Workflows (fork)

GitHub Actions chỉ chạy file trong thư mục này.

Các workflow gốc từ upstream đã được chuyển sang [../workflows-upstream/](../workflows-upstream/) để không tự chạy trên fork này.

## Active workflows

- `docs-lint.yml` — kiểm tra link và pattern trong markdown docs
- `poc-publish-packages.yml` — publish tất cả `@haywork/cuit-*` packages trong 1 job (push khi `package.json` đổi, hoặc manual)

### Publishable packages

`@haywork/cuit-types`, `@haywork/cuit-harness`, `@haywork/cuit-recorder`, `@haywork/cuit-spec-gen`, `@haywork/cuit-mcp-local`

Các workflow gốc từ upstream vẫn nằm ở [../workflows-upstream/](../workflows-upstream/).
