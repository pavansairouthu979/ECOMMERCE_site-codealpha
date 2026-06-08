import React from 'react'
import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  return (
    <div className="border rounded p-4">
      <div className="h-40 bg-gray-100 mb-4 flex items-center justify-center">Image</div>
      <h3 className="font-semibold">{product?.name || 'Product name'}</h3>
      <p className="text-sm text-gray-600">${product?.price ?? '0.00'}</p>
      <Link to={`/products/${product?.id || 1}`} className="text-sm text-blue-600">View</Link>
    </div>
  )
}
