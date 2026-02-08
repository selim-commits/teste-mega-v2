import { useState, useCallback, useMemo } from 'react';
import {
  Search,
  Copy,
  Check,
  Play,
  ChevronDown,
  ChevronRight,
  FileCode,
  Key,
  Shield,
  Book,
  Terminal,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import styles from './ApiDocs.module.css';

// --- Types ---

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type TabId = 'endpoints' | 'schemas' | 'authentication';

interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  location: 'query' | 'body' | 'path';
}

interface Endpoint {
  id: string;
  method: HttpMethod;
  path: string;
  description: string;
  category: string;
  params: EndpointParam[];
  requestExample: string;
  responseExample: string;
  statusCode: number;
}

interface SchemaField {
  name: string;
  type: string;
  optional: boolean;
}

interface Schema {
  name: string;
  fields: SchemaField[];
}

// --- Constants ---

const API_BASE_URL = 'https://api.rooom.com/v1';

const ENDPOINTS: Endpoint[] = [
  // Bookings
  {
    id: 'get-bookings',
    method: 'GET',
    path: '/bookings',
    description: 'Recupere la liste de toutes les reservations du studio, avec pagination et filtres optionnels.',
    category: 'Bookings',
    params: [
      { name: 'page', type: 'number', required: false, description: 'Numero de page (defaut: 1)', location: 'query' },
      { name: 'limit', type: 'number', required: false, description: 'Nombre de resultats par page (defaut: 20, max: 100)', location: 'query' },
      { name: 'status', type: 'BookingStatus', required: false, description: 'Filtrer par statut: pending, confirmed, in_progress, completed, cancelled', location: 'query' },
      { name: 'client_id', type: 'string', required: false, description: 'Filtrer par identifiant client', location: 'query' },
      { name: 'space_id', type: 'string', required: false, description: 'Filtrer par espace', location: 'query' },
      { name: 'start_date', type: 'string (ISO 8601)', required: false, description: 'Date de debut minimum', location: 'query' },
      { name: 'end_date', type: 'string (ISO 8601)', required: false, description: 'Date de fin maximum', location: 'query' },
    ],
    requestExample: `GET ${API_BASE_URL}/bookings?status=confirmed&limit=10`,
    responseExample: JSON.stringify({
      data: [
        {
          id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
          title: 'Shooting photo corporate',
          status: 'confirmed',
          start_time: '2026-02-10T09:00:00Z',
          end_time: '2026-02-10T12:00:00Z',
          total_amount: 450.00,
          client_id: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
          space_id: 's1a2b3c4-d5e6-7890-abcd-ef1234567890',
        },
      ],
      pagination: { page: 1, limit: 10, total: 47 },
    }, null, 2),
    statusCode: 200,
  },
  {
    id: 'post-bookings',
    method: 'POST',
    path: '/bookings',
    description: 'Cree une nouvelle reservation. Verifie automatiquement la disponibilite de l\'espace.',
    category: 'Bookings',
    params: [
      { name: 'title', type: 'string', required: true, description: 'Titre de la reservation', location: 'body' },
      { name: 'space_id', type: 'string (UUID)', required: true, description: 'Identifiant de l\'espace', location: 'body' },
      { name: 'client_id', type: 'string (UUID)', required: true, description: 'Identifiant du client', location: 'body' },
      { name: 'start_time', type: 'string (ISO 8601)', required: true, description: 'Date et heure de debut', location: 'body' },
      { name: 'end_time', type: 'string (ISO 8601)', required: true, description: 'Date et heure de fin', location: 'body' },
      { name: 'description', type: 'string', required: false, description: 'Description de la reservation', location: 'body' },
      { name: 'notes', type: 'string', required: false, description: 'Notes supplementaires', location: 'body' },
    ],
    requestExample: JSON.stringify({
      title: 'Shooting photo corporate',
      space_id: 's1a2b3c4-d5e6-7890-abcd-ef1234567890',
      client_id: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
      start_time: '2026-02-10T09:00:00Z',
      end_time: '2026-02-10T12:00:00Z',
      description: 'Portraits pour equipe marketing',
    }, null, 2),
    responseExample: JSON.stringify({
      id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
      title: 'Shooting photo corporate',
      status: 'pending',
      start_time: '2026-02-10T09:00:00Z',
      end_time: '2026-02-10T12:00:00Z',
      total_amount: 450.00,
      created_at: '2026-02-08T14:30:00Z',
    }, null, 2),
    statusCode: 201,
  },
  {
    id: 'put-bookings',
    method: 'PUT',
    path: '/bookings/:id',
    description: 'Met a jour une reservation existante. Seuls les champs fournis sont modifies.',
    category: 'Bookings',
    params: [
      { name: 'id', type: 'string (UUID)', required: true, description: 'Identifiant de la reservation', location: 'path' },
      { name: 'title', type: 'string', required: false, description: 'Nouveau titre', location: 'body' },
      { name: 'status', type: 'BookingStatus', required: false, description: 'Nouveau statut', location: 'body' },
      { name: 'start_time', type: 'string (ISO 8601)', required: false, description: 'Nouvelle date de debut', location: 'body' },
      { name: 'end_time', type: 'string (ISO 8601)', required: false, description: 'Nouvelle date de fin', location: 'body' },
      { name: 'notes', type: 'string', required: false, description: 'Notes mises a jour', location: 'body' },
    ],
    requestExample: JSON.stringify({
      status: 'confirmed',
      notes: 'Confirme par telephone',
    }, null, 2),
    responseExample: JSON.stringify({
      id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
      title: 'Shooting photo corporate',
      status: 'confirmed',
      updated_at: '2026-02-08T15:00:00Z',
    }, null, 2),
    statusCode: 200,
  },
  {
    id: 'delete-bookings',
    method: 'DELETE',
    path: '/bookings/:id',
    description: 'Supprime une reservation. Cette action est irreversible. Les factures associees ne sont pas supprimees.',
    category: 'Bookings',
    params: [
      { name: 'id', type: 'string (UUID)', required: true, description: 'Identifiant de la reservation a supprimer', location: 'path' },
    ],
    requestExample: `DELETE ${API_BASE_URL}/bookings/b1a2c3d4-e5f6-7890-abcd-ef1234567890`,
    responseExample: JSON.stringify({
      success: true,
      message: 'Reservation supprimee avec succes',
    }, null, 2),
    statusCode: 200,
  },
  // Clients
  {
    id: 'get-clients',
    method: 'GET',
    path: '/clients',
    description: 'Recupere la liste des clients avec options de recherche et filtrage par tier.',
    category: 'Clients',
    params: [
      { name: 'page', type: 'number', required: false, description: 'Numero de page', location: 'query' },
      { name: 'limit', type: 'number', required: false, description: 'Resultats par page (max: 100)', location: 'query' },
      { name: 'search', type: 'string', required: false, description: 'Recherche par nom, email ou telephone', location: 'query' },
      { name: 'tier', type: 'ClientTier', required: false, description: 'Filtrer par niveau: standard, premium, vip', location: 'query' },
    ],
    requestExample: `GET ${API_BASE_URL}/clients?search=martin&tier=premium`,
    responseExample: JSON.stringify({
      data: [
        {
          id: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
          name: 'Sophie Martin',
          email: 'sophie.martin@example.com',
          phone: '+33 6 12 34 56 78',
          tier: 'premium',
          score: 92,
          tags: ['photographe', 'regulier'],
        },
      ],
      pagination: { page: 1, limit: 20, total: 3 },
    }, null, 2),
    statusCode: 200,
  },
  {
    id: 'post-clients',
    method: 'POST',
    path: '/clients',
    description: 'Cree un nouveau client dans la base du studio.',
    category: 'Clients',
    params: [
      { name: 'name', type: 'string', required: true, description: 'Nom complet du client', location: 'body' },
      { name: 'email', type: 'string', required: false, description: 'Adresse e-mail', location: 'body' },
      { name: 'phone', type: 'string', required: false, description: 'Numero de telephone', location: 'body' },
      { name: 'company', type: 'string', required: false, description: 'Nom de l\'entreprise', location: 'body' },
      { name: 'tier', type: 'ClientTier', required: false, description: 'Niveau du client (defaut: standard)', location: 'body' },
      { name: 'tags', type: 'string[]', required: false, description: 'Tags associes au client', location: 'body' },
    ],
    requestExample: JSON.stringify({
      name: 'Sophie Martin',
      email: 'sophie.martin@example.com',
      phone: '+33 6 12 34 56 78',
      company: 'Studio Lumiere',
      tier: 'premium',
      tags: ['photographe', 'regulier'],
    }, null, 2),
    responseExample: JSON.stringify({
      id: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
      name: 'Sophie Martin',
      email: 'sophie.martin@example.com',
      tier: 'premium',
      score: 50,
      created_at: '2026-02-08T14:30:00Z',
    }, null, 2),
    statusCode: 201,
  },
  {
    id: 'put-clients',
    method: 'PUT',
    path: '/clients/:id',
    description: 'Met a jour les informations d\'un client existant.',
    category: 'Clients',
    params: [
      { name: 'id', type: 'string (UUID)', required: true, description: 'Identifiant du client', location: 'path' },
      { name: 'name', type: 'string', required: false, description: 'Nom mis a jour', location: 'body' },
      { name: 'email', type: 'string', required: false, description: 'Email mis a jour', location: 'body' },
      { name: 'phone', type: 'string', required: false, description: 'Telephone mis a jour', location: 'body' },
      { name: 'tier', type: 'ClientTier', required: false, description: 'Nouveau tier', location: 'body' },
    ],
    requestExample: JSON.stringify({
      tier: 'vip',
      phone: '+33 6 98 76 54 32',
    }, null, 2),
    responseExample: JSON.stringify({
      id: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
      name: 'Sophie Martin',
      tier: 'vip',
      updated_at: '2026-02-08T15:00:00Z',
    }, null, 2),
    statusCode: 200,
  },
  {
    id: 'delete-clients',
    method: 'DELETE',
    path: '/clients/:id',
    description: 'Supprime un client et anonymise les reservations associees.',
    category: 'Clients',
    params: [
      { name: 'id', type: 'string (UUID)', required: true, description: 'Identifiant du client a supprimer', location: 'path' },
    ],
    requestExample: `DELETE ${API_BASE_URL}/clients/c1a2b3c4-d5e6-7890-abcd-ef1234567890`,
    responseExample: JSON.stringify({
      success: true,
      message: 'Client supprime avec succes',
    }, null, 2),
    statusCode: 200,
  },
  // Spaces
  {
    id: 'get-spaces',
    method: 'GET',
    path: '/spaces',
    description: 'Recupere la liste des espaces du studio avec leurs tarifs et equipements.',
    category: 'Spaces',
    params: [
      { name: 'is_active', type: 'boolean', required: false, description: 'Filtrer par statut actif/inactif', location: 'query' },
    ],
    requestExample: `GET ${API_BASE_URL}/spaces?is_active=true`,
    responseExample: JSON.stringify({
      data: [
        {
          id: 's1a2b3c4-d5e6-7890-abcd-ef1234567890',
          name: 'Studio A - Cyclorama',
          capacity: 15,
          hourly_rate: 150.00,
          half_day_rate: 500.00,
          full_day_rate: 900.00,
          is_active: true,
          amenities: ['cyclorama', 'eclairage_studio', 'vestiaire'],
        },
      ],
    }, null, 2),
    statusCode: 200,
  },
  {
    id: 'post-spaces',
    method: 'POST',
    path: '/spaces',
    description: 'Cree un nouvel espace dans le studio.',
    category: 'Spaces',
    params: [
      { name: 'name', type: 'string', required: true, description: 'Nom de l\'espace', location: 'body' },
      { name: 'hourly_rate', type: 'number', required: true, description: 'Tarif horaire en EUR', location: 'body' },
      { name: 'capacity', type: 'number', required: false, description: 'Capacite maximale (defaut: 10)', location: 'body' },
      { name: 'half_day_rate', type: 'number', required: false, description: 'Tarif demi-journee', location: 'body' },
      { name: 'full_day_rate', type: 'number', required: false, description: 'Tarif journee complete', location: 'body' },
      { name: 'amenities', type: 'string[]', required: false, description: 'Liste des equipements disponibles', location: 'body' },
    ],
    requestExample: JSON.stringify({
      name: 'Studio B - Plateau video',
      hourly_rate: 200.00,
      capacity: 20,
      half_day_rate: 700.00,
      full_day_rate: 1200.00,
      amenities: ['fond_vert', 'eclairage_led', 'sono'],
    }, null, 2),
    responseExample: JSON.stringify({
      id: 's2b3c4d5-e6f7-8901-bcde-f12345678901',
      name: 'Studio B - Plateau video',
      hourly_rate: 200.00,
      is_active: true,
      created_at: '2026-02-08T14:30:00Z',
    }, null, 2),
    statusCode: 201,
  },
  {
    id: 'put-spaces',
    method: 'PUT',
    path: '/spaces/:id',
    description: 'Met a jour les informations d\'un espace.',
    category: 'Spaces',
    params: [
      { name: 'id', type: 'string (UUID)', required: true, description: 'Identifiant de l\'espace', location: 'path' },
      { name: 'name', type: 'string', required: false, description: 'Nouveau nom', location: 'body' },
      { name: 'hourly_rate', type: 'number', required: false, description: 'Nouveau tarif horaire', location: 'body' },
      { name: 'is_active', type: 'boolean', required: false, description: 'Activer/desactiver l\'espace', location: 'body' },
    ],
    requestExample: JSON.stringify({
      hourly_rate: 175.00,
      is_active: true,
    }, null, 2),
    responseExample: JSON.stringify({
      id: 's1a2b3c4-d5e6-7890-abcd-ef1234567890',
      name: 'Studio A - Cyclorama',
      hourly_rate: 175.00,
      updated_at: '2026-02-08T15:00:00Z',
    }, null, 2),
    statusCode: 200,
  },
  // Equipment
  {
    id: 'get-equipment',
    method: 'GET',
    path: '/equipment',
    description: 'Recupere la liste des equipements avec leur statut et disponibilite.',
    category: 'Equipment',
    params: [
      { name: 'status', type: 'EquipmentStatus', required: false, description: 'Filtrer par statut: available, reserved, in_use, maintenance, retired', location: 'query' },
      { name: 'category', type: 'string', required: false, description: 'Filtrer par categorie d\'equipement', location: 'query' },
    ],
    requestExample: `GET ${API_BASE_URL}/equipment?status=available&category=eclairage`,
    responseExample: JSON.stringify({
      data: [
        {
          id: 'e1a2b3c4-d5e6-7890-abcd-ef1234567890',
          name: 'Profoto B10 Plus',
          category: 'eclairage',
          brand: 'Profoto',
          status: 'available',
          hourly_rate: 25.00,
          condition: 95,
        },
      ],
    }, null, 2),
    statusCode: 200,
  },
  {
    id: 'post-equipment',
    method: 'POST',
    path: '/equipment',
    description: 'Ajoute un nouvel equipement a l\'inventaire du studio.',
    category: 'Equipment',
    params: [
      { name: 'name', type: 'string', required: true, description: 'Nom de l\'equipement', location: 'body' },
      { name: 'category', type: 'string', required: true, description: 'Categorie (eclairage, camera, son, etc.)', location: 'body' },
      { name: 'brand', type: 'string', required: false, description: 'Marque', location: 'body' },
      { name: 'model', type: 'string', required: false, description: 'Modele', location: 'body' },
      { name: 'serial_number', type: 'string', required: false, description: 'Numero de serie', location: 'body' },
      { name: 'hourly_rate', type: 'number', required: false, description: 'Tarif horaire de location', location: 'body' },
    ],
    requestExample: JSON.stringify({
      name: 'Profoto B10 Plus',
      category: 'eclairage',
      brand: 'Profoto',
      model: 'B10 Plus',
      serial_number: 'PB10-2026-001',
      hourly_rate: 25.00,
    }, null, 2),
    responseExample: JSON.stringify({
      id: 'e2b3c4d5-e6f7-8901-bcde-f12345678901',
      name: 'Profoto B10 Plus',
      status: 'available',
      condition: 100,
      created_at: '2026-02-08T14:30:00Z',
    }, null, 2),
    statusCode: 201,
  },
  {
    id: 'put-equipment',
    method: 'PUT',
    path: '/equipment/:id',
    description: 'Met a jour les informations d\'un equipement.',
    category: 'Equipment',
    params: [
      { name: 'id', type: 'string (UUID)', required: true, description: 'Identifiant de l\'equipement', location: 'path' },
      { name: 'status', type: 'EquipmentStatus', required: false, description: 'Nouveau statut', location: 'body' },
      { name: 'condition', type: 'number', required: false, description: 'Etat (0-100)', location: 'body' },
      { name: 'hourly_rate', type: 'number', required: false, description: 'Nouveau tarif horaire', location: 'body' },
    ],
    requestExample: JSON.stringify({
      status: 'maintenance',
      condition: 70,
    }, null, 2),
    responseExample: JSON.stringify({
      id: 'e1a2b3c4-d5e6-7890-abcd-ef1234567890',
      name: 'Profoto B10 Plus',
      status: 'maintenance',
      condition: 70,
      updated_at: '2026-02-08T15:00:00Z',
    }, null, 2),
    statusCode: 200,
  },
  // Packs
  {
    id: 'get-packs',
    method: 'GET',
    path: '/packs',
    description: 'Recupere la liste des packs, abonnements et certificats cadeaux.',
    category: 'Packs',
    params: [
      { name: 'type', type: 'PricingProductType', required: false, description: 'Filtrer par type: pack, subscription, gift_certificate', location: 'query' },
      { name: 'is_active', type: 'boolean', required: false, description: 'Filtrer par statut actif', location: 'query' },
    ],
    requestExample: `GET ${API_BASE_URL}/packs?type=pack&is_active=true`,
    responseExample: JSON.stringify({
      data: [
        {
          id: 'p1a2b3c4-d5e6-7890-abcd-ef1234567890',
          name: 'Pack Decouverte - 10h',
          type: 'pack',
          price: 1200.00,
          credits_included: 10,
          valid_days: 365,
          is_active: true,
          is_featured: true,
        },
      ],
    }, null, 2),
    statusCode: 200,
  },
  {
    id: 'post-packs',
    method: 'POST',
    path: '/packs',
    description: 'Cree un nouveau pack ou produit tarifaire.',
    category: 'Packs',
    params: [
      { name: 'name', type: 'string', required: true, description: 'Nom du pack', location: 'body' },
      { name: 'type', type: 'PricingProductType', required: true, description: 'Type: pack, subscription, gift_certificate', location: 'body' },
      { name: 'price', type: 'number', required: true, description: 'Prix en EUR', location: 'body' },
      { name: 'credits_included', type: 'number', required: false, description: 'Nombre de credits inclus', location: 'body' },
      { name: 'valid_days', type: 'number', required: false, description: 'Duree de validite en jours', location: 'body' },
      { name: 'billing_period', type: 'BillingPeriod', required: false, description: 'Periode de facturation (once, monthly, quarterly, yearly)', location: 'body' },
    ],
    requestExample: JSON.stringify({
      name: 'Pack Pro - 20h',
      type: 'pack',
      price: 2200.00,
      credits_included: 20,
      valid_days: 365,
      billing_period: 'once',
    }, null, 2),
    responseExample: JSON.stringify({
      id: 'p2b3c4d5-e6f7-8901-bcde-f12345678901',
      name: 'Pack Pro - 20h',
      type: 'pack',
      price: 2200.00,
      is_active: true,
      created_at: '2026-02-08T14:30:00Z',
    }, null, 2),
    statusCode: 201,
  },
  {
    id: 'put-packs',
    method: 'PUT',
    path: '/packs/:id',
    description: 'Met a jour un pack ou produit tarifaire existant.',
    category: 'Packs',
    params: [
      { name: 'id', type: 'string (UUID)', required: true, description: 'Identifiant du pack', location: 'path' },
      { name: 'name', type: 'string', required: false, description: 'Nouveau nom', location: 'body' },
      { name: 'price', type: 'number', required: false, description: 'Nouveau prix', location: 'body' },
      { name: 'is_active', type: 'boolean', required: false, description: 'Activer/desactiver', location: 'body' },
    ],
    requestExample: JSON.stringify({
      price: 2000.00,
      is_active: true,
    }, null, 2),
    responseExample: JSON.stringify({
      id: 'p1a2b3c4-d5e6-7890-abcd-ef1234567890',
      name: 'Pack Decouverte - 10h',
      price: 2000.00,
      updated_at: '2026-02-08T15:00:00Z',
    }, null, 2),
    statusCode: 200,
  },
  // Invoices
  {
    id: 'get-invoices',
    method: 'GET',
    path: '/invoices',
    description: 'Recupere la liste des factures avec options de filtrage par statut et client.',
    category: 'Invoices',
    params: [
      { name: 'page', type: 'number', required: false, description: 'Numero de page', location: 'query' },
      { name: 'limit', type: 'number', required: false, description: 'Resultats par page', location: 'query' },
      { name: 'status', type: 'InvoiceStatus', required: false, description: 'Filtrer par statut: draft, sent, paid, overdue, cancelled', location: 'query' },
      { name: 'client_id', type: 'string', required: false, description: 'Filtrer par client', location: 'query' },
    ],
    requestExample: `GET ${API_BASE_URL}/invoices?status=paid&limit=20`,
    responseExample: JSON.stringify({
      data: [
        {
          id: 'i1a2b3c4-d5e6-7890-abcd-ef1234567890',
          invoice_number: 'INV-2026-0042',
          status: 'paid',
          total_amount: 450.00,
          paid_amount: 450.00,
          issue_date: '2026-02-01',
          due_date: '2026-03-01',
          client_id: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
        },
      ],
      pagination: { page: 1, limit: 20, total: 156 },
    }, null, 2),
    statusCode: 200,
  },
  {
    id: 'post-invoices',
    method: 'POST',
    path: '/invoices',
    description: 'Cree une nouvelle facture. Peut etre liee a une reservation existante.',
    category: 'Invoices',
    params: [
      { name: 'client_id', type: 'string (UUID)', required: true, description: 'Identifiant du client', location: 'body' },
      { name: 'invoice_number', type: 'string', required: true, description: 'Numero de facture unique', location: 'body' },
      { name: 'issue_date', type: 'string (YYYY-MM-DD)', required: true, description: 'Date d\'emission', location: 'body' },
      { name: 'due_date', type: 'string (YYYY-MM-DD)', required: true, description: 'Date d\'echeance', location: 'body' },
      { name: 'booking_id', type: 'string (UUID)', required: false, description: 'Reservation associee', location: 'body' },
      { name: 'subtotal', type: 'number', required: false, description: 'Montant HT', location: 'body' },
      { name: 'tax_amount', type: 'number', required: false, description: 'Montant de la TVA', location: 'body' },
      { name: 'notes', type: 'string', required: false, description: 'Notes de facturation', location: 'body' },
    ],
    requestExample: JSON.stringify({
      client_id: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
      invoice_number: 'INV-2026-0043',
      issue_date: '2026-02-08',
      due_date: '2026-03-08',
      subtotal: 375.00,
      tax_amount: 75.00,
      booking_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    }, null, 2),
    responseExample: JSON.stringify({
      id: 'i2b3c4d5-e6f7-8901-bcde-f12345678901',
      invoice_number: 'INV-2026-0043',
      status: 'draft',
      total_amount: 450.00,
      created_at: '2026-02-08T14:30:00Z',
    }, null, 2),
    statusCode: 201,
  },
  // Auth
  {
    id: 'post-auth-login',
    method: 'POST',
    path: '/auth/login',
    description: 'Authentifie un utilisateur et retourne un token JWT valide 24 heures.',
    category: 'Auth',
    params: [
      { name: 'email', type: 'string', required: true, description: 'Adresse e-mail de l\'utilisateur', location: 'body' },
      { name: 'password', type: 'string', required: true, description: 'Mot de passe', location: 'body' },
    ],
    requestExample: JSON.stringify({
      email: 'admin@monStudio.com',
      password: '********',
    }, null, 2),
    responseExample: JSON.stringify({
      access_token: 'eyJhbGciOiJIUzI1NiIs...',
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        id: 'u1a2b3c4-d5e6-7890-abcd-ef1234567890',
        email: 'admin@monStudio.com',
        role: 'owner',
      },
    }, null, 2),
    statusCode: 200,
  },
  {
    id: 'post-auth-register',
    method: 'POST',
    path: '/auth/register',
    description: 'Cree un nouveau compte utilisateur et un studio associe.',
    category: 'Auth',
    params: [
      { name: 'email', type: 'string', required: true, description: 'Adresse e-mail', location: 'body' },
      { name: 'password', type: 'string', required: true, description: 'Mot de passe (min 8 caracteres)', location: 'body' },
      { name: 'name', type: 'string', required: true, description: 'Nom complet', location: 'body' },
      { name: 'studio_name', type: 'string', required: true, description: 'Nom du studio', location: 'body' },
    ],
    requestExample: JSON.stringify({
      email: 'nouveau@studio.com',
      password: '********',
      name: 'Jean Dupont',
      studio_name: 'Studio Lumiere',
    }, null, 2),
    responseExample: JSON.stringify({
      access_token: 'eyJhbGciOiJIUzI1NiIs...',
      user: {
        id: 'u2b3c4d5-e6f7-8901-bcde-f12345678901',
        email: 'nouveau@studio.com',
        role: 'owner',
      },
      studio: {
        id: 'st2b3c4d5-e6f7-8901-bcde-f1234567890',
        name: 'Studio Lumiere',
      },
    }, null, 2),
    statusCode: 201,
  },
  {
    id: 'post-auth-logout',
    method: 'POST',
    path: '/auth/logout',
    description: 'Invalide le token d\'authentification actuel.',
    category: 'Auth',
    params: [],
    requestExample: `POST ${API_BASE_URL}/auth/logout\nAuthorization: Bearer eyJhbGciOiJIUzI1NiIs...`,
    responseExample: JSON.stringify({
      success: true,
      message: 'Deconnexion reussie',
    }, null, 2),
    statusCode: 200,
  },
];

const CATEGORIES = ['Bookings', 'Clients', 'Spaces', 'Equipment', 'Packs', 'Invoices', 'Auth'];

const SCHEMAS: Schema[] = [
  {
    name: 'Booking',
    fields: [
      { name: 'id', type: 'string (UUID)', optional: false },
      { name: 'title', type: 'string', optional: false },
      { name: 'status', type: 'BookingStatus', optional: false },
      { name: 'start_time', type: 'string (ISO 8601)', optional: false },
      { name: 'end_time', type: 'string (ISO 8601)', optional: false },
      { name: 'total_amount', type: 'number', optional: false },
      { name: 'paid_amount', type: 'number', optional: false },
      { name: 'space_id', type: 'string (UUID)', optional: false },
      { name: 'client_id', type: 'string (UUID)', optional: false },
      { name: 'description', type: 'string', optional: true },
      { name: 'notes', type: 'string', optional: true },
      { name: 'internal_notes', type: 'string', optional: true },
      { name: 'is_recurring', type: 'boolean', optional: false },
      { name: 'created_at', type: 'string (ISO 8601)', optional: false },
      { name: 'updated_at', type: 'string (ISO 8601)', optional: false },
    ],
  },
  {
    name: 'Client',
    fields: [
      { name: 'id', type: 'string (UUID)', optional: false },
      { name: 'name', type: 'string', optional: false },
      { name: 'email', type: 'string', optional: true },
      { name: 'phone', type: 'string', optional: true },
      { name: 'company', type: 'string', optional: true },
      { name: 'tier', type: 'ClientTier', optional: false },
      { name: 'score', type: 'number', optional: false },
      { name: 'tags', type: 'string[]', optional: false },
      { name: 'is_active', type: 'boolean', optional: false },
      { name: 'created_at', type: 'string (ISO 8601)', optional: false },
    ],
  },
  {
    name: 'Space',
    fields: [
      { name: 'id', type: 'string (UUID)', optional: false },
      { name: 'name', type: 'string', optional: false },
      { name: 'capacity', type: 'number', optional: false },
      { name: 'hourly_rate', type: 'number', optional: false },
      { name: 'half_day_rate', type: 'number', optional: true },
      { name: 'full_day_rate', type: 'number', optional: true },
      { name: 'color', type: 'string', optional: false },
      { name: 'is_active', type: 'boolean', optional: false },
      { name: 'amenities', type: 'string[]', optional: false },
      { name: 'images', type: 'string[]', optional: false },
    ],
  },
  {
    name: 'Equipment',
    fields: [
      { name: 'id', type: 'string (UUID)', optional: false },
      { name: 'name', type: 'string', optional: false },
      { name: 'category', type: 'string', optional: false },
      { name: 'brand', type: 'string', optional: true },
      { name: 'model', type: 'string', optional: true },
      { name: 'serial_number', type: 'string', optional: true },
      { name: 'status', type: 'EquipmentStatus', optional: false },
      { name: 'condition', type: 'number (0-100)', optional: false },
      { name: 'hourly_rate', type: 'number', optional: true },
      { name: 'daily_rate', type: 'number', optional: true },
    ],
  },
  {
    name: 'Invoice',
    fields: [
      { name: 'id', type: 'string (UUID)', optional: false },
      { name: 'invoice_number', type: 'string', optional: false },
      { name: 'status', type: 'InvoiceStatus', optional: false },
      { name: 'issue_date', type: 'string (YYYY-MM-DD)', optional: false },
      { name: 'due_date', type: 'string (YYYY-MM-DD)', optional: false },
      { name: 'subtotal', type: 'number', optional: false },
      { name: 'tax_amount', type: 'number', optional: false },
      { name: 'total_amount', type: 'number', optional: false },
      { name: 'paid_amount', type: 'number', optional: false },
      { name: 'client_id', type: 'string (UUID)', optional: false },
      { name: 'booking_id', type: 'string (UUID)', optional: true },
    ],
  },
  {
    name: 'Pack (PricingProduct)',
    fields: [
      { name: 'id', type: 'string (UUID)', optional: false },
      { name: 'name', type: 'string', optional: false },
      { name: 'type', type: 'PricingProductType', optional: false },
      { name: 'price', type: 'number', optional: false },
      { name: 'currency', type: 'string', optional: false },
      { name: 'billing_period', type: 'BillingPeriod', optional: false },
      { name: 'credits_included', type: 'number', optional: true },
      { name: 'valid_days', type: 'number', optional: true },
      { name: 'is_active', type: 'boolean', optional: false },
      { name: 'is_featured', type: 'boolean', optional: false },
    ],
  },
];

// --- Helpers ---

function getMethodClass(method: HttpMethod): string {
  switch (method) {
    case 'GET': return styles.methodGet;
    case 'POST': return styles.methodPost;
    case 'PUT': return styles.methodPut;
    case 'DELETE': return styles.methodDelete;
  }
}

function generateCurlCommand(endpoint: Endpoint, apiKey: string): string {
  const url = `${API_BASE_URL}${endpoint.path}`;
  const parts: string[] = [`curl -X ${endpoint.method} '${url}'`];
  parts.push(`  -H 'Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}'`);
  parts.push(`  -H 'Content-Type: application/json'`);

  if ((endpoint.method === 'POST' || endpoint.method === 'PUT') && endpoint.params.some(p => p.location === 'body')) {
    // Build a sample body from the request example
    const bodyParams = endpoint.params.filter(p => p.location === 'body');
    if (bodyParams.length > 0) {
      try {
        // Use the request example if it looks like JSON
        const parsed = JSON.parse(endpoint.requestExample);
        parts.push(`  -d '${JSON.stringify(parsed)}'`);
      } catch {
        // Not JSON, skip body
      }
    }
  }

  return parts.join(' \\\n');
}

function highlightJson(json: string): Array<{ text: string; className: string }> {
  const tokens: Array<{ text: string; className: string }> = [];
  // Simple tokenizer for JSON display
  const regex = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}[\],\s])/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(json)) !== null) {
    if (match[1] && match[2]) {
      // key
      tokens.push({ text: match[1], className: styles.jsonKey });
      tokens.push({ text: match[2], className: '' });
    } else if (match[1]) {
      // string value
      tokens.push({ text: match[1], className: styles.jsonString });
    } else if (match[3]) {
      // number
      tokens.push({ text: match[3], className: styles.jsonNumber });
    } else if (match[4]) {
      // boolean
      tokens.push({ text: match[4], className: styles.jsonBoolean });
    } else if (match[5]) {
      // null
      tokens.push({ text: match[5], className: styles.jsonNull });
    } else if (match[6]) {
      tokens.push({ text: match[6], className: '' });
    }
  }
  return tokens;
}

// --- Component ---

export function ApiDocs() {
  const [activeTab, setActiveTab] = useState<TabId>('endpoints');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(ENDPOINTS[0]?.id ?? null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(CATEGORIES));
  const [apiKey, setApiKey] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Try It state
  const [tryItBody, setTryItBody] = useState('');
  const [tryItUrl, setTryItUrl] = useState('');
  const [tryItResponse, setTryItResponse] = useState<string | null>(null);
  const [tryItLoading, setTryItLoading] = useState(false);

  const selectedEndpoint = useMemo(
    () => ENDPOINTS.find(e => e.id === selectedEndpointId) ?? null,
    [selectedEndpointId]
  );

  const filteredEndpoints = useMemo(() => {
    if (!searchQuery.trim()) return ENDPOINTS;
    const q = searchQuery.toLowerCase();
    return ENDPOINTS.filter(
      e =>
        e.path.toLowerCase().includes(q) ||
        e.method.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, Endpoint[]> = {};
    for (const cat of CATEGORIES) {
      const items = filteredEndpoints.filter(e => e.category === cat);
      if (items.length > 0) {
        groups[cat] = items;
      }
    }
    return groups;
  }, [filteredEndpoints]);

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  const handleSelectEndpoint = useCallback((endpoint: Endpoint) => {
    setSelectedEndpointId(endpoint.id);
    setTryItResponse(null);
    setTryItLoading(false);

    // Pre-fill try-it fields
    if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
      setTryItBody(endpoint.requestExample);
    } else {
      setTryItBody('');
    }
    setTryItUrl(`${API_BASE_URL}${endpoint.path}`);
  }, []);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      // Silently fail
    });
  }, []);

  const handleTryIt = useCallback(() => {
    if (!selectedEndpoint) return;
    setTryItLoading(true);
    // Mock response after delay
    setTimeout(() => {
      setTryItResponse(selectedEndpoint.responseExample);
      setTryItLoading(false);
    }, 800);
  }, [selectedEndpoint]);

  // --- Render helpers ---

  const renderMethodBadge = (method: HttpMethod) => (
    <span className={`${styles.methodBadge} ${getMethodClass(method)}`}>
      {method}
    </span>
  );

  const renderJsonHighlighted = (json: string) => {
    const tokens = highlightJson(json);
    return (
      <pre className={styles.codeContent}>
        {tokens.map((token, i) => (
          token.className
            ? <span key={i} className={token.className}>{token.text}</span>
            : token.text
        ))}
      </pre>
    );
  };

  const renderEndpointsTab = () => (
    <div className={styles.layout}>
      {/* Sidebar with endpoint list */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarSearch}>
          <div className={styles.searchBox}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Filtrer les endpoints..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.sidebarList}>
          {Object.entries(groupedEndpoints).map(([group, endpoints]) => (
            <div key={group} className={styles.endpointGroup}>
              <div
                className={styles.groupTitle}
                onClick={() => toggleGroup(group)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleGroup(group); }}
              >
                <span>{group}</span>
                <span className={styles.groupCount}>
                  {expandedGroups.has(group)
                    ? <ChevronDown size={14} />
                    : <ChevronRight size={14} />
                  }
                </span>
              </div>
              {expandedGroups.has(group) && (
                <ul className={styles.endpointList}>
                  {endpoints.map(endpoint => (
                    <li
                      key={endpoint.id}
                      className={`${styles.endpointItem} ${selectedEndpointId === endpoint.id ? styles.endpointItemActive : ''}`}
                      onClick={() => handleSelectEndpoint(endpoint)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleSelectEndpoint(endpoint); }}
                    >
                      {renderMethodBadge(endpoint.method)}
                      <span className={styles.endpointPath}>{endpoint.path}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main detail panel */}
      <div className={styles.mainPanel}>
        {/* API Key Section */}
        <div className={styles.apiKeySection}>
          <div className={styles.apiKeyHeader}>
            <span className={styles.apiKeyTitle}>
              <Key size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-2)' }} />
              Cle API
            </span>
          </div>
          <p className={styles.apiKeyDescription}>
            Entrez votre cle API pour pre-remplir les exemples et la commande cURL.
            Votre cle n&apos;est jamais envoyee ni stockee.
          </p>
          <div className={styles.apiKeyInputRow}>
            <input
              type="password"
              className={styles.apiKeyInput}
              placeholder="votre-cle-api-ici"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<Copy size={14} />}
              onClick={() => handleCopy(apiKey, 'api-key')}
              disabled={!apiKey}
            >
              Copier
            </Button>
          </div>
          <div className={styles.baseUrlDisplay}>
            <span className={styles.baseUrlLabel}>Base URL</span>
            <span className={styles.baseUrlValue}>{API_BASE_URL}</span>
          </div>
        </div>

        {/* Endpoint Detail */}
        {selectedEndpoint ? (
          <div className={styles.endpointDetail}>
            {/* Header */}
            <div className={styles.endpointDetailHeader}>
              {renderMethodBadge(selectedEndpoint.method)}
              <span className={styles.endpointDetailPath}>{selectedEndpoint.path}</span>
              <span className={styles.endpointStatusCode}>
                {selectedEndpoint.statusCode} {selectedEndpoint.statusCode === 200 ? 'OK' : 'Created'}
              </span>
            </div>

            {/* Description */}
            <div className={styles.endpointDetailDescription}>
              {selectedEndpoint.description}
            </div>

            {/* Parameters */}
            {selectedEndpoint.params.length > 0 && (
              <div className={styles.paramsSection}>
                <div className={styles.sectionLabel}>Parametres</div>
                <table className={styles.paramsTable}>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Type</th>
                      <th>Requis</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEndpoint.params.map(param => (
                      <tr key={param.name}>
                        <td>
                          <span className={styles.paramName}>{param.name}</span>
                        </td>
                        <td>
                          <span className={styles.paramType}>{param.type}</span>
                        </td>
                        <td>
                          {param.required ? (
                            <span className={styles.paramRequired}>Requis</span>
                          ) : (
                            <span className={styles.paramOptional}>Optionnel</span>
                          )}
                        </td>
                        <td>
                          <span className={styles.paramDescription}>{param.description}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Request Example */}
            <div className={styles.codeSection}>
              <div className={styles.codeHeader}>
                <span className={styles.sectionLabel}>Exemple de requete</span>
                <button
                  className={`${styles.copyBtn} ${copiedId === `req-${selectedEndpoint.id}` ? styles.copiedBtn : ''}`}
                  onClick={() => handleCopy(selectedEndpoint.requestExample, `req-${selectedEndpoint.id}`)}
                >
                  {copiedId === `req-${selectedEndpoint.id}` ? <Check size={12} /> : <Copy size={12} />}
                  {copiedId === `req-${selectedEndpoint.id}` ? 'Copie' : 'Copier'}
                </button>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeBlockHeader}>
                  <span className={styles.codeBlockLabel}>
                    {selectedEndpoint.method === 'GET' || selectedEndpoint.method === 'DELETE' ? 'HTTP' : 'JSON'}
                  </span>
                </div>
                {(() => {
                  try {
                    JSON.parse(selectedEndpoint.requestExample);
                    return renderJsonHighlighted(selectedEndpoint.requestExample);
                  } catch {
                    return <pre className={styles.codeContent}>{selectedEndpoint.requestExample}</pre>;
                  }
                })()}
              </div>
            </div>

            {/* Response Example */}
            <div className={styles.codeSection}>
              <div className={styles.codeHeader}>
                <span className={styles.sectionLabel}>Exemple de reponse</span>
                <button
                  className={`${styles.copyBtn} ${copiedId === `res-${selectedEndpoint.id}` ? styles.copiedBtn : ''}`}
                  onClick={() => handleCopy(selectedEndpoint.responseExample, `res-${selectedEndpoint.id}`)}
                >
                  {copiedId === `res-${selectedEndpoint.id}` ? <Check size={12} /> : <Copy size={12} />}
                  {copiedId === `res-${selectedEndpoint.id}` ? 'Copie' : 'Copier'}
                </button>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeBlockHeader}>
                  <span className={styles.codeBlockLabel}>
                    JSON &mdash; {selectedEndpoint.statusCode} {selectedEndpoint.statusCode === 200 ? 'OK' : 'Created'}
                  </span>
                </div>
                {renderJsonHighlighted(selectedEndpoint.responseExample)}
              </div>
            </div>

            {/* cURL */}
            <div className={styles.curlSection}>
              <div className={styles.codeHeader}>
                <span className={styles.sectionLabel}>
                  <Terminal size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-1)' }} />
                  cURL
                </span>
                <button
                  className={`${styles.copyBtn} ${copiedId === `curl-${selectedEndpoint.id}` ? styles.copiedBtn : ''}`}
                  onClick={() => handleCopy(generateCurlCommand(selectedEndpoint, apiKey), `curl-${selectedEndpoint.id}`)}
                >
                  {copiedId === `curl-${selectedEndpoint.id}` ? <Check size={12} /> : <Copy size={12} />}
                  {copiedId === `curl-${selectedEndpoint.id}` ? 'Copie' : 'Copier cURL'}
                </button>
              </div>
              <div className={styles.codeBlock}>
                <div className={styles.codeBlockHeader}>
                  <span className={styles.codeBlockLabel}>Terminal</span>
                </div>
                <pre className={styles.codeContent}>{generateCurlCommand(selectedEndpoint, apiKey)}</pre>
              </div>
            </div>

            {/* Try It */}
            <div className={styles.tryItSection}>
              <div className={styles.sectionLabel}>
                <Play size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-1)' }} />
                Tester (simulation)
              </div>
              <div className={styles.tryItForm}>
                <div className={styles.tryItField}>
                  <label className={styles.tryItLabel} htmlFor="try-it-url">URL</label>
                  <input
                    id="try-it-url"
                    type="text"
                    className={styles.tryItInput}
                    value={tryItUrl || `${API_BASE_URL}${selectedEndpoint.path}`}
                    onChange={e => setTryItUrl(e.target.value)}
                  />
                </div>
                {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') && (
                  <div className={styles.tryItField}>
                    <label className={styles.tryItLabel} htmlFor="try-it-body">Corps de la requete (JSON)</label>
                    <textarea
                      id="try-it-body"
                      className={styles.tryItTextarea}
                      value={tryItBody || selectedEndpoint.requestExample}
                      onChange={e => setTryItBody(e.target.value)}
                    />
                  </div>
                )}
                <div className={styles.tryItActions}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Play size={14} />}
                    onClick={handleTryIt}
                    loading={tryItLoading}
                  >
                    Envoyer la requete
                  </Button>
                </div>
                {tryItResponse && (
                  <div className={styles.tryItResponse}>
                    <div className={styles.tryItResponseHeader}>
                      <span className={styles.sectionLabel}>Reponse</span>
                      <span className={styles.tryItStatusBadge}>
                        {selectedEndpoint.statusCode} {selectedEndpoint.statusCode === 200 ? 'OK' : 'Created'}
                      </span>
                    </div>
                    <div className={styles.codeBlock}>
                      <div className={styles.codeBlockHeader}>
                        <span className={styles.codeBlockLabel}>JSON</span>
                        <button
                          className={`${styles.copyBtn} ${copiedId === 'try-it-response' ? styles.copiedBtn : ''}`}
                          onClick={() => handleCopy(tryItResponse, 'try-it-response')}
                        >
                          {copiedId === 'try-it-response' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === 'try-it-response' ? 'Copie' : 'Copier'}
                        </button>
                      </div>
                      {renderJsonHighlighted(tryItResponse)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyDetail}>
            <FileCode size={48} />
            <h3 className={styles.emptyDetailTitle}>Selectionnez un endpoint</h3>
            <p className={styles.emptyDetailText}>
              Choisissez un endpoint dans la liste pour voir sa documentation.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSchemasTab = () => (
    <div className={styles.schemasGrid}>
      {SCHEMAS.map(schema => (
        <div key={schema.name} className={`${styles.schemaCard} ${styles.animateIn}`}>
          <div className={styles.schemaCardHeader}>
            <span className={styles.schemaCardTitle}>{schema.name}</span>
            <span className={styles.groupCount}>{schema.fields.length} champs</span>
          </div>
          <div className={styles.schemaCardBody}>
            {schema.fields.map(field => (
              <div key={field.name} className={styles.schemaFieldRow}>
                <span className={styles.schemaFieldName}>{field.name}</span>
                <span className={styles.schemaFieldType}>{field.type}</span>
                {field.optional && (
                  <span className={styles.schemaFieldOptional}>optionnel</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAuthTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-gap)' }}>
      <div className={styles.authSection}>
        <h3 className={styles.authTitle}>
          <Shield size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-2)' }} />
          Authentification par Bearer Token
        </h3>
        <p className={styles.authDescription}>
          L&apos;API Rooom OS utilise des tokens JWT pour l&apos;authentification. Chaque requete doit inclure
          un header Authorization avec votre token.
        </p>
        <div className={styles.authSteps}>
          <div className={styles.authStep}>
            <span className={styles.authStepNumber}>1</span>
            <div className={styles.authStepContent}>
              <div className={styles.authStepTitle}>Obtenir un token</div>
              <p className={styles.authStepText}>
                Envoyez une requete POST a <span className={styles.authCodeSnippet}>/auth/login</span> avec
                vos identifiants pour obtenir un token JWT valide 24 heures.
              </p>
            </div>
          </div>
          <div className={styles.authStep}>
            <span className={styles.authStepNumber}>2</span>
            <div className={styles.authStepContent}>
              <div className={styles.authStepTitle}>Inclure le token dans vos requetes</div>
              <p className={styles.authStepText}>
                Ajoutez le header suivant a chaque requete :
              </p>
              <div className={styles.codeBlock} style={{ marginTop: 'var(--space-2)' }}>
                <pre className={styles.codeContent}>Authorization: Bearer eyJhbGciOiJIUzI1NiIs...</pre>
              </div>
            </div>
          </div>
          <div className={styles.authStep}>
            <span className={styles.authStepNumber}>3</span>
            <div className={styles.authStepContent}>
              <div className={styles.authStepTitle}>Renouveler le token</div>
              <p className={styles.authStepText}>
                Le token expire apres 24 heures. Lorsque vous recevez une reponse 401,
                re-authentifiez-vous via <span className={styles.authCodeSnippet}>/auth/login</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.authSection}>
        <h3 className={styles.authTitle}>
          <Key size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-2)' }} />
          Cles API
        </h3>
        <p className={styles.authDescription}>
          Pour les integrations serveur-a-serveur, vous pouvez utiliser une cle API statique.
          Generez-la depuis la page Parametres de votre studio.
        </p>
        <div className={styles.codeBlock}>
          <div className={styles.codeBlockHeader}>
            <span className={styles.codeBlockLabel}>Header</span>
          </div>
          <pre className={styles.codeContent}>X-API-Key: votre-cle-api-ici</pre>
        </div>
      </div>

      <div className={styles.authSection}>
        <h3 className={styles.authTitle}>Codes d&apos;erreur</h3>
        <p className={styles.authDescription}>
          L&apos;API retourne des codes HTTP standards pour indiquer le resultat de la requete.
        </p>
        <table className={styles.paramsTable}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Signification</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className={styles.paramType}>200</span></td>
              <td><span className={styles.paramName}>OK</span></td>
              <td><span className={styles.paramDescription}>Requete traitee avec succes</span></td>
            </tr>
            <tr>
              <td><span className={styles.paramType}>201</span></td>
              <td><span className={styles.paramName}>Created</span></td>
              <td><span className={styles.paramDescription}>Ressource creee avec succes</span></td>
            </tr>
            <tr>
              <td><span className={styles.paramType}>400</span></td>
              <td><span className={styles.paramName}>Bad Request</span></td>
              <td><span className={styles.paramDescription}>Parametres invalides ou manquants</span></td>
            </tr>
            <tr>
              <td><span className={styles.paramType}>401</span></td>
              <td><span className={styles.paramName}>Unauthorized</span></td>
              <td><span className={styles.paramDescription}>Token invalide ou expire</span></td>
            </tr>
            <tr>
              <td><span className={styles.paramType}>403</span></td>
              <td><span className={styles.paramName}>Forbidden</span></td>
              <td><span className={styles.paramDescription}>Acces non autorise a cette ressource</span></td>
            </tr>
            <tr>
              <td><span className={styles.paramType}>404</span></td>
              <td><span className={styles.paramName}>Not Found</span></td>
              <td><span className={styles.paramDescription}>Ressource introuvable</span></td>
            </tr>
            <tr>
              <td><span className={styles.paramType}>409</span></td>
              <td><span className={styles.paramName}>Conflict</span></td>
              <td><span className={styles.paramDescription}>Conflit (espace deja reserve, etc.)</span></td>
            </tr>
            <tr>
              <td><span className={styles.paramType}>429</span></td>
              <td><span className={styles.paramName}>Too Many Requests</span></td>
              <td><span className={styles.paramDescription}>Limite de requetes depassee (100/min)</span></td>
            </tr>
            <tr>
              <td><span className={styles.paramType}>500</span></td>
              <td><span className={styles.paramName}>Server Error</span></td>
              <td><span className={styles.paramDescription}>Erreur interne du serveur</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <Header
        title="Documentation API"
        subtitle="Reference interactive de l'API Rooom OS"
      />

      <div className={styles.content}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'endpoints' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('endpoints')}
          >
            <Book size={16} />
            Endpoints
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'schemas' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('schemas')}
          >
            <FileCode size={16} />
            Schemas
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'authentication' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('authentication')}
          >
            <Shield size={16} />
            Authentification
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: 'var(--card-gap)' }}>
          {activeTab === 'endpoints' && renderEndpointsTab()}
          {activeTab === 'schemas' && renderSchemasTab()}
          {activeTab === 'authentication' && renderAuthTab()}
        </div>
      </div>
    </div>
  );
}
