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
  credit_purchases: [],
  credit_transactions: [],
  installments: [],
  nextId: { users: 1, products: 1, orders: 1, order_items: 1, product_images: 1, premium_payments: 1, credit_purchases: 1, credit_transactions: 1, installments: 1 },
};

let data = { ...defaultData };

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      let raw = fs.readFileSync(DB_PATH, 'utf8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      const loaded = JSON.parse(raw);
      data = { ...defaultData, ...loaded, nextId: { ...defaultData.nextId, ...(loaded.nextId || {}) } };
      if (!Array.isArray(data.premium_payments)) data.premium_payments = [];
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
      const id = Number(params[params.length - 1]);
      const idx = data.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        const setClause = sql.substring(sql.toUpperCase().indexOf('SET') + 3, sql.toUpperCase().indexOf('WHERE')).trim();
        // Handle COALESCE expressions and complex formulas
        if (setClause.includes('COALESCE') || setClause.includes('credit_balance')) {
          const eqIdx = setClause.indexOf('=');
          const col = setClause.substring(0, eqIdx).trim().toLowerCase();
          const expr = setClause.substring(eqIdx + 1).trim().toUpperCase();
          if (col === 'credit_balance' && (expr.includes('COALESCE') || expr.includes('+'))) {
            const current = Number(data.users[idx][col] || 0);
            const val = Number(params[0] || 0);
            data.users[idx][col] = current + val;
          } else if (col === 'credit_balance') {
            data.users[idx][col] = Number(params[0] || 0);
          }
        } else {
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
        }
        save();
      }
      return [{}];
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
      const newPayment = { id: data.nextId.premium_payments++, user_id: params[0], amount: params[1], status: params[2], rejection_reason: null, created_at: new Date().toISOString() };
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

    // SELECT all premium_payments with JOIN (admin)
    if (upper.startsWith('SELECT') && upper.includes('FROM PREMIUM_PAYMENTS P') && upper.includes('JOIN USERS U')) {
      const payments = data.premium_payments.map(p => {
        const user = data.users.find(u => u.id === p.user_id);
        return { ...p, full_name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '' };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return [payments];
    }

    // DELETE premium_payments by id
    if (upper.startsWith('DELETE FROM PREMIUM_PAYMENTS')) {
      const id = Number(params[0]);
      data.premium_payments = data.premium_payments.filter(p => p.id !== id);
      save();
      return [[]];
    }

    // SELECT premium_payments by id
    if (upper.startsWith('SELECT') && upper.includes('FROM PREMIUM_PAYMENTS') && upper.includes('WHERE ID =') && !upper.includes('USER_ID')) {
      const payment = data.premium_payments.find(p => p.id === params[0]);
      return [payment ? [payment] : []];
    }

    // ====== CREDIT SYSTEM HANDLERS ======

    // SELECT credit_balance or specific cols from users
    if (upper.startsWith('SELECT') && upper.includes('FROM USERS') && upper.includes('CREDIT_BALANCE')) {
      const user = data.users.find(u => u.id === params[0]);
      return [user ? [user] : []];
    }

    // SELECT from credit_purchases with JOIN users
    if (upper.startsWith('SELECT') && upper.includes('FROM CREDIT_PURCHASES C') && upper.includes('JOIN USERS U')) {
      const rows = data.credit_purchases.map(c => {
        const user = data.users.find(u => u.id === c.user_id);
        return { ...c, full_name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '' };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return [rows];
    }

    // SELECT * FROM credit_purchases WHERE id = ?
    if (upper.startsWith('SELECT') && upper.includes('FROM CREDIT_PURCHASES') && upper.includes('WHERE ID =') && !upper.includes('USER_ID')) {
      const row = data.credit_purchases.find(c => c.id === params[0]);
      return [row ? [row] : []];
    }

    // SELECT * FROM credit_purchases WHERE id = ? AND user_id = ?
    if (upper.startsWith('SELECT') && upper.includes('FROM CREDIT_PURCHASES') && upper.includes('WHERE ID =') && upper.includes('USER_ID =')) {
      const row = data.credit_purchases.find(c => c.id === params[0] && c.user_id === params[1]);
      return [row ? [row] : []];
    }

    // SELECT * FROM credit_transactions WHERE user_id = ?
    if (upper.startsWith('SELECT') && upper.includes('FROM CREDIT_TRANSACTIONS') && upper.includes('WHERE USER_ID =')) {
      const rows = data.credit_transactions.filter(t => t.user_id === params[0]).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return [rows];
    }

    // INSERT INTO credit_purchases
    if (upper.startsWith('INSERT INTO CREDIT_PURCHASES')) {
      const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
      const colNames = colsMatch ? colsMatch[1].split(',').map(c => c.trim().toLowerCase()) : [];
      const newRow = { id: data.nextId.credit_purchases++, status: 'en_attente', created_at: new Date().toISOString() };
      colNames.forEach((col, i) => {
        newRow[col] = params[i];
      });
      data.credit_purchases.push(newRow);
      save();
      return [{ insertId: newRow.id }];
    }

    // INSERT INTO credit_transactions
    if (upper.startsWith('INSERT INTO CREDIT_TRANSACTIONS')) {
      const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
      const colNames = colsMatch ? colsMatch[1].split(',').map(c => c.trim().toLowerCase()) : [];
      const newRow = { id: data.nextId.credit_transactions++, created_at: new Date().toISOString() };
      colNames.forEach((col, i) => {
        newRow[col] = params[i];
      });
      data.credit_transactions.push(newRow);
      save();
      return [{ insertId: newRow.id }];
    }

    // UPDATE credit_purchases SET ... WHERE id = ?
    if (upper.startsWith('UPDATE CREDIT_PURCHASES SET') && upper.includes('WHERE ID =')) {
      const id = Number(params[params.length - 1]);
      const idx = data.credit_purchases.findIndex(c => c.id === id);
      if (idx !== -1) {
        const setClause = sql.substring(sql.toUpperCase().indexOf('SET') + 3, sql.toUpperCase().indexOf('WHERE')).trim();
        const assignments = setClause.split(',').map(s => s.trim());
        let paramIdx = 0;
        assignments.forEach(a => {
          const eq = a.indexOf('=');
          const col = a.substring(0, eq).trim().toLowerCase();
          let val = a.substring(eq + 1).trim();
          if (val.toUpperCase() === 'NOW()') val = new Date().toISOString();
          else if (val.includes('?')) { val = params[paramIdx]; paramIdx++; }
          data.credit_purchases[idx][col] = val;
        });
        save();
      }
      return [[]];
    }

    // DELETE FROM credit_purchases WHERE id = ?
    if (upper.startsWith('DELETE FROM CREDIT_PURCHASES')) {
      data.credit_purchases = data.credit_purchases.filter(c => c.id !== Number(params[0]));
      save();
      return [[]];
    }

    // ====== INSTALLMENTS HANDLERS ======
    if (upper.startsWith('SELECT') && upper.includes('FROM INSTALLMENTS I') && upper.includes('JOIN PRODUCTS P')) {
      const rows = data.installments.map(i => {
        const p = data.products.find(x => x.id === i.product_id);
        const buyer = data.users.find(u => u.id === i.buyer_id);
        const seller = data.users.find(u => u.id === i.seller_id);
        return { ...i, product_name: p?.name || '', product_price: p?.price || 0, buyer_name: buyer?.full_name || '', buyer_email: buyer?.email || '', buyer_phone: buyer?.phone || '', seller_name: seller?.store_name || seller?.full_name || '' };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return [rows];
    }

    // SELECT * FROM installments WHERE id = ?
    if (upper.startsWith('SELECT') && upper.includes('FROM INSTALLMENTS') && upper.includes('WHERE ID =')) {
      const row = data.installments.find(i => i.id === params[0]);
      return [row ? [row] : []];
    }

    // INSERT INTO installments
    if (upper.startsWith('INSERT INTO INSTALLMENTS')) {
      const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
      const colNames = colsMatch ? colsMatch[1].split(',').map(c => c.trim().toLowerCase()) : [];
      const newRow = { id: data.nextId.installments++, status: 'en_attente', created_at: new Date().toISOString() };
      colNames.forEach((col, i) => { newRow[col] = params[i]; });
      data.installments.push(newRow);
      save();
      return [{ insertId: newRow.id }];
    }

    // UPDATE installments SET ... WHERE id = ?
    if (upper.startsWith('UPDATE INSTALLMENTS SET') && upper.includes('WHERE ID =')) {
      const id = Number(params[params.length - 1]);
      const idx = data.installments.findIndex(i => i.id === id);
      if (idx !== -1) {
        const setClause = sql.substring(sql.toUpperCase().indexOf('SET') + 3, sql.toUpperCase().indexOf('WHERE')).trim();
        const assignments = setClause.split(',').map(s => s.trim());
        let paramIdx = 0;
        assignments.forEach(a => {
          const eq = a.indexOf('=');
          const col = a.substring(0, eq).trim().toLowerCase();
          let val = a.substring(eq + 1).trim();
          if (val.toUpperCase() === 'NOW()') val = new Date().toISOString();
          else if (val.includes('?')) { val = params[paramIdx]; paramIdx++; }
          data.installments[idx][col] = val;
        });
        save();
      }
      return [[]];
    }

    // INSERT INTO contact_messages
    if (upper.startsWith('INSERT INTO CONTACT_MESSAGES')) {
      return [{ insertId: 1 }];
    }

    console.log('Unhandled SQL:', sql, JSON.stringify(params));
    return [[]];
  }
};

module.exports = mockPool;
