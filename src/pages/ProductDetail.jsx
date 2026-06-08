import React from 'react'
import { useParams } from 'react-router-dom'

export default function ProductDetail() {
  const { id } = useParams()
  return (
    <div>
      <h1 className="text-2xl font-bold">Product #{id}</h1>
      <p className="mt-2">This is a placeholder product detail page.</p>
    </div>
  )
}
