import { Eye, EyeOff, ShieldCheck, ShoppingBag, Sprout, Tractor } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { BOYACA_MUNICIPALITIES } from '../lib/formatters.js'

export function AuthPage() {
  const { user, handleLogin, handleRegister, handleDemoLogin } = useApp()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    role: 'consumidor',
    fullName: '',
    email: '',
    password: '',
    farmName: '',
    municipality: 'Chinavita',
    city: 'Bogota D.C.',
    dataConsentAccepted: false,
  })

  if (user) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#DCE5DD] bg-white p-6 sm:p-8 text-center shadow-xs space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF4EB] text-[#2E7D32]">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-extrabold text-[#18221A]">
          Ya tienes una sesion activa
        </h1>
        <p className="text-sm text-[#4A5A4E]">
          Ingresaste como <strong className="text-[#18221A]">{user.fullName}</strong> ({user.role}).
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(user.role === 'productor' ? '/productor' : '/')}
            className="min-h-[44px] rounded-xl bg-[#2E7D32] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#236327]"
          >
            Ir a mi espacio principal
          </button>
        </div>
      </div>
    )
  }

  const onDemoAccess = async (role) => {
    setError('')
    setSubmitting(true)
    try {
      const logged = await handleDemoLogin(role)
      navigate(logged.role === 'productor' ? '/productor' : '/')
    } catch (err) {
      setError(err.message || 'No fue posible iniciar la cuenta de prueba.')
    } finally {
      setSubmitting(false)
    }
  }

  const onLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const logged = await handleLogin(loginForm)
      navigate(logged.role === 'productor' ? '/productor' : '/')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion.')
    } finally {
      setSubmitting(false)
    }
  }

  const onRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const created = await handleRegister(registerForm)
      navigate(created.role === 'productor' ? '/productor' : '/')
    } catch (err) {
      setError(err.message || 'No fue posible crear la cuenta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Panel izquierdo: acceso demo rapido y seguro */}
      <section className="lg:col-span-5 rounded-2xl border border-[#DCE5DD] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF4EB] text-[#2E7D32]">
            <Sprout className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-extrabold text-[#18221A]">
              Acceso de prueba academica
            </h1>
            <p className="text-xs text-[#4A5A4E]">
              Cuentas preconfiguradas con permisos acotados por rol
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-[#4A5A4E]">
          Usa estos accesos rapidos para validar el flujo completo entre finca y comprador sin alterar seguridad ni exponer permisos administrativos.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => onDemoAccess('productor')}
            className="flex w-full items-center gap-3 rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3.5 text-left transition-colors hover:border-[#2E7D32] hover:bg-[#EAF4EB]/60 disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2E7D32] text-white">
              <Tractor className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <span className="block text-sm font-bold text-[#18221A]">
                Entrar como Productor Demo
              </span>
              <span className="block text-xs text-[#4A5A4E]">
                Juan Carlos Mendoza · Finca La Esperanza (Chinavita)
              </span>
            </div>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => onDemoAccess('consumidor')}
            className="flex w-full items-center gap-3 rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3.5 text-left transition-colors hover:border-[#2E7D32] hover:bg-[#EAF4EB]/60 disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9A5B08] text-white">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <span className="block text-sm font-bold text-[#18221A]">
                Entrar como Consumidor Demo
              </span>
              <span className="block text-xs text-[#4A5A4E]">
                Camila Rojas · Compradora en Bogota D.C.
              </span>
            </div>
          </button>
        </div>

        <div className="rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3 text-xs text-[#4A5A4E]">
          Las contraseñas en este prototipo se almacenan con hash criptografico y las acciones entre productores estan aisladas.
        </div>
      </section>

      {/* Panel derecho: formulario completo de login y registro */}
      <section className="lg:col-span-7 rounded-2xl border border-[#DCE5DD] bg-white p-5 sm:p-7 shadow-xs">
        <div role="tablist" aria-label="Opciones de acceso" className="grid grid-cols-2 gap-2 rounded-xl bg-[#F6F8F6] p-1">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => {
              setMode('login')
              setError('')
            }}
            className={`min-h-[42px] rounded-lg text-sm font-bold transition-colors ${
              mode === 'login' ? 'bg-white text-[#18221A] shadow-xs' : 'text-[#4A5A4E]'
            }`}
          >
            Iniciar sesion
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => {
              setMode('register')
              setError('')
            }}
            className={`min-h-[42px] rounded-lg text-sm font-bold transition-colors ${
              mode === 'register' ? 'bg-white text-[#18221A] shadow-xs' : 'text-[#4A5A4E]'
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900"
          >
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={onLoginSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-[#18221A] mb-1.5">
                Correo electronico
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="nombre@correo.com"
                className="min-h-[46px] w-full rounded-xl border border-[#DCE5DD] px-3.5 text-sm focus:border-[#2E7D32] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-[#18221A] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Minimo 8 caracteres"
                  className="min-h-[46px] w-full rounded-xl border border-[#DCE5DD] pl-3.5 pr-11 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#4A5A4E] hover:bg-[#F0F4F0]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[46px] w-full rounded-xl bg-[#2E7D32] px-4 py-3 text-sm font-bold text-white hover:bg-[#236327] disabled:opacity-60"
            >
              {submitting ? 'Verificando...' : 'Ingresar a mi cuenta'}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegisterSubmit} className="mt-5 space-y-4">
            <div>
              <span className="block text-xs font-bold text-[#18221A] mb-1.5">
                Tipo de perfil
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRegisterForm({ ...registerForm, role: 'consumidor' })}
                  className={`min-h-[46px] rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
                    registerForm.role === 'consumidor'
                      ? 'border-[#2E7D32] bg-[#EAF4EB] text-[#236327]'
                      : 'border-[#DCE5DD] bg-white text-[#4A5A4E]'
                  }`}
                >
                  Consumidor
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterForm({ ...registerForm, role: 'productor' })}
                  className={`min-h-[46px] rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
                    registerForm.role === 'productor'
                      ? 'border-[#2E7D32] bg-[#EAF4EB] text-[#236327]'
                      : 'border-[#DCE5DD] bg-white text-[#4A5A4E]'
                  }`}
                >
                  Productor rural
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-bold text-[#18221A] mb-1.5">
                  Nombre completo *
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  placeholder="Ej. Ana Maria Gomez"
                  className="min-h-[46px] w-full rounded-xl border border-[#DCE5DD] px-3.5 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold text-[#18221A] mb-1.5">
                  Correo electronico *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="min-h-[46px] w-full rounded-xl border border-[#DCE5DD] px-3.5 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>
            </div>

            {registerForm.role === 'productor' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-farm" className="block text-xs font-bold text-[#18221A] mb-1.5">
                    Unidad productiva o finca *
                  </label>
                  <input
                    id="reg-farm"
                    type="text"
                    required
                    value={registerForm.farmName}
                    onChange={(e) => setRegisterForm({ ...registerForm, farmName: e.target.value })}
                    placeholder="Ej. Finca El Mirador"
                    className="min-h-[46px] w-full rounded-xl border border-[#DCE5DD] px-3.5 text-sm focus:border-[#2E7D32] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="reg-muni" className="block text-xs font-bold text-[#18221A] mb-1.5">
                    Municipio de origen *
                  </label>
                  <select
                    id="reg-muni"
                    value={registerForm.municipality}
                    onChange={(e) => setRegisterForm({ ...registerForm, municipality: e.target.value })}
                    className="min-h-[46px] w-full rounded-xl border border-[#DCE5DD] bg-white px-3.5 text-sm focus:border-[#2E7D32] focus:outline-none"
                  >
                    {BOYACA_MUNICIPALITIES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="reg-city" className="block text-xs font-bold text-[#18221A] mb-1.5">
                  Ciudad de residencia *
                </label>
                <input
                  id="reg-city"
                  type="text"
                  required
                  value={registerForm.city}
                  onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                  placeholder="Bogota D.C."
                  className="min-h-[46px] w-full rounded-xl border border-[#DCE5DD] px-3.5 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label htmlFor="reg-pass" className="block text-xs font-bold text-[#18221A] mb-1.5">
                Contraseña (minimo 8 caracteres) *
              </label>
              <input
                id="reg-pass"
                type="password"
                required
                minLength={8}
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                placeholder="Crea una contraseña segura"
                className="min-h-[46px] w-full rounded-xl border border-[#DCE5DD] px-3.5 text-sm focus:border-[#2E7D32] focus:outline-none"
              />
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3 text-xs text-[#4A5A4E] cursor-pointer">
              <input
                type="checkbox"
                checked={registerForm.dataConsentAccepted}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, dataConsentAccepted: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 accent-[#2E7D32]"
              />
              <span>
                Acepto que estos datos se emplean unicamente para pruebas academicas de registro, catalogo y pedidos de prueba en el entorno TRL 4.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[46px] w-full rounded-xl bg-[#2E7D32] px-4 py-3 text-sm font-bold text-white hover:bg-[#236327] disabled:opacity-60"
            >
              {submitting ? 'Registrando cuenta...' : 'Crear cuenta de prueba'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
