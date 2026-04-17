import Link from "next/link"

const NotFound = () => (
  <div className="w-dvw h-dvh bg-black flex items-center justify-center">
    <div className="text-center p-8 max-w-md">
      <p className="text-6xl font-black text-white/20 mb-4 font-mono">404</p>
      <p className="text-white text-lg mb-6">Deze pagina bestaat niet.</p>
      <Link
        href="/"
        className="px-6 py-3 rounded-none border border-white/20 bg-black text-white hover:border-white transition-colors font-mono"
      >
        Terug naar home
      </Link>
    </div>
  </div>
)

export default NotFound
