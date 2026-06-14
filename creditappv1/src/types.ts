/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CreditType = 'DETTE' | 'PRET';

export interface Credit {
  id: string;
  nom: string;
  prenom: string;
  montant: number; // in MAD (Moroccan Dirham)
  type: CreditType;
  dateCreation: string; // ISO date string (YYYY-MM-DD)
  dateEcheance: string; // ISO date string (YYYY-MM-DD)
  description?: string;
  paye: boolean;
  notified?: boolean;
}

export interface AndroidFileStructure {
  name: string;
  path: string;
  language: 'kotlin' | 'xml' | 'groovy';
  code: string;
  description: string;
}
