import { Component } from 'react';

export default class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Intentionally suppress detailed logs in UI, keep fallback screen instead of blank page.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 840, margin: '40px auto', padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #eee' }}>
          <h2 style={{ marginTop: 0 }}>Админка временно недоступна</h2>
          <p>Произошла ошибка отображения вкладки. Обновите страницу или откройте другую вкладку панели.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
