import { Route, Routes } from 'react-router-dom'
import { CartDrawer } from './components/CartDrawer.jsx'
import { Navbar } from './components/Navbar.jsx'
import { Toast } from './components/Toast.jsx'
import { AuthPage } from './pages/AuthPage.jsx'
import { CatalogPage } from './pages/CatalogPage.jsx'
import { LabTrl4Page } from './pages/LabTrl4Page.jsx'
import { OrdersPage } from './pages/OrdersPage.jsx'
import { ProducerDashboard } from './pages/ProducerDashboard.jsx'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-[#18221A]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-10">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/ingresar" element={<AuthPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/productor" element={<ProducerDashboard />} />
          <Route path="/lab-trl4" element={<LabTrl4Page />} />
          <Route path="*" element={<CatalogPage />} />
        </Routes>
      </main>

      <footer className="hidden md:block border-t border-[#DCE5DD] bg-white py-5 text-xs text-[#4A5A4E]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6">
          <span>
            AgroBoyacá · Prototipo académico TRL 4 (Proyecto de Ingeniería II - UNAD)
          </span>
          <span>
            Chinavita y municipios de Boyacá hacia Bogotá D.C. · Sin pagos ni entregas reales
          </span>
        </div>
      </footer>

      <CartDrawer />
      <Toast />
    </div>
  )
}
