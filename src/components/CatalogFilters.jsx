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
  priceMax = 70,
  onPriceChange,
  manufacturers = [],
  onManufacturerToggle,
  puffCounts = [],
  onPuffToggle,
  nicotineTypes = [],
  onNicotineToggle,
  flavors = [],
  onFlavorToggle,
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
  onReset,
}) {
  const [dynamicOptions, setDynamicOptions] = useState(null);
  useEffect(() => {
    if (!category) { setDynamicOptions(null); return; }
    filtersApi.list(category).then(setDynamicOptions).catch(() => setDynamicOptions(null));
  }, [category]);

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

  const getOpt = (key) => (dynamicOptions?.[key]?.length > 0 ? dynamicOptions[key] : []);
  const hasOpt = (key) => (dynamicOptions?.[key]?.length > 0);

  const disposablesFilters = () => (
    <>
      <FilterSection title="Цена" open={isOpen('price')} onToggle={() => toggleSection('price')}>
        <div className="price-inputs">
          <div><label>От</label><input type="number" min={0} value={priceMin} onChange={(e) => onPriceChange?.(parseInt(e.target.value, 10) || 0, priceMax)} /></div>
          <div><label>До</label><input type="number" min={0} value={priceMax} onChange={(e) => onPriceChange?.(priceMin, parseInt(e.target.value, 10) || 0)} /></div>
        </div>
        <input type="range" min={0} max={150} value={priceMax} onChange={(e) => onPriceChange?.(priceMin, parseInt(e.target.value, 10))} className="price-slider" />
        <p className="price-range-text">Цена: {priceMin} – {priceMax} BYN</p>
      </FilterSection>
      {hasOpt('manufacturer') && (
        <FilterSection title="Производитель" open={isOpen('manufacturer')} onToggle={() => toggleSection('manufacturer')}>
          {renderCheckbox(getOpt('manufacturer'), manufacturers, onManufacturerToggle)}
        </FilterSection>
      )}
      {hasOpt('puffCount') && (
        <FilterSection title="Количество затяжек" open={isOpen('puff')} onToggle={() => toggleSection('puff')}>
          {renderCheckbox(getOpt('puffCount').map((x) => (typeof x === 'string' ? parseInt(x, 10) : x)), puffCounts, onPuffToggle)}
        </FilterSection>
      )}
      {hasOpt('nicotineType') && (
        <FilterSection title="Тип никотина" open={isOpen('nicotine')} onToggle={() => toggleSection('nicotine')}>
          {renderCheckbox(getOpt('nicotineType'), nicotineTypes, onNicotineToggle)}
        </FilterSection>
      )}
      {hasOpt('flavor') && (
        <FilterSection title="Вкус" open={isOpen('flavor')} onToggle={() => toggleSection('flavor')}>
          {renderCheckbox(getOpt('flavor'), flavors, onFlavorToggle)}
        </FilterSection>
      )}
      {hasOpt('strength') && (
        <FilterSection title="Крепость" open={isOpen('strength')} onToggle={() => toggleSection('strength')}>
          {renderCheckbox(getOpt('strength').map((x) => (typeof x === 'string' ? parseInt(x, 10) : x)), strengths, onStrengthToggle)}
        </FilterSection>
      )}
      {hasOpt('volume') && (
        <FilterSection title="Объем" open={isOpen('volume')} onToggle={() => toggleSection('volume')}>
          {renderCheckbox(getOpt('volume').map((x) => (typeof x === 'string' ? parseInt(x, 10) : x)), volumes, onVolumeToggle)}
        </FilterSection>
      )}
      {hasOpt('vgpg') && (
        <FilterSection title="VG/PG" open={isOpen('vgpg')} onToggle={() => toggleSection('vgpg')}>
          {renderCheckbox(getOpt('vgpg'), vgpgValues, onVgpgToggle)}
        </FilterSection>
      )}
      {hasOpt('charging') && (
        <FilterSection title="Зарядка" open={isOpen('charging')} onToggle={() => toggleSection('charging')}>
          {renderCheckbox(getOpt('charging'), chargingValues, onChargingToggle)}
        </FilterSection>
      )}
      {hasOpt('powerAdj') && (
        <FilterSection title="Регулировка мощности" open={isOpen('power')} onToggle={() => toggleSection('power')}>
          {renderCheckbox(getOpt('powerAdj'), powerValues, onPowerToggle)}
        </FilterSection>
      )}
      {hasOpt('battery') && (
        <FilterSection title="Емкость АКБ" open={isOpen('battery')} onToggle={() => toggleSection('battery')}>
          {renderCheckbox(getOpt('battery').map((x) => (typeof x === 'string' ? parseInt(x, 10) : x)), batteryValues, onBatteryToggle)}
        </FilterSection>
      )}
    </>
  );

  const liquidsFilters = () => (
    <>
      {hasOpt('manufacturer') && (
        <FilterSection title="Производитель" open={isOpen('manufacturer')} onToggle={() => toggleSection('manufacturer')}>
          {renderCheckbox(getOpt('manufacturer'), manufacturers, onManufacturerToggle)}
        </FilterSection>
      )}
      {hasOpt('nicotineType') && (
        <FilterSection title="Тип никотина" open={isOpen('nicotine')} onToggle={() => toggleSection('nicotine')}>
          {renderCheckbox(getOpt('nicotineType'), nicotineTypes, onNicotineToggle)}
        </FilterSection>
      )}
      {hasOpt('flavor') && (
        <FilterSection title="Вкус" open={isOpen('flavor')} onToggle={() => toggleSection('flavor')}>
          {renderCheckbox(getOpt('flavor'), flavors, onFlavorToggle)}
        </FilterSection>
      )}
      {hasOpt('strength') && (
        <FilterSection title="Крепость" open={isOpen('strength')} onToggle={() => toggleSection('strength')}>
          {renderCheckbox(getOpt('strength').map((x) => (typeof x === 'string' ? parseInt(x, 10) : x)), strengths, onStrengthToggle)}
        </FilterSection>
      )}
      {hasOpt('volume') && (
        <FilterSection title="Объем" open={isOpen('volume')} onToggle={() => toggleSection('volume')}>
          {renderCheckbox(getOpt('volume').map((x) => (typeof x === 'string' ? parseInt(x, 10) : x)), volumes, onVolumeToggle)}
        </FilterSection>
      )}
      {hasOpt('vgpg') && (
        <FilterSection title="VG/PG" open={isOpen('vgpg')} onToggle={() => toggleSection('vgpg')}>
          {renderCheckbox(getOpt('vgpg'), vgpgValues, onVgpgToggle)}
        </FilterSection>
      )}
    </>
  );

  const accessoriesFilters = () => (
    hasOpt('manufacturer') ? (
      <FilterSection title="Производитель" open={isOpen('manufacturer')} onToggle={() => toggleSection('manufacturer')}>
        {renderCheckbox(getOpt('manufacturer'), manufacturers, onManufacturerToggle)}
      </FilterSection>
    ) : null
  );

  const pouchesFilters = () => (
    <>
      {hasOpt('manufacturer') && (
        <FilterSection title="Производитель" open={isOpen('manufacturer')} onToggle={() => toggleSection('manufacturer')}>
          {renderCheckbox(getOpt('manufacturer'), manufacturers, onManufacturerToggle)}
        </FilterSection>
      )}
      {hasOpt('nicotineType') && (
        <FilterSection title="Тип никотина" open={isOpen('nicotine')} onToggle={() => toggleSection('nicotine')}>
          {renderCheckbox(getOpt('nicotineType'), nicotineTypes, onNicotineToggle)}
        </FilterSection>
      )}
      {hasOpt('flavor') && (
        <FilterSection title="Вкус" open={isOpen('flavor')} onToggle={() => toggleSection('flavor')}>
          {renderCheckbox(getOpt('flavor'), flavors, onFlavorToggle)}
        </FilterSection>
      )}
      {hasOpt('strength') && (
        <FilterSection title="Крепость" open={isOpen('strength')} onToggle={() => toggleSection('strength')}>
          {renderCheckbox(getOpt('strength').map((x) => (typeof x === 'string' ? parseInt(x, 10) : x)), strengths, onStrengthToggle)}
        </FilterSection>
      )}
    </>
  );

  const podSystemsFilters = () => (
    <>
      {hasOpt('manufacturer') && (
        <FilterSection title="Производитель" open={isOpen('manufacturer')} onToggle={() => toggleSection('manufacturer')}>
          {renderCheckbox(getOpt('manufacturer'), manufacturers, onManufacturerToggle)}
        </FilterSection>
      )}
      {hasOpt('powerAdj') && (
        <FilterSection title="Регулировка мощности" open={isOpen('power')} onToggle={() => toggleSection('power')}>
          {renderCheckbox(getOpt('powerAdj'), powerValues, onPowerToggle)}
        </FilterSection>
      )}
      {hasOpt('battery') && (
        <FilterSection title="Ёмкость АКБ" open={isOpen('battery')} onToggle={() => toggleSection('battery')}>
          {renderCheckbox(getOpt('battery').map((x) => (typeof x === 'string' ? parseInt(x, 10) : x)), batteryValues, onBatteryToggle)}
        </FilterSection>
      )}
    </>
  );

  const getFilters = () => {
    if (category === 'disposables') return disposablesFilters();
    if (category === 'liquids') return liquidsFilters();
    if (category === 'accessories') return accessoriesFilters();
    if (category === 'pouches') return pouchesFilters();
    if (category === 'pod-systems') return podSystemsFilters();
    return disposablesFilters();
  };

  return (
    <div className="catalog-filters">
      <div className="filters-header">
        <h3 className="filters-title">Фильтры</h3>
        <button type="button" className="filters-reset-icon" onClick={onReset} aria-label="Сбросить">⇄</button>
      </div>
      {getFilters()}
      <div className="filters-actions">
        <button type="button" className="btn-show-filters" onClick={() => {}}>Показать</button>
        <button type="button" className="btn-reset-filters" onClick={onReset}>Сбросить</button>
      </div>
    </div>
  );
}
