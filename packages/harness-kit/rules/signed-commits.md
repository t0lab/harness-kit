# Signed Commits

This project requires signed commits (GPG or SSH).

- Never use `--no-gpg-sign` or `-c commit.gpgsign=false` — fix the underlying signing issue instead
- If signing fails: check `gpg --list-secret-keys` or `ls ~/.ssh/*.pub`, then consult `.agents/skills/commit-signing/`
