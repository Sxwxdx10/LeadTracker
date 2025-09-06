#!/usr/bin/env python3
import csv, subprocess, shlex

# Fonction pour nettoyer les labels
def clean_labels(labels_str):
    """Nettoie et filtre les labels valides"""
    if not labels_str:
        return []
    
    # Sépare par virgule et nettoie
    labels = [label.strip() for label in labels_str.split(",")]
    
    # Filtre les labels valides (pas de virgules, pas trop longs, pas vides)
    valid_labels = []
    for label in labels:
        if label and len(label) < 50 and "," not in label and "(" not in label and ")" not in label:
            valid_labels.append(label)
    
    return valid_labels

with open("scripts/BACKLOG_EXTENDED_2025.csv", newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        title = row["Title"].strip()
        body = row["Description"].strip()
        labels_str = row["Labels"].strip()
        milestone = row["Milestone"].strip()
        weight = row.get("Weight", "").strip()
        due_date = row.get("Due Date", "").strip()

        # Nettoyer les labels
        labels = clean_labels(labels_str)

        # Construire le body complet
        body_full = f"""{body}

---

**Critères d'acceptation**
- [ ] À définir selon les besoins spécifiques

**Tests**
- [ ] Tests unitaires appropriés
- [ ] Tests d'intégration si nécessaire

**Poids:** {weight if weight else "Non défini"}
**Échéance:** {due_date if due_date else "Non définie"}
"""

        # Construire la commande gh
        cmd_parts = ['gh', 'issue', 'create']
        cmd_parts.extend(['--title', shlex.quote(title)])
        cmd_parts.extend(['--body', shlex.quote(body_full)])
        
        # Ajouter les labels valides
        for lab in labels:
            cmd_parts.extend(['--label', lab])
        
        # Ne pas ajouter le milestone maintenant, on le fera après
        
        # Ajouter le poids si disponible
        if weight and weight.isdigit():
            cmd_parts.extend(['--label', f'weight-{weight}'])

        print("+", " ".join(cmd_parts))
        subprocess.run(cmd_parts)
