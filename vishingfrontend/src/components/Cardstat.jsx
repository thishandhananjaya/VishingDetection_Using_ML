import React from 'react'

export default function CardStat({ title, value, footer }) {
  return (
    <div className="bg-gray-800 p-6 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {footer && <div className="text-xs text-gray-500 mt-2">{footer}</div>}
    </div>
  )
}
