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
  premium_payments: [],
  nextId: { users: 1, products: 1, orders: 1, order_items: 1, product_images: 1, premium_payments: 1 },
};

let data = { ...defaultData };

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      let raw = fs.readFileSync(DB_PATH, 'utf8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      data = JSON.parse(raw);
    }
  } catch { data = { ...defaultData }; }
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

    // SELECT users by phone
    if (upper.startsWith('SELECT') && upper.includes('FROM USERS') && upper.includes('WHERE PHONE =')) {
      const user = data.users.find(u => u.phone === params[0]);
      return [user ? [user] : []];
    }

    // SELECT users by role
    if (upper.startsWith('SELECT') && upper.includes('FROM USERS') && upper.includes('WHERE ROLE =')) {
      const users = data.users.filter(u => u.role === params[0]);
      return [users];
    }

    // SELECT users by verification_token
    if (upper.startsWith('SELECT') && upper.includes('FROM USERS') && upper.includes('WHERE VERIFICATION_TOKEN =')) {
      const user = data.users.find(u => u.verification_token === params[0]);
      return [user ? [user] : []];
    }

    // INSERT INTO users
    if (upper.startsWith('INSERT INTO USERS')) {
      const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
      const colNames = colsMatch ? colsMatch[1].split(',').map(c => c.trim().toLowerCase()) : [];
      const newUser = { id: data.nextId.users++, created_at: new Date().toISOString() };
      colNames.forEach((col, i) => {
        const val = params[i];
        if (col === 'password') newUser.password = val;
        else if (col === 'phone_verified') newUser.phone_verified = val === undefined ? false : !!val;
        else if (col === 'role') newUser.role = val || 'client';
        else if (col === 'verification_token') newUser.verification_token = val || null;
        else if (col === 'verification_expires') newUser.verification_expires = val || null;
        else newUser[col] = val;
      });
      if (!newUser.role) newUser.role = 'client';
      if (newUser.phone_verified === undefined) newUser.phone_verified = false;
      data.users.push(newUser);
      save();
      return [{ insertId: newUser.id }];
    }

    // SELECT products with LEFT JOIN (public)
    if (upper.startsWith('SELECT') && upper.includes('FROM PRODUCTS') && upper.includes('LEFT JOIN')) {
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
        const nameParam = params.find(p => typeof p === 'string' && p.length > 2);
        const cat = data.categories.find(c => c.name.toLowerCase() === nameParam);
        if (cat) results = results.filter(p => p.category_id === cat.id);
      }
      if (upper.includes('P.SELLER_ID =')) {
        results = results.filter(p => p.seller_id === Number(params[params.length - 1]));
      }
      if (upper.includes('P.FEATURED DESC')) {
        results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      }

      results = results.map(p => {
        const cat = data.categories.find(c => c.id === p.category_id);
        const seller = data.users.find(u => u.id === p.seller_id);
        const item = { ...p, category_name: cat ? cat.name : null, seller_name: seller ? seller.store_name || seller.full_name : null, seller_logo: seller ? seller.store_logo : null, seller_full_name: seller ? seller.full_name : null };
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
      const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
      const colNames = colsMatch ? colsMatch[1].split(',').map(c => c.trim().toLowerCase()) : [];
      const newProduct = { id: data.nextId.products++, active: true, created_at: new Date().toISOString() };
      colNames.forEach((col, i) => {
        if (col === 'gallery' || col === 'specs') newProduct[col] = typeof params[i] === 'string' ? params[i] : (params[i] ? JSON.stringify(params[i]) : null);
        else newProduct[col] = params[i] !== undefined ? params[i] : null;
      });
      data.products.push(newProduct);
      save();
      return [{ insertId: newProduct.id }];
    }

    // UPDATE users SET ... WHERE id = ?
    if (upper.startsWith('UPDATE USERS SET') && upper.includes('WHERE ID =')) {
      const id = params[params.length - 1];
      const idx = data.users.findIndex(u => u.id === Number(id));
      if (idx !== -1) {
        const setClause = sql.substring(sql.toUpperCase().indexOf('SET') + 3, sql.toUpperCase().indexOf('WHERE')).trim();
        const assignments = setClause.split(',').map(s => s.trim());
        let paramIdx = 0;
        assignments.forEach(assignment => {
          const eqIdx = assignment.indexOf('=');
          const col = assignment.substring(0, eqIdx).trim().toLowerCase();
          let val = assignment.substring(eqIdx + 1).trim();
          if (val === '?') {
            val = params[paramIdx];
            paramIdx++;
          } else if (val.toUpperCase() === 'NULL') {
            val = null;
          }
          data.users[idx][col] = val;
        });
        save();
      }
      return [[]];
    }

    // UPDATE products SET ... WHERE slug = ? (seed)
    if (upper.startsWith('UPDATE PRODUCTS SET') && upper.includes('WHERE SLUG =')) {
      const slug = params[params.length - 1];
      const idx = data.products.findIndex(p => p.slug === slug);
      if (idx !== -1) {
        const assignments = parseCols(sql);
        assignments.forEach((assignment, i) => {
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
        const assignments = parseCols(sql);
        assignments.forEach((assignment, i) => {
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

    // INSERT INTO reservations
    if (upper.startsWith('INSERT INTO RESERVATIONS')) {
      const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
      const colNames = colsMatch ? colsMatch[1].split(',').map(c => c.trim().toLowerCase()) : [];
      const newRow = { id: data.nextId.reservations++, created_at: new Date().toISOString() };
      colNames.forEach((col, i) => {
        if (col === 'status') newRow[col] = params[i] || 'en_attente';
        else newRow[col] = params[i];
      });
      data.reservations.push(newRow);
      save();
      return [{ insertId: newRow.id }];
    }

    // SELECT reservations with JOIN products
    if (upper.startsWith('SELECT') && upper.includes('FROM RESERVATIONS R') && upper.includes('JOIN PRODUCTS P')) {
      const userId = params[0];
      const results = data.reservations
        .filter(r => r.user_id === userId)
        .map(r => {
          const product = data.products.find(p => p.id === r.product_id);
          return { ...r, product_name: product ? product.name : null, product_price: product ? product.price : null };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return [results];
    }

    // SELECT reservations with JOIN users
    if (upper.startsWith('SELECT') && upper.includes('FROM RESERVATIONS R') && upper.includes('JOIN USERS U')) {
      const rId = params[0];
      const uId = params[1];
      const reservation = data.reservations.find(r => r.id === rId && r.user_id === uId);
      if (reservation) {
        const user = data.users.find(u => u.id === reservation.user_id);
        const result = { ...reservation, full_name: user ? user.full_name : null, phone: user ? user.phone : null };
        return [[result]];
      }
      return [[]];
    }

    // SELECT reservations by user + product + status
    if (upper.startsWith('SELECT') && upper.includes('FROM RESERVATIONS') && upper.includes('WHERE USER_ID =') && upper.includes('PRODUCT_ID =') && upper.includes('STATUS =')) {
      const userIdx = sql.toUpperCase().indexOf('USER_ID =') + 10;
      const prodIdx = sql.toUpperCase().indexOf('PRODUCT_ID =');
      const statIdx = sql.toUpperCase().indexOf('STATUS =');
      const userParam = Number(params[0]);
      const prodParam = Number(params[1]);
      const statParam = params[2];
      const found = data.reservations.find(r => r.user_id === userParam && r.product_id === prodParam && r.status === statParam);
      return [found ? [found] : []];
    }

    // SELECT reservations by screenshot_token
    if (upper.startsWith('SELECT') && upper.includes('FROM RESERVATIONS') && upper.includes('SCREENSHOT_TOKEN =')) {
      const reservation = data.reservations.find(r => r.screenshot_token === params[0]);
      return [reservation ? [reservation] : []];
    }

    // SELECT reservations by id (screenshot lookup)
    if (upper.startsWith('SELECT') && upper.includes('FROM RESERVATIONS') && upper.includes('WHERE ID =') && !upper.includes('USER_ID =')) {
      const reservation = data.reservations.find(r => r.id === Number(params[0]));
      return [reservation ? [reservation] : []];
    }

    // UPDATE reservations SET ... WHERE id = ?
    if (upper.startsWith('UPDATE RESERVATIONS SET') && upper.includes('WHERE ID =')) {
      const id = Number(params[params.length - 1]);
      const idx = data.reservations.findIndex(r => r.id === id);
      if (idx !== -1) {
        const setClause = sql.substring(sql.toUpperCase().indexOf('SET') + 3, sql.toUpperCase().indexOf('WHERE')).trim();
        const assignments = setClause.split(',').map(s => s.trim());
        let paramIdx = 0;
        assignments.forEach(assignment => {
          const eqIdx = assignment.indexOf('=');
          const col = assignment.substring(0, eqIdx).trim().toLowerCase();
          let val = assignment.substring(eqIdx + 1).trim();
          if (val === '?') {
            val = params[paramIdx];
            paramIdx++;
          } else if (val.toUpperCase() === 'NULL') {
            val = null;
          } else if (val.includes('?')) {
            val = params[paramIdx];
            paramIdx++;
          }
          if (col !== 'screenshot_views' || val !== undefined) {
            data.reservations[idx][col] = val;
          }
        });
        save();
      }
      return [[]];
    }

    // SELECT COUNT(*) from products
    if (upper.includes('SELECT') && upper.includes('COUNT(*)') && upper.includes('FROM PRODUCTS')) {
      let filtered = [...data.products];
      if (upper.includes('SELLER_ID =')) {
        filtered = filtered.filter(p => p.seller_id === Number(params[0]));
      }
      if (upper.includes('ACTIVE=TRUE') || upper.includes('ACTIVE = TRUE')) {
        filtered = filtered.filter(p => p.active !== false);
      }
      return [[{ total: filtered.length, active_count: filtered.filter(p => p.active !== false).length }]];
    }

    // SELECT products simple with seller_id filter (seller dashboard)
    if (upper.startsWith('SELECT') && upper.includes('FROM PRODUCTS') && upper.includes('SELLER_ID =') && !upper.includes('JOIN')) {
      let results = data.products.filter(p => p.seller_id === Number(params[0]));
      if (upper.includes('LIMIT 5')) results = results.slice(0, 5);
      results = results.map(p => {
        const cat = data.categories.find(c => c.id === p.category_id);
        const item = { ...p, category_name: cat ? cat.name : null };
        if (typeof item.gallery === 'string') try { item.gallery = JSON.parse(item.gallery); } catch { item.gallery = null; }
        if (typeof item.specs === 'string') try { item.specs = JSON.parse(item.specs); } catch { item.specs = null; }
        return item;
      });
      return [results];
    }

    // SELECT users by id and role (seller profile)
    if (upper.startsWith('SELECT') && upper.includes('FROM USERS') && upper.includes('WHERE ID =') && upper.includes('ROLE =')) {
      const user = data.users.find(u => u.id === Number(params[0]) && u.role === params[1]);
      return [user ? [user] : []];
    }

    // UPDATE users SET store_name, store_logo
    if (upper.startsWith('UPDATE USERS SET') && (upper.includes('STORE_NAME') || upper.includes('STORE_LOGO'))) {
      const id = Number(params[params.length - 1]);
      const idx = data.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        const assignments = parseCols(sql);
        let paramIdx = 0;
        assignments.forEach(a => {
          const eq = a.indexOf('=');
          const col = a.substring(0, eq).trim().toLowerCase();
          let val = a.substring(eq + 1).trim();
          if (val === '?') { val = params[paramIdx]; paramIdx++; }
          data.users[idx][col] = val;
        });
        save();
      }
      return [[]];
    }

    // INSERT INTO premium_payments
    if (upper.startsWith('INSERT INTO PREMIUM_PAYMENTS')) {
      const newPayment = { id: data.nextId.premium_payments++, user_id: params[0], amount: params[1], status: params[2], created_at: new Date().toISOString() };
      data.premium_payments.push(newPayment);
      save();
      return [{ insertId: newPayment.id }];
    }

    // SELECT premium_payments by user_id and status
    if (upper.startsWith('SELECT') && upper.includes('FROM PREMIUM_PAYMENTS') && upper.includes('WHERE USER_ID =') && upper.includes('STATUS =')) {
      const payments = data.premium_payments.filter(p => p.user_id === params[0] && p.status === params[1]).sort((a, b) => b.id - a.id);
      return [payments.length > 0 ? [payments[0]] : []];
    }

    // UPDATE premium_payments SET
    if (upper.startsWith('UPDATE PREMIUM_PAYMENTS SET')) {
      const id = Number(params[params.length - 1]);
      const idx = data.premium_payments.findIndex(p => p.id === id);
      if (idx !== -1) {
        const assignments = parseCols(sql);
        let paramIdx = 0;
        assignments.forEach(a => {
          const eq = a.indexOf('=');
          const col = a.substring(0, eq).trim().toLowerCase();
          let val = a.substring(eq + 1).trim();
          if (val === '?') { val = params[paramIdx]; paramIdx++; }
          data.premium_payments[idx][col] = val;
        });
        save();
      }
      return [[]];
    }

    // UPDATE users SET premium
    if (upper.startsWith('UPDATE USERS SET') && (upper.includes('PREMIUM'))) {
      const id = Number(params[params.length - 1]);
      const idx = data.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        const assignments = parseCols(sql);
        let paramIdx = 0;
        assignments.forEach(a => {
          const eq = a.indexOf('=');
          const col = a.substring(0, eq).trim().toLowerCase();
          let val = a.substring(eq + 1).trim();
          if (val === '?') { val = params[paramIdx]; paramIdx++; }
          data.users[idx][col] = val;
        });
        save();
      }
      return [[]];
    }

    console.log('Unhandled SQL:', sql, JSON.stringify(params));
    return [[]];
  }
};

module.exports = mockPool;
