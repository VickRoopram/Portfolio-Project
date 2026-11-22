# Git workflow: rules, checklists, process and constraints

> **Who this is for:** anyone (person or AI assistant) who changes this repo. Read it before your first push.
> **Status:** adopted 19 Nov 2026. Owner: Vick. Change this file through a PR like any other change.
> Every rule below links to the source it rests on (§10), so it can be checked.

---

## 1. The setup in one table

| Branch                              | Role                                                                               | GitHub Environment | Deployed by                               | URL                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------- | ------------------ | ----------------------------------------- | ---------------------------------------------------- |
| `main`                              | **Production.** What visitors see. Changes only by merging a PR from `version-01`. | `production`       | Netlify (production context)              | https://vick-does-creative.netlify.app               |
| `version-01`                        | **Staging.** Where features are tested and reviewed before release.                | `staging`          | Netlify (branch deploy)                   | https://version-01--vick-does-creative.netlify.app   |
| `feat/…` `fix/…` `copy/…` `chore/…` | Short-lived work branches, cut from `version-01`.                                  | none               | Netlify Deploy Preview, when a PR is open | `deploy-preview-<n>--vick-does-creative.netlify.app` |

**Hosting is Netlify, not GitHub Pages.** GitHub runs checks (CI) and keeps the deploy record. Netlify builds and publishes. [S1][S2][S3]

```
feat/my-change ──PR──▶ version-01 (staging) ──PR──▶ main (production)
      ▲                      │                          │
      └── cut from ──────────┘                          └── after release: version-01 fast-forwards to main
```

---

## 2. Incident record: "Get Pages site failed" (19 Nov 2026)

**Symptom.** Every push to `main` showed a red ✗ in GitHub Actions:
`actions/configure-pages@v5 … Error: Get Pages site failed … Not Found`.

**Evidence (checked, not assumed).**

- `.github/workflows/pages.yml` ran on every push to `main`. It deployed to GitHub Pages with `enablement: false` (the default).
- The repository API reported `has_pages: false`. Pages had never been switched on.
- The last 8 runs of "Deploy to GitHub Pages" all failed in about 10 s at `configure-pages`.
- Netlify's production deploy of the same commit (`bf1c97d`, 17 Nov 2026 10:47 UTC) was `ready`, context `production`, from git. **Pushes were landing and going live. Only the unused Pages job failed.**
- `version-01` and `main` were identical (0 commits apart). Work was going straight to `main`, skipping staging.
- The repo's "Main Branch" ruleset existed but had enforcement **Disabled**, so nothing stopped direct pushes.

**Root cause.** A leftover GitHub Pages workflow (from the project's first setup) was looking for a Pages site that didn't exist. `configure-pages` only _tries_ to enable Pages when `enablement: true`, and that needs a token with admin or Pages-write scope. The default `GITHUB_TOKEN` can't do it. [S4][S5]

**Fix.**

1. Removed `pages.yml` and `.nojekyll`. Netlify is the host. A second host on Pages couldn't run `/admin` or the Netlify Functions anyway.
2. Added `.github/workflows/ci.yml`: a `checks` job on every PR and push, and a smoke test after each deploy to `main` or `version-01`, recorded in the `production` / `staging` Environments.
3. Turned on enforcement for `main` (ruleset, §6), plus local guards (git hooks, VS Code prompt).

**Not done, and why.** We didn't enable Pages. It would be a second public copy of the site, with a broken admin and no functions.

---

## 3. Rules (constraints)

**MUST**

1. Start every change on a new branch cut from `origin/version-01`. Name it `feat/…`, `fix/…`, `copy/…` or `chore/…`: short, lowercase, hyphens. [S9]
2. Change `version-01` through a PR from your branch (recommended), or by merging locally after `npm run check` passes.
3. Change `main` **only** by merging a PR whose head is `version-01`. Use **"Create a merge commit"**, never squash or rebase (see constraint C3).
4. Have the `checks` status green before merging anything. [S7]
5. Review the staging URL in a browser before opening the release PR (§5.3 checklist).
6. After a release, fast-forward `version-01` to `main` (§5.4).
7. Keep media web-sized: under 10 MiB per file, never 50 MiB or more. Originals live in Google Drive (_Synth Elementa_). [S11]

**MUST NOT**

1. Commit or push to `main` directly, force-push to `main` or `version-01`, or delete either branch.
2. Commit secrets (`.env`, keys, passwords). The admin password lives in Netlify Blobs, never in git.
3. Rename the `checks` job in `ci.yml`. The ruleset requires that exact name. [S8]
4. Re-add a GitHub Pages workflow without enabling Pages first (see §2).

**Constraints to know**

- **C1. Netlify deploys outside GitHub Actions.** GitHub Environment approvals can only gate Actions jobs. They can't stop Netlify publishing. So the human gate for production is the **PR merge into `main`**. The `production` environment records and smoke-tests the deploy; it doesn't approve it. [S6]
- **C2. Solo account.** You can't approve your own PR, so required approvals stay at **0**. The PR itself, the green `checks` and your staging review are the gate. If a second GitHub account joins, raise it to 1. [S7]
- **C3. Long-lived staging branch.** Squash or rebase merges into `main` rewrite commits, so `version-01` and `main` drift apart and the next PR shows old changes again. Merge commits plus the post-release fast-forward keep them in step.
- **C4. Content isn't in git.** Copy, projects and images edited in `/admin` live in Netlify Blobs (_Update preview_ → staging, _Publish to live_ → production). They don't go through this git flow. See `docs/HANDOFF.md` §0.
- **C5. Environments on a free plan.** Available because the repo is **public**. Making it private on GitHub Free would remove them. [S6]

---

## 4. Guardrails: what catches what

| Layer                          | Where                                                                         | What it stops                                                                                                                                                              | Bypass                                     |
| ------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| VS Code branch protection      | `.vscode/settings.json` (`git.branchProtection: ["main"]`)                    | Asks before committing on `main` and offers a new branch [S10]                                                                                                             | Click "Commit anyway"                      |
| Git hooks                      | `.githooks/pre-commit`, `.githooks/pre-push` (`npm run setup` once per clone) | Commits on `main`, pushes to `main`, pushes that fail `npm run check` [S12]                                                                                                | `--no-verify` (emergencies only)           |
| CI `checks`: repo checks       | `ci.yml` → `scripts/ci-check.mjs`                                             | JS syntax errors, imports or `src`/`href` pointing at missing files (the "screens don't load" class of bug), conflict markers, files ≥ 50 MiB, committed secrets, bad JSON | None. Fix the problem.                     |
| CI `checks`: Netlify Functions | `ci.yml` → `scripts/ci-functions.mjs`                                         | A function in `netlify/functions` that won't load on Node 24 (Netlify's runtime), a broken `netlify/lib` import, or a missing handler or route                             | None                                       |
| CI `checks`: dependencies      | `npm audit --omit=dev --audit-level=high`                                     | Known high or critical vulnerabilities in the Functions' npm packages                                                                                                      | None                                       |
| CI `checks`: workflow lint     | actionlint 1.7.12 [S15]                                                       | Mistakes in workflow files (bad expressions, unknown properties, shell bugs), shown on the line                                                                            | None                                       |
| CI `checks`: workflow security | zizmor 1.32.0 [S16]                                                           | Unpinned actions, over-broad token permissions, script injection, credential leaks in workflows                                                                            | None                                       |
| Ruleset "Main Branch"          | GitHub → Settings → Rules                                                     | Direct pushes, force-pushes, deletion of `main`; merging with red checks [S7][S8]                                                                                          | Disable the ruleset temporarily (admin)    |
| Smoke test (`deploy` job)      | `ci.yml` → `scripts/smoke-check.mjs`                                          | A deploy Netlify didn't publish, or `/`, `/src/main.js`, `/src/styles.css`, `/admin/` not returning 200                                                                    | Not applicable. It reports after the fact. |
| Dependabot                     | `.github/dependabot.yml`                                                      | Out-of-date or vulnerable actions and npm packages. Opens a weekly grouped PR into `version-01`, 7 days after a release [S14][S17]                                         | Close the PR                               |
| Environments                   | GitHub → Settings → Environments                                              | Records each staging/production deploy with its URL. Only `main` can deploy to `production`, only `version-01` to `staging` [S6]                                           | Not applicable                             |

---

## 5. Process and checklists

### 5.1 Start a change

VS Code: **Terminal → Run Task → "1. Start work: new branch from version-01"**, or:

```bash
git fetch origin
git switch -c feat/short-name origin/version-01
```

- [ ] Branch cut from `origin/version-01` (not `main`, not an old local branch)
- [ ] Name is `feat/` `fix/` `copy/` or `chore/` + 2–4 words

### 5.2 Before you push (author)

- [ ] `npm run dev` and check the change at http://localhost:8888 (desktop and phone width)
- [ ] `npm run check` passes (the pre-push hook runs it too)
- [ ] Commit messages say _what changed and why_, one change per commit [S9]
- [ ] No files ≥ 10 MiB unless they're intended web media; no `.env`
- [ ] Push the branch, open a PR **into `version-01`**, wait for `checks` ✓, merge

### 5.3 Staging review (human fact-check) on https://version-01--vick-does-creative.netlify.app

- [ ] The `staging smoke test` job is green (Actions tab, or the `staging` environment on the repo home page)
- [ ] Hard refresh (Cmd+Shift+R). The change is there.
- [ ] Desktop: intro → Enter, synth loads, menu, a project card, Play mode, Bleep
- [ ] Phone (upright and sideways): office view loads; Play works when turned
- [ ] `/admin` signs in. _Update preview_ content shows on staging.
- [ ] Browser console has no new red errors
- [ ] Copy matches `docs/BRAND.md`

### 5.4 Release to production

1. GitHub → **Pull requests → New** → base `main` ← compare `version-01`. Title: `Release: <summary>`. List what changed.
2. Netlify posts a Deploy Preview on the PR. Click it for a last look.
3. `checks` ✓ → **Create a merge commit** → confirm.
4. Watch **Actions → CI → production smoke test** go green (usually under 2 minutes).
5. Keep staging in step:
   ```bash
   git fetch origin
   git switch version-01 && git merge --ff-only origin/main && git push origin version-01
   ```
6. If content changed in `/admin`, also click **Publish to live** there.

### 5.5 A check failed: find the fault in under a minute

1. On the PR, the failing check has a red ✗. Click **Details**.
2. The run's **Summary** page shows a table of every check and every problem, with file and line. [S18]
3. The PR's **Files changed** tab shows each problem as an annotation on the exact line. [S18]
4. Every step runs even after one fails, so a single run lists everything to fix.
5. Fix locally, run `npm run check` (and `npm run check:functions` after `npm ci` if you touched `netlify/`), then push again. The PR re-runs automatically.

_Tested 20 Nov 2026 with a deliberate-fault PR (#6): a syntax error, a missing import and a workflow bug were each annotated at the right file and line in one run._

### 5.6 Something broke in production (rollback)

- **Fastest (seconds):** Netlify → Deploys → pick the last good production deploy → **Publish deploy**. This publishes the old build without touching git. Then fix forward through the normal flow. [S3]
- **In git:** on a branch from `version-01`, `git revert -m 1 <release-merge-sha>`, then PR → `version-01` → PR → `main`.
- **Hotfix that can't wait for staging:** branch from `main`, PR straight into `main` (checks still required), then merge `main` back into `version-01`.

---

## 6. GitHub and Netlify settings (exact values)

Apply these in the browser as the repo owner. Each is a one-time setting.

### 6.1 Ruleset "Main Branch" (Settings → Rules → Rulesets → Main Branch)

| Setting                               | Value                                                                                                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enforcement status                    | **Active** (was Disabled) [S8]                                                                                                                                               |
| Bypass list                           | empty                                                                                                                                                                        |
| Target branches                       | Default branch (`main`)                                                                                                                                                      |
| Restrict creations                    | off                                                                                                                                                                          |
| **Restrict updates**                  | **off**. If on, nobody without bypass can update `main`, including PR merges. [S7]                                                                                           |
| Restrict deletions                    | on                                                                                                                                                                           |
| Require a pull request before merging | on · required approvals **0** (C2) · allowed merge methods: **Merge** only (C3)                                                                                              |
| Require status checks to pass         | on · add **`checks`** (source: GitHub Actions) · "Require branches to be up to date" **off** (main only moves via `version-01`, and §5.4 step 5 keeps them in step) [S7][S8] |
| Block force pushes                    | on                                                                                                                                                                           |

### 6.2 Ruleset "Staging" (new, target `version-01`)

Restrict deletions **on** · Block force pushes **on**. Nothing else, so the designer can still merge locally into `version-01`. (Requiring status checks here would reject every direct push, because a fresh commit has no check result yet.) [S7]

### 6.3 Environments (Settings → Environments)

| Environment    | Deployment branches and tags        | Notes                                                          |
| -------------- | ----------------------------------- | -------------------------------------------------------------- |
| `production`   | Selected branches: **`main`**       | Created automatically by the first CI run on `main` [S6]       |
| `staging`      | Selected branches: **`version-01`** | Created automatically by the first CI run on `version-01` [S6] |
| `github-pages` | **Delete**                          | Leftover from the old Pages workflow                           |

No required reviewers: they would only pause the smoke test, not Netlify (C1).

### 6.4 Security and housekeeping (Settings → General, and Settings → Advanced Security)

| Setting                                                      | Value  | Why                                                                                                                            |
| ------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Automatically delete head branches (General → Pull Requests) | **on** | Merged work branches disappear, so the branch list shows only live work. Rulesets still protect `main` and `version-01`. [S19] |
| Dependabot alerts and security updates                       | **on** | Currently off. Needed for Dependabot to raise vulnerability PRs. [S14]                                                         |
| Secret scanning + push protection                            | **on** | Free on public repos. Blocks a push that contains a known secret type. [S20]                                                   |

### 6.5 Netlify (Project configuration → Build & deploy → Continuous deployment → Branches and deploy contexts) [S2][S3]

| Setting           | Value                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| Production branch | `main`                                                                   |
| Branch deploys    | Let me add individual branches: **`version-01`**                         |
| Deploy Previews   | Any pull request against your production branch / branch deploy branches |

---

## 7. VS Code setup (once per machine)

1. Open the repo folder. Accept the recommended extensions: **GitHub Pull Requests**, **GitHub Actions**, **EditorConfig** (`.vscode/extensions.json`).
2. Run Task → **"Turn on git hooks (once per clone)"**, or `npm run setup`.
3. Status bar, bottom left: check the branch name before you commit. On `main`, VS Code asks first.
4. Review PRs and watch CI from the GitHub sidebar. No need to leave the editor.

---

## 8. Rules for AI assistants working in this repo

- Never push to `main`. Push a work branch, merge into `version-01` (or open a PR into it), then open a PR `version-01 → main` for Vick to merge. A request to "push to main" means: make sure it's on staging and open the release PR.
- Run `node scripts/ci-check.mjs` before every push and report its result.
- Keep every `uses:` pinned to a full commit SHA with its version as a comment. Never `@main`, `@latest` or a bare tag.
- Keep `permissions: contents: read` at the top of workflows; grant more per job, only if a job needs it.
- Never put `${{ github.event.* }}` or branch or PR names straight into a `run:` script. Pass them through `env:`. [S14]
- Don't change rulesets, environments or Netlify settings without asking. Confirm before each save.
- Back up any claim about GitHub, Netlify or VS Code behaviour with a link from §10, or check the live docs.
- Ask when context is missing rather than guessing.

---

## 9. Changelog

| Date        | Change                                                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 19 Nov 2026 | Pages workflow removed; CI + smoke test + Environments added; ruleset and local guards defined; this document created.                                                                  |
| 20 Nov 2026 | CI hardened: actions pinned to SHAs, Node 24, Functions load test, npm audit, actionlint, zizmor, file/line annotations and run summaries; Dependabot; PR template; fault drill passed. |

---

## 10. Sources (checked 19–20 Nov 2026)

- **[S1]** GitHub Docs, _Configuring a publishing source for your GitHub Pages site_: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- **[S2]** Netlify Docs, _Deploy overview_ (production branch, branch deploys, Deploy Previews, deploy contexts): https://docs.netlify.com/deploy/deploy-overview
- **[S3]** Netlify Docs, _Branch deploys_ (URL format `branch--site.netlify.app`, Branches and deploy contexts settings): https://docs.netlify.com/site-deploys/branch-deploys/
- **[S4]** `actions/configure-pages` README: https://github.com/actions/configure-pages
- **[S5]** `actions/configure-pages` `action.yml` (`enablement` defaults to `false` and needs a token other than `GITHUB_TOKEN`): https://github.com/actions/configure-pages/blob/main/action.yml
- **[S6]** GitHub Docs, _Managing environments for deployment_ (public repos on all plans; deployment branches; required reviewers gate jobs; a workflow referencing a missing environment creates it): https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
- **[S7]** GitHub Docs, _Available rules for rulesets_ (restrict updates, require PR, required status checks, block force pushes): https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- **[S8]** GitHub Docs, _About rulesets_ (Active / Disabled enforcement, bypass list): https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets · _Troubleshooting rules_ (status check names): https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/troubleshooting-rules
- **[S9]** GitHub Docs, _GitHub flow_ (branch → commit → PR → review → merge → delete branch): https://docs.github.com/en/get-started/using-github/github-flow
- **[S10]** VS Code 1.68 release notes, _Git: Branch protection_ (`git.branchProtection`, `git.branchProtectionPrompt`): https://code.visualstudio.com/updates/v1_68
- **[S11]** GitHub Docs, _About large files on GitHub_ (warning at 50 MiB, blocked at 100 MiB): https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- **[S12]** Git documentation, _githooks_ (`pre-commit`, `pre-push`, `core.hooksPath`): https://git-scm.com/docs/githooks
- **[S13]** GitHub Docs, _Workflow syntax_, `jobs.<job_id>.environment` (`name`, `url`): https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- **[S14]** GitHub Docs, _Secure use reference_ (pin actions to a full-length commit SHA; read-only `GITHUB_TOKEN` by default; pass untrusted input through an environment variable; Dependabot for actions): https://docs.github.com/en/actions/reference/security/secure-use
- **[S15]** actionlint usage (running in GitHub Actions, problem matcher for annotations): https://github.com/rhysd/actionlint/blob/main/docs/usage.md
- **[S16]** zizmor usage (`--format=github`, `--min-severity`, exit codes): https://docs.zizmor.sh/usage/
- **[S17]** GitHub Docs, _Dependabot options reference_ (`cooldown`, `groups`, `target-branch`): https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference
- **[S18]** GitHub Docs, _Workflow commands_ (`::error file=…,line=…` annotations; `GITHUB_STEP_SUMMARY` job summaries): https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands
- **[S19]** GitHub Docs, _Managing the automatic deletion of branches_: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches
- **[S20]** GitHub Changelog, _Secret scanning's push protection is available on public repositories, for free_ (9 May 2023): https://github.blog/changelog/2023-05-09-secret-scannings-push-protection-is-available-on-public-repositories-for-free
- **[S21]** Release notes for the pinned actions: https://github.com/actions/checkout/releases · https://github.com/actions/setup-node/releases
