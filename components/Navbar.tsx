import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Spark
        </Link>
        <div className="flex gap-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <Link href="/core" className="text-sm text-gray-600 hover:text-gray-900">
            Core
          </Link>
          <Link href="/product" className="text-sm text-gray-600 hover:text-gray-900">
            Product
          </Link>
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          <Link href="/marketing" className="text-sm text-gray-600 hover:text-gray-900">
            Marketing
          </Link>
          <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900">
            Docs
          </Link>
        </div>
      </div>
    </nav>
  )
}
