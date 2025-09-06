#!/usr/bin/env python3
import csv, subprocess, shlex, os, json, requests

# Configuration GitLab
GITLAB_URL = "https://depot.dinf.usherbrooke.ca"
PROJECT_ID = "dinf/projets/a25/eq24/leadtracker"
GITLAB_TOKEN = os.getenv('GITLAB_TOKEN')

if not GITLAB_TOKEN:
    print("❌ Erreur: Variable GITLAB_TOKEN non définie")
    print("Pour obtenir votre token:")
    print("1. Allez sur https://depot.dinf.usherbrooke.ca/-/profile/personal_access_tokens")
    print("2. Créez un token avec scope 'api'")
    print("3. Exécutez: export GITLAB_TOKEN=votre_token")
    exit(1)

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
}

def get_milestone_id(milestone_title):
    """Récupère l'ID du milestone depuis GitLab"""
    url = f"{GITLAB_URL}/api/v4/projects/{PROJECT_ID.replace('/', '%2F')}/milestones"
    headers = {"PRIVATE-TOKEN": GITLAB_TOKEN}
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        milestones = response.json()
        for milestone in milestones:
            if milestone['title'] == milestone_title:
                return milestone['id']
    return None

def create_issue(title, description, labels, milestone_title, weight):
    """Crée une issue sur GitLab via l'API"""
    
    # Récupérer les critères détaillés si disponibles
    issue_details = detailed_issues.get(title, {})
    criteria = issue_details.get("criteria", ["…", "…"])
    tests = issue_details.get("tests", ["…", "…"])

    # Construire le body complet
    criteria_text = "\n".join([f"- [ ] {c}" for c in criteria])
    tests_text = "\n".join([f"- [ ] {t}" for t in tests])
    
    body_full = f"""{description}

---

**Critères d'acceptation**
{criteria_text}

**Tests**
{tests_text}

**Poids:** {weight if weight else "Non défini"}
"""

    # Récupérer l'ID du milestone
    milestone_id = get_milestone_id(milestone_title)
    
    # Préparer les données pour l'API
    data = {
        "title": title,
        "description": body_full,
        "labels": labels + [f"weight-{weight}"] if weight else labels
    }
    
    if milestone_id:
        data["milestone_id"] = milestone_id

    # Créer l'issue
    url = f"{GITLAB_URL}/api/v4/projects/{PROJECT_ID.replace('/', '%2F')}/issues"
    headers = {
        "PRIVATE-TOKEN": GITLAB_TOKEN,
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 201:
        issue = response.json()
        print(f"✅ Issue créée: #{issue['iid']} - {title}")
        return True
    else:
        print(f"❌ Erreur création issue '{title}': {response.text}")
        return False

def clean_labels(labels_str):
    """Nettoie et filtre les labels valides"""
    if not labels_str:
        return []
    
    labels = [label.strip() for label in labels_str.split(",")]
    valid_labels = []
    for label in labels:
        if label and len(label) < 50 and "," not in label and "(" not in label and ")" not in label:
            valid_labels.append(label)
    
    return valid_labels

# Importer les issues depuis le CSV
print("🚀 Import des issues vers GitLab...")

with open("scripts/BACKLOG_SEED_FIXED.csv", newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    success_count = 0
    
    for row in reader:
        title = row["Title"].strip()
        description = row["Description"].strip()
        labels_str = row["Labels"].strip()
        milestone = row["Milestone"].strip()
        weight = row.get("Weight", "").strip()

        labels = clean_labels(labels_str)
        
        if create_issue(title, description, labels, milestone, weight):
            success_count += 1

print(f"\n✅ Import terminé: {success_count} issues créées avec succès")
