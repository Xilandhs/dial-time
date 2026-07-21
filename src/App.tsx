import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import ProductCard from "./components/ProductCard";
import ProductDetailModal from "./components/ProductDetailModal";
import CartDrawer, { CartItem } from "./components/CartDrawer";
import AdminDashboard from "./components/AdminDashboard";
import AdminOrders from "./components/AdminOrders";
import AdminProducts from "./components/AdminProducts";
import { Produit, Commande, Statistics } from "./types";
import { ShoppingBag, ChevronRight, BarChart3, Clock, HelpCircle, Shield, Menu, Lock, X, Eye, EyeOff } from "lucide-react";

export default function App() {
  // Views navigation
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<"dashboard" | "orders" | "products">("dashboard");

  // Authentication Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Public Catalog & Details Modal
  const [products, setProducts] = useState<Produit[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);

  // Cart Drawer
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Admin Data
  const [orders, setOrders] = useState<Commande[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("+221775551234");

  // Load cart from Local Storage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("dial_time_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Error reading saved cart:", e);
    }
  }, []);

  // Sync cart with Local Storage
  const syncCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem("dial_time_cart", JSON.stringify(updatedCart));
  };

  // Fetch functions
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Error fetching products:", e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data?.whatsapp_number) {
          setWhatsappNumber(data.whatsapp_number);
        }
      }
    } catch (e) {
      console.error("Error fetching settings:", e);
    }
  };

  // Initial loads and background polling/reloads
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchStats();
    fetchSettings();
  }, []);

  // Reload admin data when switching to Espace Manager and poll for updates automatically every 15s
  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      fetchStats();
      fetchProducts();

      const interval = setInterval(() => {
        fetchOrders();
        fetchStats();
        fetchProducts();
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  // Cart Handlers
  const handleAddToCart = (product: Produit, color: string, quantity: number) => {
    const existingIndex = cart.findIndex(
      (item) => item.product.id === product.id && item.color === color
    );

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...cart];
      updated[existingIndex].quantity += quantity;
    } else {
      updated = [...cart, { product, color, quantity }];
    }

    syncCart(updated);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = quantity;
    syncCart(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    syncCart(updated);
  };

  const handleClearCart = () => {
    syncCart([]);
  };

  // Admin CRUD Products handlers
  const handleAddProduct = async (payload: Omit<Produit, "id">) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProduct = async (id: string, payload: Partial<Produit>) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin Orders status handler
  const handleUpdateOrderStatus = async (code: string, newStatus: "en_attente" | "payé" | "expiré") => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(code)}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatus })
      });
      if (res.ok) {
        fetchOrders();
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update seller WhatsApp
  const handleUpdateWhatsapp = async (num: string) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_number: num })
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappNumber(data.whatsapp_number);
      }
    } catch (e) {
      console.error("Error updating settings:", e);
    }
  };

  // Reset demo orders to clear simulated data and have 100% concrete metrics
  const handleResetDemo = async () => {
    try {
      const res = await fetch("/api/reset-demo", { method: "POST" });
      if (res.ok) {
        fetchOrders();
        fetchStats();
      }
    } catch (e) {
      console.error("Error resetting demo data:", e);
    }
  };

  // Admin access protection handlers
  const handleAdminToggle = () => {
    if (isAdmin) {
      // Log out immediately without prompting
      setIsAdmin(false);
    } else {
      // Prompt for access code
      setIsAuthModalOpen(true);
      setPasswordInput("");
      setAuthError(null);
      setShowPassword(false);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = passwordInput.trim().toLowerCase();
    if (normalized === "130865" || normalized === "admin" || normalized === "manager") {
      setIsAdmin(true);
      setIsAuthModalOpen(false);
      setAuthError(null);
    } else {
      setAuthError("Code d'accès incorrect. Veuillez réessayer.");
    }
  };

  // Public filtering: only active & phare
  const activeProducts = products.filter((p) => p.actif);
  const phareProducts = activeProducts.filter((p) => p.phare);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between font-sans selection:bg-[#0F2A4A]/10 selection:text-[#0F2A4A]">
      {/* Header */}
      <Header
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        isAdmin={isAdmin}
        onAdminToggle={handleAdminToggle}
      />

      {/* Main Container */}
      <main className="flex-grow">
        {isAdmin ? (
          /* ==============================================================
             ADMIN SPACE
             ============================================================== */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Admin navigation tabs bar */}
            <div className="flex border-b border-[#EFE9E1] mb-8 overflow-x-auto space-x-6 pb-px">
              <button
                onClick={() => setAdminTab("dashboard")}
                className={`py-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-2 shrink-0 ${
                  adminTab === "dashboard"
                    ? "border-[#0F2A4A] text-[#0F2A4A]"
                    : "border-transparent text-[#2B2B2B]/50 hover:text-[#0F2A4A]"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Tableau de Bord</span>
              </button>
              
              <button
                onClick={() => setAdminTab("orders")}
                className={`py-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-2 shrink-0 ${
                  adminTab === "orders"
                    ? "border-[#0F2A4A] text-[#0F2A4A]"
                    : "border-transparent text-[#2B2B2B]/50 hover:text-[#0F2A4A]"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Commandes ({orders.length})</span>
              </button>

              <button
                onClick={() => setAdminTab("products")}
                className={`py-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-2 shrink-0 ${
                  adminTab === "products"
                    ? "border-[#0F2A4A] text-[#0F2A4A]"
                    : "border-transparent text-[#2B2B2B]/50 hover:text-[#0F2A4A]"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Gérer les Produits ({products.length})</span>
              </button>
            </div>

            {/* Admin screens routing */}
            {adminTab === "dashboard" && (
              <AdminDashboard
                stats={stats}
                onRefresh={fetchStats}
                whatsappNumber={whatsappNumber}
                onUpdateWhatsapp={handleUpdateWhatsapp}
                onResetDemo={handleResetDemo}
              />
            )}

            {adminTab === "orders" && (
              <AdminOrders
                orders={orders}
                products={products}
                onUpdateStatus={handleUpdateOrderStatus}
                onRefresh={fetchOrders}
              />
            )}

            {adminTab === "products" && (
              <AdminProducts
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}
          </div>
        ) : (
          /* ==============================================================
             PUBLIC STOREFRONT
             ============================================================== */
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* Brand Hero Introduction */}
            <Hero />

            {/* Collection Catalog Grid */}
            <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-20">
              <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                <h2 className="serif-title font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#0F2A4A]">
                  Notre Sélection d'Exception
                </h2>
                <div className="w-12 h-0.5 bg-[#C5A880] mx-auto" />
                <p className="font-sans text-xs sm:text-sm text-[#2B2B2B]/70 leading-relaxed">
                  Chaque montre est rigoureusement sélectionnée pour la pureté de son cadran, 
                  son mouvement fiable et sa robustesse. Découvrez des pièces d'horlogerie uniques.
                </p>
              </div>

              {activeProducts.length === 0 ? (
                <div className="text-center p-16 bg-white border border-[#EFE9E1] rounded-3xl text-xs text-[#2B2B2B]/60 italic">
                  Le catalogue est momentanément vide. Veuillez repasser plus tard.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {activeProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={(p) => setSelectedProduct(p)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Slogan Banner section */}
            <section className="bg-[#0F2A4A] text-[#FAF8F5] py-16 text-center border-t border-b border-[#0F2A4A]">
              <div className="max-w-4xl mx-auto px-4 space-y-4">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold block">
                  Savoir-faire et Exigence
                </span>
                <p className="font-serif text-xl sm:text-3xl italic tracking-wide max-w-2xl mx-auto leading-relaxed">
                  "Une montre d'exception ne donne pas seulement l'heure. Elle affirme une posture face au temps."
                </p>
                <div className="pt-2">
                  <span className="text-[11px] uppercase tracking-widest text-[#FAF8F5]/60 font-medium">
                    Dial Time  -Cadran d'exception
                  </span>
                </div>
              </div>
            </section>

            {/* Explanatory notes (Delivery & Offline Money) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#EFE9E1]/60">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Rule 1 */}
                <div className="bg-white p-6 rounded-2xl border border-[#EFE9E1] text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#EFE9E1]/50 text-[#0F2A4A] flex items-center justify-center mx-auto text-xs font-bold">
                    1
                  </div>
                  <h4 className="serif-title font-serif text-base font-semibold text-[#0F2A4A]">
                    Commande simple & rapide
                  </h4>
                  <p className="text-xs text-[#2B2B2B]/75 leading-relaxed">
                    Sélectionnez vos pièces, validez votre panier sans créer de compte. C'est immédiat.
                  </p>
                </div>

                {/* Rule 2 */}
                <div className="bg-white p-6 rounded-2xl border border-[#EFE9E1] text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#EFE9E1]/50 text-[#0F2A4A] flex items-center justify-center mx-auto text-xs font-bold">
                    2
                  </div>
                  <h4 className="serif-title font-serif text-base font-semibold text-[#0F2A4A]">
                    Validation WhatsApp
                  </h4>
                  <p className="text-xs text-[#2B2B2B]/75 leading-relaxed">
                    Votre bon de commande est généré et vous êtes redirigé(e) vers l'admin pour confirmer la livraison.
                  </p>
                </div>

                {/* Rule 3 */}
                <div className="bg-white p-6 rounded-2xl border border-[#EFE9E1] text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#EFE9E1]/50 text-[#0F2A4A] flex items-center justify-center mx-auto text-xs font-bold">
                    3
                  </div>
                  <h4 className="serif-title font-serif text-base font-semibold text-[#0F2A4A]">
                    Règlement Flexible
                  </h4>
                  <p className="text-xs text-[#2B2B2B]/75 leading-relaxed">
                    Réglez hors ligne par Mobile Money (MTN , Flooz, Wa), virement bancaire ou cash à la livraison.
                  </p>
                </div>

              </div>
            </section>
          </div>
        )}
      </main>

      {/* Cart Slider Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        whatsappNumber={whatsappNumber}
      />

      {/* Product Detail Overlay Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Secure Manager Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#0F2A4A]/60 backdrop-blur-md transition-opacity"
            onClick={() => setIsAuthModalOpen(false)}
          />

          {/* Modal Content Card */}
          <div className="relative w-full max-w-md bg-[#FAF8F5] rounded-3xl overflow-hidden shadow-2xl border border-[#0F2A4A]/10 p-8 z-10 animate-in fade-in zoom-in-95 duration-250">
            {/* Close Button */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#FAF8F5] text-gray-400 hover:text-[#0F2A4A] border border-transparent hover:border-[#0F2A4A]/10 transition-all cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Lock Icon */}
            <div className="w-12 h-12 bg-[#0F2A4A]/10 rounded-2xl flex items-center justify-center text-[#0F2A4A] mb-5">
              <Lock className="w-5 h-5" />
            </div>

            {/* Typography Title & Subtitle */}
            <h3 className="serif-title font-serif text-xl font-bold text-[#0F2A4A] mb-1">
              Accès Sécurisé  -Espace Manager
            </h3>
            <p className="text-xs text-[#2B2B2B]/70 leading-relaxed mb-6">
              Afin de protéger vos commandes, stocks et statistiques, l'accès à cet espace est réservé à la direction.
            </p>

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0F2A4A]">
                  Code d'accès
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Saisissez votre code d'accès"
                    className="w-full pl-4 pr-11 py-3 rounded-xl border border-[#0F2A4A]/10 bg-white text-xs text-[#2B2B2B] focus:border-[#0F2A4A] focus:outline-none focus:ring-1 focus:ring-[#0F2A4A]/20 transition-all font-mono tracking-wider"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0F2A4A] p-1 transition-colors cursor-pointer"
                    title={showPassword ? "Masquer le code d'accès" : "Afficher le code d'accès"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {authError && (
                <p className="text-[11px] font-medium text-red-600 animate-pulse">
                  {authError}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex-1 py-3.5 rounded-full border border-[#0F2A4A]/10 text-xs font-semibold uppercase tracking-wider text-[#0F2A4A] bg-white hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-full bg-[#0F2A4A] text-[#FAF8F5] text-xs font-bold uppercase tracking-wider hover:bg-[#0F2A4A]/90 transition-all cursor-pointer shadow-md hover:shadow-[#0F2A4A]/10"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#EFE9E1] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <p className="font-serif text-base font-semibold text-[#0F2A4A] tracking-wide">
            Dial Time
          </p>
          <p className="text-[10px] text-[#2B2B2B]/50 uppercase tracking-[0.15em] font-sans">
            © {new Date().getFullYear()} Dial Time. Tous droits réservés. Cadran d'exception.
          </p>
          <p className="text-[9px] text-[#2B2B2B]/40 font-serif">
            Plateforme de dropshipping de confiance  -Devise : Franc CFA (FCFA) uniquement.
          </p>
        </div>
      </footer>
    </div>
  );
}
