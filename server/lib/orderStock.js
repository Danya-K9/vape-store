/**
 * Списание и возврат остатков по позициям заказа (бронь).
 * Позиции с одним productId суммируются, чтобы не ошибиться при нескольких строках одного товара.
 */

function mergeQuantitiesByProductId(items) {
  const map = new Map();
  for (const item of items || []) {
    if (!item.productId) continue;
    map.set(item.productId, (map.get(item.productId) || 0) + (item.quantity || 0));
  }
  return map;
}

function productSnapshotById(items) {
  const map = new Map();
  for (const item of items || []) {
    if (item.productId && item.product && !map.has(item.productId)) {
      map.set(item.productId, item.product);
    }
  }
  return map;
}

export function verifyStockForOrderItems(items) {
  const needById = mergeQuantitiesByProductId(items);
  const snap = productSnapshotById(items);
  for (const [productId, needQty] of needById) {
    const p = snap.get(productId);
    if (!p) continue;
    if (p.stock == null || p.stock === undefined) continue;
    if (needQty > p.stock) {
      return {
        ok: false,
        code: 'out_of_stock',
        productName: p.name,
        have: p.stock,
        need: needQty,
      };
    }
  }
  return { ok: true };
}

export async function decrementStockForOrderInTx(tx, order) {
  const items = order.items || [];
  const check = verifyStockForOrderItems(items);
  if (!check.ok) return check;

  const needById = mergeQuantitiesByProductId(items);
  for (const [productId, qty] of needById) {
    const p = await tx.product.findUnique({ where: { id: productId } });
    if (!p) continue;
    if (p.stock == null || p.stock === undefined) continue;
    const nextStock = Math.max(0, p.stock - qty);
    await tx.product.update({
      where: { id: p.id },
      data: { stock: nextStock, isActive: nextStock > 0 },
    });
  }
  return { ok: true };
}

export async function restoreStockForOrderInTx(tx, order) {
  const items = order.items || [];
  const needById = mergeQuantitiesByProductId(items);
  for (const [productId, qty] of needById) {
    const p = await tx.product.findUnique({ where: { id: productId } });
    if (!p) continue;
    if (p.stock == null || p.stock === undefined) continue;
    const nextStock = p.stock + qty;
    await tx.product.update({
      where: { id: p.id },
      data: { stock: nextStock, isActive: nextStock > 0 },
    });
  }
  return { ok: true };
}
