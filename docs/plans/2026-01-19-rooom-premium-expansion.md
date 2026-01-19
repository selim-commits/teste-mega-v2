# Rooom OS Premium Expansion - Design Document

> **Date**: 2026-01-19
> **Status**: Approved - Ready for Implementation

## Overview

Expansion majeure de Rooom OS pour devenir une plateforme premium complète avec:
- 3 widgets embeddables indépendants (Booking, Chat, Packs)
- Système de packs et abonnements style Squarespace Scheduling
- Chat hybride IA + Humain
- Personnalisation CSS complète + injection custom

## Architecture

### Widgets Séparés
- `rooom-booking.js` (<50kb) - Réservation d'espaces
- `rooom-chat.js` (<40kb) - Chat hybride IA/Humain
- `rooom-packs.js` (<30kb) - Vente packs/abonnements/certificats

### Nouvelles Fonctionnalités

#### 1. Widget Builder
- Configuration visuelle complète dans le dashboard
- Preview live responsive (desktop/tablet/mobile)
- Variables CSS exposées pour personnalisation
- Éditeur Monaco pour CSS custom
- Presets de thèmes prédéfinis

#### 2. Chat Hybride
- YODA AI répond aux questions courantes
- Vérification disponibilités en temps réel
- Booking in-chat
- Escalade intelligente vers humain
- Dashboard conversations pour l'équipe

#### 3. Packs & Abonnements
- Packs d'heures prépayées
- Abonnements récurrents avec rollover
- Certificats cadeaux personnalisables
- Wallet client avec solde
- Déduction automatique à la réservation

## Database Schema

### Nouvelles Tables
- `pricing_products` - Définition packs/abos/certificats
- `client_wallets` - Solde heures/crédits par client
- `client_purchases` - Achats et abonnements actifs
- `wallet_transactions` - Historique des mouvements
- `chat_conversations` - Conversations chat
- `chat_messages` - Messages avec support rich content
- `widget_configs` - Configuration des widgets par studio

## Implementation Tasks

### Phase 1: Database & Core Services
- [ ] Créer migrations Supabase
- [ ] Services: pricingService, walletService, chatService
- [ ] Hooks React Query

### Phase 2: Widget Infrastructure
- [ ] Refactorer embed system pour multi-widgets
- [ ] Widget loader unifié
- [ ] Système de thème CSS variables
- [ ] PostMessage API étendue

### Phase 3: Packs Widget
- [ ] PacksWidget component
- [ ] Flow d'achat Stripe
- [ ] Gift certificate generation
- [ ] Wallet display in booking

### Phase 4: Chat Widget
- [ ] ChatWidget component
- [ ] YODA AI integration
- [ ] Real-time avec Supabase
- [ ] Dashboard conversations

### Phase 5: Widget Builder
- [ ] Page WidgetBuilder dans dashboard
- [ ] Theme editor avec preview
- [ ] Monaco CSS editor
- [ ] Code snippet generator

### Phase 6: Polish & Premium UX
- [ ] Animations Framer Motion
- [ ] Loading states élégants
- [ ] Error handling gracieux
- [ ] Mobile optimization
