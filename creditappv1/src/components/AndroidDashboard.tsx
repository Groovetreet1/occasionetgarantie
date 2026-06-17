/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Credit, CreditType } from '../types';
import { initialCredits, formatMAD, formatDateString, getDaysRemaining } from '../utils';
import { 
  PiggyBank, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  Plus, 
  Calendar, 
  Bell, 
  CheckCircle2, 
  X, 
  Check, 
  Search, 
  Sparkles,
  Smartphone,
  BookOpen,
  ArrowUpDown,
  Filter,
  CheckCircle,
  AlertTriangle,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import AndroidCodeViewer from './AndroidCodeViewer';

export default function AndroidDashboard() {
  // Sync state with localstorage
  const [credits, setCredits] = useState<Credit[]>(() => {
    const saved = localStorage.getItem('mad_credits_data');
    return saved ? JSON.parse(saved) : initialCredits;
  });

  // Dark/Light mode within the phone/app preview
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // App interior navigation
  const [currentTab, setCurrentTab] = useState<'home' | 'add' | 'calendar' | 'notifications'>('home');

  // Interactive filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DETTE' | 'PRET'>('ALL');
  const [filterPaye, setFilterPaye] = useState<'ALL' | 'EN_COURS' | 'PAYE'>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_ECHEANCE' | 'MONTANT'>('DATE_ECHEANCE');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Form states
  const [formNom, setFormNom] = useState('');
  const [formPrenom, setFormPrenom] = useState('');
  const [formMontant, setFormMontant] = useState('');
  const [formType, setFormType] = useState<CreditType>('DETTE');
  const [formDateCreation, setFormDateCreation] = useState('2026-05-24'); // Today (by default based on prompt & metadata context)
  const [formDateEcheance, setFormDateEcheance] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Notifications Simulator States
  const [simulatedAlerts, setSimulatedAlerts] = useState<any[]>([]);
  const [systemToasts, setSystemToasts] = useState<any[]>([]);

  // Selected date on the Calendar view
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date(2026, 4)); // May 2026
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('mad_credits_data', JSON.stringify(credits));
    generateSimulatedAlerts();
  }, [credits]);

  // Handle active alerts generation (Jour J & 48h before)
  const generateSimulatedAlerts = () => {
    const alerts: any[] = [];
    credits.forEach((credit) => {
      if (credit.paye) return; // Skip paid loans/debts

      const daysLeft = getDaysRemaining(credit.dateEcheance, '2026-05-24');
      const label = `${credit.prenom} ${credit.nom}`;

      if (daysLeft === 0) {
        alerts.push({
          id: `alert-j-${credit.id}`,
          creditId: credit.id,
          title: "🔴 Échéance Aujourd'hui !",
          message: `Le crédit de ${formatMAD(credit.montant)} pour ${label} est arrivé à échéance le Jour J (${formatDateString(credit.dateEcheance)}).`,
          type: 'error',
          daysLeft,
          credit
        });
      } else if (daysLeft > 0 && daysLeft <= 2) {
        alerts.push({
          id: `alert-48h-${credit.id}`,
          creditId: credit.id,
          title: "⏰ Alerte 48 heures avant !",
          message: `Rappel critique : Le remboursement de ${formatMAD(credit.montant)} par/pour ${label} expire dans ${daysLeft} jour(s).`,
          type: 'warning',
          daysLeft,
          credit
        });
      }
    });

    setSimulatedAlerts(alerts);
  };

  // Generate simulated alerts on load 
  useEffect(() => {
    generateSimulatedAlerts();
  }, []);

  // Request browser local notification permission and dispatch
  const handleRequestAndTriggerRealNotification = (title: string, body: string) => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new window.Notification(title, {
            body,
            icon: '/favicon.ico',
          });
        }
      });
    }

    // Add visual in-app system toast fallback
    const newToast = { id: Date.now().toString(), title, body };
    setSystemToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setSystemToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  };

  // Quick Action to test native notification logic
  const triggerTestNotification = () => {
    handleRequestAndTriggerRealNotification(
      "📣 Maîtresse des Crédits MAD",
      "Simulateur Actif ! Alarme planifiée 48h avant et Jour J pour tous vos prêts en Dirhams."
    );
  };

  // Trigger alert-specific notifications manually
  const triggerSpecificAlertNotification = (alert: any) => {
    handleRequestAndTriggerRealNotification(
      alert.title,
      alert.message
    );
  };

  // Adding a credit
  const handleAddCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNom.trim() || !formPrenom.trim()) {
      setFormError('Veuillez remplir le nom et le prénom.');
      return;
    }
    const amountNum = parseFloat(formMontant);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Le montant doit être un nombre supérieur à 0.');
      return;
    }
    if (!formDateEcheance) {
      setFormError("Veuillez sélectionner une date limite d'échéance.");
      return;
    }

    const newCredit: Credit = {
      id: 'cred-' + Date.now().toString(36),
      nom: formNom.trim(),
      prenom: formPrenom.trim(),
      montant: amountNum,
      type: formType,
      dateCreation: formDateCreation || '2026-05-24',
      dateEcheance: formDateEcheance,
      description: formDescription.trim() || undefined,
      paye: false
    };

    setCredits(prev => [newCredit, ...prev]);

    // Show simulated toast on successful addition
    const desc = newCredit.type === 'DETTE' ? 'dette ajoutée' : 'prêt enregistré';
    handleRequestAndTriggerRealNotification(
      "✅ Crédit créé avec succès !",
      `Crédit de ${formatMAD(newCredit.montant)} pour ${newCredit.prenom} enregistré. Alarme de rappel planifiée.`
    );

    // Reset Form & Switch Tab
    setFormNom('');
    setFormPrenom('');
    setFormMontant('');
    setFormDescription('');
    setFormDateEcheance('');
    setFormError('');
    setCurrentTab('home');
  };

  // Deleting credit with animation
  const handleDeleteCredit = (creditId: string) => {
    const credToDelete = credits.find(c => c.id === creditId);
    if (!credToDelete) return;

    setCredits(prev => prev.filter(c => c.id !== creditId));

    handleRequestAndTriggerRealNotification(
      "🗑️ Crédit supprimé",
      `Le fichier de crédit pour ${credToDelete.prenom} ${credToDelete.nom} a été supprimé des registres virtuels.`
    );
  };

  // Toggle paid status
  const handleTogglePaye = (creditId: string) => {
    setCredits(prev => prev.map(c => {
      if (c.id === creditId) {
        const nextPayeState = !c.paye;
        return { ...c, paye: nextPayeState };
      }
      return c;
    }));
  };

  // Calculations for Dashboards
  const totalDettes = credits.filter(c => !c.paye && c.type === 'DETTE').reduce((sum, c) => sum + c.montant, 0);
  const totalPrets = credits.filter(c => !c.paye && c.type === 'PRET').reduce((sum, c) => sum + c.montant, 0);
  const totalActif = totalPrets - totalDettes; // Net financial status under monitoring

  // Total absolute credits amount in progress
  const totalEnCoursAbsoluto = credits.filter(c => !c.paye).reduce((sum, c) => sum + c.montant, 0);

  // Sorting & Filtering logic for the main list
  const filteredCredits = credits.filter(c => {
    const matchSearch = `${c.prenom} ${c.nom} ${c.description || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'ALL' ? true : c.type === filterType;
    const matchStatus = filterPaye === 'ALL' 
      ? true 
      : filterPaye === 'PAYE' ? c.paye === true : c.paye === false;
    return matchSearch && matchType && matchStatus;
  }).sort((a, b) => {
    let check = 0;
    if (sortBy === 'DATE_ECHEANCE') {
      check = new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime();
    } else {
      check = a.montant - b.montant;
    }
    return sortOrder === 'ASC' ? check : -check;
  });

  // Recharts: Payé vs Non Payé Ratio Chart Data
  const payeCount = credits.filter(c => c.paye).length;
  const nonPayeCount = credits.filter(c => !c.paye).length;
  const payeRatioData = [
    { name: 'Remboursé', value: payeCount || 0, color: '#10B981' }, // Green
    { name: 'En cours', value: nonPayeCount || 0, color: '#EF4444' } // Red
  ];

  // Recharts: Distribution of active amounts by Person
  const activeCreditsMap: { [key: string]: number } = {};
  credits.filter(c => !c.paye).forEach(c => {
    const key = `${c.prenom} ${c.nom[0]}.`;
    activeCreditsMap[key] = (activeCreditsMap[key] || 0) + c.montant;
  });
  const distributionData = Object.keys(activeCreditsMap).map(key => ({
    name: key,
    montant: activeCreditsMap[key]
  })).slice(0, 5); // top 5 people

  // Materials & Calendar Generation for May 2026
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = [];
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Fill previous empty spaces
    const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align Mon-Sun
    for (let i = 0; i < adjustedFirstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentCalendarMonth);
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Identify calendar events / due dates
  const getCreditsDueOnDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return credits.filter(c => c.dateEcheance === dateStr);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-1 sm:px-4 py-8 font-sans">
      
      {/* Dynamic Native System Alert Popup overlay */}
      <AnimatePresence>
        {systemToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 border-2 border-emerald-500 text-white p-4 rounded-2xl shadow-2xl max-w-sm flex items-start space-x-3"
          >
            <div className="bg-emerald-950 p-2 rounded-xl">
              <Bell className="text-emerald-400" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-300">{toast.title}</p>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.body}</p>
            </div>
            <button 
              id={`close-system-toast-${toast.id}`}
              onClick={() => setSystemToasts(prev => prev.filter(t => t.id !== toast.id))} 
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main Header with dynamic Moroccan theme */}
      <header className="mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center justify-center sm:justify-start space-x-2.5">
            <span className="bg-gradient-to-tr from-slate-900 to-emerald-700 p-2.5 rounded-2xl text-white shadow-md">
              <span className="font-extrabold text-sm tracking-widest block">MAD</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Maîtresse des Crédits <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">MAD</span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-2 max-w-xl">
            Gestion intelligente, alarmes locales push adaptées au temps marocain et architecture Android Room.
          </p>
        </div>

        {/* Real-time configuration indicator */}
        <div className="flex items-center gap-3">
          <button 
            id="btn-simulate-alarm"
            onClick={triggerTestNotification}
            className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs py-2 px-3.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all"
          >
            <Bell size={14} className="animate-bounce" />
            <span>Tester Notification push</span>
          </button>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Aujourd'hui : 24 mai 2026
          </div>
        </div>
      </header>

      {/* Responsive layout: Grid combining Simulated Android Phone on left & Kotlin Code Panel on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Simulated Android Smartphone Frame (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          <div className="w-full max-w-[410px] bg-slate-950 p-3 rounded-[50px] shadow-2xl relative border-4 border-slate-850">
            {/* Phone Front Camera notch */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-950 rounded-full z-20 flex items-center justify-around px-4">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
              <div className="w-12 h-1 bg-slate-800 rounded" />
              <div className="w-2 h-2 rounded-full bg-blue-900/50" />
            </div>

            {/* Inner App Container hosting the Material 3 app */}
            <div className={`w-full rounded-[42px] overflow-hidden min-h-[660px] pb-4 transition-colors duration-300 relative ${
              isDarkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
            }`}>
              
              {/* App Status Bar */}
              <div className={`px-6 pt-5 pb-2 flex justify-between items-center text-[11px] font-mono font-bold tracking-tight select-none ${
                isDarkMode ? 'text-slate-400 bg-slate-950/20' : 'text-slate-600 bg-slate-100/30'
              }`}>
                <span>18:46 🇲🇦</span>
                <div className="flex items-center space-x-1.5">
                  <span>5G</span>
                  <div className={`w-5 h-2.5 border rounded-sm p-0.5 flex items-center ${isDarkMode ? 'border-slate-400' : 'border-slate-600'}`}>
                    <div className={`w-3 h-full rounded-2xs ${isDarkMode ? 'bg-slate-100' : 'bg-slate-900'}`} />
                  </div>
                </div>
              </div>

              {/* App Action/Theme Bar */}
              <div className={`px-5 py-3.5 flex justify-between items-center border-b ${
                isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white/40'
              }`}>
                <div className="flex items-center space-x-1.5">
                  <Sparkles size={16} className="text-emerald-500" />
                  <span className="text-xs font-black tracking-wide uppercase font-sans">
                    MAD Crédits
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Theme Switcher within phone */}
                  <button 
                    id="btn-phone-theme-toggle"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-1.5 rounded-full transition-all ${
                      isDarkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-white shadow text-slate-700 hover:bg-slate-100'
                    }`}
                    title="Changer de thème de l'application"
                  >
                    {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                  </button>

                  <button
                    id="btn-phone-notif-tab"
                    onClick={() => setCurrentTab('notifications')}
                    className="p-1.5 rounded-full relative bg-slate-800/10 hover:bg-slate-800/30 text-slate-400 transition-all"
                  >
                    <Bell size={14} className={simulatedAlerts.length > 0 ? "text-rose-500 animate-pulse" : ""} />
                    {simulatedAlerts.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 text-[8px] font-bold text-white flex items-center justify-center rounded-full">
                        {simulatedAlerts.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* App Content Window */}
              <div className="px-4 py-3 h-[500px] overflow-y-auto scrollbar-none">
                
                {/* Simulated Alert Notification Banner Inside App */}
                {simulatedAlerts.length > 0 && currentTab !== 'notifications' && (
                  <button
                    id="btn-dismiss-app-banner"
                    onClick={() => setCurrentTab('notifications')}
                    className="w-full mb-3 p-2.5 rounded-xl text-left flex items-center justify-between text-xs font-medium cursor-pointer transition-all duration-200 border bg-rose-950/20 border-rose-800 text-rose-300"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                      <span className="truncate">Vous avez {simulatedAlerts.length} échéance(s) critique(s)</span>
                    </div>
                    <span className="text-[10px] bg-rose-900 text-white font-bold px-2 py-0.5 rounded-lg shrink-0 ml-1">
                      Voir
                    </span>
                  </button>
                )}

                {/* TAB 1: DOUSE - INTERACTIVE DASHBOARD */}
                {currentTab === 'home' && (
                  <div className="space-y-4 text-left">
                    
                    {/* Material 3 Styled Wallet Balance Card */}
                    <div className="relative rounded-2xl overflow-hidden p-4 text-white bg-gradient-to-tr from-slate-900 via-slate-850 to-emerald-800 shadow-lg">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <PiggyBank size={90} />
                      </div>

                      <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                        MONITORING ACTIF (MAD)
                      </p>
                      <h3 className="text-2xl font-black mt-1 tracking-tight">
                        {formatMAD(totalActif)}
                      </h3>
                      
                      <div className="mt-3.5 grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
                        <div>
                          <p className="text-[9px] text-slate-405 text-rose-300 flex items-center gap-1">
                            <TrendingDown size={10} /> Dettes (Je dois)
                          </p>
                          <p className="text-xs font-black text-rose-300 mt-0.5">
                            {formatMAD(totalDettes)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-emerald-400 flex items-center justify-end gap-1">
                            <TrendingUp size={10} /> Prêts (On me doit)
                          </p>
                          <p className="text-xs font-black text-emerald-300 mt-0.5">
                            {formatMAD(totalPrets)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Recharts Pie Chart in app interior */}
                    <div className={`p-3.5 rounded-2xl border ${
                      isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <p className={`text-[11px] font-bold mb-2 uppercase tracking-wide tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        📊 Ratio de Remboursement
                      </p>

                      {credits.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">Aucune donnée pour générer le graphique.</p>
                      ) : (
                        <div className="h-28 w-full flex items-center justify-between">
                          <div className="w-[100px] h-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={payeRatioData}
                                  innerRadius={28}
                                  outerRadius={40}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {payeRatioData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          {/* Mini Custom Legend */}
                          <div className="flex-1 pl-4 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 text-emerald-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                Remboursés
                              </span>
                              <span className="font-bold">{payeCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 text-rose-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                En cours
                              </span>
                              <span className="font-bold">{nonPayeCount}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Filter and Sorting Options inside the Android Phone */}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        <button
                          id="btn-filter-all"
                          onClick={() => setFilterType('ALL')}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                            filterType === 'ALL' 
                              ? 'bg-emerald-600 text-white' 
                              : isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          Tout ({credits.length})
                        </button>
                        <button
                          id="btn-filter-dette"
                          onClick={() => setFilterType('DETTE')}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                            filterType === 'DETTE' 
                              ? 'bg-rose-600 text-white' 
                              : isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          Dettes
                        </button>
                        <button
                          id="btn-filter-pret"
                          onClick={() => setFilterType('PRET')}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                            filterType === 'PRET' 
                              ? 'bg-emerald-600 text-white' 
                              : isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          Prêts
                        </button>
                      </div>

                      <div className="flex gap-2 items-center">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <input
                            id="input-inline-search"
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-7 pr-2.5 py-1.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                              isDarkMode 
                                ? 'bg-slate-900/80 border-slate-800 text-white placeholder-slate-500' 
                                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                            }`}
                          />
                          <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                          {searchQuery && (
                            <button
                              id="btn-clear-inline-search"
                              onClick={() => setSearchQuery('')}
                              className="absolute right-2 top-2.5 text-slate-400 hover:text-white"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>

                        {/* Order toggler */}
                        <button
                          id="btn-toggle-sort-order"
                          onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                          className={`p-2 rounded-xl border transition-all ${
                            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100'
                          }`}
                          title="Changer l'ordre de tri"
                        >
                          <ArrowUpDown size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Credits List Area */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          DÉTAIL DES ÉCHÉANCES
                        </span>
                        
                        <button 
                          id="btn-toggle-sort-key"
                          onClick={() => setSortBy(prev => prev === 'DATE_ECHEANCE' ? 'MONTANT' : 'DATE_ECHEANCE')}
                          className="text-[10px] text-emerald-400 flex items-center gap-1 underline"
                        >
                          Trier par : {sortBy === 'DATE_ECHEANCE' ? 'Échéance' : 'Montant'}
                        </button>
                      </div>

                      {filteredCredits.length === 0 ? (
                        <div className={`p-6 rounded-xl text-center text-xs text-slate-405 border-2 border-dashed ${
                          isDarkMode ? 'border-slate-800' : 'border-slate-205'
                        }`}>
                          Aucune transaction trouvée.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          <AnimatePresence initial={false}>
                            {filteredCredits.map((credit) => {
                              const daysLeft = getDaysRemaining(credit.dateEcheance, '2026-05-24');
                              const isOverdue = daysLeft < 0 && !credit.paye;
                              const isClose = daysLeft >= 0 && daysLeft <= 2 && !credit.paye;
                              
                              return (
                                <motion.div
                                  layout
                                  key={credit.id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, x: -100 }}
                                  className={`p-3 rounded-xl border transition-all flex items-center justify-between group ${
                                    credit.paye 
                                      ? (isDarkMode ? 'bg-slate-900/35 border-slate-800 text-slate-400 line-through opacity-70' : 'bg-slate-100/70 border-slate-200 text-slate-500 line-through opacity-75')
                                      : isOverdue
                                        ? (isDarkMode ? 'bg-rose-955/30 border-rose-900/60' : 'bg-rose-50 border-rose-100')
                                        : isClose
                                          ? (isDarkMode ? 'bg-amber-955/35 border-amber-800/80 text-amber-100' : 'bg-amber-50 border-amber-100 text-amber-900')
                                          : (isDarkMode ? 'bg-slate-900/85 border-slate-805' : 'bg-white border-slate-200 shadow-sm')
                                  }`}
                                >
                                  {/* Left Details */}
                                  <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`text-xs font-bold truncate ${credit.paye ? 'text-slate-500' : (isDarkMode ? 'text-white' : 'text-slate-900')}`}>
                                        {credit.prenom} {credit.nom}
                                      </span>
                                      
                                      {/* Mini Type Badge */}
                                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                                        credit.paye 
                                          ? 'bg-slate-800/40 text-slate-500'
                                          : credit.type === 'DETTE' ? 'bg-rose-900/40 text-rose-300' : 'bg-emerald-900/40 text-emerald-300'
                                      }`}>
                                        {credit.type === 'DETTE' ? 'Doit' : 'Prêt'}
                                      </span>
                                    </div>

                                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1">
                                      <span className="flex items-center gap-0.5">
                                        <Calendar size={10} /> {formatDateString(credit.dateEcheance)}
                                      </span>

                                      {/* Alarm Status Badge */}
                                      {!credit.paye && (
                                        <span className={`font-bold flex items-center gap-0.5 ${
                                          isOverdue ? 'text-rose-500' : isClose ? 'text-amber-500' : 'text-slate-400'
                                        }`}>
                                          {isOverdue ? 'Retard' : isClose ? 'Alerte !' : `${daysLeft}j restant`}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {credit.description && (
                                      <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">
                                        {credit.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Right side: Amount and micro control actions */}
                                  <div className="flex items-center space-x-2 shrink-0">
                                    <span className={`text-xs font-extrabold font-mono ${
                                      credit.paye ? 'text-slate-500' : credit.type === 'DETTE' ? 'text-rose-400' : 'text-emerald-400'
                                    }`}>
                                      {credit.type === 'DETTE' ? '-' : '+'}{formatMAD(credit.montant)}
                                    </span>

                                    {/* Action Buttons inside row */}
                                    <div className="flex items-center gap-1">
                                      <button
                                        id={`btn-toggle-row-paye-${credit.id}`}
                                        onClick={() => handleTogglePaye(credit.id)}
                                        className={`p-1 rounded-md transition-all ${
                                          credit.paye 
                                            ? 'bg-emerald-950 text-emerald-400 hover:bg-slate-800' 
                                            : isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                                        }`}
                                        title={credit.paye ? "Marquer comme Non payé" : "Marquer comme Payé"}
                                      >
                                        <Check size={10} />
                                      </button>

                                      <button
                                        id={`btn-delete-row-${credit.id}`}
                                        onClick={() => handleDeleteCredit(credit.id)}
                                        className="p-1 rounded-md bg-slate-800/10 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 transition-all"
                                        title="Supprimer"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  </div>

                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* TAB 2: ADD NEW CREDIT FORM */}
                {currentTab === 'add' && (
                  <form onSubmit={handleAddCreditSubmit} className="space-y-4 text-left">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-800">
                      <span className="text-xs font-bold text-emerald-400">📝 NOUVEAU CRÉDIT</span>
                      <button 
                        id="btn-add-form-close"
                        type="button" 
                        onClick={() => setCurrentTab('home')} 
                        className="text-slate-404 text-xs font-semibold"
                      >
                        Annuler
                      </button>
                    </div>

                    {formError && (
                      <div className="bg-rose-950/45 text-rose-300 p-2 rounded-xl text-xs border border-rose-800 flex items-center space-x-2">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="space-y-3.5">
                      {/* Segmented type selector */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nature du crédit</label>
                        <div className="grid grid-cols-2 gap-2 mt-1 bg-slate-900/70 p-1 rounded-xl">
                          <button
                            id="btn-form-type-dette"
                            type="button"
                            onClick={() => setFormType('DETTE')}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                              formType === 'DETTE' 
                                ? 'bg-rose-950/70 text-rose-450 border border-rose-500/30 font-extrabold text-rose-300' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Dette (Je dois)
                          </button>
                          <button
                            id="btn-form-type-pret"
                            type="button"
                            onClick={() => setFormType('PRET')}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                              formType === 'PRET' 
                                ? 'bg-emerald-950/80 text-emerald-350 border border-emerald-500/30 font-extrabold text-emerald-300' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Prêt (On me doit)
                          </button>
                        </div>
                      </div>

                      {/* Name / Presurname */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Prénom</label>
                          <input
                            id="input-form-prenom"
                            type="text"
                            placeholder="ex: Rachid"
                            value={formPrenom}
                            onChange={(e) => setFormPrenom(e.target.value)}
                            className={`w-full p-2 rounded-xl text-xs mt-1 border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nom</label>
                          <input
                            id="input-form-nom"
                            type="text"
                            placeholder="ex: El Idrissi"
                            value={formNom}
                            onChange={(e) => setFormNom(e.target.value)}
                            className={`w-full p-2 rounded-xl text-xs mt-1 border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Montant explicite en Dirham */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Montant (Dirham MAD)</label>
                        <div className="relative mt-1">
                          <input
                            id="input-form-montant"
                            type="number"
                            placeholder="0.00"
                            value={formMontant}
                            onChange={(e) => setFormMontant(e.target.value)}
                            className={`w-full p-2 pr-12 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold ${
                              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                          />
                          <span className="absolute right-3 top-2 text-xs font-bold text-emerald-400 font-sans">
                            MAD
                          </span>
                        </div>
                      </div>

                      {/* Dates Creation / Echeance */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Aujourd'hui (Création)</label>
                          <input
                            id="input-form-date-creation"
                            type="date"
                            value={formDateCreation}
                            onChange={(e) => setFormDateCreation(e.target.value)}
                            className={`w-full p-2 rounded-xl text-[11px] mt-1 border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                              isDarkMode ? 'bg-slate-900 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Échéance (Limite)</label>
                          <input
                            id="input-form-date-echeance"
                            type="date"
                            value={formDateEcheance}
                            onChange={(e) => setFormDateEcheance(e.target.value)}
                            className={`w-full p-2 rounded-xl text-[11px] mt-1 border focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold border-emerald-500/30`}
                          />
                        </div>
                      </div>

                      {/* Note / Description */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Notes Optionnelles</label>
                        <textarea
                          id="textarea-form-notes"
                          placeholder="ex: Boutique, avance mariage, etc."
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          rows={2}
                          className={`w-full p-2 rounded-xl text-xs mt-1 border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            isDarkMode ? 'bg-slate-900 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        />
                      </div>

                      {/* Save Button */}
                      <button
                        id="btn-form-save"
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-1.5"
                      >
                        <Plus size={14} />
                        <span>Enregistrer (Simuler Alarmes)</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 3: CALENDAR & DUE DATES VISUALIZATION */}
                {currentTab === 'calendar' && (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-850">
                      <span className="text-xs font-bold text-emerald-400">📅 CALENDRIER DES ÉCHÉANCES</span>
                      <button 
                        id="btn-calendar-today"
                        type="button" 
                        onClick={() => setCurrentCalendarMonth(new Date(2026, 4))} 
                        className="text-[10px] text-slate-400"
                      >
                        Mai 2026
                      </button>
                    </div>

                    {/* Month Navigator */}
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-bold">
                        {currentCalendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </span>
                      <div className="flex space-x-1">
                        <button
                          id="btn-calendar-prev-month"
                          type="button"
                          onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1))}
                          className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <ChevronLeft size={12} />
                        </button>
                        <button
                          id="btn-calendar-next-month"
                          type="button"
                          onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1))}
                          className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold">
                      {/* Days of week */}
                      {dayNames.map(d => (
                        <div key={d} className="text-slate-500 py-1">{d}</div>
                      ))}

                      {/* Day cells */}
                      {calendarDays.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} />;
                        
                        const dayStr = day.toISOString().split('T')[0];
                        const dailyCredits = getCreditsDueOnDate(day);
                        const hasCredits = dailyCredits.length > 0;
                        const isSelected = selectedCalendarDate === dayStr;
                        const isToday = dayStr === '2026-05-24';

                        return (
                          <button
                            id={`btn-calendar-day-${dayStr}`}
                            key={dayStr}
                            onClick={() => setSelectedCalendarDate(dayStr)}
                            type="button"
                            className={`p-1.5 rounded-lg flex flex-col items-center justify-between min-h-[36px] transition-all relative ${
                              isToday 
                                ? 'bg-emerald-600 text-white font-black ring-2 ring-emerald-400/50' 
                                : isSelected 
                                  ? 'bg-slate-800 border border-slate-700 text-emerald-400' 
                                  : isDarkMode ? 'hover:bg-slate-900/60 text-slate-300' : 'hover:bg-slate-100 text-slate-800'
                            }`}
                          >
                            <span>{day.getDate()}</span>
                            {hasCredits && (
                              <div className="absolute bottom-1 flex gap-0.5">
                                {dailyCredits.map(c => (
                                  <span 
                                    key={c.id} 
                                    className={`w-1 h-1 rounded-full ${
                                      c.paye ? 'bg-slate-500' : c.type === 'DETTE' ? 'bg-rose-500' : 'bg-emerald-400'
                                    }`} 
                                  />
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Details of the selected date */}
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <p className="text-[10px] font-bold text-slate-400">
                        Échéances du : {selectedCalendarDate ? formatDateString(selectedCalendarDate) : '24/05/2026 (Aujourd\'hui)'}
                      </p>
                      
                      {selectedCalendarDate ? (
                        (() => {
                          const matching = credits.filter(c => c.dateEcheance === selectedCalendarDate);
                          if (matching.length === 0) return <p className="text-xs text-slate-500 mt-2">Aucune échéance à cette date.</p>;
                          
                          return (
                            <div className="mt-2 space-y-1.5">
                              {matching.map(c => (
                                <div key={c.id} className="flex justify-between items-center text-xs p-1 bg-slate-950/20 rounded">
                                  <span>{c.prenom} {c.nom}</span>
                                  <span className={`font-bold font-mono ${c.type === 'DETTE' ? 'text-rose-450' : 'text-emerald-450'}`}>
                                    {c.type === 'DETTE' ? '-' : '+'}{formatMAD(c.montant)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      ) : (
                        // Default view for Today
                        (() => {
                          const matching = credits.filter(c => c.dateEcheance === '2026-05-24');
                          if (matching.length === 0) return <p className="text-xs text-slate-400 mt-2">Aucune échéance critique aujourd'hui !</p>;
                          
                          return (
                            <div className="mt-2 space-y-1.5">
                              {matching.map(c => (
                                <div key={c.id} className="flex justify-between items-center text-xs p-1.5 bg-rose-950/30 border border-rose-900 rounded">
                                  <span className="text-rose-300 font-bold">{c.prenom} {c.nom} (Jour J)</span>
                                  <span className="font-extrabold text-rose-300 font-mono">
                                    {formatMAD(c.montant)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      )}
                    </div>

                  </div>
                )}

                {/* TAB 4: CREDIT REMINDERS & NOTIFICATION LOGS COUCH */}
                {currentTab === 'notifications' && (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-805">
                      <span className="text-xs font-bold text-rose-400">🔔 ALARMES LOCALES (Push)</span>
                      <button 
                        id="btn-trigger-notif-sim"
                        type="button" 
                        onClick={triggerTestNotification} 
                        className="text-[10px] text-emerald-400 underline font-bold"
                      >
                        Tester Alarme
                      </button>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-350 leading-relaxed space-y-1.5">
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <Info size={12} className="text-emerald-400" />
                        Logique de rappel automatique (Kotlin) :
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                        <li>Filtre les personnes ayant des crédits actifs.</li>
                        <li>Planifie automatiquement 2 alarmes via <code className="text-emerald-300">AlarmManager</code>.</li>
                        <li><b>Alerte 48h :</b> déclenchée 48 heures avant la date limite.</li>
                        <li><b>Alerte Jour J :</b> déclenchée à 09h00 précises le jour de l'échéance.</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase text-slate-450 text-slate-400">
                        Rappels planifiés en cours d'analyse
                      </span>

                      {simulatedAlerts.length === 0 ? (
                        <div className="text-center p-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                          Aucun rappel critique ou échéance proche (48h / Jour J) à notifier actuellement.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {simulatedAlerts.map(alert => (
                            <div 
                              key={alert.id}
                              className={`p-3 rounded-xl border text-xs leading-relaxed flex flex-col justify-between gap-1.5 transition-all ${
                                alert.type === 'error' 
                                  ? 'bg-rose-950/20 border-rose-800 text-rose-300' 
                                  : 'bg-amber-955/20 border-amber-800 text-amber-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold flex items-center gap-1">
                                  {alert.type === 'error' ? '🚨' : '⏰'} {alert.title}
                                </span>
                                <span className="text-[9px] uppercase font-mono bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                                  {alert.daysLeft === 0 ? "Jour J" : "48h avant"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300">{alert.message}</p>
                              
                              <button
                                id={`btn-trigger-specific-alert-${alert.id}`}
                                onClick={() => triggerSpecificAlertNotification(alert)}
                                type="button"
                                className="self-end text-[9px] font-bold py-1 px-2 rounded hover:scale-105 active:scale-95 transition-transform bg-slate-900 border border-slate-800 flex items-center gap-1 text-white"
                              >
                                <Bell size={8} /> Déclencher cette notification
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>

              {/* App Bottom Navigation Bar styled exactly in Material 3 UI */}
              <div className={`absolute bottom-0 left-0 w-full px-4 pt-1 pb-4 flex justify-around items-center border-t transition-colors ${
                isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-white text-slate-600'
              }`}>
                <button
                  id="btn-nav-home"
                  onClick={() => setCurrentTab('home')}
                  className={`flex flex-col items-center py-1.5 transition-all ${
                    currentTab === 'home' ? 'text-emerald-450 scale-105 font-bold text-emerald-500' : 'hover:text-slate-200 text-slate-500'
                  }`}
                >
                  <PiggyBank size={18} />
                  <span className="text-[9px] mt-0.5">Actif</span>
                </button>

                <button
                  id="btn-nav-add"
                  onClick={() => setCurrentTab('add')}
                  className={`flex flex-col items-center py-1.5 transition-all ${
                    currentTab === 'add' ? 'text-emerald-450 scale-105 font-bold text-emerald-500' : 'hover:text-slate-200 text-slate-500'
                  }`}
                >
                  <Plus size={18} />
                  <span className="text-[9px] mt-0.5">Ajouter</span>
                </button>

                {/* Simulated Floating Middle Action Circle */}
                <div className="relative -top-3.5">
                  <button
                    id="btn-fab-quick-add"
                    onClick={() => {
                      setFormType('DETTE');
                      setCurrentTab('add');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white p-3 rounded-full shadow-lg border border-emerald-400/40 transition-transform flex items-center justify-center cursor-pointer"
                    title="Ajout Rapide de Crédit"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <button
                  id="btn-nav-calendar"
                  onClick={() => setCurrentTab('calendar')}
                  className={`flex flex-col items-center py-1.5 transition-all ${
                    currentTab === 'calendar' ? 'text-emerald-450 scale-105 font-bold text-emerald-500' : 'hover:text-slate-200 text-slate-500'
                  }`}
                >
                  <Calendar size={18} />
                  <span className="text-[9px] mt-0.5">Échéancier</span>
                </button>

                <button
                  id="btn-nav-notif"
                  onClick={() => setCurrentTab('notifications')}
                  className={`flex flex-col items-center py-1.5 transition-all relative ${
                    currentTab === 'notifications' ? 'text-emerald-450 scale-105 font-bold text-emerald-500' : 'hover:text-slate-200 text-slate-500'
                  }`}
                >
                  <Bell size={18} />
                  <span className="text-[9px] mt-0.5">Alarmes</span>
                  {simulatedAlerts.length > 0 && (
                    <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>
              </div>

            </div>

            {/* Smart Home Indicator bar */}
            <div className="w-28 h-1 bg-slate-800 rounded-full mx-auto mt-2" />
          </div>

          {/* Quick instructions indicator details below the phone */}
          <div className="mt-4 max-w-sm text-center text-xs text-slate-500 space-y-1 px-4">
            <p>💡 L'application est interactive ! Modifiez ou créez des dettes pour recalculer le ratio et préVisualiser les notifications de 48h ou de Jour J.</p>
          </div>

        </div>

        {/* RIGHT COLUMN: Statistics Dashboard & Android Code Sandbox Tab (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Dashboard Summary Bento Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" />
              <span>Analyse et Répartition Financière</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Statistiques actualisées en temps réel basées sur {credits.length} transactions enregistrées.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              
              {/* Distribution Bar Chart Widget */}
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-3">
                  💰 Top 5 des Créanciers/Débiteurs (En Dirhams)
                </span>
                {distributionData.length === 0 ? (
                  <p className="text-xs text-slate-500 py-10 text-center">Aucun crédit actif.</p>
                ) : (
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                        />
                        <Bar dataKey="montant" fill="#047857" radius={[4, 4, 0, 0]}>
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#047857'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Quick Health Status Indicator Widget */}
              <div className="flex flex-col justify-between bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-2">
                    🛡️ Diagnostic de Solvabilité
                  </span>
                  
                  {credits.length === 0 ? (
                    <p className="text-xs text-slate-505">Aucun crédit.</p>
                  ) : (
                    <div className="space-y-3 mt-1 text-xs">
                      <div className="flex justify-between items-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl border border-emerald-900/10">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={14} />
                          <span>Crédits remboursés</span>
                        </div>
                        <span className="font-bold">{payeCount} dossiers</span>
                      </div>

                      <div className="flex justify-between items-center bg-rose-500/10 text-rose-600 dark:text-rose-400 p-2.5 rounded-xl border border-rose-900/10">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle size={14} />
                          <span>Crédits en attente</span>
                        </div>
                        <span className="font-bold">{nonPayeCount} dossiers</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2.5">
                  💡 <b>Conseil de Trésorerie :</b> Vous disposez de {formatMAD(totalPrets)} de prêts actifs à récupérer. N'hésitez pas à relancer vos débiteurs 48h avant l'échéance programmée !
                </div>
              </div>

            </div>
          </div>

          {/* Android Code Sandbox Panel component */}
          <div>
            <AndroidCodeViewer />
          </div>

        </div>

      </div>

    </div>
  );
}
