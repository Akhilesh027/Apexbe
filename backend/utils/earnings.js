import VendorEarning from '../models/VendorEarning.js';
import Product from '../models/Products.js';

export const addVendorEarningsFromOrder = async (order) => {
  const vendorMap = new Map();
  for (const item of order.orderItems) {
    const vendorId = item.vendorId?.toString();
    if (!vendorId) continue;
    let earnings = (item.finalAmount || 0) * (item.quantity || 0);
    if (earnings === 0 && item.productId) {
      const product = await Product.findById(item.productId).select('afterDiscount commission finalAmount');
      if (product) {
        const perUnit = product.finalAmount || (product.afterDiscount * (1 - (product.commission || 0)/100));
        earnings = perUnit * item.quantity;
      }
    }
    if (earnings > 0) vendorMap.set(vendorId, (vendorMap.get(vendorId) || 0) + earnings);
  }
  for (const [vendorId, amount] of vendorMap) {
    let record = await VendorEarning.findOne({ vendorId });
    if (!record) record = new VendorEarning({ vendorId });
    record.totalEarned += amount;
    record.pendingBalance += amount;
    record.transactions.push({
      type: 'credit',
      amount,
      orderId: order._id,
      description: `Earnings from order #${order.orderNumber}`,
      createdAt: new Date(),
    });
    await record.save();
  }
};