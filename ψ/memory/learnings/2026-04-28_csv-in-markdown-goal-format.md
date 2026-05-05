# Lesson: CSV-in-Markdown Goal Tracking Format

**Date**: 2026-04-28
**Source**: PM Oracle design session
**Context**: Designing goal tracking for PM Oracle

## Pattern

When tracking project objectives in markdown files, use a CSV code block inside the `.md` file:

```markdown
## Status Tracking

```csv
id,objective,status,owner,deadline,evidence,updated
G1,Backtest PF > 1.5,at-risk,broky,-,PF=1.42,2026-04-28
```
```

## Key Insight

The CSV tracks **objective status**, NOT system parameters. Each row is a goal with a status (on-track/at-risk/blocked/completed/pending), and the evidence column is where you put metrics. This is fundamentally different from a parameters CSV that tracks PF/MaxDD/WR as columns.

## Why This Works

1. **Human-readable**: Markdown renders the CSV as a readable table
2. **Machine-parseable**: CSV can be extracted and processed programmatically
3. **Audit trail below**: Append-only markdown log provides history that CSV alone can't
4. **One file per project**: All MT5 goals in one file, all project-X goals in another

## Anti-Pattern

DON'T do this:
```csv
phase,name,status,pf,maxdd,wr,updated
```
This tracks system parameters as columns, mixing status tracking with metric logging.

DO this:
```csv
id,objective,status,owner,deadline,evidence,updated
G1,Backtest PF > 1.5,at-risk,broky,-,PF=1.42,2026-04-28
```
Here the metric is IN the evidence column, not AS a column.

## Applicability

Any oracle that needs to track progress toward measurable goals — PM, project leads, product managers.