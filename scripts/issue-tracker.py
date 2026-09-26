#!/usr/bin/env python3
"""
issue-tracker.py — Append-only issue tracking for oracle vault.

Usage:
  issue-tracker add --title "..." --problem "..." [--severity high] [--project emily]
  issue-tracker list [--status open|fixed|wontfix] [--project X]
  issue-tracker fix ISSUE-001 --solution "..."
  issue-tracker wontfix ISSUE-001 --reason "..."
  issue-tracker show ISSUE-001
  issue-tracker search "keyword"

File: ψ/issues/issues.jsonl — one JSON object per line, append-only.
Status changes update the status field in-place (git tracks history).
"""
import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

DEFAULT_FILE = Path(__file__).resolve().parent.parent / "ψ" / "issues" / "issues.jsonl"


def _load(filepath: Path) -> list[dict]:
    if not filepath.exists():
        return []
    issues = []
    with open(filepath) as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    issues.append(json.loads(line))
                except json.JSONDecodeError:
                    print(f"⚠️  skip bad line: {line[:60]}...", file=sys.stderr)
    return issues


def _save(filepath: Path, issues: list[dict]):
    with open(filepath, "w") as f:
        for issue in issues:
            f.write(json.dumps(issue, ensure_ascii=False) + "\n")


def _next_id(issues: list[dict]) -> str:
    max_num = 0
    for issue in issues:
        iid = issue.get("id", "")
        if iid.startswith("ISSUE-"):
            try:
                max_num = max(max_num, int(iid.split("-")[1]))
            except ValueError:
                pass
    return f"ISSUE-{max_num + 1:03d}"


def cmd_add(args):
    filepath = Path(args.file) if args.file else DEFAULT_FILE
    issues = _load(filepath)
    iid = _next_id(issues)
    now = datetime.now().strftime("%Y-%m-%d")

    issue = {
        "id": iid,
        "status": "open",
        "severity": args.severity or "medium",
        "project": args.project or "",
        "title": args.title,
        "problem": args.problem,
        "solution": "",
        "discovered": now,
        "fixed": "",
        "notes": args.notes or "",
    }
    issues.append(issue)
    _save(filepath, issues)
    print(f"✅ {iid} created: {args.title}")


def cmd_list(args):
    filepath = Path(args.file) if args.file else DEFAULT_FILE
    issues = _load(filepath)

    if args.status:
        issues = [i for i in issues if i.get("status") == args.status]
    if args.project:
        issues = [i for i in issues if i.get("project") == args.project]

    if not issues:
        print("(no issues)")
        return

    print(f"{'ID':<12} {'ST':<10} {'SEV':<8} {'PROJECT':<16} TITLE")
    print("-" * 70)
    for i in issues:
        status_icon = {"open": "🔴", "in_progress": "🟡", "fixed": "🟢", "wontfix": "⚫"}.get(i.get("status"), "?")
        print(f"{i['id']:<12} {status_icon} {i['status']:<6} {i.get('severity',''):<8} {i.get('project',''):<16} {i['title']}")


def cmd_fix(args):
    filepath = Path(args.file) if args.file else DEFAULT_FILE
    issues = _load(filepath)
    now = datetime.now().strftime("%Y-%m-%d")

    for issue in issues:
        if issue["id"] == args.id:
            issue["status"] = "fixed"
            issue["solution"] = args.solution
            issue["fixed"] = now
            _save(filepath, issues)
            print(f"✅ {args.id} fixed")
            return
    print(f"❌ {args.id} not found", file=sys.stderr)
    sys.exit(1)


def cmd_wontfix(args):
    filepath = Path(args.file) if args.file else DEFAULT_FILE
    issues = _load(filepath)

    for issue in issues:
        if issue["id"] == args.id:
            issue["status"] = "wontfix"
            issue["notes"] = (issue.get("notes", "") + " | WONTFIX: " + args.reason).strip(" |")
            _save(filepath, issues)
            print(f"⚫ {args.id} marked wontfix")
            return
    print(f"❌ {args.id} not found", file=sys.stderr)
    sys.exit(1)


def cmd_show(args):
    filepath = Path(args.file) if args.file else DEFAULT_FILE
    issues = _load(filepath)

    for issue in issues:
        if issue["id"] == args.id:
            print(json.dumps(issue, indent=2, ensure_ascii=False))
            return
    print(f"❌ {args.id} not found", file=sys.stderr)
    sys.exit(1)


def cmd_search(args):
    filepath = Path(args.file) if args.file else DEFAULT_FILE
    issues = _load(filepath)
    keyword = args.keyword.lower()

    matches = [i for i in issues
               if keyword in i.get("title", "").lower()
               or keyword in i.get("problem", "").lower()
               or keyword in i.get("solution", "").lower()]

    if not matches:
        print(f"(no matches for '{args.keyword}')")
        return

    for i in matches:
        status_icon = {"open": "🔴", "in_progress": "🟡", "fixed": "🟢", "wontfix": "⚫"}.get(i.get("status"), "?")
        print(f"{status_icon} {i['id']}: {i['title']}")
        if i.get("solution"):
            print(f"   fix: {i['solution'][:120]}")


def main():
    parser = argparse.ArgumentParser(description="Oracle Issue Tracker")
    parser.add_argument("--file", help="Path to issues.jsonl")
    sub = parser.add_subparsers(dest="cmd")

    p_add = sub.add_parser("add", help="Create new issue")
    p_add.add_argument("--title", required=True)
    p_add.add_argument("--problem", required=True)
    p_add.add_argument("--severity", choices=["critical", "high", "medium", "low"], default="medium")
    p_add.add_argument("--project", default="")
    p_add.add_argument("--notes", default="")

    p_list = sub.add_parser("list", help="List issues")
    p_list.add_argument("--status", choices=["open", "in_progress", "fixed", "wontfix"])
    p_list.add_argument("--project")

    p_fix = sub.add_parser("fix", help="Mark issue as fixed")
    p_fix.add_argument("id")
    p_fix.add_argument("--solution", required=True)

    p_wf = sub.add_parser("wontfix", help="Mark issue as wontfix")
    p_wf.add_argument("id")
    p_wf.add_argument("--reason", required=True)

    p_show = sub.add_parser("show", help="Show issue detail")
    p_show.add_argument("id")

    p_search = sub.add_parser("search", help="Search issues by keyword")
    p_search.add_argument("keyword")

    args = parser.parse_args()
    if not args.cmd:
        parser.print_help()
        return

    {"add": cmd_add, "list": cmd_list, "fix": cmd_fix,
     "wontfix": cmd_wontfix, "show": cmd_show, "search": cmd_search}[args.cmd](args)


if __name__ == "__main__":
    main()
