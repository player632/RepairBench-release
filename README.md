# RepairBench

RepairBench is a benchmark for evaluating large language models on realistic front-end
repair work. Each task presents an agent with a complete, buildable web application that
carries a set of injected defects, together with a user-written fault report that
describes only part of the observable breakage. The agent must locate the root causes in
the source tree and repair them. Grading is fully automated: the verifier builds the
project, serves the build output, drives a headless browser through a fixed checkpoint
script and scores the result.

The suite contains **202 tasks** across six front-end technology stacks, each built on a
distinct front-end application. Every task is self-contained and can be graded
independently.

## Suite composition

| Framework | Tasks |
|---|---|
| Vanilla (no framework) | 50 |
| React | 39 |
| Angular | 36 |
| Vue | 34 |
| Svelte | 26 |
| Solid | 17 |
| **Total** | **202** |

Implementation language is TypeScript for 111 tasks and JavaScript for 91 tasks. Task
statements are written in English for 143 tasks; the remaining 59 are written in Chinese
or are bilingual. Applications span dashboards, editors, games, media tools and
productivity utilities, and range from dependency-free static sites to monorepo builds.

## Task characteristics

| Property | Median | Range |
|---|---|---|
| Injected defects per task | 12 | 10 – 17 |
| Reference repair, files touched | 9 | 1 – 13 |
| Reference repair, changed lines | 27 | 18 – 139 |
| Grading checkpoints per task | 31.5 | 21 – 87 |
| Verifier timeout | 1140 s | 780 – 3600 s |

The suite records 2402 injected defects; 199 of the 202 tasks carry a defect ledger. Of the
2037 defects labelled as reported or unreported, 55.0% are named in the fault report and
45.0% are not. Per-task figures are recorded in `results/task-index.csv`.

Three properties define the difficulty of the suite:

- **Partial fault reports.** Every statement declares that its report is incomplete, so an
  agent that repairs only the reported symptoms cannot obtain a full score.
- **Regression pressure.** Checkpoints are partitioned into fail-to-pass (F2P) and
  pass-to-pass (P2P) sets, and the score is the product of the two pass rates, so a repair
  that breaks previously working behaviour is penalised multiplicatively.
- **Behaviour-level grading.** Checkpoints drive a real browser and assert on observable
  application state. Scores do not depend on how a repair is written, and no credit is
  given for edits that do not change behaviour.

## Reference results

Two models were graded on the complete suite with the shipped verifier. The mean task score is
`100 x F2P_rate x P2P_rate`; a build failure scores 0.

| Model | Mean | Median | Submissions that built | Mean F2P rate | Mean P2P rate |
|---|---|---|---|---|---|
| `qwen3.8-max` | 48.34 | 50.00 | 200 / 202 | 0.505 | 0.917 |
| `qwen3.6-flash` | 37.65 | 41.67 | 186 / 202 | 0.402 | 0.804 |

Per-task scores, per-framework breakdowns and the score distribution are documented in
[docs/results.md](docs/results.md). Machine-readable results are in `results/`.

## Repository layout

```text
.
├── README.md                     this file
├── docs/
│   ├── task-format.md            task package layout and file reference
│   ├── evaluation.md             verifier pipeline, scoring and operating instructions
│   ├── quality-assurance.md      build-time requirements, measured results and deviations
│   └── results.md                reference evaluation results
├── repair_bench/
│   ├── outputs/<instance_id>/    202 task packages
│   └── agent_template.py         minimal reference answering agent
├── repo/                         202 seed source trees in their delivered (defective) state
├── evaluation/                   verifier runtime (static server and checkpoint runner)
├── results/                      reference results and derived indexes
└── tools/                        dependency installation and offline-tier helpers
```

Every `tests/run.sh` resolves the repository root from its own location and expects `repo/`
and `evaluation/` to be siblings of `repair_bench/`; task packages and seed trees must not be
relocated independently. Each seed tree ships as source only, without dependency directories
or framework build caches. Dependency installation is described in
[docs/evaluation.md](docs/evaluation.md#dependency-installation).

## Requirements

| Component | Requirement |
|---|---|
| Node.js | 20 or newer, with `npm` |
| Python | 3.9 or newer |
| Shell utilities | `bash`, `curl`, `tar`, `git` |
| Verifier runtime | `playwright` with a Chromium build, installed in the quick start below |
| Package managers | `npm`; `pnpm`, `yarn` or `bun` additionally for the seed trees whose lockfile requires them |
| Disk | 2.6 GB for this distribution, plus dependency and build storage per task |
| Network | Required to install dependencies. Grading runs offline once dependencies are present, with the exceptions listed in [docs/evaluation.md](docs/evaluation.md#offline-dependency-tiers) |

## Quick start

1. Install the verifier runtime:

   ```bash
   cd evaluation
   npm install
   npx playwright install chromium
   cd ..
   ```

2. Install the dependencies of the task to be graded:

   ```bash
   python3 tools/install_seed_deps.py --task repair-vanilla__svgedit-01
   ```

3. Create a working copy of the seed tree and let the agent repair it. The agent may read
   only `repair_bench/outputs/<instance_id>/instruction.md` and the working copy:

   ```bash
   cp -R repo/vanilla/svgedit /tmp/workspace/svgedit
   ```

4. Grade the repaired tree and read the score:

   ```bash
   bash repair_bench/outputs/repair-vanilla__svgedit-01/tests/run.sh /tmp/workspace/svgedit
   cat /tmp/wlb-repair-logs/reward.json
   ```

Grading is independent of the answering layer: any agent that edits the working copy is scored
by the same verifier. `repair_bench/agent_template.py` is a minimal reference implementation,
and [docs/evaluation.md](docs/evaluation.md) specifies the grading sequence, oracle validation
and the answering constraints. [docs/quality-assurance.md](docs/quality-assurance.md) records
the requirements every task was verified against at build time, the measured result for each,
and the deviations and limitations that remain.

## Third-party code

Each seed tree at `repo/<framework>/<name>/` is a complete front-end application. Every tree
retains the licence, copyright notices, README and package metadata published with it, and
those upstream terms govern the corresponding code.

| Licence information in the seed tree | Trees |
|---|---|
| Top-level `LICENSE`, `LICENCE` or `COPYING` file | 168 |
| `license` field in `package.json`, or a licence file in a subdirectory | 12 |
| No licence information present | 22 |

`results/seed-provenance.csv` records the upstream attribution of each tree: 184 trees carry an
upstream repository reference, 40 of them with the exact upstream commit, and 18 have no
recorded upstream. Attribution was established from the snapshot manifest (92 trees), from
package metadata (47) or from project documentation (45).

The task packages, the verifier runtime, the tooling and the documentation are provided by the
benchmark authors. No licence has been declared for these components.
