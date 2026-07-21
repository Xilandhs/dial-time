import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { Produit, Commande, LigneCommande, Statistics } from "./src/types.js";

const app = express();
const PORT = 3000;

// Resolve __dirname since we're using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "data", "db.json");

// Ensure DB directory and file exist
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ products: [], orders: [] }, null, 2), "utf8");
}

// Helpers to read and write database with automatic order expiration check
function readDB(): { products: Produit[]; orders: Commande[] } {
  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(data);
    let orders: Commande[] = parsed.orders || [];
    const products: Produit[] = parsed.products || [];

    // Auto-expire orders older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoMs = sevenDaysAgo.getTime();

    let updated = false;
    orders = orders.map((order) => {
      if (order.statut === "en_attente") {
        const orderTime = new Date(order.date_creation).getTime();
        if (orderTime < sevenDaysAgoMs) {
          order.statut = "expiré";
          updated = true;
        }
      }
      return order;
    });

    if (updated) {
      fs.writeFileSync(DB_PATH, JSON.stringify({ products, orders }, null, 2), "utf8");
    }

    return { products, orders };
  } catch (error) {
    console.error("Error reading database:", error);
    return { products: [], orders: [] };
  }
}

function writeDB(data: { products: Produit[]; orders: Commande[] }) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing to database:", error);
  }
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
app.get("/api/products", (req, res) => {
  const db = readDB();
  res.json(db.products);
});

app.post("/api/products", (req, res) => {
  const { nom, description, prix, actif, phare, couleurs } = req.body;
  
  if (!nom || !description || isNaN(Number(prix)) || !Array.isArray(couleurs)) {
    return res.status(400).json({ error: "Champs invalides pour la création du produit." });
  }

  const db = readDB();
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

  db.products.push(newProduct);
  writeDB(db);
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { nom, description, prix, actif, phare, couleurs } = req.body;

  const db = readDB();
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Produit non trouvé" });
  }

  db.products[index] = {
    ...db.products[index],
    nom: nom !== undefined ? nom : db.products[index].nom,
    description: description !== undefined ? description : db.products[index].description,
    prix: prix !== undefined ? Number(prix) : db.products[index].prix,
    actif: actif !== undefined ? !!actif : db.products[index].actif,
    phare: phare !== undefined ? !!phare : db.products[index].phare,
    couleurs: couleurs !== undefined ? couleurs : db.products[index].couleurs
  };

  writeDB(db);
  res.json(db.products[index]);
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();

  // Check if any order references this product to decide whether to physical or soft delete
  const isReferenced = db.orders.some((order) =>
    order.lignes.some((ligne) => ligne.produit_id === id)
  );

  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Produit non trouvé" });
  }

  if (isReferenced) {
    // Soft delete to protect history
    db.products[index].actif = false;
    writeDB(db);
    res.json({ message: "Produit référencé par des commandes existantes, il a été désactivé à la place.", softDeleted: true });
  } else {
    // Physical delete
    db.products.splice(index, 1);
    writeDB(db);
    res.json({ message: "Produit supprimé avec succès.", softDeleted: false });
  }
});

// 2. ORDERS API
app.get("/api/orders", (req, res) => {
  const db = readDB();
  let orders = db.orders;

  const { statut, telephone, produit_id, date_debut, date_fin, search } = req.query;

  // Filters
  if (statut) {
    orders = orders.filter((o) => o.statut === statut);
  }
  if (telephone) {
    orders = orders.filter((o) => o.telephone_client.includes(telephone as string));
  }
  if (produit_id) {
    orders = orders.filter((o) => o.lignes.some((l) => l.produit_id === produit_id));
  }
  if (date_debut) {
    orders = orders.filter((o) => new Date(o.date_creation) >= new Date(date_debut as string));
  }
  if (date_fin) {
    orders = orders.filter((o) => new Date(o.date_creation) <= new Date(date_fin as string));
  }
  if (search) {
    const s = (search as string).toLowerCase();
    orders = orders.filter(
      (o) =>
        o.code_commande.toLowerCase().includes(s) ||
        o.nom_client.toLowerCase().includes(s) ||
        o.telephone_client.includes(s) ||
        o.adresse_livraison.toLowerCase().includes(s)
    );
  }

  // Sort by newest first
  orders.sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());

  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const { nom_client, telephone_client, adresse_livraison, note, lignes } = req.body;

  if (!nom_client || !telephone_client || !adresse_livraison || !Array.isArray(lignes) || lignes.length === 0) {
    return res.status(400).json({ error: "Informations de commande manquantes ou incorrectes." });
  }

  const db = readDB();

  // Validate and construct Order Lines with Frozen Prices
  const finalLignes: LigneCommande[] = [];
  let totalCalculated = 0;

  for (const item of lignes) {
    const originalProduct = db.products.find((p) => p.id === item.produit_id);
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
      prix_unitaire_fige: price // Price is frozen forever
    });
  }

  const existingCodes = db.orders.map((o) => o.code_commande);
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

  db.orders.push(newOrder);
  writeDB(db);

  res.status(201).json(newOrder);
});

app.put("/api/orders/:code/status", (req, res) => {
  const { code } = req.params;
  const { statut } = req.body; // 'en_attente' | 'payé' | 'expiré'

  if (!["en_attente", "payé", "expiré"].includes(statut)) {
    return res.status(400).json({ error: "Statut invalide" });
  }

  const db = readDB();
  const index = db.orders.findIndex((o) => o.code_commande === code);
  if (index === -1) {
    return res.status(404).json({ error: "Commande non trouvée" });
  }

  db.orders[index].statut = statut;
  writeDB(db);

  res.json(db.orders[index]);
});

// Endpoint to reset and clear demo orders so the user starts with 100% concrete, real data
app.post("/api/reset-demo", (req, res) => {
  const db = readDB();
  db.orders = [];
  writeDB(db);
  res.json({ message: "Toutes les commandes de démonstration ont été effacées. Votre base de données est maintenant prête pour de vraies transactions !", success: true });
});

// 3. STATISTICS/ANALYTICS API
app.get("/api/stats", (req, res) => {
  const db = readDB();
  const orders = db.orders;
  
  const { period } = req.query; // 'day' | 'week' | 'month'

  // Chiffre d'affaires réalisé (payé)
  const ca_realise = orders
    .filter((o) => o.statut === "payé")
    .reduce((sum, o) => sum + o.montant_total, 0);

  // Chiffre d'affaires potentiel (tous statuts confondus)
  const ca_potentiel = orders.reduce((sum, o) => sum + o.montant_total, 0);

  // Taux de désistement = expirés / total
  const totalCount = orders.length;
  const expirerCount = orders.filter((o) => o.statut === "expiré").length;
  const taux_desistement = totalCount > 0 ? (expirerCount / totalCount) * 100 : 0;

  // Top produits vendus (calculé par quantité et CA total cumulé dans les lignes de commandes payées)
  const productStatsMap: { [key: string]: { nom: string; quantite: number; ca: number } } = {};
  
  orders.filter(o => o.statut === 'payé').forEach((order) => {
    order.lignes.forEach((ligne) => {
      if (!productStatsMap[ligne.produit_id]) {
        productStatsMap[ligne.produit_id] = {
          nom: ligne.nom_produit,
          quantite: 0,
          ca: 0
        };
      }
      productStatsMap[ligne.produit_id].quantite += ligne.quantite;
      productStatsMap[ligne.produit_id].ca += ligne.quantite * ligne.prix_unitaire_fige;
    });
  });

  const top_produits = Object.values(productStatsMap).sort((a, b) => b.quantite - a.quantite);

  // Répartition par statut
  const statuses: ("en_attente" | "payé" | "expiré")[] = ["en_attente", "payé", "expiré"];
  const statut_repartition = statuses.map((st) => {
    const filtered = orders.filter((o) => o.statut === st);
    const count = filtered.length;
    const montant = filtered.reduce((sum, o) => sum + o.montant_total, 0);
    return {
      statut: st,
      count,
      montant
    };
  });

  // Évolution du CA par date
  // Regrouper par jour, format YYYY-MM-DD
  const evolutionMap: { [key: string]: { paye: number; potentiel: number } } = {};
  
  orders.forEach((order) => {
    const dateStr = order.date_creation.split("T")[0]; // YYYY-MM-DD
    if (!evolutionMap[dateStr]) {
      evolutionMap[dateStr] = { paye: 0, potentiel: 0 };
    }
    if (order.statut === "payé") {
      evolutionMap[dateStr].paye += order.montant_total;
    }
    evolutionMap[dateStr].potentiel += order.montant_total;
  });

  // Sort dates
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
