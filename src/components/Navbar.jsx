import React from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">CodeAlpha Shop</Link>
        <nav className="flex items-center space-x-4">
          <Link to="/products" className="text-gray-700">Products</Link>
          <Link to="/cart" className="text-gray-700">Cart</Link>
          <Link to="/wishlist" className="text-gray-700">Wishlist</Link>
          <Link to="/login" className="text-gray-700">Login</Link>
        </nav>
      </div>
    </header>
  )
}
