## Backlog & Cursor setup (GitHub)

```bash
# 1) Labels & milestones
bash scripts/create_labels.sh
bash scripts/create_milestones.sh

# 2) Import issues from CSV
python3 scripts/import_issues.py
