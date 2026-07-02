export function AboutSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-light mb-6">Fragrance is an art fused with science</h2>
          <p className="text-xl text-gray-600 mb-8">
            In SCEILL, we believe that each product is there to make you adored, 
            loved and remembered.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div>
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="font-semibold mb-2">Artistry</h3>
              <p className="text-gray-600">Crafted with creative passion</p>
            </div>
            <div>
              <div className="text-4xl mb-3">🔬</div>
              <h3 className="font-semibold mb-2">Science</h3>
              <p className="text-gray-600">Precision in every drop</p>
            </div>
            <div>
              <div className="text-4xl mb-3">💝</div>
              <h3 className="font-semibold mb-2">Memory</h3>
              <p className="text-gray-600">Fragrances that linger</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}