import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import CatalogFilters from '../components/CatalogFilters';
import { products as localProducts, categories } from '../data/products';
import { productsApi } from '../lib/api';
import './Catalog.css';

const categoryNames = {
  disposables: 'Одноразки',
  liquids: 'Жидкости',
  'pod-systems': 'POD системы',
  pouches: 'Никотиновые паучи',
  accessories: 'Комплектующие',
};

function getManufacturer(name) {
  if (name.includes('KLIK KLAK')) return 'KLIK KLAK';
  if (name.includes('PLONQ')) return 'PLONQ';
  if (name.includes('HQD')) return 'HQD';
  if (name.includes('Vaporesso')) return 'Vaporesso';
  if (name.includes('Tradewinds')) return 'Tradewinds';
  if (name.includes('Zenith')) return 'Zenith';
  if (name.includes('Glitch')) return 'Glitch';
  if (name.includes('Bad Drip')) return 'Bad Drip';
  if (name.includes('Ohm Brew')) return 'Ohm Brew';
  return 'Individual';
}

function getPuffCount(name) {
  if (name.includes('4000')) return 4000;
  if (name.includes('8000')) return 8000;
  if (name.includes('1200')) return 1200;
  return null;
}

export default function Catalog() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(150);
  const [manufacturers, setManufacturers] = useState([]);
  const [puffCounts, setPuffCounts] = useState([]);
  const [nicotineTypes, setNicotineTypes] = useState([]);
  const [apiProducts, setApiProducts] = useState(null);

  useEffect(() => { setSearch(searchParams.get('search') || ''); }, [searchParams]);
  useEffect(() => {
    const params = { category: category || undefined, search: search || undefined, priceMin, priceMax };
    if (manufacturers.length) params.manufacturer = manufacturers.join(',');
    if (puffCounts.length) params.puffCount = puffCounts.join(',');
    if (nicotineTypes.length) params.nicotineType = nicotineTypes.join(',');
    productsApi.list(params).then(setApiProducts).catch(() => setApiProducts([]));
  }, [category, search, priceMin, priceMax, manufacturers, puffCounts, nicotineTypes]);

  const products = apiProducts ?? localProducts;
  const fromApi = apiProducts !== null;

  const byCategory = category
    ? products.filter((p) => p.category === category)
    : products;

  const filtered = useMemo(() => {
    if (fromApi) return byCategory;
    let result = byCategory;
    if (search.trim()) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    result = result.filter((p) => p.price >= priceMin && p.price <= priceMax);
    if (manufacturers.length > 0) {
      result = result.filter((p) => manufacturers.includes(getManufacturer(p.name)));
    }
    if (puffCounts.length > 0) {
      result = result.filter((p) => {
        const puff = getPuffCount(p.name);
        return puff && puffCounts.includes(puff);
      });
    }
    return result;
  }, [byCategory, search, priceMin, priceMax, manufacturers, puffCounts, fromApi]);

  const title = category ? categoryNames[category] || 'Каталог' : 'Каталог';

  const handlePriceChange = (min, max) => {
    setPriceMin(min);
    setPriceMax(max);
  };

  const handleManufacturerToggle = (m) => {
    setManufacturers((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handlePuffToggle = (p) => {
    setPuffCounts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleNicotineToggle = (n) => {
    setNicotineTypes((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  };

  const handleReset = () => {
    setPriceMin(0);
    setPriceMax(150);
    setManufacturers([]);
    setPuffCounts([]);
    setNicotineTypes([]);
  };

  return (
    <motion.div
      className="catalog-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="catalog-header">
        <h1>{title}</h1>
        <nav className="breadcrumb">
          <Link to="/">Главная</Link>
          <span>/</span>
          <span>{title}</span>
        </nav>
        <div className="catalog-search-wrap">
          <input
            type="search"
            placeholder="Поиск товаров..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="catalog-search"
          />
        </div>
      </div>

      <CatalogFilters
        category={category}
        priceMin={priceMin}
        priceMax={priceMax}
        onPriceChange={handlePriceChange}
        manufacturers={manufacturers}
        onManufacturerToggle={handleManufacturerToggle}
        puffCounts={puffCounts}
        onPuffToggle={handlePuffToggle}
        nicotineTypes={nicotineTypes}
        onNicotineToggle={handleNicotineToggle}
        onReset={handleReset}
      />

      <div className="catalog-grid">
        {filtered.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="catalog-empty">
          <img
            src="https://images.unsplash.com/photo-1584735175097-719d848f8449?w=400"
            alt="Пусто"
            className="catalog-empty-image"
          />
          <p>В данной категории пока нет товаров</p>
        </div>
      )}
    </motion.div>
  );
}
