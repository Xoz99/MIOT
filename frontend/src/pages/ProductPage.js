import React from 'react';
import ProductForm from '../components/products/ProductForm';
import ProductList from '../components/products/ProductList';
import { formatRupiah } from '../utils/formatters';

const ProductsPage = ({ products, addProduct }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Add Product Form */}
      <div>
        <ProductForm addProduct={addProduct} />
      </div>

      {/* Products List */}
      <div className="lg:col-span-2">
        <ProductList products={products} formatRupiah={formatRupiah} />
      </div>
    </div>
  );
};

export default ProductsPage;