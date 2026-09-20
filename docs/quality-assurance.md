# Quality assurance

Every task in this distribution was verified against a fixed set of requirements before it was
accepted. This document states those requirements, the measured result for each, and whether
that result can be recomputed from the files shipped here.

Two categories are used throughout:

- **Recomputable** — the evidence is part of this distribution, so the stated result can be
  reproduced locally without any additional material.
- **Attested** — the check was performed at build time and its result is recorded here, but an
  input it depends on is not part of this distribution.

Eleven of the twelve requirements are recomputable. Corpus-wide counts used below: 300 tasks
across 6 frameworks; 9,859 checkpoints declared in `tests/dsl.json`, of which 9,855 are scored
(3,706 fail-to-pass and 6,149 pass-to-pass) and 4 are executed but not scored; three validation
records per task, 900 in total.

## Requirements and measured results

| # | Requirement | Measured result | Category |
|---|---|---|---|
| 1 | The checkpoint set passes in full on the seed state with adaptation and instrumentation applied and no defects injected | `validation/baseline.json`: 9,859 `pass`, 0 failures, across 300 records | Recomputable |
| 2 | The checkpoint set passes in full once the reference repair is applied | `validation/oracle.json`: 9,859 `pass`, 0 failures, across 300 records | Recomputable |
| 3 | The outcomes declared in `task.toml` hold | 300 of 300 declare `expected_oracle_exit_code = 0` with `expected_oracle_reward = 1.0`, and `expected_nop_exit_code = 1` with `expected_nop_reward = 0.0` | Recomputable |
| 4 | Every scored fail-to-pass checkpoint fails in the delivered state | `validation/mutation.json`: 3,700 of 9,859 checkpoints fail, reconciled below | Recomputable |
| 5 | Each validation record covers exactly the declared checkpoint set | 900 of 900 records match `tests/dsl.json` identifier-for-identifier; 0 mismatches | Recomputable |
| 6 | The scored partition is well formed | `tests/f2p_expected.json` and `tests/p2p_expected.json` are disjoint, every identifier they list is declared, and 4 declared checkpoints appear in neither list | Recomputable |
| 7 | A reference repair ships with every task | `solution/gold.patch` present for 300 of 300 tasks | Recomputable |
| 8 | The verifier cannot pass a task unconditionally | 300 of 300 `tests/run.sh`: no unconditional `exit 0` on the verdict path and no hardcoded reward value | Recomputable |
| 9 | The scoring rule is the same for every task | 300 of 300 compute `score = 100 x f2p_rate x p2p_rate`, set `reward` to 1 only when no scored checkpoint failed, and delegate checkpoint execution to `evaluation/dsl_runner.mjs` | Recomputable |
| 10 | No checkpoint is vacuous | 0 checkpoints declare an empty assertion list | Recomputable |
| 11 | The fault report states that it is incomplete | 300 of 300 `instruction.md` files state that the reports do not describe every defect | Recomputable |
| 12 | The fault report does not identify defect locations | 0 findings across 300 tasks | Attested |

Requirement 8 admits two occurrences of `|| true` in the whole corpus, in
`repair-svelte__svelteforge-admin-01` and `repair-vue__dashy-01`. Both sit on a background
`wait` inside the server-supervision loop and cannot affect the reported verdict.

### Reconciliation of the delivered state

Requirement 4 does not expect the 3,700 failures to equal the 3,706 scored fail-to-pass
checkpoints. The measured total follows from four recorded components:

```text
3,706   scored fail-to-pass checkpoints
  -11   fail-to-pass checkpoints that pass in the delivered state because a second defect
        masks them; each is listed in task-format.md
   +2   pass-to-pass checkpoints that already fail in the delivered tree
   +3   checkpoints that are executed but excluded from scoring
------
3,700   checkpoints failing in validation/mutation.json
```

The remaining 6,159 checkpoints pass in the delivered state.

### Instruction leakage

Requirement 12 is the one requirement that cannot be recomputed from this distribution. At
build time each `instruction.md` was scanned against a per-task list of terms that would reveal
where a defect sits or how it is fixed: source file names, identifiers, the `data-testid`
values installed by `environment/instrumentation.patch`, and fix-mechanism vocabulary. No term
of that kind occurs in any of the 300 fault reports. Vocabulary that a symptom description
necessarily carries — the name of the feature that misbehaves, for example — is permitted by
design and was tallied separately from the prohibited terms.

The per-task term lists are deliberately not shipped: taken together they would form a locator
index for every defect in the benchmark. Requirement 12 is therefore stated as an attestation
rather than as a reproducible measurement. Exposure at grading time is narrower still: an
answering agent receives only `instruction.md` and its working copy of the seed tree, so no
verifier-side file reaches it.

### Derivation of the exit status

`tests/run.sh` reports the verdict as its exit status. On the verdict path 279 tasks derive
that status from `reward` and 21 return the status of `evaluation/dsl_runner.mjs`, which is 0
only when every executed checkpoint passed. For those 21 every executed checkpoint is also a
scored checkpoint, so the two definitions agree for every possible outcome and the contract in
[evaluation.md](evaluation.md#exit-statuses) holds uniformly across all 300 tasks. The four
tasks that declare an executed-but-unscored checkpoint all derive their status from `reward`,
so excluding a checkpoint from scoring can never make a fully scored repair exit non-zero.

On the infrastructure path the 300 verifiers fall into four groups:

| Tasks | Verdict path | When the checkpoint runner exits 4 |
|---|---|---|
| 238 | Status derived from `reward` | Not distinguished from a checkpoint failure |
| 11 | Status derived from `reward` | Reported as `VERIFIER_ERROR` and propagated unchanged, so the run ends with status 4 |
| 30 | Status derived from `reward` | Reported as `VERIFIER_ERROR` and converted to status 2 |
| 21 | Status of `evaluation/dsl_runner.mjs` | The same statement, so the run ends with status 4 |

## Known deviations

Three deviations from uniformity are present in this distribution. Each is recorded here so
that a locally reproduced run can be compared against the shipped artifacts without ambiguity.

| Deviation | Tasks | Documented in |
|---|---|---|
| A scored fail-to-pass checkpoint passes in the delivered state, or a pass-to-pass checkpoint already fails there | 12 | [task-format.md](task-format.md#validation-records) |
| A declared checkpoint is executed but excluded from scoring | 4 | [task-format.md](task-format.md#checkpoint-dsl) |
| `reward.json` departs from the documented shape | 2 | this section |

The third deviation affects two tasks. The scoring step of `repair-angular__ng-lite-todo-01`
differs from the other 299 in all of the following ways:

| Aspect | 299 tasks | `repair-angular__ng-lite-todo-01` |
|---|---|---|
| Checkpoint-count key | `f2p.expected`, `p2p.expected` | `f2p.total`, `p2p.total` |
| Score precision | 2 decimal places | 4 decimal places |
| Rate precision | 4 decimal places | 6 decimal places |
| Additional keys | none, except `verifier_exit_code` in 50 tasks (see below) | `checkpoint_total`, `results_total` |
| Key order | `f2p`, `p2p`, `score`, `reward` | `reward`, `score`, `f2p`, `p2p`, then the additional keys |
| Missing checkpoint results | `{"error": "checkpoint_results.json missing"}` on stdout, status 2 | `VERIFIER_ERROR: no checkpoint_results.json - the runner produced nothing` on stderr, status 2 |

None of these affects which checkpoints pass, the score the task can achieve, the reward or the
exit status; the reported score differs from the standard form only in the number of decimal
places. Consumers that parse `reward.json` should read `f2p.total` and `p2p.total` for this
task, and should not rely on key order or on the error message reaching stdout.

The scoring step of `repair-svelte__8mb.local-01` writes a diagnostic record into `reward.json`
instead of the documented one: the keys are `f2p_pass`, `f2p_total`, `p2p_pass`, `p2p_total`,
`red_f2p`, `red_p2p` and `reward`, there is no `score` key, and `reward` holds the continuous
product `f2p_rate x p2p_rate` rounded to 4 decimals rather than the binary verdict. The
documented record — `f2p` and `p2p` as objects, `score = 100 x f2p_rate x p2p_rate` rounded to
2 decimals and the binary `reward` — is computed by the same step and printed to stdout, which
is where a consumer of this task should read it. The exit status follows the standard contract:
0 only when every scored checkpoint passed, 1 otherwise, 2 on a verifier fault.

One further departure is confined to an error path. When `repair-svelte__gittok.dev-01` aborts
a run through its `verifier_error` helper it writes `{"task", "verdict", "reason", "reward"}`
into `reward.json` before exiting 2; no scored verdict exists in that case. Every other
verifier leaves `reward.json` untouched when it aborts.

A further 50 tasks add a `verifier_exit_code` field to `reward.json`, always computed as
`0 if reward == 1.0 else 1`. Twenty-one of those 50 belong to the final group of the exit-status
table above and return the runner status instead, so for them the field can disagree with the
status the script exits with. The field and that caveat are documented in
[evaluation.md](evaluation.md#scoring).

## Known limitations

- **Browser-process crashes are handled inconsistently.** If Chromium is killed mid-run,
  `evaluation/dsl_runner.mjs` records the remaining checkpoints as `infra_crash` failures,
  writes `runner_crashed` into `checkpoint_results.json`, prints a `RUNNER_CRASHED` line and
  exits 4. Of the 300 verifiers, 32 end with exit status 4, 30 convert the condition to exit
  status 2, and 238 absorb it into the scoring step: the run ends with exit status 1 and a
  partial score, which is indistinguishable from a genuine repair failure. Consumers that need
  to separate the cases should test for `runner_crashed` in
  `${LOGS_DIR}/checkpoint_results.json` rather than relying on the exit status.
- **Exit status 3 is reachable in 4 tasks only.** An `exit 3` path appears in the
  `tests/run.sh` of `repair-react__15-puzzle-react-01`, `repair-react__ace-step-ui-01`,
  `repair-react__word-master-01` and `repair-react__zhithead-01` alone; the other 296
  verifiers never emit it.

## Reproduction

Requirements 1 to 11 can be checked locally. The three validation states are reproducible from
the shipped material alone: the seed tree in `repo/`, the patches in `environment/`, the
reference repair in `solution/gold.patch`, and the verifier in `tests/run.sh` running against
`evaluation/`. [evaluation.md](evaluation.md#oracle-validation) gives the command sequence for
the oracle state and for the delivered state.

## Not included in this distribution

The build-time material that is not shipped here comprises the per-task instruction-leakage
term lists and scan records, the verifier-integrity scan records, the intermediate measurement
states taken while each task was constructed, and the benchmark-level design and selection
records. The verifier-integrity property they attest to is restated as requirement 8 and is
recomputable from `tests/run.sh`; the leakage property is restated as requirement 12 and is
not. Nothing required to answer, grade or reproduce a task is omitted.
