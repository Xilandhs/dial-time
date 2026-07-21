import dotenv from "dotenv";
dotenv.config();
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { Produit, Commande, LigneCommande, Statistics } from "./src/types.js";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SUPABASE CLIENT ---
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// Auto-expire les commandes "en_attente" de plus de 7 jours
async function expireOldOrders() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  await supabase
    .from("orders")
    .update({ statut: "expiré" })
    .eq("statut", "en_attente")
    .lt("date_creation", sevenDaysAgo.toISOString());
}

// Generate unique 6-character code: #A1B2C3
function generateOrderCode(existingCodes: string[]): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  do {
    code = "#";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingCodes.includes(code));
  return code;
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API ROUTES ---

// 1. PRODUCTS API
app.get("/api/products", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/products", async (req, res) => {
  const { nom, description, prix, actif, phare, couleurs } = req.body;

  if (!nom || !description || isNaN(Number(prix)) || !Array.isArray(couleurs)) {
    return res.status(400).json({ error: "Champs invalides pour la création du produit." });
  }

  const newProduct: Produit = {
    id: "prod_" + Date.now(),
    nom,
    description,
    prix: Number(prix),
    actif: !!actif,
    phare: !!phare,
    couleurs: couleurs.map((col: any) => ({
      id: col.id || "col_" + Math.random().toString(36).substr(2, 9),
      nom_couleur: col.nom_couleur,
      photo: col.photo
    }))
  };

  const { data, error } = await supabase.from("products").insert(newProduct).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { nom, description, prix, actif, phare, couleurs } = req.body;

  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: "Produit non trouvé" });
  }

  const updated = {
    nom: nom !== undefined ? nom : existing.nom,
    description: description !== undefined ? description : existing.description,
    prix: prix !== undefined ? Number(prix) : existing.prix,
    actif: actif !== undefined ? !!actif : existing.actif,
    phare: phare !== undefined ? !!phare : existing.phare,
    couleurs: couleurs !== undefined ? couleurs : existing.couleurs
  };

  const { data, error } = await supabase
    .from("products")
    .update(updated)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !product) {
    return res.status(404).json({ error: "Produit non trouvé" });
  }

  // Vérifie si une commande référence ce produit (dans le jsonb "lignes")
  const { data: orders } = await supabase
    .from("orders")
    .select("code_commande, lignes");

  const isReferenced = (orders || []).some((order: any) =>
    order.lignes.some((ligne: LigneCommande) => ligne.produit_id === id)
  );

  if (isReferenced) {
    const { data, error } = await supabase
      .from("products")
      .update({ actif: false })
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: "Produit référencé par des commandes existantes, il a été désactivé à la place.", softDeleted: true, product: data });
  } else {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: "Produit supprimé avec succès.", softDeleted: false });
  }
});

// 2. ORDERS API
app.get("/api/orders", async (req, res) => {
  await expireOldOrders();

  let query = supabase.from("orders").select("*");
  const { statut, telephone, produit_id, date_debut, date_fin, search } = req.query;

  if (statut) query = query.eq("statut", statut as string);
  if (telephone) query = query.ilike("telephone_client", `%${telephone}%`);
  if (date_debut) query = query.gte("date_creation", new Date(date_debut as string).toISOString());
  if (date_fin) query = query.lte("date_creation", new Date(date_fin as string).toISOString());

  const { data, error } = await query.order("date_creation", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  let orders = data || [];

  // Filtres qui portent sur le contenu jsonb "lignes" : appliqués côté serveur après lecture
  if (produit_id) {
    orders = orders.filter((o: any) => o.lignes.some((l: LigneCommande) => l.produit_id === produit_id));
  }
  if (search) {
    const s = (search as string).toLowerCase();
    orders = orders.filter(
      (o: any) =>
        o.code_commande.toLowerCase().includes(s) ||
        o.nom_client.toLowerCase().includes(s) ||
        o.telephone_client.includes(s) ||
        o.adresse_livraison.toLowerCase().includes(s)
    );
  }

  res.json(orders);
});

app.post("/api/orders", async (req, res) => {
  const { nom_client, telephone_client, adresse_livraison, note, lignes } = req.body;

  if (!nom_client || !telephone_client || !adresse_livraison || !Array.isArray(lignes) || lignes.length === 0) {
    return res.status(400).json({ error: "Informations de commande manquantes ou incorrectes." });
  }

  const { data: products, error: prodError } = await supabase.from("products").select("*");
  if (prodError) return res.status(500).json({ error: prodError.message });

  const finalLignes: LigneCommande[] = [];
  let totalCalculated = 0;

  for (const item of lignes) {
    const originalProduct = (products || []).find((p: Produit) => p.id === item.produit_id);
    if (!originalProduct) {
      return res.status(404).json({ error: `Produit avec ID ${item.produit_id} non trouvé.` });
    }

    const price = originalProduct.prix;
    const qty = Number(item.quantite) || 1;
    totalCalculated += price * qty;

    finalLignes.push({
      produit_id: originalProduct.id,
      nom_produit: originalProduct.nom,
      couleur_choisie: item.couleur_choisie || originalProduct.couleurs[0]?.nom_couleur || "Standard",
      quantite: qty,
      prix_unitaire_fige: price
    });
  }

  const { data: existingOrders } = await supabase.from("orders").select("code_commande");
  const existingCodes = (existingOrders || []).map((o: any) => o.code_commande);
  const code_commande = generateOrderCode(existingCodes);

  const newOrder: Commande = {
    code_commande,
    nom_client,
    telephone_client,
    adresse_livraison,
    note,
    statut: "en_attente",
    date_creation: new Date().toISOString(),
    montant_total: totalCalculated,
    lignes: finalLignes
  };

  const { data, error } = await supabase.from("orders").insert(newOrder).select().single();
  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json(data);
});

app.put("/api/orders/:code/status", async (req, res) => {
  const { code } = req.params;
  const { statut } = req.body;

  if (!["en_attente", "payé", "expiré"].includes(statut)) {
    return res.status(400).json({ error: "Statut invalide" });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ statut })
    .eq("code_commande", code)
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Commande non trouvée" });
  }

  res.json(data);
});

// 3. STATISTICS/ANALYTICS API
app.get("/api/stats", async (req, res) => {
  await expireOldOrders();

  const { data, error } = await supabase.from("orders").select("*");
  if (error) return res.status(500).json({ error: error.message });
  const orders: Commande[] = data || [];

  const ca_realise = orders
    .filter((o) => o.statut === "payé")
    .reduce((sum, o) => sum + o.montant_total, 0);

  const ca_potentiel = orders.reduce((sum, o) => sum + o.montant_total, 0);

  const totalCount = orders.length;
  const expirerCount = orders.filter((o) => o.statut === "expiré").length;
  const taux_desistement = totalCount > 0 ? (expirerCount / totalCount) * 100 : 0;

  const productStatsMap: { [key: string]: { nom: string; quantite: number; ca: number } } = {};

  orders.filter((o) => o.statut === "payé").forEach((order) => {
    order.lignes.forEach((ligne) => {
      if (!productStatsMap[ligne.produit_id]) {
        productStatsMap[ligne.produit_id] = { nom: ligne.nom_produit, quantite: 0, ca: 0 };
      }
      productStatsMap[ligne.produit_id].quantite += ligne.quantite;
      productStatsMap[ligne.produit_id].ca += ligne.quantite * ligne.prix_unitaire_fige;
    });
  });

  const top_produits = Object.values(productStatsMap).sort((a, b) => b.quantite - a.quantite);

  const statuses: ("en_attente" | "payé" | "expiré")[] = ["en_attente", "payé", "expiré"];
  const statut_repartition = statuses.map((st) => {
    const filtered = orders.filter((o) => o.statut === st);
    const count = filtered.length;
    const montant = filtered.reduce((sum, o) => sum + o.montant_total, 0);
    return { statut: st, count, montant };
  });

  const evolutionMap: { [key: string]: { paye: number; potentiel: number } } = {};

  orders.forEach((order) => {
    const dateStr = order.date_creation.split("T")[0];
    if (!evolutionMap[dateStr]) evolutionMap[dateStr] = { paye: 0, potentiel: 0 };
    if (order.statut === "payé") evolutionMap[dateStr].paye += order.montant_total;
    evolutionMap[dateStr].potentiel += order.montant_total;
  });

  const sortedDates = Object.keys(evolutionMap).sort();
  const evolution_ca = sortedDates.map((date) => ({
    date,
    paye: evolutionMap[date].paye,
    potentiel: evolutionMap[date].potentiel
  }));

  const statistics: Statistics = {
    ca_realise,
    ca_potentiel,
    taux_desistement,
    top_produits,
    statut_repartition,
    evolution_ca
  };

  res.json(statistics);
});

// Serve Vite or Static files depending on mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();