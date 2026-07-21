import React, { useState, useEffect } from "react";
import { Commande, Produit } from "../types";
import { formatFCFA } from "./ProductCard";
import { Search, Calendar, ChevronDown, ChevronUp, User, Phone, MapPin, FileText, Check, AlertCircle, Clock } from "lucide-react";

interface AdminOrdersProps {
  orders: Commande[];
  products: Produit[];
  onUpdateStatus: (code: string, newStatus: "en_attente" | "payé" | "expiré") => void;
  onRefresh: () => void;
}

export default function AdminOrders({ orders, products, onUpdateStatus, onRefresh }: AdminOrdersProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [activeDropdownCode, setActiveDropdownCode] = useState<string | null>(null);

  const toggleExpand = (code: string) => {
    setExpandedOrders((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const filteredOrders = orders.filter((order) => {
    // 1. Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      order.code_commande.toLowerCase().includes(searchLower) ||
      order.nom_client.toLowerCase().includes(searchLower) ||
      order.telephone_client.includes(search) ||
      order.adresse_livraison.toLowerCase().includes(searchLower);

    // 2. Status filter
    const matchesStatus = statusFilter === "all" || order.statut === statusFilter;

    // 3. Product filter
    const matchesProduct =
      productFilter === "all" ||
      order.lignes.some((line) => line.produit_id === productFilter);

    // 4. Date Debut
    const matchesDateDebut =
      !dateDebut || new Date(order.date_creation) >= new Date(dateDebut);

    // 5. Date Fin
    const matchesDateFin =
      !dateFin || new Date(order.date_creation) <= new Date(dateFin + "T23:59:59");

    return matchesSearch && matchesStatus && matchesProduct && matchesDateDebut && matchesDateFin;
  });

  const getStatusBadge = (status: "en_attente" | "payé" | "expiré") => {
    const badges = {
      en_attente: {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        label: "En attente",
        icon: <Clock className="w-3 h-3" />
      },
      payé: {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Payé",
        icon: <Check className="w-3 h-3" />
      },
      expiré: {
        bg: "bg-red-50 text-red-700 border-red-200",
        label: "Expiré",
        icon: <AlertCircle className="w-3 h-3" />
      }
    };
    const current = badges[status] || badges.en_attente;

    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${current.bg}`}>
        {current.icon}
        <span>{current.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div>
        <h2 className="serif-title font-serif text-2xl font-bold text-[#0F2A4A]">
          Gestion des Commandes
        </h2>
        <p className="text-xs text-[#2B2B2B]/60 font-sans mt-0.5">
          Visualisez, triez, filtrez et validez les bons de commande reçus.
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-white p-5 rounded-2xl border border-[#0F2A4A]/10 shadow-sm space-y-4">
        
        {/* Row 1: Search & Status Quick Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-[#2B2B2B]/40 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par code, client, téléphone, adresse..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#0F2A4A]/10 text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none transition-all"
            />
          </div>

          {/* Status Select */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#0F2A4A]/10 bg-white text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none transition-all"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="payé">Payé</option>
              <option value="expiré">Expiré</option>
            </select>
          </div>
        </div>

        {/* Row 2: Advanced filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#FAF8F5]">
          
          {/* Product Filter */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-[#2B2B2B]/50 mb-1">
              Filtre par Modèle
            </label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#0F2A4A]/10 bg-white text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none transition-all"
            >
              <option value="all">Tous les produits</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Date Début */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-[#2B2B2B]/50 mb-1">
              Date Début
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#0F2A4A]/10 text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none transition-all"
            />
          </div>

          {/* Date Fin */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-[#2B2B2B]/50 mb-1">
              Date Fin
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#0F2A4A]/10 text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#0F2A4A]/10 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center p-12 text-[#2B2B2B]/60 italic text-xs">
            Aucune commande ne correspond aux critères de filtre.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#0F2A4A]/10 bg-[#FAF8F5]/80 text-[10px] font-bold uppercase tracking-wider text-[#2B2B2B]/50">
                  <th className="py-4 px-6 w-8"></th>
                  <th className="py-4 px-4">Code</th>
                  <th className="py-4 px-4">Client</th>
                  <th className="py-4 px-4 text-center">Date de création</th>
                  <th className="py-4 px-4 text-right">Montant total</th>
                  <th className="py-4 px-4 text-center">Statut (clic pour modifier)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F2A4A]/10">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrders.includes(order.code_commande);
                  const isDropdownActive = activeDropdownCode === order.code_commande;

                  return (
                    <React.Fragment key={order.code_commande}>
                      {/* Row Header */}
                      <tr className={`hover:bg-[#FAF8F5]/40 transition-colors ${isExpanded ? "bg-[#EFE9E1]/10" : ""}`}>
                        {/* Accordion Toggle Arrow */}
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => toggleExpand(order.code_commande)}
                            className="text-[#0F2A4A]/60 hover:text-[#0F2A4A] transition-colors p-1"
                            title={isExpanded ? "Replier" : "Déplier les détails"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Code Commande */}
                        <td className="py-4 px-4 font-mono font-bold text-[#C5A059] text-xs">
                          {order.code_commande}
                        </td>

                        {/* Client details short */}
                        <td className="py-4 px-4">
                          <div className="text-xs font-semibold text-[#0F2A4A]">
                            {order.nom_client}
                          </div>
                          <div className="text-[10px] text-[#2B2B2B]/60 font-mono">
                            {order.telephone_client}
                          </div>
                        </td>

                        {/* Date création */}
                        <td className="py-4 px-4 text-center text-[11px] text-[#2B2B2B]/75">
                          {new Date(order.date_creation).toLocaleString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>

                        {/* Montant total */}
                        <td className="py-4 px-4 text-right font-serif font-bold text-[#0F2A4A] text-sm">
                          {formatFCFA(order.montant_total)}
                        </td>

                        {/* Inline Toggle Statut Badge */}
                        <td className="py-4 px-4 text-center relative">
                          <div className="inline-block text-left">
                            <button
                              onClick={() =>
                                setActiveDropdownCode(
                                  isDropdownActive ? null : order.code_commande
                                )
                              }
                              className="focus:outline-none transition-transform hover:scale-[1.03]"
                              title="Modifier le statut"
                            >
                              {getStatusBadge(order.statut)}
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownActive && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setActiveDropdownCode(null)} 
                                />
                                <div className="absolute right-1/2 translate-x-1/2 mt-2 w-40 rounded-xl bg-white border border-[#0F2A4A]/10 shadow-xl z-20 overflow-hidden divide-y divide-[#FAF8F5] animate-in fade-in slide-in-from-top-1 duration-150">
                                  <div className="px-3 py-2 text-[8px] font-bold uppercase tracking-widest text-[#2B2B2B]/40">
                                    Changer de statut
                                  </div>
                                  <button
                                    onClick={() => {
                                      onUpdateStatus(order.code_commande, "en_attente");
                                      setActiveDropdownCode(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold hover:bg-[#FAF8F5] text-amber-700 flex items-center space-x-2"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span>En attente</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      onUpdateStatus(order.code_commande, "payé");
                                      setActiveDropdownCode(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold hover:bg-[#FAF8F5] text-emerald-700 flex items-center space-x-2"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>Payé</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      onUpdateStatus(order.code_commande, "expiré");
                                      setActiveDropdownCode(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold hover:bg-[#FAF8F5] text-red-700 flex items-center space-x-2"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span>Expiré</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Section */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-[#EFE9E1]/15 px-8 py-6 border-b border-[#0F2A4A]/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top duration-200">
                              
                              {/* Left column: client & delivery */}
                              <div className="space-y-4">
                                <h4 className="serif-title font-serif text-xs font-semibold uppercase tracking-wider text-[#0F2A4A] border-b border-[#0F2A4A]/10 pb-1.5">
                                  Détails du destinataire
                                </h4>
                                
                                <div className="space-y-2.5 text-xs">
                                  <div className="flex items-center space-x-2.5 text-[#2B2B2B]">
                                    <User className="w-4 h-4 text-[#C5A059]" />
                                    <span><strong>Client :</strong> {order.nom_client}</span>
                                  </div>
                                  <div className="flex items-center space-x-2.5 text-[#2B2B2B]">
                                    <Phone className="w-4 h-4 text-[#C5A059]" />
                                    <span><strong>Téléphone :</strong> {order.telephone_client}</span>
                                  </div>
                                  <div className="flex items-start space-x-2.5 text-[#2B2B2B]">
                                    <MapPin className="w-4 h-4 text-[#C5A059] mt-0.5 shrink-0" />
                                    <span><strong>Adresse :</strong> {order.adresse_livraison}</span>
                                  </div>
                                  {order.note && (
                                    <div className="flex items-start space-x-2.5 text-[#2B2B2B] bg-white p-3 rounded-xl border border-[#0F2A4A]/10">
                                      <FileText className="w-4 h-4 text-[#C5A059] mt-0.5 shrink-0" />
                                      <span><strong>Note d'instruction :</strong> {order.note}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right column: items ordered */}
                              <div className="space-y-4">
                                <h4 className="serif-title font-serif text-xs font-semibold uppercase tracking-wider text-[#0F2A4A] border-b border-[#0F2A4A]/10 pb-1.5">
                                  Lignes de Commande (Prix figés)
                                </h4>
                                
                                <div className="space-y-3">
                                  {order.lignes.map((line, lIndex) => (
                                    <div 
                                      key={`${line.produit_id}-${lIndex}`}
                                      className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#0F2A4A]/10 shadow-xs text-xs"
                                    >
                                      <div>
                                        <p className="font-serif font-medium text-[#0F2A4A]">
                                          {line.nom_produit}
                                        </p>
                                        <p className="text-[10px] text-[#C5A059] uppercase tracking-wider font-semibold">
                                          {line.couleur_choisie}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-mono text-[#2B2B2B]/70 text-[10px]">
                                          {line.quantite} x {formatFCFA(line.prix_unitaire_fige)}
                                        </p>
                                        <p className="font-serif font-semibold text-[#0F2A4A] mt-0.5">
                                          {formatFCFA(line.prix_unitaire_fige * line.quantite)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
