#!/usr/bin/env python3
import csv, subprocess, shlex

with open("scripts/BACKLOG_SEED.csv", newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        title = row["Title"].strip()
        body = row["Description"].strip()
        labels = row["Labels"].strip().split(",")
        milestone = row["Milestone"].strip()

        body_full = f"""{body}

---

**Critères d'acceptation (à compléter)**
- [ ] …
- [ ] …

"""
        cmd = f'gh issue create --title {shlex.quote(title)} --body {shlex.quote(body_full)}'
        for lab in labels:
            if lab:
                cmd += f' --label {lab}'
        if milestone:
            cmd += f' --milestone {shlex.quote(milestone)}'

        print("+", cmd)
        subprocess.run(cmd, shell=True)
