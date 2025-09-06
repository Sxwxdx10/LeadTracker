#!/usr/bin/env python3
import csv, subprocess, shlex

# Mapping des issues détaillées avec critères d'acceptation
detailed_issues = {
    "Bootstraper le repo & Docker Compose": {
        "criteria": [
            "Solution .NET 8 avec structure clean architecture",
            "Application Next.js configurée avec TypeScript", 
            "Docker Compose avec services : API, DB PostgreSQL, proxy Nginx",
            "Variables d'environnement documentées dans .env.example",
            "README avec instructions de démarrage en < 5 minutes",
            "Tous les services démarrent avec `docker-compose up`"
        ],
        "tests": [
            "Test d'intégration: `docker-compose up` démarre tous les services",
            "Test de santé: endpoints `/health` retournent 200",
            "Test de connectivité: API peut se connecter à PostgreSQL"
        ]
    },
    "Modèle de données initial (Org, User, Lead, Stage, Task)": {
        "criteria": [
            "Entités EF Core : Organization, User, Lead, Stage, Task",
            "Relations correctes avec clés étrangères",
            "Indexes sur colonnes fréquemment requêtées (org_id, email, created_at)",
            "Contraintes d'intégrité (email unique par org, etc.)",
            "Migration initiale appliquée automatiquement",
            "Seed data basique pour développement"
        ],
        "tests": [
            "Tests unitaires pour validation des entités",
            "Tests d'intégration pour migrations",
            "Tests de contraintes d'intégrité",
            "Tests de performance sur requêtes indexées"
        ]
    },
    "Auth & JWT (multi-tenant)": {
        "criteria": [
            "Endpoints : POST /auth/register, /auth/login, /auth/refresh, /auth/reset",
            "JWT avec claims : user_id, org_id, roles",
            "Refresh token sécurisé (httpOnly cookie)",
            "Header X-Org-Id résout l'organisation active",
            "Validation email lors de l'inscription",
            "Reset password avec token temporaire (15min)"
        ],
        "tests": [
            "Tests unitaires pour AuthService",
            "Tests d'intégration pour endpoints auth",
            "Tests de sécurité : tentatives de force brute",
            "Tests multi-tenant : isolation des données"
        ]
    }
    # Ajouter les autres issues selon le besoin...
}

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

with open("scripts/BACKLOG_SEED_FIXED.csv", newline='', encoding='utf-8') as f:
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

        # Récupérer les critères détaillés si disponibles
        issue_details = detailed_issues.get(title, {})
        criteria = issue_details.get("criteria", ["…", "…"])
        tests = issue_details.get("tests", ["…", "…"])

        # Construire le body complet
        criteria_text = "\n".join([f"- [ ] {c}" for c in criteria])
        tests_text = "\n".join([f"- [ ] {t}" for t in tests])
        
        body_full = f"""{body}

---

**Critères d'acceptation**
{criteria_text}

**Tests**
{tests_text}

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
        
        # Ajouter le milestone (utiliser le numéro au lieu du nom)
        if milestone:
            if "Jalon A - Septembre 2025" in milestone:
                cmd_parts.extend(['--milestone', '1'])
            elif "Jalon B - Octobre 2025" in milestone:
                cmd_parts.extend(['--milestone', '2'])
            elif "Jalon C - Novembre 2025" in milestone:
                cmd_parts.extend(['--milestone', '3'])
            elif "Jalon Final - Décembre 2025" in milestone:
                cmd_parts.extend(['--milestone', '4'])
            else:
                cmd_parts.extend(['--milestone', shlex.quote(milestone)])
        
        # Ajouter le poids si disponible
        if weight and weight.isdigit():
            cmd_parts.extend(['--label', f'weight-{weight}'])

        print("+", " ".join(cmd_parts))
        subprocess.run(cmd_parts)
