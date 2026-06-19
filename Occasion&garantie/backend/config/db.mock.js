const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.json');

const defaultData = {
  users: [],
  products: [],
  categories: [
    { id: 1, name: 'Smartphones', slug: 'smartphones' },
    { id: 2, name: 'Tablettes', slug: 'tablettes' },
    { id: 3, name: 'Ordinateurs', slug: 'ordinateurs' },
    { id: 4, name: 'Accessoires', slug: 'accessoires' },
    { id: 5, name: 'Gaming', slug: 'gaming' },
  ],
  orders: [],
  order_items: [],
  product_images: [],
  deposits: [],
  nextId: { users: 1, products: 1, orders: 1, order_items: 1, product_images: 1, deposits: 1 },
};

let data = { ...defaultData };

function ensureDefaults(obj, defaults) {
  for (const key of Object.keys(defaults)) {
    if (!(key in obj)) obj[key] = defaults[key];
    else if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) && defaults[key] !== null) {
      ensureDefaults(obj[key], defaults[key]);
    }
  }
}

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      let raw = fs.readFileSync(DB_PATH, 'utf8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      data = JSON.parse(raw);
      ensureDefaults(data, defaultData);
    }
  } catch { data = JSON.parse(JSON.stringify(defaultData)); }
}

function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

load();

function parseCols(sql) {
  const upper = sql.toUpperCase();
  const setIdx = upper.indexOf('SET');
  const whereIdx = upper.indexOf('WHERE');
  if (setIdx === -1) return [];
  const setClause = sql.substring(setIdx + 3, whereIdx > -1 ? whereIdx : sql.length).trim();
  return setClause.split(',').map(s => s.trim());
}

const mockPool = {
  query: async (sql, params = []) => {
    const upper = sql.trim().toUpperCase();

    // SELECT users by email
    if (upper.startsWith('SELECT') && upper.includes('FROM USERS') && upper.includes('WHERE EMAIL =')) {
      const user = data.users.find(u => u.email === params[0]);
      return [user ? [user] : []];
    }

    // SELECT users by id
    if (upper.startsWith('SELECT') && upper.includes('FROM USERS') && upper.includes('WHERE ID =')) {
      const user = data.users.find(u => u.id === params[0]);
      return [user ? [user] : []];
    }

    // INSERT INTO users
    if (upper.startsWith('INSERT INTO USERS')) {
      const newUser = {
        id: data.nextId.users++,
        full_name: params[0],
        email: params[1],
        password: params[2],
        phone: params[3] || null,
        role: params[4] || 'client',
        created_at: new Date().toISOString(),
      };
      data.users.push(newUser);
      save();
      return [{ insertId: newUser.id }];
    }

    // SELECT products with LEFT JOIN (public)
    if (upper.startsWith('SELECT') && upper.includes('FROM PRODUCTS') && upper.includes('LEFT JOIN CATEGORIES')) {
      let results = [...data.products];

      if (upper.includes('WHERE P.ACTIVE = TRUE')) {
        results = results.filter(p => p.active !== false);
      }
      if (upper.includes('WHERE P.SLUG =')) {
        results = results.filter(p => p.slug === params[0]);
      }
      if (upper.includes('WHERE P.FEATURED = TRUE')) {
        results = results.filter(p => p.featured === true);
      }
      if (upper.includes('AND LOWER(C.NAME) = ?')) {
        const nameParam = params[params.length - 1];
        const cat = data.categories.find(c => c.name.toLowerCase() === nameParam);
        if (cat) results = results.filter(p => p.category_id === cat.id);
      }
      if (upper.includes('P.FEATURED DESC')) {
        results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      }

      results = results.map(p => {
        const cat = data.categories.find(c => c.id === p.category_id);
        const item = { ...p, category_name: cat ? cat.name : null };
        if (typeof item.gallery === 'string') try { item.gallery = JSON.parse(item.gallery); } catch { item.gallery = null; }
        if (typeof item.specs === 'string') try { item.specs = JSON.parse(item.specs); } catch { item.specs = null; }
        return item;
      });

      if (upper.includes('LIMIT 8')) {
        results = results.slice(0, 8);
      }

      return [results];
    }

    // SELECT products simple (admin)
    if (upper.startsWith('SELECT') && upper.includes('FROM PRODUCTS') && !upper.includes('JOIN')) {
      let results = [...data.products];
      if (params.length > 0 && upper.includes('SLUG =')) {
        results = results.filter(p => p.slug === params[0]);
      }
      if (params.length > 0 && upper.includes('WHERE ID =')) {
        results = results.filter(p => p.id === Number(params[0]));
      }
      if (upper.includes('ACTIVE = TRUE')) {
        results = results.filter(p => p.active !== false);
      }
      if (upper.includes('SELECT ID FROM')) {
        return [results.map(p => ({ id: p.id }))];
      }
      results = results.map(p => {
        const item = { ...p };
        if (typeof item.gallery === 'string') try { item.gallery = JSON.parse(item.gallery); } catch { item.gallery = null; }
        if (typeof item.specs === 'string') try { item.specs = JSON.parse(item.specs); } catch { item.specs = null; }
        return item;
      });
      return [results];
    }

    // INSERT INTO products
    if (upper.startsWith('INSERT INTO PRODUCTS')) {
      const newProduct = {
        id: data.nextId.products++,
        name: params[0],
        slug: params[1],
        description: params[2],
        price: params[3],
        old_price: params[4] || null,
        category_id: params[5] || null,
        brand: params[6] || null,
        state: params[7] || 'tres_bon',
        warranty: params[8] || '6 mois',
        stock: params[9] || 1,
        featured: params[10] || false,
        image: params[11] || null,
        gallery: params[12] || null,
        specs: params[13] || null,
        active: true,
        created_at: new Date().toISOString(),
      };
      data.products.push(newProduct);
      save();
      return [{ insertId: newProduct.id }];
    }

    // UPDATE users SET password = ? WHERE email = ? (reset password)
    if (upper.startsWith('UPDATE USERS SET') && upper.includes('WHERE EMAIL =')) {
      const password = params[0];
      const email = params[1];
      const idx = data.users.findIndex(u => u.email === email);
      if (idx !== -1) {
        data.users[idx].password = password;
        save();
      }
      return [[]];
    }

    // UPDATE products SET ... WHERE slug = ? (seed)
    if (upper.startsWith('UPDATE PRODUCTS SET') && upper.includes('WHERE SLUG =')) {
      const slug = params[params.length - 1];
      const idx = data.products.findIndex(p => p.slug === slug);
      if (idx !== -1) {
        const cols = parseCols(sql);
        cols.forEach((assignment, i) => {
          const col = assignment.split('=')[0].trim().toLowerCase();
          if (col === 'specs') data.products[idx][col] = params[i];
        });
        save();
      }
      return [[]];
    }

    // UPDATE products SET ... WHERE id = ? (admin edit)
    if (upper.startsWith('UPDATE PRODUCTS SET') && upper.includes('WHERE ID =')) {
      const id = params[params.length - 1];
      const idx = data.products.findIndex(p => p.id === Number(id));
      if (idx !== -1) {
        const cols = parseCols(sql);
        cols.forEach((assignment, i) => {
          const col = assignment.split('=')[0].trim().toLowerCase();
          if (col === 'specs') data.products[idx][col] = params[i];
          else if (col === 'name') data.products[idx].name = params[i];
          else if (col === 'slug') data.products[idx].slug = params[i];
          else if (col === 'description') data.products[idx].description = params[i];
          else if (col === 'price') data.products[idx].price = params[i];
          else if (col === 'old_price') data.products[idx].old_price = params[i];
          else if (col === 'category_id') data.products[idx].category_id = params[i];
          else if (col === 'brand') data.products[idx].brand = params[i];
          else if (col === 'state') data.products[idx].state = params[i];
          else if (col === 'warranty') data.products[idx].warranty = params[i];
          else if (col === 'stock') data.products[idx].stock = params[i];
          else if (col === 'featured') data.products[idx].featured = params[i];
          else if (col === 'image') data.products[idx].image = params[i];
          else if (col === 'gallery') data.products[idx].gallery = params[i];
        });
        save();
      }
      return [[]];
    }

    // INSERT INTO deposits
    if (upper.startsWith('INSERT INTO DEPOSITS')) {
      const newDeposit = {
        id: data.nextId.deposits++,
        user_id: params[0],
        product_id: params[1],
        product_name: params[2],
        screenshot: params[3] || null,
        status: params[4] || 'en_attente',
        created_at: new Date().toISOString(),
      };
      data.deposits.push(newDeposit);
      save();
      return [{ insertId: newDeposit.id }];
    }

    // DELETE FROM products WHERE id = ?
    if (upper.startsWith('DELETE FROM PRODUCTS')) {
      const id = params[0];
      data.products = data.products.filter(p => p.id !== Number(id));
      save();
      return [[]];
    }

    console.log('Unhandled SQL:', sql, JSON.stringify(params));
    return [[]];
  }
};

module.exports = mockPool;
