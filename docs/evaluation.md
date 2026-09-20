# Evaluation protocol

## Verifier pipeline

`repair_bench/outputs/<instance_id>/tests/run.sh` is the single entry point for grading one
task. It executes the following stages against the source tree supplied as its first
argument:

1. **Resolve paths.** The repository root is derived from the script location; the source
   tree defaults to `seed_path` in `task.toml`; the verifier runtime is resolved to
   `evaluation/`.
2. **Supply dependencies.** Where the verifier manages dependencies itself, it restores a
   frozen archive or installs from the registry. Otherwise it requires `node_modules` to be
   present in the source tree.
3. **Clear the build output directory** recorded for the task, so a stale artifact cannot
   satisfy a checkpoint.
4. **Build** the project with the task's build command and environment.
5. **Serve** the build output over HTTP with `evaluation/serve_static.mjs`. 12 tasks use a
   task-specific static server or API stub from their own `tests/` directory.
6. **Execute checkpoints** with `evaluation/dsl_runner.mjs`, which drives a headless
   Chromium through every checkpoint in `tests/dsl.json` in an isolated browser context.
7. **Partition and score** the checkpoint verdicts against `tests/f2p_expected.json` and
   `tests/p2p_expected.json`, and write `${LOGS_DIR}/reward.json`.

## Scoring

```
f2p_rate = passed_F2P / total_F2P
p2p_rate = passed_P2P / total_P2P
score    = 100 x f2p_rate x p2p_rate
reward   = 1 if no checkpoint failed else 0
```

The score is the product of the two pass rates, not their average. A repair that fixes
every reported defect but regresses previously working behaviour is therefore penalised
multiplicatively. `reward` is the binary all-or-nothing outcome and matches
`expected_oracle_reward` in `task.toml` only for a complete repair.

`${LOGS_DIR}/reward.json`:

```json
{
  "f2p": {"expected": 14, "passed": 12, "failing": ["CP-F07", "CP-F11"], "rate": 0.8571},
  "p2p": {"expected": 12, "passed": 12, "failing": [], "rate": 1.0},
  "score": 85.71,
  "reward": 0.0
}
```

Fifty tasks additionally emit a `verifier_exit_code` field, always computed as
`0 if reward == 1.0 else 1`. Twenty-one of those tasks return the runner status rather than this
value, so for them the field can disagree with the status the script actually exits with.
Two tasks emit a variant of this record, `repair-angular__ng-lite-todo-01` and
`repair-svelte__8mb.local-01`; the differences are tabulated in
[quality-assurance.md](quality-assurance.md#known-deviations).

### Exit statuses

| Status | Meaning |
|---|---|
| 0 | Every F2P and P2P checkpoint passed (`reward` 1, `score` 100) |
| 1 | At least one checkpoint failed; `reward.json` records the partial score |
| 2 | Verifier or build error: the project did not build, produced no output, or the server did not become ready. No partial score is awarded. 30 tasks also convert a mid-run browser crash to this status |
| 3 | Dependency supply failed. An `exit 3` path exists in the `tests/run.sh` of 4 tasks only; the other 296 verifiers never emit it |
| 4 | The browser process was killed mid-run. Remaining checkpoints are recorded as `infra_crash` and `runner_crashed` is written into `checkpoint_results.json`. Returned by the 32 tasks that propagate the runner status |

An exit status of 2 is recorded as a build failure and scores 0. Intermediate logs
(`build.log`, `serve.log`, `runner-stdout.txt`, `checkpoint_results.json`,
`exit-code.txt`) are written to `${LOGS_DIR}`.

Of the 300 verifiers, 32 can return status 4, 30 convert that condition to status 2, and 238
derive the exit status from `reward` alone and do not distinguish a browser-process crash from
an ordinary checkpoint failure. How each task derives its status, and how to detect a crash
reliably, are described in
[quality-assurance.md](quality-assurance.md#derivation-of-the-exit-status).

## Grading a task

The quick start in the [README](../README.md#quick-start) gives the full sequence for one task.
Grading itself is a single command:

```bash
bash repair_bench/outputs/<instance_id>/tests/run.sh <working_copy>
```

Without the working-copy argument the verifier grades `seed_path` directly and modifies that
tree.

### Oracle validation

The reference repair must score 100. To check one task:

```bash
ROOT=$(pwd)
TASK=repair-vanilla__svgedit-01
rm -rf /tmp/oracle && mkdir -p /tmp/oracle
cp -R repo/vanilla/svgedit /tmp/oracle/svgedit
git -C /tmp/oracle/svgedit init -q
git -C /tmp/oracle/svgedit add -A
git -C /tmp/oracle/svgedit commit -qm base
git -C /tmp/oracle/svgedit apply "$ROOT/repair_bench/outputs/$TASK/solution/gold.patch"
bash "repair_bench/outputs/$TASK/tests/run.sh" /tmp/oracle/svgedit
```

The expected outcome is exit status 0 and `score` 100, matching `validation/oracle.json`.
Running the verifier against an unmodified copy of the seed tree must instead produce exit
status 1 with every F2P checkpoint failing, matching `validation/mutation.json`. 12 tasks
deviate from that expectation in the shipped records, 11 of them by exactly one checkpoint;
they are listed in [task-format.md](task-format.md#validation-records).

## Build constraints

Prerequisites and the verifier-runtime installation command are listed in the
[README](../README.md#requirements). Individual tasks impose further constraints at build time,
for example `NODE_OPTIONS=--openssl-legacy-provider` for older Angular and webpack toolchains.
These are set inside each `tests/run.sh` and require no configuration.

## Dependency installation

Seed trees are distributed as source only; `node_modules` directories are not included.
`results/dependency-install.csv` records, for every task, the seed path, the directories
that require an installation, the package manager and how it was determined.

| Class | Tasks | Action required |
|---|---|---|
| `no-node-project` | 59 | None. The verifier serves the source tree directly |
| `verifier-installs` | 93 | None. The verifier restores or installs dependencies itself |
| `preinstalled-required` | 148 | Install dependencies into the seed tree before grading |

```bash
python3 tools/install_seed_deps.py --list                 # show the plan
python3 tools/install_seed_deps.py --task <instance_id>   # one task
python3 tools/install_seed_deps.py --all --jobs 4         # whole suite
```

The package manager is taken from the install command embedded in the task's verifier when one
exists, and otherwise from the lockfile in the install directory, in the order
`pnpm-lock.yaml`, `bun.lock`, `yarn.lock`, `package-lock.json`. Installation requires network
access. A verifier that installs dependencies itself does so only when the source tree has no
`node_modules`, with the exceptions recorded under
[Offline dependency tiers](#offline-dependency-tiers); preinstalling dependencies
therefore makes grading offline for all but those tasks.

### Offline dependency tiers

82 verifiers can supply dependencies from a build workspace instead of installing from the
registry: 78 from a frozen `node_modules` archive under `_build/tmp/` and 4 from a cached
`node_modules` directory under `_build/gates/`. Neither location is part of this distribution.

- For 78 of them the offline tier is consulted only when the source tree has no
  `node_modules`, so installing dependencies with `tools/install_seed_deps.py` satisfies the
  verifier.
- `repair-react__free-react-tailwind-admin-dashboard-01` has no such guard: when the archive is
  absent it runs `npm install` at grading time and therefore requires network access.
- 3 verifiers require their archive unconditionally, ignore any preinstalled `node_modules`
  and terminate with exit status 2 when it is absent: `repair-react__arcomage-hd-01`,
  `repair-react__crossnote-app-01` and `repair-react__ytubic-01`.

For these three, install dependencies first and then rebuild the archive at the path the
verifier expects:

```bash
python3 tools/install_seed_deps.py --task repair-react__ytubic-01
python3 tools/prepare_offline_tiers.py --task repair-react__ytubic-01
```

The rebuilt archive resolves dependency versions from the lockfile in the seed tree and may
differ in patch level from the archive used for the published reference results.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `WLB_APP_SRC` | `seed_path` from `task.toml` | Source tree to grade; overridden by the first positional argument |
| `WLB_EVAL_ROOT` | `<repository_root>/evaluation` | Verifier runtime location |
| `WLB_PORT` | per-task default | HTTP port used to serve the build output |
| `LOGS_DIR` | `/tmp/wlb-repair-logs` | Directory for logs and `reward.json` |

Individual verifiers accept further task-specific overrides, declared at the top of their
own `run.sh`. Set `LOGS_DIR` to a distinct directory per task when grading several tasks in
parallel, and set `WLB_PORT` to distinct values when verifiers run concurrently on one
host.

## Answering protocol

The answering stage is model-agnostic. The following conditions apply to a comparable run:

- The agent may read `repair_bench/outputs/<instance_id>/instruction.md` and its working
  copy of the seed tree. No other file in the task package may be exposed; the remaining
  files are verifier-side material, as tabulated in
  [task-format.md](task-format.md#package-layout).
- The agent works on a copy of the seed tree, never on `repo/` itself.
- There is no turn limit and no time limit. `agent.timeout_sec` is `0.0` for every task.
- The agent does not run the project's build, development server or test suite while
  answering. Root causes are identified by reading code.
- The repaired tree is graded by `tests/run.sh` without further modification.

`repair_bench/agent_template.py` is a minimal reference implementation. It exposes
`list_dir`, `read_file`, `write_file` and `finish` tools confined to the working copy and
drives a messages-style model endpoint. Point it at a different endpoint and model to
evaluate another system; the grading path is unchanged.

## Portability notes

- **Path resolution.** Each `tests/run.sh` derives the repository root as three levels
  above its own directory and expects `repo/` and `evaluation/` at that root. 38 verifiers
  instead search upward for a directory containing `evaluation/dsl_runner.mjs`.
  Both schemes resolve correctly in this layout; moving task packages or seed trees
  independently breaks them.
- **Build workspace references.** 84 verifiers reference `_build/` paths that belong to the
  build workspace used to produce the suite. That directory is not part of this distribution,
  and every reference to it is an optional supply tier except for the three archive-only
  verifiers. The only support file needed at grading time, `http-parser-shim.js`, ships inside
  `repair_bench/outputs/repair-angular__idlespace-01/tests/` and lets that Angular 8 workspace
  build under a modern Node runtime.
- **Source tree mutation.** Grading deletes the recorded build output directory and
  rebuilds inside the source tree. Grade a copy, and expect the working copy to be
  modified by the run.
- **Network access.** Grading a task whose dependencies are already present requires no
  network access. Seed applications were adapted to run offline;
  `environment/adaptation.patch` records the substitutions for the 257 tasks that needed
  them.
