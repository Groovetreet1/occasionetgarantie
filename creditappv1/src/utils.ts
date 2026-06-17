/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Credit } from './types';

// Predefined mock credits for rich visual demonstration aligned with 2026-05-24 local time.
export const initialCredits: Credit[] = [
  {
    id: 'c1',
    nom: 'Alami',
    prenom: 'Karim',
    montant: 4500,
    type: 'DETTE', // I owe him
    dateCreation: '2026-05-10',
    dateEcheance: '2026-05-26', // In 2 days (48h alert!)
    description: 'Achat de matériel informatique au souk de Casablanca.',
    paye: false,
  },
  {
    id: 'c2',
    nom: 'Zahra',
    prenom: 'Fatima',
    montant: 8500,
    type: 'PRET', // She owes me
    dateCreation: '2026-05-15',
    dateEcheance: '2026-05-24', // Today! (Jour J alert)
    description: 'Avance pour commande de tissus artisanaux de Fès.',
    paye: false,
  },
  {
    id: 'c3',
    nom: 'Bennani',
    prenom: 'Youssef',
    montant: 2300,
    type: 'PRET', // He owes me
    dateCreation: '2026-04-20',
    dateEcheance: '2026-06-15', // Normal future
    description: 'Participation événementiel et logistique traiteur.',
    paye: false,
  },
  {
    id: 'c4',
    nom: 'Chraibi',
    prenom: 'Sophia',
    montant: 3200,
    type: 'DETTE', // I owed her
    dateCreation: '2026-05-01',
    dateEcheance: '2026-05-18', // Past date, but paid!
    description: 'Remboursement frais de déplacement Marrakech.',
    paye: true,
  }
];

export function formatMAD(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateString(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function getDaysRemaining(dueDateStr: string, creationDateStr: string = '2026-05-24'): number {
  const current = new Date(creationDateStr);
  const due = new Date(dueDateStr);
  
  // Set times to midnight to calculate pure days difference
  current.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - current.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
