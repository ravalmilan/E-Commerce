// src/utils/stock.js

export const isVariantProduct = (product) =>
  Array.isArray(product.sizes) && product.sizes.length > 0;

export const isSimpleOutOfStock = (product) =>
  !product.stock || product.stock <= 0;

export const isVariantOutOfStock = (product) =>
  product.sizes.every((s) => s.available === false);

export const isProductOutOfStock = (product) => {
  if (isVariantProduct(product)) {
    return isVariantOutOfStock(product);
  }
  return isSimpleOutOfStock(product);
};
