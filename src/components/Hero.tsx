import React from "react";
import { ArrowDown, Clock } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] to-[#EFE9E1] py-16 sm:py-24 border-b border-[#EFE9E1]">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#C5A880]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#0F2A4A]/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-[#0F2A4A]/10 text-xs font-semibold uppercase tracking-[0.15em] text-[#C5A059] mb-6 shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          <span>Haute Horlogerie & Style</span>
        </div>
        
        <h1 className="font-serif text-5xl sm:text-7xl lg:text-[84px] leading-[0.9] tracking-tighter text-[#0F2A4A] max-w-4xl mx-auto mb-8">
          L'essence du temps, <br/>
          sculptée avec <span className="italic font-light text-[#C5A059]">maîtrise.</span>
        </h1>
        
        <p className="font-sans text-sm sm:text-base text-[#2B2B2B]/75 max-w-2xl mx-auto leading-relaxed mb-10 uppercase tracking-widest text-[11px] font-semibold">
          Chaque garde-temps Dial Time raconte une histoire de précision et d'exigence. 
          Découvrez notre sélection de cadrans d'exception en temps réel.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <a
            href="#catalog-section"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0F2A4A] text-[#FAF8F5] text-xs font-semibold tracking-wider uppercase hover:bg-[#0F2A4A]/90 hover:-translate-y-0.5 transition-all duration-200 shadow-md shadow-[#0F2A4A]/10 text-center cursor-pointer"
          >
            Explorer la Collection
          </a>
        </div>
      </div>

      {/* Subtle indicator scroll */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-50">
        <ArrowDown className="w-4 h-4 text-[#0F2A4A]" />
      </div>
    </section>
  );
}
