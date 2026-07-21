import React from "react";
import { Produit } from "../types";
import { ArrowRight, Tag } from "lucide-react";

interface ProductCardProps {
  product: Produit;
  onSelect: (product: Produit) => void;
  key?: string | number;
}

export function formatFCFA(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const primaryColor = product.couleurs[0];
  const photoUrl = primaryColor ? primaryColor.photo : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80";

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-2xl border border-[#0F2A4A]/10 overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-[#0F2A4A]/5 hover:border-[#C5A059]/30 transition-all duration-300 flex flex-col h-full"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/5] bg-[#EFE9E1]/40 overflow-hidden">
        <img
          src={photoUrl}
          alt={product.nom}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          {product.phare && (
            <span className="bg-[#0F2A4A] text-[#FAF8F5] text-[9px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full shadow-sm">
              Sélection Phare
            </span>
          )}
          <span className="bg-[#FAF8F5]/90 backdrop-blur-md text-[#C5059] text-[#C5A059] border border-[#C5A059]/30 text-[9px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full shadow-sm">
            Cadran d'exception
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="serif-title font-serif text-lg font-medium text-[#0F2A4A] leading-tight group-hover:text-[#C5A059] transition-colors duration-200">
            {product.nom}
          </h3>
          <span className="font-serif text-base font-bold text-[#C5A059] shrink-0 whitespace-nowrap">
            {formatFCFA(product.prix)}
          </span>
        </div>

        <p className="font-sans text-xs text-[#2B2B2B]/70 leading-relaxed line-clamp-3 mb-6 flex-grow">
          {product.description}
        </p>

        <div className="pt-4 border-t border-[#0F2A4A]/10 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#0F2A4A]">
          <span className="text-[10px] text-[#C5A059]">
            {product.couleurs.length} {product.couleurs.length > 1 ? "variantes" : "variante"} disponible{product.couleurs.length > 1 ? "s" : ""}
          </span>
          <div className="flex items-center space-x-1 group-hover:translate-x-1.5 transition-transform duration-200 text-[#0F2A4A]">
            <span>Commander</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
          </div>
        </div>
      </div>
    </div>
  );
}
