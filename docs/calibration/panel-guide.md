# Calibration panel guide

*For the senior PMs scoring the Praxis golden set. Time commitment: ~3–4 hours. Paid.*

## What this is

Praxis grades product-management deliverables (PRDs, experiment plans, strategy memos) with an AI grader that scores against published rubrics. Before we ship anything on top of that grader, we are measuring whether it scores the way experienced product leaders do. **You are the ground truth.** Your scores will be compared with the grader's — and with the other panelists' — to decide whether this product is viable.

Two things follow from that:

1. **Score independently.** Please don't discuss items with other panelists until everyone has submitted. Disagreement between raters is *data* (it tells us the human ceiling), not a problem to smooth over.
2. **Judge only what is written.** Not what the writer probably meant, not what you'd have done. If it isn't on the page, it doesn't score.

## What you receive

- `reading-pack.md` — 30 submissions (10 one-page PRDs, 10 experiment plans, 10 strategy memos), each with the brief the writer received and the rubric you're scoring against. Grouped by type so you can grade like-for-like in one sitting.
- `scores.csv` — the scoring sheet: one row per item × criterion, plus one `OVERALL_PASS` row per item.

## How to score

Each rubric criterion gets a band score:

| Band | Meaning |
|---|---|
| **0** | Missing or off-track — the criterion isn't attempted, or the attempt misunderstands it |
| **1** | Attempted but weak — you can see the intent, but it misses the bar |
| **2** | Solid — meets the bar; you'd accept this from a competent PM |
| **3** | Excellent — exceeds the bar; you'd point to this as an example |

Score each criterion **against its descriptor** (the descriptor states what "strong" looks like), not holistically. A submission can be a 3 on problem clarity and a 0 on metrics — jagged profiles are normal and expected.

`OVERALL_PASS`: enter `pass` if the work meets the bar for the deliverable overall — roughly "would you accept this in a portfolio review as evidence the person can do the job?" — else `fail`. Trust your judgment; this is deliberately holistic.

## Calibration anchors

- Reward **specificity**; penalize vague, generic, or buzzword answers even when they sound professional.
- Padding is not substance. A tight 150-word section can outscore a 400-word one.
- Output metrics ("features shipped", "clicks") are not outcome metrics.
- A "strategy" with no trade-offs — nothing dropped, nothing declined — misses the point of strategy.
- Don't grade prose style beyond clarity. Fragments and bullets are fine if the thinking is there.

## Practical notes

- Work type by type (all PRDs, then all experiment plans, then all memos) — it keeps your internal bar steady.
- If two items feel identical in quality, giving them identical scores is correct; don't force spread.
- If you believe an item is broken (contradictory brief, truncated text), score it anyway and flag it in an email — don't skip rows.
- Return the completed `scores.csv` (or a Google Sheet copy) with your initials in the filename.

## What happens with your scores

Per criterion, we compute agreement between the AI grader and each human rater, and between the human raters themselves (exact agreement, adjacent agreement, mean absolute error, quadratic-weighted kappa, and pass/fail agreement). The published go/no-go bar: the grader must sit **within the panel's own agreement range** — nobody can ask a grader to agree with the panel more than the panel agrees with itself. We'll share the results with you, and with your permission, credit you in the published methodology.
