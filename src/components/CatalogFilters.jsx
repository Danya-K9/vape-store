import { useState, useEffect } from 'react';
import { filtersApi } from '../lib/api';
import './CatalogFilters.css';

function FilterSection({ title, open, onToggle, children }) {
  return (
    <div className="filter-section">
      <button
        type="button"
        className="filter-section-header"
        onClick={() => onToggle()}
      >
        {title} <span className={`filter-arrow ${!open ? 'arrow-right' : ''}`}>{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="filter-section-content">{children}</div>}
    </div>
  );
}

export default function CatalogFilters({
  category,
  priceMin = 0,
  priceMax = 200,
  onPriceChange,
  manufacturers = [],
  onManufacturerToggle,
  puffCounts = [],
  onPuffToggle,
  nicotineTypes = [],
  onNicotineToggle,
  flavors = [],
  onFlavorToggle,
  countries = [],
  onCountryToggle,
  strengths = [],
  onStrengthToggle,
  volumes = [],
  onVolumeToggle,
  vgpgValues = [],
  onVgpgToggle,
  chargingValues = [],
  onChargingToggle,
  powerValues = [],
  onPowerToggle,
  batteryValues = [],
  onBatteryToggle,
  wattsValues = [],
  onWattsToggle,
  resistanceValues = [],
  onResistanceToggle,
  supplierValues = [],
  onSupplierToggle,
  tobaccoValues = [],
  onTobaccoToggle,
  weightValues = [],
  onWeightToggle,
  coalTypeValues = [],
  onCoalTypeToggle,
  packCountValues = [],
  onPackCountToggle,
  colorValues = [],
  onColorToggle,
  displayValues = [],
  onDisplayToggle,
  onApply,
  onReset,
}) {
  const [priceMinInput, setPriceMinInput] = useState(String(priceMin ?? 0));
  const [priceMaxInput, setPriceMaxInput] = useState(String(priceMax ?? 0));
  const [priceSliderValue, setPriceSliderValue] = useState(Number(priceMax) || 0);
  const sliderUpperBound = Math.max(
    200,
    Number(priceMax) || 0,
    Math.ceil(parseFloat(String(priceMaxInput).replace(',', '.')) || 0),
    Math.ceil(parseFloat(String(priceMinInput).replace(',', '.')) || 0)
  );
  const [dynamicOptions, setDynamicOptions] = useState(null);
  useEffect(() => {
    filtersApi.list(category).then(setDynamicOptions).catch(() => setDynamicOptions(null));
  }, [category]);
  useEffect(() => {
    setPriceMinInput(String(priceMin));
    setPriceMaxInput(String(priceMax));
    setPriceSliderValue(Number(priceMax) || 0);
  }, [priceMin, priceMax]);

  const SECTION_TITLES = {
    manufacturer: 'Производитель',
    puffCount: 'Количество затяжек',
    nicotineType: 'Тип никотина',
    flavor: 'Вкус',
    strength: 'Крепость (%)',
    volume: 'Объем',
    vgpg: 'VG/PG',
    charging: 'Зарядка',
    powerAdj: 'Регулировка мощности',
    battery: 'Емкость АКБ',
    watts: 'Ватты',
    resistance: 'Сопротивление',
    supplier: 'Поставщик',
    tobacco: 'Наличие табака',
    weight: 'Вес',
    coalType: 'Тип углей',
    packCount: 'Кол-во в пачке',
    country: 'Страна',
    color: 'Цвет',
    display: 'Дисплей',
  };
  const NUMERIC_FILTER_KEYS = new Set(['puffCount', 'strength', 'volume', 'battery']);

  const selectionMap = {
    manufacturer: { selected: manufacturers, onToggle: onManufacturerToggle },
    puffCount: { selected: puffCounts, onToggle: onPuffToggle },
    nicotineType: { selected: nicotineTypes, onToggle: onNicotineToggle },
    flavor: { selected: flavors, onToggle: onFlavorToggle },
    country: { selected: countries, onToggle: onCountryToggle },
    strength: { selected: strengths, onToggle: onStrengthToggle },
    volume: { selected: volumes, onToggle: onVolumeToggle },
    vgpg: { selected: vgpgValues, onToggle: onVgpgToggle },
    charging: { selected: chargingValues, onToggle: onChargingToggle },
    powerAdj: { selected: powerValues, onToggle: onPowerToggle },
    battery: { selected: batteryValues, onToggle: onBatteryToggle },
    watts: { selected: wattsValues, onToggle: onWattsToggle },
    resistance: { selected: resistanceValues, onToggle: onResistanceToggle },
    supplier: { selected: supplierValues, onToggle: onSupplierToggle },
    tobacco: { selected: tobaccoValues, onToggle: onTobaccoToggle },
    weight: { selected: weightValues, onToggle: onWeightToggle },
    coalType: { selected: coalTypeValues, onToggle: onCoalTypeToggle },
    packCount: { selected: packCountValues, onToggle: onPackCountToggle },
    color: { selected: colorValues, onToggle: onColorToggle },
    display: { selected: displayValues, onToggle: onDisplayToggle },
  };

  const [openSections, setOpenSections] = useState({
    price: true,
    manufacturer: true,
    puff: true,
    nicotine: true,
    flavor: category === 'liquids' ? false : true,
  });
  const toggleSection = (key) => {
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  };
  const isOpen = (key) => openSections[key] !== false;
  const normalizePrice = (nextMinRaw, nextMaxRaw) => {
    const parsedMin = parseFloat(String(nextMinRaw).replace(',', '.'));
    const parsedMax = parseFloat(String(nextMaxRaw).replace(',', '.'));
    const nextMin = Math.max(0, Number.isFinite(parsedMin) ? parsedMin : 0);
    const nextMax = Math.max(nextMin, Number.isFinite(parsedMax) ? parsedMax : nextMin);
    return { nextMin, nextMax };
  };
  const sanitizePriceInput = (value) => value.replace(/[^\d.,]/g, '').replace(',', '.').replace(/(\..*)\./g, '$1');

  const renderPriceSection = () => (
    <FilterSection title="Цена" open={isOpen('price')} onToggle={() => toggleSection('price')}>
      <div className="price-inputs">
        <div>
          <label>От</label>
          <input
            type="text"
            inputMode="decimal"
            value={priceMinInput}
            onChange={(e) => setPriceMinInput(sanitizePriceInput(e.target.value))}
          />
        </div>
        <div>
          <label>До</label>
          <input
            type="text"
            inputMode="decimal"
            value={priceMaxInput}
            onChange={(e) => {
              const sanitized = sanitizePriceInput(e.target.value);
              setPriceMaxInput(sanitized);
              const num = parseFloat(sanitized);
              if (Number.isFinite(num)) setPriceSliderValue(Math.max(0, num));
            }}
          />
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={sliderUpperBound}
        step={0.01}
        value={priceSliderValue}
        onInput={(e) => {
          const next = parseFloat(e.currentTarget.value) || 0;
          setPriceSliderValue(next);
          setPriceMaxInput(String(next.toFixed(2)));
        }}
        onChange={(e) => {
          const next = parseFloat(e.currentTarget.value) || 0;
          setPriceSliderValue(next);
          setPriceMaxInput(String(next.toFixed(2)));
        }}
        className="price-slider"
      />
      <p className="price-range-text">Цена: {priceMinInput || 0} – {priceMaxInput || 0} BYN</p>
    </FilterSection>
  );

  const renderCheckbox = (items, selected, onToggle) =>
    items.map((item) => (
      <label key={item} className="filter-checkbox">
        <input
          type="checkbox"
          checked={selected.includes(item)}
          onChange={() => onToggle(item)}
        />
        <span>{typeof item === 'number' ? item : item}</span>
      </label>
    ));

  const filterKeys = Object.keys(dynamicOptions || {});
  const renderedSections = filterKeys.map((key) => {
    const config = selectionMap[key];
    if (!config || !Array.isArray(dynamicOptions?.[key]) || dynamicOptions[key].length === 0) return null;
    const options = NUMERIC_FILTER_KEYS.has(key)
      ? dynamicOptions[key].map((value) => (typeof value === 'string' ? parseInt(value, 10) : value))
      : dynamicOptions[key];
    return (
      <FilterSection key={key} title={SECTION_TITLES[key] || key} open={isOpen(key)} onToggle={() => toggleSection(key)}>
        {renderCheckbox(options, config.selected || [], config.onToggle)}
      </FilterSection>
    );
  });

  return (
    <div className="catalog-filters">
      <div className="filters-header">
        <h3 className="filters-title">Фильтры</h3>
        <button type="button" className="filters-reset-icon" onClick={onReset} aria-label="Сбросить">⇄</button>
      </div>
      {renderPriceSection()}
      {renderedSections}
      <div className="filters-actions">
        <button
          type="button"
          className="btn-show-filters"
          onClick={() => {
            const { nextMin, nextMax } = normalizePrice(priceMinInput, priceMaxInput);
            setPriceMinInput(String(nextMin));
            setPriceMaxInput(String(nextMax));
            setPriceSliderValue(nextMax);
            onPriceChange?.(nextMin, nextMax);
            onApply?.({ nextMin, nextMax });
          }}
        >
          Показать
        </button>
        <button type="button" className="btn-reset-filters" onClick={onReset}>Сбросить</button>
      </div>
    </div>
  );
}
