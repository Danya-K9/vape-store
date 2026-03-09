import { Link } from 'react-router-dom';
import './Ticker.css';

const brands = [
  { name: 'PLONQ', url: '/catalog/disposables' },
  { name: 'Cuttwood', url: '/catalog/liquids' },
  { name: 'Hold Fast', url: '/catalog/liquids' },
  { name: 'Marina Vape', url: '/catalog/liquids' },
  { name: 'Ethos', url: '/catalog/liquids' },
  { name: 'Big Bottle', url: '/catalog/liquids' },
  { name: 'HQD', url: '/catalog/disposables' },
  { name: 'Tradewinds', url: '/catalog/liquids' },
  { name: 'Zenith', url: '/catalog/liquids' },
  { name: 'Bad Drip', url: '/catalog/liquids' },
  { name: 'Glitch', url: '/catalog/pouches' },
  { name: 'Vaporesso', url: '/catalog/pod-systems' },
];

export default function Ticker() {
  return (
    <div className="ticker-wrap">
      <div className="ticker">
        <div className="ticker-content">
          {[...brands, ...brands].map((brand, i) => (
            <Link key={i} to={brand.url} className="ticker-item">
              <span className="ticker-brand">{brand.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
