export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Layout khusus login: tanpa sidebar, tanpa header
  // Halaman login akan dirender full-screen
  return <>{children}</>
}
