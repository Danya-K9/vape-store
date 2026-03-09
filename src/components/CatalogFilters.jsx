import { useState } from 'react';
import './CatalogFilters.css';

const DISPOSABLES_MANUFACTURERS = [
  'Chillax', 'Dotmod', 'ELFBAR', 'Fill POD', 'FLASH', 'HQD', 'Individual',
  'KLIK KLAK', 'LOST MARY', 'Luxlite', 'Maskking', 'MOJO', 'MYLE', 'PLONQ', 'VOOM', 'o!',
];

const LIQUIDS_MANUFACTURERS = ['Glitch Sauce', 'Tradewinds', 'Zenith', 'Bad Drip', 'Ohm Brew'];

const LIQUIDS_NICOTINE = ['Без никотина', 'Солевой', 'Щелочной'];

const FLAVORS = [
  'Апельсин', 'Арбуз', 'Вишня', 'Груша', 'Жвачка', 'Кола', 'Лимон',
  'Ментол', 'Мята', 'Напиток с холодком', 'Фрукты', 'Цитрус', 'Эвкалипт', 'Яблоко', 'Ягоды',
];

const COUNTRIES = ['Беларусь', 'Великобритания', 'Китай', 'Малайзия', 'РФ', 'США'];
const COUNTRIES_DISPOSABLES = ['Китай', 'РФ', 'США'];

const REGIONS_RB = ['Брест', 'Витебск', 'Гомель', 'Гродно', 'Минск', 'Могилев'];

const STRENGTHS = [0, 2, 3, 6, 12, 15, 20, 24, 25, 30, 35, 40, 45, 48, 50, 55];

const VOLUMES = [9, 10, 15, 16, 20, 25, 30, 50, 58, 60, 65, 75, 80, 95, 97, 100, 120, 145];

const VGPG = ['50/50', '60/40', '65/35'];

const PUFF_COUNTS = [600, 800, 1000, 1200, 4000, 5000, 8000];

const NICOTINE_TYPES = ['Без никотина', 'Солевой', 'Щелочной'];

const CHARGING = ['есть', 'нет'];
const POWER_ADJ = ['есть', 'нет'];
const BATTERY = [320, 650, 850, 999];
const COLORS = ['Чёрный', 'Белый', 'Синий', 'Красный', 'Зелёный', 'Серый'];
const DISPLAY = ['есть', 'нет'];

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
  onReset,
}) {
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

  const renderCheckbox = (items, selected, onToggle, key) =>
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
      <FilterSection title="Производитель" open={isOpen('manufacturer')} onToggle={() => toggleSection('manufacturer')}>
        {renderCheckbox(DISPOSABLES_MANUFACTURERS, manufacturers, onManufacturerToggle)}
      </FilterSection>
      <FilterSection title="Количество затяжек" open={isOpen('puff')} onToggle={() => toggleSection('puff')}>
        {renderCheckbox(PUFF_COUNTS, puffCounts, onPuffToggle)}
      </FilterSection>
      <FilterSection title="Тип никотина" open={isOpen('nicotine')} onToggle={() => toggleSection('nicotine')}>
        {renderCheckbox(NICOTINE_TYPES, nicotineTypes, onNicotineToggle)}
      </FilterSection>
      <FilterSection title="Вкус" open={isOpen('flavor')} onToggle={() => toggleSection('flavor')}>
        {renderCheckbox(FLAVORS, [], () => {}, 'flavor')}
      </FilterSection>
      <FilterSection title="Крепость" open={isOpen('strength')} onToggle={() => toggleSection('strength')}>
        {renderCheckbox([20], [], () => {}, 'strength')}
      </FilterSection>
    </>
  );

  const liquidsFilters = () => (
    <>
      <FilterSection title="Производитель" open={isOpen('manufacturer')} onToggle={() => toggleSection('manufacturer')}>
        {renderCheckbox(LIQUIDS_MANUFACTURERS, manufacturers, onManufacturerToggle)}
      </FilterSection>
      <FilterSection title="Тип никотина" open={isOpen('nicotine')} onToggle={() => toggleSection('nicotine')}>
        {renderCheckbox(LIQUIDS_NICOTINE, nicotineTypes, onNicotineToggle)}
      </FilterSection>
      <FilterSection title="Вкус" open={isOpen('flavor')} onToggle={() => toggleSection('flavor')}>
        {renderCheckbox(FLAVORS, [], () => {}, 'flavor')}
      </FilterSection>
      <FilterSection title="Доступность в регионах РБ" open={isOpen('regions')} onToggle={() => toggleSection('regions')}>
        {renderCheckbox(REGIONS_RB, [], () => {}, 'regions')}
      </FilterSection>
      <FilterSection title="Страна происхождения" open={isOpen('country')} onToggle={() => toggleSection('country')}>
        {renderCheckbox(COUNTRIES, [], () => {}, 'country')}
      </FilterSection>
      <FilterSection title="Крепость" open={isOpen('strength')} onToggle={() => toggleSection('strength')}>
        {renderCheckbox(STRENGTHS, [], () => {}, 'strength')}
      </FilterSection>
      <FilterSection title="Объем" open={isOpen('volume')} onToggle={() => toggleSection('volume')}>
        {renderCheckbox(VOLUMES, [], () => {}, 'volume')}
      </FilterSection>
      <FilterSection title="VG/PG" open={isOpen('vgpg')} onToggle={() => toggleSection('vgpg')}>
        {renderCheckbox(VGPG, [], () => {}, 'vgpg')}
      </FilterSection>
    </>
  );

  const accessoriesFilters = () => (
    <FilterSection title="Производитель" open={isOpen('manufacturer')} onToggle={() => toggleSection('manufacturer')}>
      {renderCheckbox(LIQUIDS_MANUFACTURERS.concat('Vaporesso'), manufacturers, onManufacturerToggle)}
    </FilterSection>
  );

  const pouchesFilters = () => (
    <>
      <FilterSection title="Производитель" open={isOpen('manufacturer')} onToggle={() => toggleSection('manufacturer')}>
        {renderCheckbox(LIQUIDS_MANUFACTURERS.concat('Glitch'), manufacturers, onManufacturerToggle)}
      </FilterSection>
      <FilterSection title="Количество затяжек" open={isOpen('puff')} onToggle={() => toggleSection('puff')}>
        {renderCheckbox(PUFF_COUNTS, puffCounts, onPuffToggle)}
      </FilterSection>
      <FilterSection title="Тип никотина" open={isOpen('nicotine')} onToggle={() => toggleSection('nicotine')}>
        {renderCheckbox(NICOTINE_TYPES, nicotineTypes, onNicotineToggle)}
      </FilterSection>
      <FilterSection title="Вкус" open={isOpen('flavor')} onToggle={() => toggleSection('flavor')}>
        {renderCheckbox(FLAVORS, [], () => {}, 'flavor')}
      </FilterSection>
      <FilterSection title="Страна происхождения" open={isOpen('country')} onToggle={() => toggleSection('country')}>
        {renderCheckbox(COUNTRIES, [], () => {}, 'country')}
      </FilterSection>
      <FilterSection title="Крепость" open={isOpen('strength')} onToggle={() => toggleSection('strength')}>
        {renderCheckbox(STRENGTHS, [], () => {}, 'strength')}
      </FilterSection>
      <FilterSection title="Регулировка мощности" open={isOpen('power')} onToggle={() => toggleSection('power')}>
        {renderCheckbox(POWER_ADJ, [], () => {}, 'power')}
      </FilterSection>
      <FilterSection title="Емкость АКБ" open={isOpen('battery')} onToggle={() => toggleSection('battery')}>
        {renderCheckbox(BATTERY, [], () => {}, 'battery')}
      </FilterSection>
      <FilterSection title="Цвет" open={isOpen('color')} onToggle={() => toggleSection('color')}>
        {renderCheckbox(COLORS, [], () => {}, 'color')}
      </FilterSection>
      <FilterSection title="Дисплей" open={isOpen('display')} onToggle={() => toggleSection('display')}>
        {renderCheckbox(DISPLAY, [], () => {}, 'display')}
      </FilterSection>
    </>
  );

  const getFilters = () => {
    if (category === 'disposables') return disposablesFilters();
    if (category === 'liquids') return liquidsFilters();
    if (category === 'accessories') return accessoriesFilters();
    if (category === 'pouches') return pouchesFilters();
    if (category === 'pod-systems') return disposablesFilters();
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
