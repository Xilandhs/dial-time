import React, { useState } from "react";
import { Produit, CouleurProduit } from "../types";
import { formatFCFA } from "./ProductCard";
import { Plus, Edit2, Trash2, Check, X, Image as ImageIcon, Eye, EyeOff, Star, AlertTriangle, Link2 } from "lucide-react";

interface AdminProductsProps {
  products: Produit[];
  onAddProduct: (product: Omit<Produit, "id">) => void;
  onUpdateProduct: (id: string, updated: Partial<Produit>) => void;
  onDeleteProduct: (id: string) => void;
}

export default function AdminProducts({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: AdminProductsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produit | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const handleCopyProductLink = async (productId: string) => {
    const url = new URL(window.location.origin);
    url.searchParams.set("produit", productId);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedLinkId(productId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (e) {
      console.error("Impossible de copier le lien:", e);
    }
  };

  // Form Fields
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [actif, setActif] = useState(true);
  const [phare, setPhare] = useState(false);
  const [couleurs, setCouleurs] = useState<CouleurProduit[]>([]);

  // New color form scratchpad
  const [newColorName, setNewColorName] = useState("");
  const [newColorPhoto, setNewColorPhoto] = useState("");

  const resetForm = () => {
    setNom("");
    setDescription("");
    setPrix("");
    setActif(true);
    setPhare(false);
    setCouleurs([
      { id: "col_1", nom_couleur: "Or Royal", photo: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&q=80" }
    ]);
    setNewColorName("");
    setNewColorPhoto("");
    setEditingProduct(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleOpenEdit = (p: Produit) => {
    setEditingProduct(p);
    setNom(p.nom);
    setDescription(p.description);
    setPrix(p.prix.toString());
    setActif(p.actif);
    setPhare(p.phare);
    setCouleurs([...p.couleurs]);
    setNewColorName("");
    setNewColorPhoto("");
    setIsEditing(true);
  };

  const handleAddColor = () => {
    if (!newColorName || !newColorPhoto) {
      alert("Veuillez remplir le nom et le lien photo de la variante.");
      return;
    }
    const newCol: CouleurProduit = {
      id: "col_" + Date.now() + Math.random().toString(36).substr(2, 4),
      nom_couleur: newColorName,
      photo: newColorPhoto
    };
    setCouleurs((prev) => [...prev, newCol]);
    setNewColorName("");
    setNewColorPhoto("");
  };

  const handleRemoveColor = (id: string) => {
    if (couleurs.length <= 1) {
      alert("Un produit doit comporter au moins une variante de couleur.");
      return;
    }
    setCouleurs((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !description || !prix || couleurs.length === 0) {
      alert("Champs requis manquants.");
      return;
    }

    const payload = {
      nom,
      description,
      prix: Number(prix),
      actif,
      phare,
      couleurs
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, payload);
    } else {
      onAddProduct(payload);
    }

    setIsEditing(false);
    resetForm();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title & Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="serif-title font-serif text-2xl font-bold text-[#0F2A4A]">
            Catalogue Produits CRUD
          </h2>
          <p className="text-xs text-[#2B2B2B]/60 font-sans mt-0.5">
            Ajoutez, éditez ou désactivez les modèles de montres du catalogue.
          </p>
        </div>
        
        {!isEditing && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#0F2A4A] hover:bg-[#0F2A4A]/90 transition-all cursor-pointer shadow-md shadow-[#0F2A4A]/10"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau produit</span>
          </button>
        )}
      </div>

      {/* Dynamic CRUD Edit/Add Form Screen */}
      {isEditing ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#0F2A4A]/10 shadow-md space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-[#0F2A4A]/10 pb-4">
            <h3 className="serif-title font-serif text-lg font-semibold text-[#0F2A4A]">
              {editingProduct ? `Modifier : ${editingProduct.nom}` : "Ajouter un nouveau garde-temps"}
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 rounded-full hover:bg-[#FAF8F5] text-gray-400 hover:text-[#0F2A4A] border border-transparent hover:border-[#0F2A4A]/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Column 1: Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#0F2A4A] mb-1.5">
                    Nom du modèle
                  </label>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex: Le Chronographe Aviateur"
                    className="w-full px-4 py-3 rounded-xl border border-[#0F2A4A]/10 bg-[#FAF8F5]/50 text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#0F2A4A] mb-1.5">
                    Prix de vente (en FCFA)
                  </label>
                  <input
                    type="number"
                    required
                    value={prix}
                    onChange={(e) => setPrix(e.target.value)}
                    placeholder="Ex: 185000"
                    className="w-full px-4 py-3 rounded-xl border border-[#0F2A4A]/10 bg-[#FAF8F5]/50 text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]/20 transition-all font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#0F2A4A] mb-1.5">
                    Description & Caractéristiques
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Matériaux, mouvement, étanchéité..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[#0F2A4A]/10 bg-[#FAF8F5]/50 text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]/20 transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Inline Toggle Selectors */}
                <div className="flex space-x-6 bg-[#FAF8F5] p-4 rounded-xl border border-[#0F2A4A]/10">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={actif}
                      onChange={(e) => setActif(e.target.checked)}
                      className="rounded border-[#0F2A4A]/10 text-[#0F2A4A] focus:ring-[#0F2A4A]/20 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-[#0F2A4A] uppercase tracking-wider">
                      Actif (Visible)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={phare}
                      onChange={(e) => setPhare(e.target.checked)}
                      className="rounded border-[#0F2A4A]/10 text-[#0F2A4A] focus:ring-[#0F2A4A]/20 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-[#0F2A4A] uppercase tracking-wider">
                      Mettre en Phare
                    </span>
                  </label>
                </div>
              </div>

              {/* Column 2: Variants & Photos */}
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#0F2A4A]/10">
                <h4 className="serif-title font-serif text-sm font-semibold text-[#0F2A4A] border-b border-[#0F2A4A]/10 pb-2">
                  Variantes de couleurs & Photos Unsplash
                </h4>

                {/* Add new color item */}
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#0F2A4A]/10 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      placeholder="Nom de couleur (Ex: Noir Mat)"
                      className="px-3 py-2 rounded-lg border border-[#0F2A4A]/10 bg-white text-[11px] text-[#2B2B2B] focus:outline-none focus:border-[#0F2A4A]"
                    />
                    <input
                      type="text"
                      value={newColorPhoto}
                      onChange={(e) => setNewColorPhoto(e.target.value)}
                      placeholder="Lien URL de la photo Unsplash"
                      className="px-3 py-2 rounded-lg border border-[#0F2A4A]/10 bg-white text-[11px] text-[#2B2B2B] focus:outline-none focus:border-[#0F2A4A]"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="w-full py-2 bg-[#C5A059] hover:bg-[#0F2A4A] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    + Ajouter la variante
                  </button>
                </div>

                {/* List of currently configured colors */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {couleurs.map((color, index) => (
                    <div 
                      key={color.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#0F2A4A]/10 text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-50 border border-[#0F2A4A]/10">
                          <img
                            src={color.photo}
                            alt={color.nom_couleur}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-[#0F2A4A]">{color.nom_couleur}</p>
                          <p className="text-[9px] text-[#2B2B2B]/40 font-mono truncate max-w-[180px]">{color.photo}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveColor(color.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 rounded-full transition-colors cursor-pointer"
                        title="Retirer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#0F2A4A]/10">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-full border border-[#0F2A4A]/10 text-xs font-semibold uppercase tracking-wider text-[#0F2A4A] bg-white hover:border-[#0F2A4A]/30 transition-all cursor-pointer"
              >
                Annuler
              </button>
              
              <button
                type="submit"
                className="px-8 py-3 rounded-full bg-[#0F2A4A] text-[#FAF8F5] text-xs font-bold tracking-wider uppercase hover:bg-[#0F2A4A]/90 hover:-translate-y-0.5 transition-all shadow-md shadow-[#0F2A4A]/10 cursor-pointer"
              >
                Enregistrer le produit
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Products List Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((p) => {
            const firstColor = p.couleurs[0];
            const photo = firstColor ? firstColor.photo : "";

            return (
              <div 
                key={p.id}
                className={`bg-white rounded-2xl border border-[#0F2A4A]/10 shadow-xs overflow-hidden flex flex-col justify-between transition-all ${
                  !p.actif ? "opacity-60 bg-[#FAF8F5]/40" : ""
                }`}
              >
                <div>
                  {/* Photo Banner with indicators */}
                  <div className="relative aspect-[16/9] bg-[#EFE9E1]/30">
                    <img
                      src={photo}
                      alt={p.nom}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Active/Star badging */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {p.actif ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center space-x-1">
                          <Eye className="w-2.5 h-2.5" />
                          <span>Visible</span>
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 border border-gray-200 text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center space-x-1">
                          <EyeOff className="w-2.5 h-2.5" />
                          <span>Masqué</span>
                        </span>
                      )}

                      {p.phare && (
                        <span className="bg-[#0F2A4A] text-[#FAF8F5] text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center space-x-1">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Phare</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="serif-title font-serif text-base font-semibold text-[#0F2A4A]">
                        {p.nom}
                      </h4>
                      <span className="font-serif text-sm font-bold text-[#C5A059] whitespace-nowrap ml-2">
                        {formatFCFA(p.prix)}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#2B2B2B]/70 leading-relaxed line-clamp-3">
                      {p.description}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {p.couleurs.map((col) => (
                        <span 
                          key={col.id} 
                          className="bg-[#EFE9E1]/50 border border-[#0F2A4A]/10 px-2 py-0.5 rounded text-[9px] font-semibold text-[#0F2A4A]"
                        >
                          {col.nom_couleur}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-5 border-t border-[#0F2A4A]/10 bg-[#FAF8F5]/30 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex space-x-2">
                    {/* Toggle Active status */}
                    <button
                      onClick={() => onUpdateProduct(p.id, { actif: !p.actif })}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        p.actif
                          ? "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100"
                          : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      }`}
                      title={p.actif ? "Masquer du catalogue" : "Rendre visible sur le catalogue"}
                    >
                      {p.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    {/* Toggle Phare status */}
                    <button
                      onClick={() => onUpdateProduct(p.id, { phare: !p.phare })}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        p.phare
                          ? "bg-[#0F2A4A] border-[#0F2A4A] text-[#FAF8F5]"
                          : "bg-white border-[#0F2A4A]/10 text-[#0F2A4A] hover:bg-[#FAF8F5]"
                      }`}
                      title={p.phare ? "Retirer de la mise en avant" : "Mettre en avant sur l'accueil"}
                    >
                      <Star className={`w-4 h-4 ${p.phare ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  <div className="flex space-x-2">
                    {/* Copy shareable product link (for ads / social bio links) */}
                    <button
                      onClick={() => handleCopyProductLink(p.id)}
                      className="p-2 rounded-xl border border-[#0F2A4A]/10 text-[#0F2A4A] hover:border-[#0F2A4A]/30 bg-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                      title="Copier le lien direct du produit"
                    >
                      {copiedLinkId === p.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4" />
                          <span>Lien</span>
                        </>
                      )}
                    </button>

                    {/* Open Edit Form */}
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 rounded-xl border border-[#0F2A4A]/10 text-[#0F2A4A] hover:border-[#0F2A4A]/30 bg-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Éditer</span>
                    </button>

                    {/* Delete Product */}
                    <button
                      onClick={() => {
                        if (confirm(`Voulez-vous vraiment supprimer le produit "${p.nom}" ? S'il est associé à des commandes passées, il sera désactivé pour protéger l'historique.`)) {
                          onDeleteProduct(p.id);
                        }
                      }}
                      className="p-2 rounded-xl border border-[#0F2A4A]/10 hover:border-red-200 text-[#2B2B2B]/40 hover:text-red-500 bg-white transition-all cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
