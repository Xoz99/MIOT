import React, { useState } from 'react';
import ProductForm from '../components/products/ProductForm';
import ProductList from '../components/products/ProductList';
import { formatRupiah } from '../utils/formatters';

const ProductsPage = ({ products, addProduct, loading, error, onRefresh }) => {
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState('');

  const handleAddProduct = async (productData) => {
    setProductLoading(true);
    setProductError('');
    
    const result = await addProduct(productData);
    
    if (result && !result.success) {
      setProductError(result.error);
    }
    
    setProductLoading(false);
    return result;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Add Product Form */}
      <div>
        <ProductForm 
          addProduct={handleAddProduct}
          loading={productLoading}
          error={productError}
        />
      </div>

      {/* Products List */}
      <div className="lg:col-span-2">
        <ProductList 
          products={products}
          formatRupiah={formatRupiah}
          loading={loading}
          error={error}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );
};

export default ProductsPage;