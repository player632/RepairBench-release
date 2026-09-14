# Reference results

## Protocol

Two models were evaluated over the complete suite. Each model answered every task once and was
graded once, with the same agent harness, the same tool set, the same task packages and the
same verifier.

| Item | Value |
|---|---|
| Tasks | 202 |
| Models | `qwen3.8-max`, `qwen3.6-flash` |
| Graded runs | 404 (202 per model) |
| Grading rounds | `r7` (197 tasks per model) and `r7fr` (5 tasks per model); the rounds are disjoint |
| Grading window | 2026-09-11 to 2026-09-12 |
| Answering budget | Unlimited turns, no time limit (`agent.timeout_sec = 0.0`) |
| Verifier | `repair_bench/outputs/<instance_id>/tests/run.sh` as shipped in this distribution |

Each task was answered from a fresh copy of the seed tree and the repaired tree was graded
without modification, using the scoring rule defined in
[evaluation.md](evaluation.md#scoring). A submission that failed to build received exit
status 2 and a score of 0. Aggregate F2P and P2P rates are averaged over all 202 tasks; a
task whose submission failed to build contributes 0 to both rates.

## Aggregate results

| Metric | `qwen3.8-max` | `qwen3.6-flash` |
|---|---|---|
| Tasks graded | 202 | 202 |
| Mean score | 48.34 | 37.65 |
| Median score | 50.00 | 41.67 |
| Standard deviation (population) | 16.98 | 20.30 |
| Submissions that built | 200 | 186 |
| Build failures | 2 | 16 |
| Mean F2P rate | 0.505 | 0.402 |
| Mean P2P rate | 0.917 | 0.804 |
| Tasks scoring 0 | 10 | 29 |
| Tasks scoring 100 | 2 | 0 |

## Results by framework

Mean score and number of submissions that built, per framework.

| Framework | Tasks | `qwen3.8-max` mean | built | `qwen3.6-flash` mean | built |
|---|---|---|---|---|---|
| Vanilla | 50 | 51.18 | 50 | 40.68 | 49 |
| React | 39 | 47.13 | 39 | 39.12 | 37 |
| Angular | 36 | 46.91 | 34 | 32.56 | 28 |
| Vue | 34 | 49.52 | 34 | 41.29 | 33 |
| Svelte | 26 | 43.31 | 26 | 27.55 | 23 |
| Solid | 17 | 51.18 | 17 | 44.35 | 16 |

## Score distribution

| Score band | `qwen3.8-max` | `qwen3.6-flash` |
|---|---|---|
| 0 | 10 | 29 |
| above 0, below 25 | 7 | 13 |
| 25 to below 50 | 66 | 94 |
| 50 to below 75 | 111 | 64 |
| 75 and above | 8 | 2 |

## Head-to-head comparison

Both models were graded on all 202 tasks.

| Outcome | Tasks |
|---|---|
| `qwen3.8-max` scored higher | 125 |
| `qwen3.6-flash` scored higher | 34 |
| Equal scores | 43 |

## Interpretation

- Mean scores sit below 50 for both models. Because the score is the product of the F2P and
  P2P rates, a high P2P rate alone cannot compensate for unrepaired defects.
- The gap between the mean F2P rate (0.505) and the mean P2P rate (0.917) for
  `qwen3.8-max` shows that existing behaviour is largely preserved while roughly half of the
  injected defects remain unrepaired.
- 45.0% of the labelled defects are not named in the task statement, so full credit requires
  defects to be located without being pointed out.
- Build failures are scored 0 and are concentrated in the larger Angular and Vue workspaces.
  They measure toolchain handling as well as repair quality.
- 8 tasks scored 0 for both models.

## Result artifacts

| File | Contents |
|---|---|
| `results/ledger.json` | Authoritative record: per-run task, model, round, score, build status, F2P and P2P counts and rates, grading timestamp; plus aggregate, per-framework and head-to-head summaries |
| `results/task-index.csv` | One row per task: framework, language, seed path, defect counts, reported and unreported defect counts, checkpoint counts, verifier timeout, reference repair size, and both models' scores and rates |
| `results/summary.json` | Suite-level distributions of defects, checkpoint counts, reference repair sizes and verifier timeouts, together with the aggregate result tables |
| `results/dependency-install.csv` | Per-task seed path, installation directories, package manager and dependency class |
| `results/seed-provenance.csv` | Upstream attribution of each seed tree: repository reference, branch, upstream commit and snapshot timestamp where recorded, and how the attribution was established |

### `results/task-index.csv` columns

| Column | Meaning |
|---|---|
| `instance_id`, `framework`, `language`, `repository`, `seed_path` | Task identity and location, from `task.toml` |
| `defects` | Injected defects recorded for the task; empty for the 3 tasks without a defect ledger |
| `reported_defects`, `unreported_defects` | Defects named and not named in the task statement |
| `defect_type_tags` | Number of `defect_type:` tags in `task.toml` |
| `f2p_checkpoints`, `p2p_checkpoints`, `total_checkpoints` | Scored checkpoint counts, from `tests/f2p_expected.json` and `tests/p2p_expected.json` |
| `verifier_timeout_sec` | Verifier timeout from `task.toml` |
| `gold_patch_files`, `gold_patch_changed_lines` | Size of `solution/gold.patch` |
| `score_<model>`, `f2p_rate_<model>`, `p2p_rate_<model>`, `build_failed_<model>` | Grading outcome per model, from `results/ledger.json` |
