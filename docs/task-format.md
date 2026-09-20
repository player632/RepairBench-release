# Task package format

Every task is a directory under `repair_bench/outputs/` named after its instance
identifier, for example `repair-vanilla__svgedit-01`. The identifier encodes the framework
and the seed application: `repair-<framework>__<application>-<index>`.

## Package layout

| Path | Role | Exposed to the agent |
|---|---|---|
| `task.toml` | Machine-readable task descriptor | No |
| `instruction.md` | Fault report given to the agent | **Yes** |
| `environment/adaptation.patch` | Offline adaptation applied to the upstream seed | No |
| `environment/instrumentation.patch` | Read-only measurement probes applied to the seed | No |
| `environment/mutation.patch` | Injected defects | No |
| `solution/gold.patch` | Reference repair | No |
| `tests/run.sh` | Verifier entry point | No |
| `tests/dsl.json` | Checkpoint definitions executed against the running application | No |
| `tests/f2p_expected.json` | Identifiers of the fail-to-pass checkpoints | No |
| `tests/p2p_expected.json` | Identifiers of the pass-to-pass checkpoints | No |
| `tests/serve_*.mjs`, `tests/mock_api.mjs` | Task-specific static server or API stub (12 tasks) | No |
| `tests/http-parser-shim.js` | Node compatibility shim needed to build the project (1 task) | No |
| `validation/baseline.json` | Checkpoint results for the repaired reference state | No |
| `validation/mutation.json` | Checkpoint results for the delivered defective state | No |
| `validation/oracle.json` | Checkpoint results for the seed tree with `solution/gold.patch` applied | No |

The only inputs an answering agent may read are `instruction.md` and its working copy of
the seed tree. Every other file in the package, and the whole of `tests/`, `solution/`,
`environment/` and `validation/`, is verifier-side material and reveals defect locations
and expected behaviour.

`environment/adaptation.patch` is absent for the 43 tasks whose seed application already runs
offline without modification. The remaining files are present for all 300 tasks.

## `task.toml`

```toml
schema_version = "1.0"

[metadata]
benchmark = "RepairBench"
instance_id = "repair-vanilla__svgedit-01"
repository = "vanilla/svgedit"
framework = "vanilla"
language = "javascript"
category = "repair"
task_kind = "repair"
seed_path = "repo/vanilla/svgedit"
base_state = "seed original with ... applied; defects injected per environment/mutation.patch."
tags = ["repair", "repair-bench", "vanilla", "defect_type:...", ...]
expected_nop_exit_code = 1
expected_oracle_exit_code = 0
expected_nop_reward = 0.0
expected_oracle_reward = 1.0

[verifier]
timeout_sec = 1500.0

[agent]
timeout_sec = 0.0

[environment]
cpus = 4
memory_mb = 6144
storage_mb = 4096
allow_internet = false
```

| Field | Meaning |
|---|---|
| `instance_id` | Unique task identifier, equal to the package directory name |
| `repository` | Seed provenance label: the upstream `owner/name` slug for 113 tasks, a `<framework>/<name>` label for the remaining 187 |
| `framework` | One of `vanilla`, `react`, `angular`, `vue`, `svelte`, `solid` |
| `seed_path` | Location of the delivered source tree, relative to the repository root |
| `base_state` | Derivation of the delivered tree from the upstream seed |
| `tags` | Application technologies, plus `defect_type:<mechanism>` tags classifying the injected defects: 3406 `defect_type:` tags over the 300 tasks, 3057 of them distinct. Three tasks (`repair-angular__ngx-widget-grid-01`, `repair-angular__sakai-ng-01`, `repair-vanilla__toaster-01`) carry none |
| `expected_nop_exit_code`, `expected_nop_reward` | Verifier outcome for the unrepaired tree: exit 1, reward 0 |
| `expected_oracle_exit_code`, `expected_oracle_reward` | Verifier outcome for the reference repair: exit 0, reward 1 |
| `verifier.timeout_sec` | Upper bound for one grading run |
| `agent.timeout_sec` | Answering budget; `0.0` denotes no limit |
| `environment.*` | Resource envelope in which the task was graded |

## Seed tree state

Seed trees are located at `repo/<framework>/<name>/`. The `seed_path` field in
`task.toml` is authoritative.

The tree at `seed_path` is the state handed to the agent. It is the upstream snapshot with
three patches applied in order:

1. `environment/adaptation.patch` — removes network dependencies so the application runs
   offline: external fonts, remote APIs, telemetry and live endpoints are replaced by
   local fixtures or stubs.
2. `environment/instrumentation.patch` — adds a read-only measurement surface, typically
   `data-testid` attributes and a namespaced probe object on `window`. The probe only
   exposes DOM and application state that a user could observe; it performs no writes and
   contains no defect-specific logic.
3. `environment/mutation.patch` — injects the defects.

`solution/gold.patch` is the exact inverse of `environment/mutation.patch` restricted to the
application sources; applying it to the delivered tree restores correct behaviour.

Two properties hold for all 300 tasks and can be re-checked locally:

- `solution/gold.patch` applies cleanly to the delivered tree.
- `environment/mutation.patch` reverse-applies cleanly to the delivered tree, confirming
  that the tree carries the injected defects.

```bash
cd repo/vanilla/svgedit
git apply --check ../../../repair_bench/outputs/repair-vanilla__svgedit-01/solution/gold.patch
git apply --check -R ../../../repair_bench/outputs/repair-vanilla__svgedit-01/environment/mutation.patch
```

Seed trees contain source only; dependency installation is described in
[evaluation.md](evaluation.md#dependency-installation). Licence coverage and the recorded
upstream repository of each tree are summarised in the
[README](../README.md#third-party-code) and in `results/seed-provenance.csv`.

## `instruction.md`

The statement is written as a fault report from the application's user. It follows a
consistent structure:

- problems the reporter is certain about, each described by observable behaviour and the
  interaction that reproduces it;
- observations the reporter is unsure about, which may be correct existing behaviour;
- a general request to review the remaining functionality;
- an explicit declaration, present in all 300 statements, that the report does not cover
  every defect and that regressions introduced during the repair are penalised;
- in 129 of the 300 statements, a note that the agent must not run the project's build,
  development server or tests while answering.

Statements describe behaviour at the user level and never name source files, functions or
defects that are not part of the report.

Defect identifiers and the reported/unreported split are recorded per task in
`results/task-index.csv`.

## Checkpoint DSL

`tests/dsl.json` declares an ordered list of checkpoints. Each checkpoint runs in an
isolated browser context against the served application and consists of a `setup` action
sequence followed by one or more assertions.

Frequently used setup actions: `goto`, `wait`, `click`, `fill`, `press`, `hover`, `drag`,
`select`, `mouse`, `reload`, `js_eval`, `script`, `count-requests`.

Frequently used assertion types: `js_eval`, `text`, `exists`, `visible`, `value`, `count`,
`url`, `url-contains`, `attribute`, `class-contains`, `disabled`, `order`, `storage`,
`storage-keys-whitelist`, `storage-json-key`, `pages-count`, `request-count`.

Locators resolve through `data-testid` attributes installed by
`environment/instrumentation.patch`; role-based and wildcard locators are also supported.
Assertions compare observable state only, so no checkpoint depends on wall-clock values or
on absolute timings.

The authoritative partition of checkpoints is given by `tests/f2p_expected.json` and
`tests/p2p_expected.json`, which the verifier reads at grading time. The `partition` field
inside `dsl.json` is descriptive: it is absent for every checkpoint in 21 tasks, and in 12
further tasks it names a partition other than the one the expected files assign. The
remaining 267 tasks agree throughout. Where the two disagree, the expected files govern.

The verifier executes every checkpoint declared in `tests/dsl.json` and scores only those
listed in the two expected files. Four tasks declare one checkpoint that appears in neither
list; such a checkpoint is still executed and still recorded in `validation/`, but it
contributes to neither pass rate.

| Instance | Executed but not scored |
|---|---|
| `repair-angular__skinet-01` | `F08` |
| `repair-angular__tugtainer-01` | `F11` |
| `repair-react__learn-react-app-01` | `F06` |
| `repair-react__ant-design-pro-01` | `CP-ALL-TAIL` |

In the first three, the unscored checkpoint is labelled F2P in `dsl.json`, which therefore
declares 12 F2P checkpoints against a scored list of 11. It is excluded from scoring
because its assertion requires an exact restored value that is not derivable from the
information available to the solver. The underlying defect remains part of the task: the
checkpoint still fails in the delivered state and passes in the oracle state.
`CP-ALL-TAIL` is an isolation probe of kind `policy`; it is not associated with a defect and
passes in all three validation states.

## Validation records

`validation/` holds the checkpoint results measured at build time for three states of the
task:

| File | State | Expected outcome |
|---|---|---|
| `baseline.json` | Upstream seed with adaptation and instrumentation, no injected defects | All checkpoints pass |
| `mutation.json` | Delivered tree (the task state) | Every F2P checkpoint fails, every P2P checkpoint passes |
| `oracle.json` | Delivered tree with `solution/gold.patch` applied | All checkpoints pass |

Each file contains a `summary` block and a `checkpoint_results` array with the identifier,
status, failure type and duration of every checkpoint. These records demonstrate that the
checkpoint set discriminates between the defective and the repaired state, and they can be
reproduced by running the verifier against each state.

Measured over the shipped records:

- `baseline.json` — every checkpoint passes in all 300 records.
- `oracle.json` — every checkpoint passes in all 300 records.
- `mutation.json` — every F2P checkpoint fails and every P2P checkpoint passes in 288 of
  the 300 records. The 12 records listed below deviate: 11 of them by exactly one
  checkpoint, and `repair-react__pacman-react-01` by two.

| Instance | Checkpoint passing in the defective state | Checkpoint failing in the defective state |
|---|---|---|
| `repair-angular__angular-tetris-01` | `CP-21` (F2P) | — |
| `repair-angular__casual-chess-01` | — | `CP-P08` (P2P) |
| `repair-angular__ng-alain-01` | — | `CP-39` (P2P) |
| `repair-react__drawdb-01` | `CP-30` (F2P) | — |
| `repair-react__dunno-01` | `CP-04` (F2P) | — |
| `repair-react__mochord-01` | `F05` (F2P) | — |
| `repair-react__pacman-react-01` | `F10`, `F10b` (F2P) | — |
| `repair-vanilla__minipaint-01` | `CP-74` (F2P) | — |
| `repair-vanilla__piskel-01` | `CP-25` (F2P) | — |
| `repair-vanilla__svgomg-01` | `CP-30` (F2P) | — |
| `repair-vue__vue-color-avatar-01` | `CP-23` (F2P) | — |
| `repair-vue__vue-crypto-dashboard-01` | `CP-24` (F2P) | — |

An F2P checkpoint that passes in the defective state does not contribute to the achievable
score range for that defect; a P2P checkpoint that fails in the defective state is a
regression already present in the delivered tree. Both cases are recorded here so that a
locally reproduced run can be compared against the shipped record without ambiguity.

These three records are the evidence for requirements 1, 2, 4 and 5 in
[quality-assurance.md](quality-assurance.md), which lists all twelve requirements every task
was verified against at build time, reconciles the corpus-wide totals against these records,
and records the deviations and limitations that remain.
