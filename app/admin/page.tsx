import { redirect } from "next/navigation"

// the header menu links to /admin; orders are the page admins use most
export default function AdminHome() {
  redirect("/admin/orders")
}
