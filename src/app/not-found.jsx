import Link from "next/link"

const NotFound = () => (
  <div className="w-dvw h-dvh bg-black flex items-center justify-center">
    <div className="text-center p-8 max-w-md">
      <p className="text-6xl font-black text-white/20 mb-4">404</p>
      <p className="text-white/80 text-lg mb-6">
        Deze pagina bestaat niet.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        Terug naar home
      </Link>
    </div>
  </div>
)

export default NotFound