import {
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  ShoppingBasket,
  Sprout,
  Store,
  User,
} from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export function Navbar() {
  const { user, cartCount, setCartOpen, handleLogout } = useApp()
  const navigate = useNavigate()

  const onLogout = async () => {
    await handleLogout()
    navigate('/ingresar')
  }

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors min-h-[44px] ${
      isActive
        ? 'bg-[#EAF4EB] text-[#236327]'
        : 'text-[#4A5A4E] hover:bg-[#F0F4F0] hover:text-[#18221A]'
    }`

  const mobileTabClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 py-2 px-2 text-xs font-semibold transition-colors min-h-[56px] flex-1 ${
      isActive ? 'text-[#2E7D32] bg-[#EAF4EB]/70 rounded-xl' : 'text-[#4A5A4E]'
    }`

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#DCE5DD] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E7D32] text-white shadow-sm">
              <Sprout className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight text-[#18221A]">
                AgroBoyacá
              </span>
              <span className="hidden sm:block text-xs font-medium text-[#4A5A4E]">
                Del campo boyacense a Bogotá
              </span>
            </div>
          </Link>

          <nav aria-label="Navegacion principal" className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              <Store className="h-4 w-4" aria-hidden="true" />
              <span>Catálogo</span>
            </NavLink>

            {user?.role === 'productor' && (
              <NavLink to="/productor" className={navLinkClass}>
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                <span>Panel productor</span>
              </NavLink>
            )}

            {user && (
              <NavLink to="/pedidos" className={navLinkClass}>
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                <span>{user.role === 'productor' ? 'Pedidos recibidos' : 'Mis pedidos'}</span>
              </NavLink>
            )}

            <NavLink to="/lab-trl4" className={navLinkClass}>
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              <span>Lab TRL 4</span>
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            {user?.role !== 'productor' && (
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label={`Abrir canasta con ${cartCount} productos`}
                className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-[#DCE5DD] bg-white px-3 text-sm font-semibold text-[#18221A] hover:bg-[#F6F8F6] focus-visible:outline-2 focus-visible:outline-[#2E7D32]"
              >
                <ShoppingBasket className="h-5 w-5 text-[#2E7D32]" aria-hidden="true" />
                <span className="hidden sm:inline">Canasta</span>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2E7D32] px-1.5 text-xs font-bold text-white tabular-nums">
                  {cartCount}
                </span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col items-end leading-tight">
                  <span className="text-sm font-bold text-[#18221A]">{user.fullName}</span>
                  <span className="text-xs font-medium text-[#2E7D32] capitalize">
                    {user.role === 'productor' ? `${user.farmName} · ${user.municipality}` : user.city}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Cerrar sesion"
                  title="Cerrar sesion"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#DCE5DD] bg-white px-3 text-sm font-semibold text-[#4A5A4E] hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200 focus-visible:outline-2 focus-visible:outline-[#2E7D32]"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            ) : (
              <Link
                to="/ingresar"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2E7D32] px-4 text-sm font-bold text-white hover:bg-[#236327] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32]"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span>Ingresar</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Barra inferior para navegacion movil */}
      <nav
        aria-label="Navegacion movil"
        className="fixed bottom-0 inset-x-0 z-30 border-t border-[#DCE5DD] bg-white/95 backdrop-blur-sm px-2 py-1.5 md:hidden"
      >
        <div className="flex items-center justify-around gap-1">
          <NavLink to="/" end className={mobileTabClass}>
            <Store className="h-5 w-5" aria-hidden="true" />
            <span>Catálogo</span>
          </NavLink>

          {user?.role === 'productor' ? (
            <NavLink to="/productor" className={mobileTabClass}>
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
              <span>Mi finca</span>
            </NavLink>
          ) : (
            <NavLink to="/pedidos" className={mobileTabClass}>
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
              <span>Pedidos</span>
            </NavLink>
          )}

          {user?.role === 'productor' && (
            <NavLink to="/pedidos" className={mobileTabClass}>
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
              <span>Pedidos</span>
            </NavLink>
          )}

          <NavLink to="/lab-trl4" className={mobileTabClass}>
            <FlaskConical className="h-5 w-5" aria-hidden="true" />
            <span>TRL 4</span>
          </NavLink>

          {!user && (
            <NavLink to="/ingresar" className={mobileTabClass}>
              <User className="h-5 w-5" aria-hidden="true" />
              <span>Cuenta</span>
            </NavLink>
          )}
        </div>
      </nav>
    </>
  )
}
