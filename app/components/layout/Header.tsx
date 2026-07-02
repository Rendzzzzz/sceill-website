"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  Home,
  Package,
  Tag,
  Newspaper,
  LayoutDashboard,
  LogOut
} from "lucide-react"

export function Header() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/catalog', label: 'Catalog', icon: Package },
    { href: '/promo', label: 'Promo', icon: Tag },
    { href: '/blog', label: 'Blog', icon: Newspaper },
  ]

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b' 
          : 'bg-white border-b'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-2xl font-light tracking-wider hover:opacity-70 transition-opacity flex items-center gap-2"
          >
            <span className="font-serif">SCEILL</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-black transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart" className="relative hover:opacity-70 transition-opacity">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 hover:opacity-70 transition-opacity"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden lg:inline text-sm font-medium text-gray-700">
                    {session.user?.name?.split(' ')[0] || 'User'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/user/profile"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-sm transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/user/orders"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-sm transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        <span>My Orders</span>
                      </Link>
                    </div>

                    {/* Admin Section */}
                    {session.user?.role === 'admin' && (
                      <>
                        <div className="border-t my-1"></div>
                        <div className="py-1">
                          <Link
                            href="/admin"
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-sm text-blue-600 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                          <Link
                            href="/admin/products"
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-sm text-blue-600 transition-colors pl-9"
                          >
                            <span>Manage Products</span>
                          </Link>
                          <Link
                            href="/admin/promos"
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-sm text-blue-600 transition-colors pl-9"
                          >
                            <span>Manage Promos</span>
                          </Link>
                          <Link
                            href="/admin/blog"
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-sm text-blue-600 transition-colors pl-9"
                          >
                            <span>Manage Blog</span>
                          </Link>
                        </div>
                      </>
                    )}

                    <div className="border-t my-1"></div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <button className="hidden sm:inline-block bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors">
                  Sign In
                </button>
                <button className="sm:hidden text-sm font-medium hover:opacity-70 transition-opacity">
                  Login
                </button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden hover:opacity-70 transition-opacity"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center space-x-3 text-sm font-medium text-gray-700 hover:text-black transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
              
              {session && (
                <>
                  <div className="border-t my-2"></div>
                  <Link
                    href="/user/profile"
                    className="flex items-center space-x-3 text-sm font-medium text-gray-700 hover:text-black transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/user/orders"
                    className="flex items-center space-x-3 text-sm font-medium text-gray-700 hover:text-black transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Package className="w-4 h-4" />
                    <span>My Orders</span>
                  </Link>
                  
                  {session.user?.role === 'admin' && (
                    <>
                      <div className="border-t my-2"></div>
                      <Link
                        href="/admin"
                        className="flex items-center space-x-3 text-sm font-medium text-blue-600 transition-colors py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </>
                  )}
                  
                  <div className="border-t my-2"></div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center space-x-3 text-sm font-medium text-red-600 transition-colors py-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}