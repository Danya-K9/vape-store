import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import CatalogFilters from '../components/CatalogFilters';
import { products as localProducts, categories } from '../data/products';
import { productsApi } from '../lib/api';
import { contentApi } from '../lib/api';
import './Catalog.css';

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
  const [flavors, setFlavors] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [volumes, setVolumes] = useState([]);
  const [vgpgValues, setVgpgValues] = useState([]);
  const [chargingValues, setChargingValues] = useState([]);
  const [powerValues, setPowerValues] = useState([]);
  const [batteryValues, setBatteryValues] = useState([]);
  const [wattsValues, setWattsValues] = useState([]);
  const [resistanceValues, setResistanceValues] = useState([]);
  const [supplierValues, setSupplierValues] = useState([]);
  const [tobaccoValues, setTobaccoValues] = useState([]);
  const [weightValues, setWeightValues] = useState([]);
  const [coalTypeValues, setCoalTypeValues] = useState([]);
  const [packCountValues, setPackCountValues] = useState([]);
  const [apiProducts, setApiProducts] = useState(null);
  const [dynamicCategories, setDynamicCategories] = useState(categories);
  const [applyCounter, setApplyCounter] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState({
    priceMin: 0,
    priceMax: 150,
    manufacturers: [],
    puffCounts: [],
    nicotineTypes: [],
    flavors: [],
    strengths: [],
    volumes: [],
    vgpgValues: [],
    chargingValues: [],
    powerValues: [],
    batteryValues: [],
    wattsValues: [],
    resistanceValues: [],
    supplierValues: [],
    tobaccoValues: [],
    weightValues: [],
    coalTypeValues: [],
    packCountValues: [],
  });
  const prevCategoryRef = useRef(category);

  useEffect(() => {
    contentApi.categories().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setDynamicCategories(data.map((c) => ({ id: c.slug, slug: c.slug, name: c.name })));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { setSearch(searchParams.get('search') || ''); }, [searchParams]);
  useEffect(() => {
    if (prevCategoryRef.current !== category) {
      prevCategoryRef.current = category;
      setApiProducts(null);
    }
    const params = { category: category || undefined, search: search || undefined, priceMin: appliedFilters.priceMin, priceMax: appliedFilters.priceMax };
    if (appliedFilters.manufacturers.length) params.manufacturer = appliedFilters.manufacturers.join(',');
    if (appliedFilters.puffCounts.length) params.puffCount = appliedFilters.puffCounts.join(',');
    if (appliedFilters.nicotineTypes.length) params.nicotineType = appliedFilters.nicotineTypes.join(',');
    if (appliedFilters.flavors.length) params.flavor = appliedFilters.flavors.join(',');
    if (appliedFilters.strengths.length) params.strength = appliedFilters.strengths.join(',');
    if (appliedFilters.volumes.length) params.volume = appliedFilters.volumes.join(',');
    if (appliedFilters.vgpgValues.length) params.vgpg = appliedFilters.vgpgValues.join(',');
    if (appliedFilters.chargingValues.length) params.charging = appliedFilters.chargingValues.join(',');
    if (appliedFilters.powerValues.length) params.powerAdj = appliedFilters.powerValues.join(',');
    if (appliedFilters.batteryValues.length) params.battery = appliedFilters.batteryValues.join(',');
    if (appliedFilters.wattsValues.length) params.watts = appliedFilters.wattsValues.join(',');
    if (appliedFilters.resistanceValues.length) params.resistance = appliedFilters.resistanceValues.join(',');
    if (appliedFilters.supplierValues.length) params.supplier = appliedFilters.supplierValues.join(',');
    if (appliedFilters.tobaccoValues.length) params.tobacco = appliedFilters.tobaccoValues.join(',');
    if (appliedFilters.weightValues.length) params.weight = appliedFilters.weightValues.join(',');
    if (appliedFilters.coalTypeValues.length) params.coalType = appliedFilters.coalTypeValues.join(',');
    if (appliedFilters.packCountValues.length) params.packCount = appliedFilters.packCountValues.join(',');
    productsApi.list(params).then(setApiProducts).catch(() => setApiProducts([]));
  }, [category, search, applyCounter]);

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
    result = result.filter((p) => p.price >= appliedFilters.priceMin && p.price <= appliedFilters.priceMax);
    if (appliedFilters.manufacturers.length > 0) {
      result = result.filter((p) => appliedFilters.manufacturers.includes(getManufacturer(p.name)));
    }
    if (appliedFilters.puffCounts.length > 0) {
      result = result.filter((p) => {
        const puff = getPuffCount(p.name);
        return puff && appliedFilters.puffCounts.includes(puff);
      });
    }
    return result;
  }, [byCategory, search, appliedFilters, fromApi]);

  const categoryNames = Object.fromEntries(dynamicCategories.map((c) => [c.slug, c.name]));
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

  const toggleArray = (setter) => (value) => {
    setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };

  const handleReset = () => {
    setPriceMin(0);
    setPriceMax(150);
    setManufacturers([]);
    setPuffCounts([]);
    setNicotineTypes([]);
    setFlavors([]);
    setStrengths([]);
    setVolumes([]);
    setVgpgValues([]);
    setChargingValues([]);
    setPowerValues([]);
    setBatteryValues([]);
    setWattsValues([]);
    setResistanceValues([]);
    setSupplierValues([]);
    setTobaccoValues([]);
    setWeightValues([]);
    setCoalTypeValues([]);
    setPackCountValues([]);
    const resetFilters = {
      priceMin: 0,
      priceMax: 150,
      manufacturers: [],
      puffCounts: [],
      nicotineTypes: [],
      flavors: [],
      strengths: [],
      volumes: [],
      vgpgValues: [],
      chargingValues: [],
      powerValues: [],
      batteryValues: [],
      wattsValues: [],
      resistanceValues: [],
      supplierValues: [],
      tobaccoValues: [],
      weightValues: [],
      coalTypeValues: [],
      packCountValues: [],
    };
    setAppliedFilters(resetFilters);
    setApplyCounter((x) => x + 1);
  };

  const handleApplyFilters = (payload) => {
    const nextMin = payload?.nextMin ?? priceMin;
    const nextMax = payload?.nextMax ?? priceMax;
    setAppliedFilters({
      priceMin: nextMin,
      priceMax: nextMax,
      manufacturers,
      puffCounts,
      nicotineTypes,
      flavors,
      strengths,
      volumes,
      vgpgValues,
      chargingValues,
      powerValues,
      batteryValues,
      wattsValues,
      resistanceValues,
      supplierValues,
      tobaccoValues,
      weightValues,
      coalTypeValues,
      packCountValues,
    });
    setApplyCounter((x) => x + 1);
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
        flavors={flavors}
        onFlavorToggle={toggleArray(setFlavors)}
        strengths={strengths}
        onStrengthToggle={toggleArray(setStrengths)}
        volumes={volumes}
        onVolumeToggle={toggleArray(setVolumes)}
        vgpgValues={vgpgValues}
        onVgpgToggle={toggleArray(setVgpgValues)}
        chargingValues={chargingValues}
        onChargingToggle={toggleArray(setChargingValues)}
        powerValues={powerValues}
        onPowerToggle={toggleArray(setPowerValues)}
        batteryValues={batteryValues}
        onBatteryToggle={toggleArray(setBatteryValues)}
        wattsValues={wattsValues}
        onWattsToggle={toggleArray(setWattsValues)}
        resistanceValues={resistanceValues}
        onResistanceToggle={toggleArray(setResistanceValues)}
        supplierValues={supplierValues}
        onSupplierToggle={toggleArray(setSupplierValues)}
        tobaccoValues={tobaccoValues}
        onTobaccoToggle={toggleArray(setTobaccoValues)}
        weightValues={weightValues}
        onWeightToggle={toggleArray(setWeightValues)}
        coalTypeValues={coalTypeValues}
        onCoalTypeToggle={toggleArray(setCoalTypeValues)}
        packCountValues={packCountValues}
        onPackCountToggle={toggleArray(setPackCountValues)}
        onApply={handleApplyFilters}
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
