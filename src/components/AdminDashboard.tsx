import React, { useState, useEffect } from "react";
import { Statistics } from "../types";
import { formatFCFA } from "./ProductCard";
import { TrendingUp, Award, RefreshCw, XCircle, DollarSign, Percent, Settings, Phone, CheckCircle2, Trash2, AlertTriangle } from "lucide-react";

interface AdminDashboardProps {
  stats: Statistics | null;
  onRefresh: () => void;
  whatsappNumber: string;
  onUpdateWhatsapp: (num: string) => void;
  onResetDemo: () => Promise<void>;
}

export default function AdminDashboard({ stats, onRefresh, whatsappNumber, onUpdateWhatsapp, onResetDemo }: AdminDashboardProps) {
  const [editingNumber, setEditingNumber] = useState(whatsappNumber);
  const [showSettingsSaved, setShowSettingsSaved] = useState(false);

  useEffect(() => {
    setEditingNumber(whatsappNumber);
  }, [whatsappNumber]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWhatsapp(editingNumber);
    setShowSettingsSaved(true);
    setTimeout(() => setShowSettingsSaved(false), 2000);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F2A4A]" />
      </div>
    );
  }

  // Calculate coordinates for the SVG Line Chart
  const chartWidth = 500;
  const chartHeight = 200;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const points = stats.evolution_ca;
  const maxVal = Math.max(...points.map((p) => Math.max(p.paye, p.potentiel)), 100000);
  const totalCount = stats.statut_repartition.reduce((sum, s) => sum + s.count, 0);

  // Generate SVG path points
  const getCoordinates = (index: number, val: number) => {
    if (points.length <= 1) {
      return { x: paddingLeft + chartWidth / 2, y: paddingTop + chartHeight / 2 };
    }
    const x = paddingLeft + (index / (points.length - 1)) * (chartWidth - paddingLeft - paddingRight);
    const y = paddingTop + (1 - val / maxVal) * (chartHeight - paddingTop - paddingBottom);
    return { x, y };
  };

  let payePath = "";
  let potentielPath = "";
  let payeFillPath = "";

  if (points.length > 0) {
    points.forEach((p, i) => {
      const coordPaye = getCoordinates(i, p.paye);
      const coordPot = getCoordinates(i, p.potentiel);

      if (i === 0) {
        payePath = `M ${coordPaye.x} ${coordPaye.y}`;
        potentielPath = `M ${coordPot.x} ${coordPot.y}`;
        payeFillPath = `M ${coordPaye.x} ${chartHeight - paddingBottom} L ${coordPaye.x} ${coordPaye.y}`;
      } else {
        payePath += ` L ${coordPaye.x} ${coordPaye.y}`;
        potentielPath += ` L ${coordPot.x} ${coordPot.y}`;
        payeFillPath += ` L ${coordPaye.x} ${coordPaye.y}`;
      }

      if (i === points.length - 1) {
        payeFillPath += ` L ${coordPaye.x} ${chartHeight - paddingBottom} Z`;
      }
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="serif-title font-serif text-2xl font-bold text-[#0F2A4A]">
            Analyses & Performances
          </h2>
          <p className="text-xs text-[#2B2B2B]/60 font-sans mt-0.5">
            Suivi en temps réel des ventes et de la conversion Dial Time.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 px-4 py-2 border border-[#0F2A4A]/10 rounded-full text-xs font-semibold uppercase tracking-wider text-[#0F2A4A] bg-white hover:border-[#0F2A4A]/30 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Grid: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: CA Réalisé */}
        <div className="bg-white p-6 rounded-2xl border border-[#0F2A4A]/10 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B2B2B]/60 block">
              Chiffre d'Affaires Réalisé
            </span>
            <div className="font-serif text-2xl font-bold text-[#0F2A4A]">
              {formatFCFA(stats.ca_realise)}
            </div>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Commandes encaissées</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: CA Potentiel */}
        <div className="bg-white p-6 rounded-2xl border border-[#0F2A4A]/10 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B2B2B]/60 block">
              Chiffre d'Affaires Potentiel
            </span>
            <div className="font-serif text-2xl font-bold text-[#C5A059]">
              {formatFCFA(stats.ca_potentiel)}
            </div>
            <p className="text-[10px] text-[#C5A059] font-semibold">
              Total cumulé toutes commandes
            </p>
          </div>
          <div className="p-3 bg-[#EFE9E1]/60 text-[#C5A059] rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Taux de Désistement */}
        <div className="bg-white p-6 rounded-2xl border border-[#0F2A4A]/10 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B2B2B]/60 block">
              Taux de Désistement
            </span>
            <div className="font-serif text-2xl font-bold text-red-800">
              {stats.taux_desistement.toFixed(1)} %
            </div>
            <p className="text-[10px] text-red-800/80 font-semibold flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              <span>Commandes expirées (sans paiement sous 7j)</span>
            </p>
          </div>
          <div className="p-3 bg-red-50 text-red-800 rounded-xl">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bento Grid: Chart + Products & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Evolution Chart */}
        <div className="bg-white p-6 rounded-2xl border border-[#0F2A4A]/10 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="serif-title font-serif text-base font-semibold text-[#0F2A4A] mb-2">
              Évolution Temporelle du Chiffre d'Affaires
            </h3>
            <p className="text-[11px] text-[#2B2B2B]/60 mb-6 font-sans">
              Comparaison graphique entre le chiffre d'affaires encaissé (payé) et potentiel par date.
            </p>
          </div>

          {points.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-[#2B2B2B]/50 italic">
              Aucune commande enregistrée pour tracer le graphique.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full min-w-[450px]"
              >
                <defs>
                  <linearGradient id="payeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C5A059" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#C5A059" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1={paddingLeft} y1={paddingTop} x2={chartWidth - paddingRight} y2={paddingTop} stroke="#0F2A4A" strokeOpacity="0.08" strokeDasharray="3 3" />
                <line x1={paddingLeft} y1={paddingTop + (chartHeight - paddingTop - paddingBottom) / 2} x2={chartWidth - paddingRight} y2={paddingTop + (chartHeight - paddingTop - paddingBottom) / 2} stroke="#0F2A4A" strokeOpacity="0.08" strokeDasharray="3 3" />
                <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="#2B2B2B" strokeWidth="0.5" />

                {/* Y Axis Labels */}
                <text x={paddingLeft - 8} y={paddingTop + 4} textAnchor="end" className="text-[9px] fill-[#2B2B2B]/60 font-mono">
                  {formatFCFA(maxVal)}
                </text>
                <text x={paddingLeft - 8} y={paddingTop + (chartHeight - paddingTop - paddingBottom) / 2 + 4} textAnchor="end" className="text-[9px] fill-[#2B2B2B]/60 font-mono">
                  {formatFCFA(maxVal / 2)}
                </text>
                <text x={paddingLeft - 8} y={chartHeight - paddingBottom + 4} textAnchor="end" className="text-[9px] fill-[#2B2B2B]/60 font-mono">
                  0
                </text>

                {/* Fills and lines */}
                {payeFillPath && (
                  <path d={payeFillPath} fill="url(#payeGrad)" />
                )}
                {potentielPath && (
                  <path d={potentielPath} fill="none" stroke="#0F2A4A" strokeWidth="1.5" strokeDasharray="4 2" />
                )}
                {payePath && (
                  <path d={payePath} fill="none" stroke="#C5A059" strokeWidth="2.5" />
                )}

                {/* Dots and Labels */}
                {points.map((p, i) => {
                  const payeCoord = getCoordinates(i, p.paye);
                  const isLastOrFirst = i === 0 || i === points.length - 1 || points.length <= 5;
                  
                  return (
                    <g key={p.date}>
                      <circle cx={payeCoord.x} cy={payeCoord.y} r="3.5" fill="#C5A059" stroke="white" strokeWidth="1" />
                      {isLastOrFirst && (
                        <text 
                          x={payeCoord.x} 
                          y={chartHeight - paddingBottom + 16} 
                          textAnchor="middle" 
                          className="text-[8px] fill-[#2B2B2B]/70 font-mono"
                        >
                          {p.date.substring(5)} {/* MM-DD */}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Chart Legend */}
          <div className="flex items-center space-x-6 justify-center mt-4 border-t border-[#0F2A4A]/10 pt-4 text-[10px] font-semibold uppercase tracking-wider">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-0.5 bg-[#C5A059] block"></span>
              <span className="text-[#2B2B2B]/70">CA Réalisé (Payé)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-0.5 border-t border-dashed border-[#0F2A4A] block"></span>
              <span className="text-[#2B2B2B]/70">CA Potentiel (Global)</span>
            </div>
          </div>
        </div>

        {/* Right: Status Distribution & Configuration */}
        <div className="space-y-6">
          
          {/* Status Breakdown Box */}
          <div className="bg-white p-6 rounded-2xl border border-[#0F2A4A]/10 shadow-sm">
            <h3 className="serif-title font-serif text-base font-semibold text-[#0F2A4A] mb-4">
              Répartition des Commandes
            </h3>
            
            <div className="space-y-4">
              {stats.statut_repartition.map((stat) => {
                const colorsMap: { [key: string]: string } = {
                  payé: "bg-emerald-500",
                  en_attente: "bg-amber-500",
                  expiré: "bg-red-500"
                };
                const labelMap: { [key: string]: string } = {
                  payé: "Payées",
                  en_attente: "En attente (7 jours max)",
                  expiré: "Expirées"
                };

                const percentage = totalCount > 0 ? (stat.count / totalCount) * 100 : 0;

                return (
                  <div key={stat.statut} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#2B2B2B]/85">{labelMap[stat.statut]}</span>
                      <span className="text-[#0F2A4A] font-bold font-mono">
                        {stat.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full bg-[#EFE9E1]/40 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colorsMap[stat.statut] || "bg-gray-400"} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-[#2B2B2B]/50 font-mono text-right">
                      Sous-total : {formatFCFA(stat.montant)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Settings - WhatsApp number configuration */}
          <div className="bg-white p-6 rounded-2xl border border-[#0F2A4A]/10 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <Settings className="w-4 h-4 text-[#C5A059]" />
              <h3 className="serif-title font-serif text-base font-semibold text-[#0F2A4A]">
                Configuration Vendeur
              </h3>
            </div>
            <p className="text-[11px] text-[#2B2B2B]/60 mb-4">
              Numéro de téléphone WhatsApp utilisé pour recevoir les bons de commande préremplis.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-[#0F2A4A] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={editingNumber}
                  onChange={(e) => setEditingNumber(e.target.value)}
                  placeholder="Ex: +221775551234"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#0F2A4A]/10 bg-[#FAF8F5] text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0F2A4A] hover:bg-[#0F2A4A]/90 text-white text-[10px] font-bold tracking-wider uppercase rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Enregistrer les paramètres</span>
              </button>
            </form>

            {showSettingsSaved && (
              <div className="mt-3 flex items-center space-x-2 text-emerald-600 text-xs font-semibold animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration sauvegardée !</span>
              </div>
            )}
          </div>

          {/* Danger Zone - Clear Demo Data */}
          <div className="bg-white p-6 rounded-2xl border border-red-200/50 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="serif-title font-serif text-base font-semibold text-red-950">
                Données de Démonstration
              </h3>
            </div>
            <p className="text-[11px] text-[#2B2B2B]/70 mb-4 leading-relaxed">
              Supprimez définitivement les 3 commandes de démonstration (Mamadou, Awa, Ibrahim) pour démarrer votre activité avec des statistiques 100% réelles.
            </p>

            <button
              onClick={async () => {
                if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement toutes les commandes de démonstration ? Vos produits existants seront conservés.")) {
                  await onResetDemo();
                  alert("Commandes de démonstration effacées avec succès ! Votre espace de vente est désormais vierge.");
                }
              }}
              className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 text-[10px] font-bold tracking-wider uppercase rounded-xl border border-red-200 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider les données de test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Products Table/List */}
      <div className="bg-white p-6 rounded-2xl border border-[#0F2A4A]/10 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="w-4 h-4 text-[#C5A059]" />
          <h3 className="serif-title font-serif text-base font-semibold text-[#0F2A4A]">
            Classement des Meilleurs Produits (Payés)
          </h3>
        </div>

        {stats.top_produits.length === 0 ? (
          <div className="text-xs text-[#2B2B2B]/50 italic py-6 text-center">
            Aucun produit vendu à ce jour (aucune commande marquée comme Payée).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#0F2A4A]/10 text-[10px] font-bold uppercase tracking-wider text-[#2B2B2B]/50 pb-2">
                  <th className="py-3">Position</th>
                  <th className="py-3">Modèle / Garde-temps</th>
                  <th className="py-3 text-center">Quantité vendue</th>
                  <th className="py-3 text-right">Chiffre d'Affaires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF8F5] text-xs font-sans text-[#2B2B2B]/85">
                {stats.top_produits.map((prod, index) => (
                  <tr key={prod.nom} className="hover:bg-[#FAF8F5]/50 transition-colors">
                    <td className="py-3.5 font-bold font-mono text-[#C5A059]">
                      #{index + 1}
                    </td>
                    <td className="py-3.5 font-serif font-semibold text-[#0F2A4A] text-sm">
                      {prod.nom}
                    </td>
                    <td className="py-3.5 text-center font-mono font-semibold">
                      {prod.quantite}
                    </td>
                    <td className="py-3.5 text-right font-serif font-semibold text-[#C5A059]">
                      {formatFCFA(prod.ca)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
