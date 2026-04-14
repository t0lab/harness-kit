---
name: commit-signing
description: GPG and SSH commit signing setup, verification, and troubleshooting — invoke when the user asks about commit signing, signed commits, GPG keys, SSH signing, "verified" badges on GitHub, or when a git commit fails with a signing error. Run this proactively when setting up a new machine or new repo that requires signed commits.
---

# Commit Signing

Signed commits let GitHub/GitLab verify that commits actually came from you. Two approaches: **SSH signing** (recommended for new setups — simpler, reuses your existing key) and **GPG signing** (traditional, wider tool support).

---

## Which approach?

| | SSH signing | GPG signing |
|---|---|---|
| Setup complexity | Low — reuses existing SSH key | Medium — separate keyring |
| Requires | git ≥ 2.34, OpenSSH | gpg installed |
| GitHub support | Yes (since Apr 2022) | Yes |
| Key expiry | No (unless you set it) | Yes (GPG keys expire) |
| Passphrase caching | SSH agent (already running) | GPG agent (separate) |

**Default to SSH signing** unless the team or repo already uses GPG, or a compliance requirement specifies GPG.

---

## SSH Signing Setup

### 1. Check for an existing key
```bash
ls ~/.ssh/*.pub
```
If you have `id_ed25519.pub` or `id_rsa.pub`, skip to step 3.

### 2. Generate a new Ed25519 key (if needed)
```bash
ssh-keygen -t ed25519 -C "your@email.com"
# Accept default path (~/.ssh/id_ed25519), set a passphrase
```

### 3. Configure git globally
```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

### 4. Add signing key to GitHub
Go to **Settings → SSH and GPG keys → New signing key** (different from authentication keys).
Paste the contents of `~/.ssh/id_ed25519.pub`.

### 5. Set up local verification (optional but useful)
Allows `git log --show-signature` to verify locally:
```bash
echo "$(git config user.email) namespaces=\"git\" $(cat ~/.ssh/id_ed25519.pub)" >> ~/.ssh/allowed_signers
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
```

### 6. Test it
```bash
git commit --allow-empty -m "test: verify commit signing"
git log --show-signature -1
```
Look for `Good "git" signature` in the output.

---

## GPG Signing Setup

### 1. Generate a GPG key
```bash
gpg --full-generate-key
# Choose: (1) RSA and RSA, 4096 bits, 0 = does not expire
# Or: (9) ECC (ed25519) for modern machines
```

### 2. Get the key ID
```bash
gpg --list-secret-keys --keyid-format=long
# Output like: sec   4096R/3AA5C34371567BD2
# Key ID is: 3AA5C34371567BD2
```

### 3. Configure git globally
```bash
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true
# On macOS with gpg from Homebrew:
git config --global gpg.program gpg
```

### 4. Export public key for GitHub
```bash
gpg --armor --export <KEY_ID>
```
Go to **Settings → SSH and GPG keys → New GPG key**, paste the output.

### 5. Test it
```bash
git commit --allow-empty -m "test: verify GPG signing"
git log --show-signature -1
```

---

## Per-project vs global

Enable globally (all repos on this machine):
```bash
git config --global commit.gpgsign true
```

Enable for one project only:
```bash
git config commit.gpgsign true   # inside the repo, no --global
```

---

## Troubleshooting

### `error: gpg failed to sign the data`
1. Check the GPG agent is running: `gpg-connect-agent reloadagent /bye`
2. Test key directly: `echo "test" | gpg --clearsign`
3. Check `git config --global user.signingkey` matches `gpg --list-secret-keys`
4. On macOS: install pinentry-mac (`brew install pinentry-mac`) and add `pinentry-program /usr/local/bin/pinentry-mac` to `~/.gnupg/gpg-agent.conf`

### Passphrase prompt on every commit (GPG)
Cache in GPG agent — edit `~/.gnupg/gpg-agent.conf`:
```
default-cache-ttl 3600
max-cache-ttl 86400
```
Then: `gpg-connect-agent reloadagent /bye`

### Passphrase prompt on every commit (SSH)
Add key to SSH agent:
```bash
ssh-add ~/.ssh/id_ed25519
# On macOS, persist across reboots:
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

### `error: cannot run ssh-keygen`
OpenSSH not installed or not in PATH. Install it:
- Ubuntu: `sudo apt install openssh-client`
- macOS: should be pre-installed; check `which ssh-keygen`

### Commits show as "Unverified" on GitHub
- For SSH: make sure you added the key as a **Signing Key** (not just Authentication Key)
- For GPG: key email must match `git config user.email`; key must not be expired
- Check: `git log --show-signature -1` — if locally valid, the issue is the GitHub key registration

### Key expired (GPG)
```bash
gpg --edit-key <KEY_ID>
# At gpg> prompt:
expire          # extend the main key
key 1           # select subkey
expire          # extend the subkey
save
# Then re-export and update on GitHub
```

---

## Never bypass signing

Once signing is configured, never disable it to work around a failure:
```bash
# These are wrong — fix the underlying issue instead:
git commit --no-gpg-sign
git -c commit.gpgsign=false commit
```
A failed signing check is a signal — expired key, wrong key configured, agent not running. Diagnose and fix.
