import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Delivery.css';

export default function Delivery() {
  return (
    <div className="delivery-page">
      <nav className="breadcrumb">
        <Link to="/">Главная</Link>
        <span> — </span>
        <span>Доставка</span>
      </nav>
      <h1>Способы и условия доставки</h1>
      <p className="delivery-unavailable">ДОСТАВКА ВРЕМЕННО НЕ ДОСТУПНА!</p>
    </div>
  );
}
