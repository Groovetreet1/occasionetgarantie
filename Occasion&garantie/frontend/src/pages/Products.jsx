import { useEffect, useState } from 'react';
import { FiSearch, FiSliders, FiPackage } from 'react-icons/fi';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import AnimatedBg from '../components/AnimatedBg';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/products${search ? `?search=${search}` : ''}`)
      .then((res) => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <section className="products-section" style={{ paddingTop: '120px' }}>
      <AnimatedBg />
      <div className="container">
        <div className="products-header">
          <div>
            <h2 className="section-title">Nos produits</h2>
            <p className="section-subtitle" style={{ marginBottom: 0 }}>
              {products.length} article{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <FiSearch size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>
          <button className="btn btn-secondary">
            <FiSliders size={16} /> Filtres
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : products.length > 0 ? (
          <div className="products-grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon"><FiPackage size={48} /></div>
            <p>Aucun produit trouvé{search ? ` pour "${search}"` : ''}.</p>
          </div>
        )}
      </div>
    </section>
  );
}
