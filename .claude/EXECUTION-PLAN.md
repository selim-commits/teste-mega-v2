# Rooom OS - Plan d'Exécution Ralph

> Plan automatisé pour terminer l'application basé sur l'audit complet.
> Généré: Janvier 2026

---

## RÉSUMÉ DE L'AUDIT

| Catégorie | État | Actions requises |
|-----------|------|------------------|
| Design System | 239 violations | Corriger toutes les valeurs hardcodées |
| Pages Partielles | 7 pages à 60-85% | Compléter les fonctionnalités |
| Page Stub | Settings à 40% | Connecter à Supabase |
| Services | 2 partiels | Compléter base.ts et chatAIService.ts |

---

## PHASE 1: DESIGN SYSTEM POLISH

### Objectif
Corriger les 239 violations du design system.

### Fichiers à corriger

| Fichier | Violations | Type |
|---------|------------|------|
| `src/pages/AIConsole.module.css` | 25 | Couleurs hardcodées |
| `embed-packs/packs.css` | 72 | Espacements px |
| `embed/embed.css` | 58 | Espacements + couleurs |
| `embed-chat/chat.css` | 41 | Espacements + couleurs |
| `src/pages/Bookings.module.css` | ~20 | Variables --rooom-* |
| `src/pages/Chat.module.css` | 1 | Border-radius |
| Autres CSS modules | ~22 | Mixtes |

### Commande Ralph

```bash
/ralph-loop 'Read .claude/context/STARTUP.md then .claude/agents/polish-agent.md.

MISSION: Corriger toutes les violations du design system.

FICHIERS PRIORITAIRES:
1. src/pages/AIConsole.module.css - Remplacer 25 couleurs hardcodées
2. embed-packs/packs.css - Remplacer 72 espacements px
3. embed/embed.css - Remplacer 58 violations
4. embed-chat/chat.css - Remplacer 41 violations
5. src/pages/Bookings.module.css - Migrer --rooom-* vers design system

RÈGLES:
- Remplacer #1a1a1a par var(--text-primary)
- Remplacer #888, #999 par var(--text-secondary)
- Remplacer padding: 16px par padding: var(--space-4)
- Remplacer border-radius: 8px par border-radius: var(--radius-lg)
- Ne JAMAIS ajouter de nouvelles couleurs ou espacements hardcodés

Vérifier npm run build après chaque fichier.' --max-iterations 30 --completion-promise 'POLISH_COMPLETE'
```

---

## PHASE 2: SETTINGS PAGE

### Objectif
Connecter Settings.tsx à Supabase pour persister les paramètres.

### État actuel
- Score: 40%
- Problème: Tout en local state, aucune persistence

### Tâches
1. Créer table `studio_settings` dans Supabase
2. Créer service `settingsService.ts`
3. Créer hook `useSettings.ts`
4. Refactorer Settings.tsx pour utiliser React Query
5. Ajouter optimistic updates

### Commande Ralph

```bash
/ralph-loop 'Read .claude/context/STARTUP.md then .claude/agents/feature-agent.md.

MISSION: Connecter Settings.tsx à Supabase.

ÉTAPES:
1. Créer src/services/settings.ts avec CRUD pour studio_settings
2. Créer src/hooks/useSettings.ts avec React Query
3. Refactorer src/pages/Settings.tsx:
   - Remplacer useState par useSettings hook
   - Ajouter useMutation pour les mises à jour
   - Ajouter états loading/error
   - Ajouter optimistic updates

ARCHITECTURE:
Settings.tsx → useSettings hook → settingsService → Supabase

Respecter le pattern existant des autres services.
npm run build doit passer.' --max-iterations 25 --completion-promise 'FEATURE_COMPLETE'
```

---

## PHASE 3: AI INTEGRATION

### Objectif
Implémenter une vraie intégration LLM pour AIConsole et Chat.

### État actuel
- AIConsole: Réponses mock, pas d'API
- Chat/YODA: Intégration IA manquante

### Tâches
1. Créer edge function Supabase pour Claude API
2. Compléter chatAIService.ts avec vraies requêtes
3. Refactorer AIConsole pour streaming responses
4. Intégrer YODA dans Chat

### Commande Ralph

```bash
/ralph-loop 'Read .claude/context/STARTUP.md then .claude/agents/feature-agent.md.

MISSION: Implémenter intégration LLM pour AIConsole.

ÉTAPES:
1. Créer src/services/ai.ts:
   - Fonction streamChat(messages, onChunk)
   - Gestion des erreurs et retry
   - Types pour messages et responses

2. Refactorer src/services/chatAIService.ts:
   - Remplacer mock par vraie intégration
   - Support streaming responses
   - Context management

3. Mettre à jour src/pages/AIConsole.tsx:
   - Utiliser le nouveau service
   - Afficher streaming en temps réel
   - États loading appropriés

4. Intégrer dans src/pages/Chat.tsx:
   - Ajouter mode YODA AI
   - Toggle humain/AI responses

npm run build doit passer.' --max-iterations 30 --completion-promise 'FEATURE_COMPLETE'
```

---

## PHASE 4: PAGES PARTIELLES

### Objectif
Compléter les 7 pages partielles à 90%+.

### Pages et manques

| Page | Score | Manque |
|------|-------|--------|
| Clients | 85% | Historique d'activité |
| Team | 80% | Système d'invitation |
| Inventory | 80% | QR codes, maintenance avancée |
| Bookings | 75% | Design system, validation |
| Packs | 70% | Analytics, certificats cadeaux |
| Chat | 65% | Intégration YODA |
| AIConsole | 60% | LLM réel |

### Commande Ralph (Clients)

```bash
/ralph-loop 'Read .claude/context/STARTUP.md then .claude/agents/feature-agent.md.

MISSION: Ajouter historique d activité aux Clients.

ÉTAPES:
1. Créer composant ClientActivityHistory.tsx
2. Query les bookings, paiements, messages du client
3. Afficher timeline avec filtres
4. Intégrer dans la page Clients détail

npm run build doit passer.' --max-iterations 20 --completion-promise 'FEATURE_COMPLETE'
```

### Commande Ralph (Team)

```bash
/ralph-loop 'Read .claude/context/STARTUP.md then .claude/agents/feature-agent.md.

MISSION: Implémenter système d invitation Team.

ÉTAPES:
1. Créer table team_invitations dans Supabase
2. Créer service invitationsService.ts
3. Ajouter composant InviteModal.tsx
4. Gérer envoi email et expiration
5. Page d acceptation d invitation

npm run build doit passer.' --max-iterations 25 --completion-promise 'FEATURE_COMPLETE'
```

### Commande Ralph (Inventory QR)

```bash
/ralph-loop 'Read .claude/context/STARTUP.md then .claude/agents/feature-agent.md.

MISSION: Implémenter génération QR codes pour Inventory.

ÉTAPES:
1. Installer qrcode library
2. Créer composant QRCodeGenerator.tsx
3. Générer QR unique par équipement
4. Ajouter scan et lookup
5. Imprimer étiquettes

npm run build doit passer.' --max-iterations 20 --completion-promise 'FEATURE_COMPLETE'
```

---

## PHASE 5: POLISH FINAL

### Objectif
Vérification finale et optimisations.

### Tâches
1. Audit accessibilité (a11y)
2. Performance optimization
3. États loading/error partout
4. Empty states
5. Validation finale du design system

### Commande Ralph

```bash
/ralph-loop 'Read .claude/context/STARTUP.md then .claude/agents/polish-agent.md.

MISSION: Polish final de l application.

CHECKLIST:
1. ACCESSIBILITÉ
   - Tous les boutons ont aria-label si icon-only
   - Focus visible sur tous les interactifs
   - Contraste couleurs suffisant
   - Labels associés aux inputs

2. PERFORMANCE
   - Lazy loading des pages
   - Images optimisées
   - Mémoization où nécessaire

3. ÉTATS
   - Loading states avec Skeleton
   - Error states avec retry
   - Empty states informatifs

4. DESIGN SYSTEM
   - Vérifier 0 violations restantes
   - Tous les états hover/focus/disabled
   - Typographie cohérente

npm run build doit passer.
Rapport final dans POLISH-REPORT.md' --max-iterations 25 --completion-promise 'POLISH_COMPLETE'
```

---

## SÉQUENCE D'EXÉCUTION RECOMMANDÉE

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: Design System (30 iterations max)              │
│ → Corrige les 239 violations                            │
│ → POLISH_COMPLETE                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 2: Settings (25 iterations max)                   │
│ → Connecte Settings à Supabase                          │
│ → FEATURE_COMPLETE                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 3: AI Integration (30 iterations max)             │
│ → Intègre Claude API                                    │
│ → FEATURE_COMPLETE                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 4: Pages Partielles (65 iterations total)         │
│ → Clients: 20 iterations                                │
│ → Team: 25 iterations                                   │
│ → Inventory: 20 iterations                              │
│ → FEATURE_COMPLETE (x3)                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 5: Polish Final (25 iterations max)               │
│ → Accessibilité, performance, états                     │
│ → POLISH_COMPLETE                                       │
└─────────────────────────────────────────────────────────┘
```

**Total estimé: ~175 iterations Ralph**

---

## COMMANDES QUICK START

### Lancer Phase 1 (Design System)
```bash
cd /Users/selimrochette-moreau/Documents/GitHub/teste-mega-v2
/ralph-loop 'Read .claude/context/STARTUP.md then .claude/agents/polish-agent.md. Corriger toutes les 239 violations du design system. Fichiers prioritaires: AIConsole.module.css, embed-packs/packs.css, embed/embed.css, embed-chat/chat.css. npm run build doit passer.' --max-iterations 30 --completion-promise 'POLISH_COMPLETE'
```

### Lancer toutes les phases séquentiellement
```bash
# Phase 1
/ralph-loop '...' --completion-promise 'POLISH_COMPLETE'

# Phase 2 (après Phase 1)
/ralph-loop '...' --completion-promise 'FEATURE_COMPLETE'

# etc.
```

---

## VÉRIFICATION FINALE

Après toutes les phases, exécuter:

```bash
npm run build
npm run lint
npx tsc --noEmit
```

Si tout passe, l'application est **production-ready**.

---

## NOTES

- Chaque phase crée un commit avec le type approprié (feat:, fix:, style:)
- Les agents lisent STARTUP.md → RULES.md → CONTEXT.md automatiquement
- Les completion promises garantissent que le travail est vraiment terminé
- En cas d'erreur, l'agent debug peut être invoqué

