import React from 'react'
import ProductCard from '../components/ProductCard'

export default function Products() {
  const demo = Array.from({length:6}).map((_,i)=>({id:i+1,name:`Product ${i+1}`,price: (i+1)*10}))
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {demo.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}
