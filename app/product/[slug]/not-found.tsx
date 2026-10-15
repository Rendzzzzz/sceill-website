import Link from "next/link"
import { Button } from "../../components/ui/Button"

export default function ProductNotFound() {
  return (
    <main className="container mx-auto px-4 py-32 text-center">
      <h1 className="text-5xl">Fragrance not found</h1>
      <p className="mt-3 text-muted">This fragrance may have been retired or the link is incorrect.</p>
      <Link href="/catalog" className="mt-8 inline-block">
        <Button>Browse the collection</Button>
      </Link>
    </main>
  )
}
