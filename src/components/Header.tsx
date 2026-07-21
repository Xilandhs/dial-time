import React from "react";
import { ShoppingBag, ShieldCheck, ShoppingCart } from "lucide-react";

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  isAdmin: boolean;
  onAdminToggle: () => void;
}

export default function Header({ cartCount, onOpenCart, isAdmin, onAdminToggle }: HeaderProps) {
  const [logoClicks, setLogoClicks] = React.useState(0);

  const handleLogoClick = () => {
    if (isAdmin) {
      onAdminToggle(); // Logout if already admin
    } else {
      setLogoClicks((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          onAdminToggle(); // Open secure modal
          return 0;
        }
        return next;
      });
    }
  };

  // Reset logo click counter if no activity
  React.useEffect(() => {
    if (logoClicks > 0) {
      const timer = setTimeout(() => {
        setLogoClicks(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [logoClicks]);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#0F2A4A]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo - Double click or 5 rapid taps to login */}
        <div 
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={handleLogoClick}
          onDoubleClick={onAdminToggle}
          title={isAdmin ? "Déconnexion" : undefined}
        >
          <div className="w-9 h-9 bg-[#0F2A4A] rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <div className="w-5.5 h-5.5 border-2 border-[#C5A059] rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl tracking-tight text-[#0F2A4A] leading-none">
              Dial <span className="font-light italic text-[#C5A059]">Time</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#0F2A4A]/60 font-semibold mt-0.5">
              Cadran d'exception
            </span>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center space-x-4">
          {/* Mode Switcher Toggle - Hidden for public users, visible only for Admin to exit */}
          {isAdmin && (
            <button
              id="admin-toggle-btn"
              onClick={onAdminToggle}
              className="flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all duration-300 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Quitter l'Espace Manager</span>
            </button>
          )}

          {/* Cart Icon (only visible/enabled in public view) */}
          {!isAdmin && (
            <button
              id="cart-toggle-btn"
              onClick={onOpenCart}
              className="relative p-2.5 rounded-full border border-[#0F2A4A]/10 bg-white hover:border-[#0F2A4A]/30 text-[#0F2A4A] transition-all duration-200"
              title="Mon Panier"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#0F2A4A] text-[#FAF8F5] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
