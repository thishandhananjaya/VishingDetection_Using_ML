import React from 'react'
import { Link } from 'react-router-dom'

export default function CallRow({ call }) {
  const date = call?.datetime ? new Date(call.datetime).toLocaleString() : ''
  return (
    <tr className="border-b border-gray-700 hover:bg-gray-800 transition-colors duration-150">
      <td className="p-3">{call.caller}</td>
      <td className="p-3">{date}</td>
      <td className="p-3">{call.risk}%</td>
      <td className="p-3">{call.status}</td>
      <td className="p-3">
        <Link to={`/calls/${call.id}`} className="text-blue-500 hover:underline">
          View
        </Link>
      </td>
    </tr>
  )
}
