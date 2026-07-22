import React, { useState, useEffect } from "react";
import { Produit, CouleurProduit } from "../types";
import { formatFCFA } from "./ProductCard";
import { X, Plus, Minus, ShoppingBag, Check } from "lucide-react";

interface ProductDetailModalProps {
  product: Produit | null;
  onClose: () => void;
  onAddToCart: (product: Produit, color: string, quantity: number) => void;
}

export default function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  if (!product) return null;

  const [selectedColor, setSelectedColor] = useState<CouleurProduit>(
    product.couleurs[0] || { id: "default", nom_couleur: "Standard", photo: "" }
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  // Reset state when product changes
  useEffect(() => {
    if (product.couleurs.length > 0) {
      setSelectedColor(product.couleurs[0]);
    }
    setQuantity(1);
    setIsAdded(false);
  }, [product]);

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleAddToCart = () => {
    onAddToCart(product, selectedColor.nom_couleur, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0F2A4A]/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-[#FAF8F5] rounded-3xl overflow-hidden shadow-2xl border border-[#0F2A4A]/10 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-[#0F2A4A] border border-[#0F2A4A]/10 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Product Image */}
          <div className="relative aspect-square md:aspect-[4/5] bg-[#EFE9E1]/30">
            <img
              src={selectedColor.photo || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"}
              alt={`${product.nom} - ${selectedColor.nom_couleur}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-500"
            />
            
            {product.phare && (
              <span className="absolute top-6 left-6 bg-[#0F2A4A] text-[#FAF8F5] text-[10px] font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full shadow-md">
                Sélection Phare
              </span>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-between max-h-[85vh] md:max-h-none overflow-y-auto">
            <div>
              {/* Slogan / Accent Tag */}
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] mb-2 block">
                Cadran d'exception
              </span>

              {/* Title & Price */}
              <h2 className="serif-title font-serif text-2xl sm:text-3xl font-semibold text-[#0F2A4A] mb-3 leading-tight">
                {product.nom}
              </h2>
              
              <div className="font-serif text-xl sm:text-2xl font-semibold text-[#C5A059] mb-6">
                {formatFCFA(product.prix)}
              </div>

              {/* Description */}
              <div className="border-t border-b border-[#0F2A4A]/10 py-5 mb-6">
                <p className="font-sans text-xs sm:text-sm text-[#2B2B2B]/80 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Color Selector */}
              {product.couleurs.length > 0 && (
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F2A4A] mb-3 block">
                    Variante de couleur : <span className="font-medium text-[#2B2B2B]/75">{selectedColor.nom_couleur}</span>
                  </span>
                  
                  <div className="flex flex-wrap gap-3">
                    {product.couleurs.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color)}
                        className={`group relative p-1 rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                          selectedColor.id === color.id
                            ? "border-[#0F2A4A] ring-2 ring-[#0F2A4A]/10"
                            : "border-[#0F2A4A]/10 hover:border-[#0F2A4A]/30"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={color.photo}
                            alt={color.nom_couleur}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <span className="sr-only">{color.nom_couleur}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F2A4A] mb-3 block">
                  Quantité
                </span>
                
                <div className="inline-flex items-center border border-[#0F2A4A]/10 rounded-xl bg-white p-1">
                  <button
                    onClick={handleDecrement}
                    className="p-2 rounded-lg hover:bg-[#FAF8F5] text-[#0F2A4A] transition-colors cursor-pointer"
                    title="Diminuer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <span className="w-12 text-center font-serif text-sm font-semibold text-[#0F2A4A]">
                    {quantity}
                  </span>
                  
                  <button
                    onClick={handleIncrement}
                    className="p-2 rounded-lg hover:bg-[#FAF8F5] text-[#0F2A4A] transition-colors cursor-pointer"
                    title="Augmenter"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`w-full py-4 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg cursor-pointer ${
                isAdded
                  ? "bg-[#C5A059] text-white shadow-none"
                  : "bg-[#0F2A4A] text-[#FAF8F5] hover:bg-[#0F2A4A]/90 hover:shadow-[#0F2A4A]/20"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Ajouté au Panier</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ajouter au Panier — {formatFCFA(product.prix * quantity)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
