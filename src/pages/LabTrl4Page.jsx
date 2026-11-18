import {
  CheckCircle2,
  Download,
  ExternalLink,
  FlaskConical,
  MonitorSmartphone,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { DESIGN_FINDINGS, TRACEABILITY_MATRIX } from '../data/seedData.js'
import { getDataModeLabel, runTrl4LaboratorySuite } from '../services/agroService.js'

export function LabTrl4Page() {
  const { handleResetDemo } = useApp()
  const [report, setReport] = useState(null)
  const [running, setRunning] = useState(false)
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  })

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const onRunSuite = async () => {
    setRunning(true)
    try {
      const output = await runTrl4LaboratorySuite()
      setReport(output)
    } finally {
      setRunning(false)
    }
  }

  const onDownloadReport = () => {
    if (!report) return
    const payload = {
      project: 'AgroBoyaca TRL 4',
      environment: getDataModeLabel(),
      viewport: `${viewport.width}x${viewport.height}`,
      ...report,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-trl4-agroboyaca-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#DCE5DD] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF4EB] px-3 py-1 text-xs font-bold text-[#236327]">
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              <span>Entorno de validacion en laboratorio TRL 4</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#18221A]">
              Pruebas integradas y trazabilidad de requerimientos
            </h1>
            <p className="text-sm text-[#4A5A4E] max-w-2xl">
              Este modulo ejecuta casos de prueba reales sobre los servicios de la plataforma para comprobar integridad de inventario, control de acceso por rol y flujos de negocio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDemo}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#DCE5DD] bg-white px-4 text-sm font-bold text-[#18221A] hover:bg-[#F6F8F6]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Restablecer datos demo
            </button>

            <button
              type="button"
              disabled={running}
              onClick={onRunSuite}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] px-5 text-sm font-bold text-white hover:bg-[#236327] disabled:opacity-60"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              {running ? 'Ejecutando pruebas...' : 'Ejecutar suite TRL 4'}
            </button>
          </div>
        </div>

        {/* Telemetria del entorno */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3.5">
            <span className="text-xs font-semibold text-[#4A5A4E]">Motor de persistencia activo</span>
            <span className="mt-1 block text-sm font-extrabold text-[#18221A]">
              {getDataModeLabel()}
            </span>
          </div>
          <div className="rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3.5">
            <span className="text-xs font-semibold text-[#4A5A4E] flex items-center gap-1.5">
              <MonitorSmartphone className="h-3.5 w-3.5 text-[#2E7D32]" aria-hidden="true" />
              Resolucion actual de prueba
            </span>
            <span className="mt-1 block text-sm font-extrabold text-[#18221A] tabular-nums">
              {viewport.width} x {viewport.height} px
            </span>
          </div>
          <div className="rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3.5">
            <span className="text-xs font-semibold text-[#4A5A4E]">Cobertura funcional</span>
            <span className="mt-1 block text-sm font-extrabold text-[#2E7D32] tabular-nums">
              8 / 8 RF implementados
            </span>
          </div>
        </div>
      </section>

      {/* Resultados de la ejecucion en vivo */}
      {report && (
        <section
          aria-label="Resultados de pruebas TRL 4"
          className="rounded-2xl border border-[#2E7D32] bg-white p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#18221A]">
                Resultado de ejecucion: {report.passedCount}/{report.totalCount} aprobados ({report.passRate}%)
              </h2>
              <p className="text-xs text-[#4A5A4E] tabular-nums">
                Duracion total: {report.totalDurationMs} ms · Umbral RNF-04: &lt; 2000 ms
              </p>
            </div>
            <button
              type="button"
              onClick={onDownloadReport}
              className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-[#DCE5DD] px-3.5 text-xs font-bold text-[#18221A] hover:bg-[#F6F8F6]"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Descargar reporte JSON
            </button>
          </div>

          <ul className="divide-y divide-[#DCE5DD] rounded-xl border border-[#DCE5DD]">
            {report.results.map((item) => (
              <li
                key={item.title}
                className="flex flex-wrap items-start justify-between gap-3 p-3.5 text-sm"
              >
                <div className="flex items-start gap-2.5">
                  {item.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-[#2E7D32] shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-[#236327]">{item.code}</span>
                    <p className="font-bold text-[#18221A]">{item.title}</p>
                    <p className="text-xs text-[#4A5A4E]">{item.detail}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#4A5A4E] tabular-nums">
                  {item.durationMs} ms
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Hallazgos de diseño detectados y corregidos */}
      <section className="rounded-2xl border border-[#DCE5DD] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-extrabold text-[#18221A]">
          Deteccion de problemas de diseño y ajustes (Maqueta previa a Prototipo TRL 4)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DESIGN_FINDINGS.map((finding) => (
            <article
              key={finding.id}
              className="rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#9A5B08]">{finding.id}</span>
                <span className="text-xs font-bold text-[#18221A]">{finding.screen}</span>
              </div>
              <p className="text-xs text-[#4A5A4E]">
                <strong className="text-[#18221A]">Problema detectado:</strong> {finding.issue}
              </p>
              <p className="text-xs text-[#236327]">
                <strong>Ajuste aplicado:</strong> {finding.resolution}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Matriz completa de los 8 RF y 8 RNF */}
      <section className="rounded-2xl border border-[#DCE5DD] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-extrabold text-[#18221A]">
          Trazabilidad de requerimientos (8 RF y 8 RNF)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#DCE5DD] text-[#4A5A4E]">
                <th className="py-2.5 pr-4 font-bold">Codigo</th>
                <th className="py-2.5 pr-4 font-bold">Requerimiento</th>
                <th className="py-2.5 pr-4 font-bold">Historias</th>
                <th className="py-2.5 font-bold">Validar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F0]">
              {TRACEABILITY_MATRIX.map((row) => (
                <tr key={row.code}>
                  <td className="py-2.5 pr-4 font-extrabold text-[#2E7D32] whitespace-nowrap">
                    {row.code}
                  </td>
                  <td className="py-2.5 pr-4 text-[#18221A]">{row.name}</td>
                  <td className="py-2.5 pr-4 text-[#4A5A4E] whitespace-nowrap">{row.hu}</td>
                  <td className="py-2.5">
                    <Link
                      to={row.route}
                      className="inline-flex items-center gap-1 font-bold text-[#2E7D32] hover:underline"
                    >
                      Abrir
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
