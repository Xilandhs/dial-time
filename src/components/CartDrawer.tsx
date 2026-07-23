import React, { useState } from "react";
import { formatFCFA } from "./ProductCard";
import { X, Trash2, ArrowRight, ShieldCheck, ShoppingCart, MessageSquare, CheckCircle2 } from "lucide-react";
import { Produit } from "../types";

export interface CartItem {
  product: Produit;
  color: string;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  whatsappNumber: string; // From admin settings
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  whatsappNumber
}: CartDrawerProps) {
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [note, setNote] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  if (!isOpen) return null;

  const total = cartItems.reduce((sum, item) => sum + item.product.prix * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!nom || !telephone || !adresse) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Post to Express API
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom_client: nom,
          telephone_client: telephone,
          adresse_livraison: adresse,
          note: note,
          lignes: cartItems.map((item) => ({
            produit_id: item.product.id,
            couleur_choisie: item.color,
            quantite: item.quantity
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement de la commande.");
      }

      const order = await response.json();
      setCreatedOrder(order);

      // 2. Prepare WhatsApp message
      let messageText = `Bonjour Dial Time ! 🌟\n`;
      messageText += `Je souhaite valider ma commande sur votre site.\n\n`;
      messageText += `🆔 *Code Commande :* ${order.code_commande}\n`;
      messageText += `👤 *Client :* ${order.nom_client}\n`;
      messageText += `📞 *Téléphone :* ${order.telephone_client}\n`;
      messageText += `📍 *Adresse de livraison :* ${order.adresse_livraison}\n`;
      if (order.note) {
        messageText += `📝 *Note :* ${order.note}\n`;
      }
      messageText += `\n📦 *Articles commandés :*\n`;
      
      order.lignes.forEach((ligne: any) => {
        messageText += `- ${ligne.nom_produit} (Couleur: ${ligne.couleur_choisie}) x${ligne.quantite}  -${formatFCFA(ligne.prix_unitaire_fige * ligne.quantite)}\n`;
      });

      messageText += `\n💵 *Montant Total :* ${formatFCFA(order.montant_total)}\n\n`;
      messageText += `Merci de m'indiquer la marche à suivre pour le paiement (virement / cash / mobile money).`;

      const encodedText = encodeURIComponent(messageText);
      // Strip any non-digit chars for the phone
      const cleanPhone = whatsappNumber.replace(/\D/g, "");
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

      // 3. Clear cart
      onClearCart();

      // 4. Trigger auto-redirection
      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 300);

    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de l'enregistrement de votre commande. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0F2A4A]/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        {/* Drawer Panel */}
        <div className="w-screen max-w-lg bg-[#FAF8F5] border-l border-[#0F2A4A]/10 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-[#0F2A4A]/10 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-5 h-5 text-[#0F2A4A]" />
              <h2 className="serif-title font-serif text-lg font-semibold text-[#0F2A4A]">
                Mon Panier {cartItems.length > 0 && `(${cartItems.length})`}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#FAF8F5] text-[#0F2A4A] border border-transparent hover:border-[#0F2A4A]/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Screen State */}
          {createdOrder ? (
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-16 h-16 text-[#C5A059] mb-6 animate-bounce" />
              <h3 className="serif-title font-serif text-2xl font-semibold text-[#0F2A4A] mb-2">
                Commande Enregistrée !
              </h3>
              <p className="font-sans text-xs uppercase tracking-widest text-[#C5A059] font-semibold mb-4">
                Code : {createdOrder.code_commande}
              </p>
              
              <div className="bg-[#EFE9E1]/30 border border-[#0F2A4A]/10 p-6 rounded-2xl mb-8 text-left max-w-sm w-full space-y-3">
                <p className="text-xs text-[#2B2B2B]">
                  <strong>Nom :</strong> {createdOrder.nom_client}
                </p>
                <p className="text-xs text-[#2B2B2B]">
                  <strong>Montant :</strong> {formatFCFA(createdOrder.montant_total)}
                </p>
                <p className="text-xs text-[#2B2B2B]/80 text-center italic border-t border-[#0F2A4A]/10 pt-3 mt-3">
                  Paiement hors-ligne géré directement sur WhatsApp.
                </p>
              </div>

              <p className="text-xs text-[#2B2B2B]/75 leading-relaxed mb-6">
                Une redirection automatique vers WhatsApp a été lancée. 
                Si l'application ne s'ouvre pas automatiquement, cliquez sur le bouton ci-dessous pour envoyer le message de confirmation :
              </p>

              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Bonjour Dial Time ! Je souhaite valider ma commande : \n` +
                  `Code Commande : ${createdOrder.code_commande}\n` +
                  `Client : ${createdOrder.nom_client}\n` +
                  `Montant Total : ${formatFCFA(createdOrder.montant_total)}`
                )}`}
                className="w-full py-4 rounded-full bg-[#0F2A4A] hover:bg-[#0F2A4A]/90 text-white text-xs font-bold tracking-widest uppercase transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ouvrir WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  setCreatedOrder(null);
                  onClose();
                }}
                className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#C5A059] hover:text-[#0F2A4A] transition-colors cursor-pointer"
              >
                Retour au catalogue
              </button>
            </div>
          ) : (
            <>
              {/* Content / Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-[#2B2B2B]/60 p-8">
                    <ShoppingCart className="w-12 h-12 stroke-[1.5] mb-4 text-[#C5A059]" />
                    <p className="font-serif text-base font-medium text-[#0F2A4A] mb-1">Votre panier est vide</p>
                    <p className="text-xs">Ajoutez des garde-temps depuis le catalogue public.</p>
                  </div>
                ) : (
                  <>
                    {/* Cart list */}
                    <div className="space-y-4">
                      {cartItems.map((item, index) => {
                        const colObj = item.product.couleurs.find(c => c.nom_couleur === item.color) || item.product.couleurs[0];
                        return (
                          <div 
                            key={`${item.product.id}-${item.color}`}
                            className="flex items-center space-x-4 bg-white p-3 rounded-2xl border border-[#0F2A4A]/10 shadow-sm"
                          >
                            {/* Watch Miniature */}
                            <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                              <img
                                src={colObj?.photo || item.product.couleurs[0]?.photo}
                                alt={item.product.nom}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="serif-title font-serif text-sm font-medium text-[#0F2A4A] truncate">
                                {item.product.nom}
                              </h4>
                              <p className="text-[10px] text-[#C5A059] uppercase tracking-wider font-semibold">
                                {item.color}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-serif text-xs font-semibold text-[#0F2A4A]">
                                  {formatFCFA(item.product.prix * item.quantity)}
                                </span>
                                
                                {/* Quantity Toggles */}
                                <div className="flex items-center border border-[#0F2A4A]/10 rounded-lg bg-[#FAF8F5] p-0.5">
                                  <button
                                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                                    className="px-1.5 py-0.5 text-[#0F2A4A] hover:bg-white rounded transition-colors text-xs font-bold cursor-pointer"
                                    title="Diminuer"
                                  >
                                    -
                                  </button>
                                  <span className="px-2 text-xs font-semibold font-serif text-[#0F2A4A]">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                                    className="px-1.5 py-0.5 text-[#0F2A4A] hover:bg-white rounded transition-colors text-xs font-bold cursor-pointer"
                                    title="Augmenter"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => onRemoveItem(index)}
                              className="p-2 text-[#2B2B2B]/40 hover:text-red-500 rounded-full transition-colors shrink-0"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Checkout Form */}
                    <div className="border-t border-[#0F2A4A]/10 pt-6 mt-6">
                      <h3 className="serif-title font-serif text-base font-semibold text-[#0F2A4A] mb-4">
                        Informations de Livraison
                      </h3>
                      
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#0F2A4A] mb-1.5">
                            Nom Complet <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            placeholder="Mamadou DIOP"
                            className="w-full px-4 py-3 rounded-xl border border-[#0F2A4A]/10 bg-white text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]/20 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#0F2A4A] mb-1.5">
                            Numéro Téléphone <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={telephone}
                            onChange={(e) => setTelephone(e.target.value)}
                            placeholder="Ex: +229 00 00 00 00 00"
                            className="w-full px-4 py-3 rounded-xl border border-[#0F2A4A]/10 bg-white text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]/20 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#0F2A4A] mb-1.5">
                            Adresse de livraison complète <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={adresse}
                            onChange={(e) => setAdresse(e.target.value)}
                            placeholder="Ex: Ville, Quartier, Rue 12 x 15"
                            className="w-full px-4 py-3 rounded-xl border border-[#0F2A4A]/10 bg-white text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]/20 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#0F2A4A] mb-1.5">
                            Note de livraison <span className="text-gray-400 font-normal">(Optionnelle)</span>
                          </label>
                          <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ex: Appeler à l'arrivée, livrer l'après-midi..."
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-[#0F2A4A]/10 bg-white text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]/20 transition-all resize-none"
                          />
                        </div>

                        {/* Order Summary & Pricing */}
                        <div className="bg-[#EFE9E1]/30 p-4 rounded-2xl border border-[#0F2A4A]/10 space-y-2 mt-6">
                          <div className="flex justify-between text-xs text-[#2B2B2B]/70">
                            <span>Sous-total articles</span>
                            <span>{formatFCFA(total)}</span>
                          </div>
                          <div className="flex justify-between font-serif text-sm font-semibold text-[#0F2A4A] pt-2 border-t border-[#0F2A4A]/10">
                            <span>Montant Total</span>
                            <span>{formatFCFA(total)}</span>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-4 mt-2 rounded-full bg-[#0F2A4A] hover:bg-[#0F2A4A]/90 disabled:bg-[#0F2A4A]/40 text-white text-xs font-bold tracking-widest uppercase transition-all shadow-lg shadow-[#0F2A4A]/10 flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <span>{isSubmitting ? "Enregistrement..." : "Valider ma commande"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
