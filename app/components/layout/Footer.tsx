import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-light mb-4">SCEILL</h3>
            <p className="text-gray-400 text-sm">Luxury fragrance for the discerning</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Catalog</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/catalog" className="hover:text-white">All Products</Link></li>
              <li><Link href="/promo" className="hover:text-white">Promo</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Instagram</a></li>
              <li><a href="#" className="hover:text-white">Twitter</a></li>
              <li><a href="#" className="hover:text-white">YouTube</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 SCEILL. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}