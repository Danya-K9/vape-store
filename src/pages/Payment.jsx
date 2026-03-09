import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Payment.css';

export default function Payment() {
  return (
    <motion.div
      className="payment-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <nav className="breadcrumb">
        <Link to="/">Главная</Link>
        <span> — </span>
        <span>Оплата</span>
      </nav>
      <h1>Оплата</h1>
      <div className="payment-content">
        <p className="payment-intro">Оплатить заказ можно:</p>
        <ul className="payment-methods">
          <li>наличными</li>
          <li>банковской пластиковой картой</li>
        </ul>
      </div>
    </motion.div>
  );
}
