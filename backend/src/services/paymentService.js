class PaymentService {
  static calculateTotal(items) {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  static validatePaymentItems(items, products) {
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stok ${product.name} tidak cukup`);
      }
    }
    return true;
  }
}

module.exports = PaymentService;
