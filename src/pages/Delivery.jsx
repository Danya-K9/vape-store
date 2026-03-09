import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Delivery.css';

export default function Delivery() {
  return (
    <motion.div
      className="delivery-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <nav className="breadcrumb">
        <Link to="/">Главная</Link>
        <span> — </span>
        <span>Доставка</span>
      </nav>
      <h1>Способы и условия доставки</h1>
      <p className="delivery-unavailable">ДОСТАВКА ВРЕМЕННО НЕ ДОСТУПНА!</p>
    </motion.div>
  );
}
