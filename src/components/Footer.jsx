import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-gray-100 mt-8">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} CodeAlpha Shop. All rights reserved.
      </div>
    </footer>
  )
}
