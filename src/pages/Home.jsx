import React from 'react'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const demo = [{ id:1, name:'Demo product', price:9.99 }]
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome to CodeAlpha Shop</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {demo.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}
