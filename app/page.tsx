'use client'

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

import { HiOutlineUpload, HiOutlineDownload, HiOutlineCheck, HiOutlineX, HiOutlineSearch, HiOutlinePlus, HiOutlineRefresh, HiOutlineEye, HiOutlinePencil, HiOutlineClock, HiOutlineChevronDown, HiOutlineChevronRight, HiOutlineDocumentText, HiOutlineTag, HiOutlineFilter, HiOutlineCode } from 'react-icons/hi'
import { BsCheckCircleFill, BsXCircleFill, BsGearFill, BsArrowRepeat } from 'react-icons/bs'
import { FiPackage, FiLayers, FiDatabase, FiHome, FiSettings, FiFileText, FiTrendingUp, FiCpu, FiBox } from 'react-icons/fi'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

// ============================================================
// CONSTANTS
// ============================================================
const ENRICHMENT_COORDINATOR_ID = "69986393d956b79390da180d"
const EXPORT_AGENT_ID = "699863a6c32baa328efdb2d7"

// ============================================================
// TypeScript Interfaces
// ============================================================
interface Job {
  id: string
  name: string
  productCount: number
  status: 'processing' | 'completed' | 'failed' | 'partial'
  date: string
  products: EnrichedProduct[]
}

interface EnrichedProduct {
  id: string
  originalData: Record<string, string>
  status: 'enriched' | 'edited' | 'approved' | 'failed'
  product_name?: string
  enrichment_status?: string
  confidence_score?: number
  description_data?: {
    product_title: string
    short_description: string
    long_description: string
    selling_points: string[]
    meta_keywords: string[]
    confidence_score: number
  }
  categorization_data?: {
    primary_category: string
    taxonomy_path: string
    secondary_categories: string[]
    tags: string[]
    product_type: string
    confidence_score: number
  }
  attribute_data?: {
    physical_attributes: {
      dimensions: string
      weight: string
      size: string
      color: string
      material: string
    }
    technical_specs: { key: string; value: string }[]
    variant_attributes: { attribute: string; options: string[] }[]
    additional_attributes: { key: string; value: string }[]
    confidence_score: number
  }
  seo_data?: {
    meta_title: string
    meta_description: string
    faq_content: { question: string; answer: string }[]
    json_ld_markup: string
    rich_snippet_content: string
    seo_score: number
    confidence_score: number
  }
}

type ScreenType = 'dashboard' | 'new-job' | 'processing' | 'review' | 'history' | 'settings'

// ============================================================
// Sample Data Generator
// ============================================================
function generateSampleProducts(): EnrichedProduct[] {
  return [
    {
      id: 'sample-1',
      originalData: { nombre: 'Silla de Oficina Ergonomica', sku: 'EOC-2024', precio: '349.99', marca: 'ProComfort', ean: '8412345678901' },
      status: 'enriched',
      product_name: 'Silla de Oficina Ergonomica ProComfort',
      enrichment_status: 'completado',
      confidence_score: 94,
      description_data: {
        product_title: 'Silla de Oficina Ergonomica ProComfort con Soporte Lumbar Ajustable',
        short_description: 'Silla ergonomica premium con soporte lumbar ajustable, respaldo de malla transpirable y reposabrazos 4D para comodidad durante todo el dia.',
        long_description: 'La Silla de Oficina Ergonomica ProComfort esta disenada para profesionales que exigen comodidad durante largas jornadas de trabajo. Cuenta con un respaldo de malla contorneado que promueve la circulacion de aire, soporte lumbar ajustable que se adapta a la columna vertebral y reposabrazos 4D que se ajustan a la posicion preferida. Incluye mecanismo de inclinacion sincronizado con control de tension y borde de asiento en cascada para reducir la presion en los muslos.',
        selling_points: ['Sistema de soporte lumbar ajustable', 'Respaldo de malla transpirable', 'Reposabrazos ajustables 4D', 'Mecanismo de inclinacion sincronizado', 'Garantia de 5 anos incluida'],
        meta_keywords: ['silla ergonomica', 'silla oficina', 'soporte lumbar', 'silla escritorio', 'silla malla', 'silla ajustable', 'teletrabajo', 'silla gaming', 'mobiliario oficina', 'silla postural', 'silla ejecutiva', 'ergonomia'],
        confidence_score: 94
      },
      categorization_data: {
        primary_category: 'Mobiliario de Oficina',
        taxonomy_path: 'Hogar y Jardin > Muebles > Mobiliario de Oficina > Sillas de Oficina',
        secondary_categories: ['Sillas Ergonomicas', 'Sillas de Escritorio'],
        tags: ['ergonomica', 'silla oficina', 'soporte lumbar', 'silla malla', 'ajustable', 'teletrabajo'],
        product_type: 'Silla de Trabajo',
        confidence_score: 95
      },
      attribute_data: {
        physical_attributes: { dimensions: '70 cm A x 68 cm P x 112-122 cm Al', weight: '19 kg', size: 'Estandar', color: 'Negro Mate', material: 'Malla y Nylon' },
        technical_specs: [{ key: 'Capacidad de Peso', value: '136 kg' }, { key: 'Rango de Altura del Asiento', value: '43-53 cm' }, { key: 'Rango de Inclinacion', value: '90-120 grados' }],
        variant_attributes: [{ attribute: 'Color', options: ['Negro Mate', 'Gris Grafito', 'Azul Marino'] }, { attribute: 'Reposacabezas', options: ['Con Reposacabezas', 'Sin Reposacabezas'] }],
        additional_attributes: [{ key: 'Montaje Requerido', value: 'Si' }, { key: 'Tipo de Ruedas', value: 'Ruedas dobles para alfombra' }],
        confidence_score: 92
      },
      seo_data: {
        meta_title: 'Silla de Oficina Ergonomica con Soporte Lumbar | ProComfort',
        meta_description: 'Compra la Silla de Oficina Ergonomica ProComfort con soporte lumbar ajustable, malla transpirable y reposabrazos 4D. Envio gratis en pedidos superiores a 299 EUR.',
        faq_content: [
          { question: 'Cual es la capacidad de peso maxima?', answer: 'La silla ProComfort soporta hasta 136 kg de peso.' },
          { question: 'Es necesario ensamblarla?', answer: 'Si, el ensamblaje suele tomar entre 20-30 minutos con las herramientas incluidas.' },
          { question: 'Tiene garantia?', answer: 'Si, incluye garantia de 5 anos contra defectos de fabricacion.' }
        ],
        json_ld_markup: '{"@context":"https://schema.org","@type":"Product","name":"Silla de Oficina Ergonomica ProComfort","brand":{"@type":"Brand","name":"ProComfort"},"gtin13":"8412345678901"}',
        rich_snippet_content: 'Silla Ergonomica ProComfort - 4.7 estrellas, 1,249 resenas, 349.99 EUR',
        seo_score: 91,
        confidence_score: 93
      }
    },
    {
      id: 'sample-2',
      originalData: { nombre: 'Auriculares Inalambricos con Cancelacion de Ruido', sku: 'WNC-500', precio: '199.99', marca: 'SonicPure', ean: '8412345678918' },
      status: 'enriched',
      product_name: 'Auriculares Inalambricos SonicPure ANC 500',
      enrichment_status: 'completado',
      confidence_score: 96,
      description_data: {
        product_title: 'SonicPure ANC 500 Auriculares Inalambricos con Cancelacion de Ruido Adaptativa',
        short_description: 'Auriculares inalambricos premium con cancelacion de ruido adaptativa, 40 horas de bateria y certificacion Hi-Res Audio.',
        long_description: 'Experimenta audio inmersivo con los SonicPure ANC 500. Estos auriculares inalambricos premium cuentan con cancelacion de ruido adaptativa que se ajusta automaticamente a tu entorno, ofreciendo un sonido cristalino ya sea en una oficina concurrida o en un avion. Con 40 horas de bateria, conectividad Bluetooth 5.3 multipunto y soporte Hi-Res Audio, estos auriculares establecen un nuevo estandar en audio inalambrico.',
        selling_points: ['Cancelacion de ruido adaptativa', '40 horas de autonomia', 'Certificacion Hi-Res Audio', 'Bluetooth 5.3 multipunto', 'Diseno plegable con estuche'],
        meta_keywords: ['auriculares inalambricos', 'cancelacion de ruido', 'bluetooth', 'ANC', 'audifonos', 'cascos inalambricos', 'audio hi-res', 'over-ear', 'musica', 'auriculares premium', 'SonicPure', 'noise cancelling'],
        confidence_score: 96
      },
      categorization_data: {
        primary_category: 'Electronica',
        taxonomy_path: 'Electronica > Audio > Auriculares > Auriculares Over-Ear',
        secondary_categories: ['Auriculares con Cancelacion de Ruido', 'Auriculares Inalambricos'],
        tags: ['auriculares', 'cancelacion ruido', 'inalambricos', 'bluetooth', 'audio', 'ANC'],
        product_type: 'Auriculares Over-Ear',
        confidence_score: 97
      },
      attribute_data: {
        physical_attributes: { dimensions: '19 x 16.5 x 8.1 cm', weight: '250 g', size: 'Talla Unica', color: 'Negro Medianoche', material: 'Cuero Proteina Premium y Aluminio' },
        technical_specs: [{ key: 'Tamano del Driver', value: '40 mm' }, { key: 'Respuesta de Frecuencia', value: '4Hz - 40kHz' }, { key: 'Version Bluetooth', value: '5.3' }],
        variant_attributes: [{ attribute: 'Color', options: ['Negro Medianoche', 'Plata Escarcha', 'Oro Rosa'] }],
        additional_attributes: [{ key: 'Carga', value: 'USB-C, 5 min de carga = 3 horas de reproduccion' }, { key: 'Codecs', value: 'LDAC, AAC, SBC' }],
        confidence_score: 95
      },
      seo_data: {
        meta_title: 'SonicPure ANC 500 Auriculares Inalambricos con Cancelacion de Ruido',
        meta_description: 'SonicPure ANC 500 - Auriculares inalambricos premium con cancelacion de ruido adaptativa y 40 horas de bateria. Certificacion Hi-Res Audio. Compra ahora.',
        faq_content: [
          { question: 'Cuanto dura la bateria?', answer: 'Hasta 40 horas con ANC activado, 60 horas con ANC desactivado.' },
          { question: 'Son compatibles con multiples dispositivos?', answer: 'Si, soportan conexion Bluetooth 5.3 multipunto para conectarse a dos dispositivos simultaneamente.' },
          { question: 'Incluyen estuche de transporte?', answer: 'Si, incluyen un estuche rigido de transporte con compartimento para el cable de carga.' }
        ],
        json_ld_markup: '{"@context":"https://schema.org","@type":"Product","name":"SonicPure ANC 500","brand":{"@type":"Brand","name":"SonicPure"},"gtin13":"8412345678918"}',
        rich_snippet_content: 'SonicPure ANC 500 - 4.8 estrellas, 2,103 resenas, 199.99 EUR',
        seo_score: 95,
        confidence_score: 96
      }
    },
    {
      id: 'sample-3',
      originalData: { nombre: 'Te Verde Matcha Organico', sku: 'OGT-100', precio: '24.99', marca: 'ZenLeaf', ean: '8412345678925' },
      status: 'enriched',
      product_name: 'Te Verde Matcha Organico Ceremonial ZenLeaf',
      enrichment_status: 'completado',
      confidence_score: 92,
      description_data: {
        product_title: 'Te Matcha Organico Grado Ceremonial - Polvo de Te Verde Premium Japones',
        short_description: 'Matcha japones grado ceremonial premium, molido en piedra a partir de hojas cultivadas a la sombra para un sabor suave y rico en umami.',
        long_description: 'Procedente de la renombrada region de Uji en Kioto, Japon, nuestro Matcha Grado Ceremonial se muele en piedra a partir de hojas de te de primera cosecha cultivadas a la sombra. El resultado es un polvo verde esmeralda vibrante con un sabor naturalmente dulce, rico en umami y textura cremosa. Perfecto para ceremonias de te tradicionales, lattes y batidos. Certificado Organico y analizado para garantizar su pureza.',
        selling_points: ['Grado ceremonial de Uji, Kioto', 'Molido en piedra para textura fina', 'Certificado Organico', 'Rico en L-teanina y antioxidantes', '30 porciones por lata'],
        meta_keywords: ['matcha', 'te verde', 'organico', 'grado ceremonial', 'te japones', 'superalimento', 'matcha en polvo', 'antioxidantes', 'L-teanina', 'te Uji', 'matcha latte', 'te matcha premium'],
        confidence_score: 92
      },
      categorization_data: {
        primary_category: 'Alimentos y Bebidas',
        taxonomy_path: 'Alimentos y Bebidas > Te > Te Verde > Matcha',
        secondary_categories: ['Te Organico', 'Superalimentos en Polvo'],
        tags: ['matcha', 'te verde', 'organico', 'grado ceremonial', 'te japones', 'superalimento'],
        product_type: 'Te en Polvo',
        confidence_score: 93
      },
      attribute_data: {
        physical_attributes: { dimensions: '7.6 x 7.6 x 10.2 cm', weight: '100g', size: 'Lata 100g', color: 'Verde Esmeralda', material: 'N/A' },
        technical_specs: [{ key: 'Origen', value: 'Uji, Kioto, Japon' }, { key: 'Cafeina', value: '~70mg por porcion' }],
        variant_attributes: [{ attribute: 'Tamano', options: ['30g Inicio', '100g Lata', '250g Granel'] }],
        additional_attributes: [{ key: 'Certificaciones', value: 'Organico, Sin OGM, Vegano' }, { key: 'Vida Util', value: '12 meses desde produccion' }],
        confidence_score: 91
      },
      seo_data: {
        meta_title: 'Te Matcha Organico Grado Ceremonial - Te Verde Japones Premium',
        meta_description: 'Matcha grado ceremonial premium de Uji, Kioto. Molido en piedra, certificado organico, sabor umami intenso. Perfecto para lattes y te tradicional. Envio gratis.',
        faq_content: [
          { question: 'Que diferencia al grado ceremonial?', answer: 'El matcha grado ceremonial utiliza solo las hojas mas jovenes y tiernas de la primera cosecha, resultando en un sabor mas dulce y vibrante.' },
          { question: 'Como se prepara el matcha?', answer: 'Tamiza 1-2 gramos de matcha en un tazon, agrega 70ml de agua a 80 grados C y bate con un chasen (batidor de bambu) hasta obtener espuma.' },
          { question: 'Cuantas porciones contiene?', answer: 'La lata de 100g contiene aproximadamente 30 porciones de matcha ceremonial.' }
        ],
        json_ld_markup: '{"@context":"https://schema.org","@type":"Product","name":"Te Matcha Organico Grado Ceremonial ZenLeaf","brand":{"@type":"Brand","name":"ZenLeaf"},"gtin13":"8412345678925"}',
        rich_snippet_content: 'Matcha Organico ZenLeaf - 4.9 estrellas, 856 resenas, 24.99 EUR',
        seo_score: 82,
        confidence_score: 92
      }
    }
  ]
}

function generateSampleJobs(): Job[] {
  return [
    {
      id: 'job-sample-1',
      name: 'catalogo_electronica.csv',
      productCount: 45,
      status: 'completed',
      date: '2026-02-18T14:30:00Z',
      products: generateSampleProducts()
    },
    {
      id: 'job-sample-2',
      name: 'coleccion_primavera.json',
      productCount: 120,
      status: 'completed',
      date: '2026-02-15T09:15:00Z',
      products: []
    },
    {
      id: 'job-sample-3',
      name: 'electrodomesticos_cocina.csv',
      productCount: 18,
      status: 'partial',
      date: '2026-02-10T16:45:00Z',
      products: []
    }
  ]
}

// ============================================================
// Markdown Renderer
// ============================================================
function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">{part}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

// ============================================================
// File Parser
// ============================================================
function parseFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (file.name.endsWith('.json')) {
        try {
          const data = JSON.parse(text)
          resolve(Array.isArray(data) ? data : [data])
        } catch {
          reject('Invalid JSON file')
        }
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length < 2) { reject('CSV needs at least a header row and one data row'); return }
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const obj: Record<string, string> = {}
          headers.forEach((h, i) => { obj[h] = values[i] || '' })
          return obj
        })
        resolve(rows)
      } else {
        reject('Unsupported file type. Please upload CSV or JSON.')
      }
    }
    reader.onerror = () => reject('File read error')
    reader.readAsText(file)
  })
}

// ============================================================
// SEO Score Color Helper
// ============================================================
function getSeoScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

function getSeoScoreBg(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-700 border-green-200'
  if (score >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-red-100 text-red-700 border-red-200'
}

// ============================================================
// Status Badge Helper
// ============================================================
function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Completado</Badge>
    case 'processing':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Procesando</Badge>
    case 'failed':
      return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Fallido</Badge>
    case 'partial':
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Parcial</Badge>
    case 'enriched':
      return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Enriquecido</Badge>
    case 'edited':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Editado</Badge>
    case 'approved':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Aprobado</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getConfidenceBadge(score: number | undefined) {
  if (score == null) return null
  const color = score >= 90 ? 'bg-green-100 text-green-700 border-green-200' :
    score >= 70 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
    'bg-red-100 text-red-700 border-red-200'
  return <Badge className={cn(color, 'text-xs font-semibold')}>{score}%</Badge>
}

// ============================================================
// ErrorBoundary
// ============================================================
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================
// Sidebar Component
// ============================================================
function Sidebar({ activeScreen, setActiveScreen, collapsed, setCollapsed }: {
  activeScreen: ScreenType
  setActiveScreen: (s: ScreenType) => void
  collapsed: boolean
  setCollapsed: (c: boolean) => void
}) {
  const navItems: { id: ScreenType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Panel', icon: <FiHome className="w-5 h-5" /> },
    { id: 'new-job', label: 'Nuevo Trabajo', icon: <HiOutlinePlus className="w-5 h-5" /> },
    { id: 'history', label: 'Historial', icon: <FiFileText className="w-5 h-5" /> },
    { id: 'settings', label: 'Configuracion', icon: <FiSettings className="w-5 h-5" /> },
  ]

  return (
    <div className={cn("h-screen flex flex-col border-r border-border/50 backdrop-blur-md bg-white/75 transition-all duration-300", collapsed ? "w-16" : "w-60")}>
      <div className="p-4 flex items-center gap-3 border-b border-border/50">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <FiBox className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight text-foreground truncate">Enriquecimiento</span>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveScreen(item.id)}
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200", activeScreen === item.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border/50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
        >
          {collapsed ? <HiOutlineChevronRight className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Header Component
// ============================================================
function AppHeader({ title, sampleDataOn, setSampleDataOn }: { title: string; sampleDataOn: boolean; setSampleDataOn: (v: boolean) => void }) {
  return (
    <div className="h-16 border-b border-border/50 backdrop-blur-md bg-white/60 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Datos de Ejemplo</Label>
          <Switch id="sample-toggle" checked={sampleDataOn} onCheckedChange={setSampleDataOn} />
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">U</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Metric Card
// ============================================================
function MetricCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string | number; subtext?: string }) {
  return (
    <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Dashboard Screen
// ============================================================
function DashboardScreen({ jobs, setActiveScreen, setCurrentJob, setEnrichedProducts, sampleDataOn }: {
  jobs: Job[]
  setActiveScreen: (s: ScreenType) => void
  setCurrentJob: (j: Job) => void
  setEnrichedProducts: (p: EnrichedProduct[]) => void
  sampleDataOn: boolean
}) {
  const displayJobs = sampleDataOn && jobs.length === 0 ? generateSampleJobs() : jobs

  const totalProducts = displayJobs.reduce((sum, j) => sum + j.productCount, 0)
  const activeJobs = displayJobs.filter(j => j.status === 'processing').length
  const completedJobs = displayJobs.filter(j => j.status === 'completed').length
  const completionRate = displayJobs.length > 0 ? Math.round((completedJobs / displayJobs.length) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panel</h2>
          <p className="text-sm text-muted-foreground mt-1">Resumen de tu actividad de enriquecimiento de productos</p>
        </div>
        <Button onClick={() => setActiveScreen('new-job')} className="gap-2 rounded-xl">
          <HiOutlinePlus className="w-4 h-4" />
          Nuevo Trabajo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<FiPackage className="w-5 h-5" />} label="Total Productos" value={totalProducts} subtext="En todos los trabajos" />
        <MetricCard icon={<BsArrowRepeat className="w-5 h-5" />} label="Trabajos Activos" value={activeJobs} subtext="Procesando actualmente" />
        <MetricCard icon={<FiTrendingUp className="w-5 h-5" />} label="Tasa de Completado" value={`${completionRate}%`} subtext={`${completedJobs} de ${displayJobs.length} trabajos`} />
        <MetricCard icon={<HiOutlineClock className="w-5 h-5" />} label="Procesamiento Prom." value={displayJobs.length > 0 ? '~2.3s/producto' : '--'} subtext="Por producto" />
      </div>

      <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Trabajos Recientes</CardTitle>
          <CardDescription>Tus ultimas ejecuciones de enriquecimiento</CardDescription>
        </CardHeader>
        <CardContent>
          {displayJobs.length === 0 ? (
            <div className="text-center py-16">
              <FiDatabase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Sin trabajos de enriquecimiento</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">Sube tu primer catalogo de productos para comenzar con el enriquecimiento automatico con IA.</p>
              <Button onClick={() => setActiveScreen('new-job')} className="gap-2 rounded-xl">
                <HiOutlineUpload className="w-4 h-4" />
                Subir Catalogo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Trabajo</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-sm">{job.name}</TableCell>
                    <TableCell className="text-sm">{job.productCount}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(job.date).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setCurrentJob(job)
                            setEnrichedProducts(job.products)
                            setActiveScreen('review')
                          }}
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <HiOutlineRefresh className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <HiOutlineDownload className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// New Job Screen
// ============================================================
function NewJobScreen({ uploadedFile, setUploadedFile, parsedProducts, setParsedProducts, enrichmentConfig, setEnrichmentConfig, onStartEnrichment, sampleDataOn }: {
  uploadedFile: File | null
  setUploadedFile: (f: File | null) => void
  parsedProducts: Record<string, string>[]
  setParsedProducts: (p: Record<string, string>[]) => void
  enrichmentConfig: { descriptions: boolean; categorization: boolean; attributes: boolean; seo: boolean; brandTone: string; taxonomyPreference: string }
  setEnrichmentConfig: React.Dispatch<React.SetStateAction<{ descriptions: boolean; categorization: boolean; attributes: boolean; seo: boolean; brandTone: string; taxonomyPreference: string }>>
  onStartEnrichment: () => void
  sampleDataOn: boolean
}) {
  const [dragActive, setDragActive] = useState(false)
  const [parseError, setParseError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayProducts = sampleDataOn && parsedProducts.length === 0
    ? [
        { nombre: 'Silla de Oficina Ergonomica', sku: 'EOC-2024', precio: '349.99', marca: 'ProComfort', ean: '8412345678901' },
        { nombre: 'Auriculares Inalambricos ANC', sku: 'WNC-500', precio: '199.99', marca: 'SonicPure', ean: '8412345678918' },
        { nombre: 'Te Verde Matcha Organico', sku: 'OGT-100', precio: '24.99', marca: 'ZenLeaf', ean: '8412345678925' },
      ]
    : parsedProducts

  const handleFile = useCallback(async (file: File) => {
    setUploadedFile(file)
    setParseError('')
    try {
      const products = await parseFile(file)
      setParsedProducts(products)
    } catch (err) {
      setParseError(typeof err === 'string' ? err : 'Failed to parse file')
      setParsedProducts([])
    }
  }, [setUploadedFile, setParsedProducts])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragActive(false)
  }, [])

  const columns = displayProducts.length > 0 ? Object.keys(displayProducts[0]) : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nuevo Trabajo de Enriquecimiento</h2>
        <p className="text-sm text-muted-foreground mt-1">Sube tu catalogo de productos y configura las opciones de enriquecimiento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload */}
        <div className="space-y-4">
          <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HiOutlineUpload className="w-4 h-4 text-primary" />
                Subir Catalogo
              </CardTitle>
              <CardDescription>Arrastra y suelta un archivo CSV o JSON</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn("border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200", dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50")}
              >
                <HiOutlineUpload className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  {uploadedFile ? uploadedFile.name : 'Suelta tu archivo aqui o haz clic para explorar'}
                </p>
                <p className="text-xs text-muted-foreground">Admite archivos CSV y JSON</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
              </div>
              {parseError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                  <BsXCircleFill className="w-4 h-4 flex-shrink-0" />
                  {parseError}
                </div>
              )}
            </CardContent>
          </Card>

          {displayProducts.length > 0 && (
            <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <HiOutlineDocumentText className="w-4 h-4 text-primary" />
                  Vista Previa
                </CardTitle>
                <CardDescription>{displayProducts.length} productos detectados en {columns.length} columnas</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map((col) => (
                          <TableHead key={col} className="text-xs font-medium">{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayProducts.slice(0, 20).map((row, i) => (
                        <TableRow key={i}>
                          {columns.map((col) => (
                            <TableCell key={col} className="text-xs">{row[col] ?? ''}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Configuration */}
        <div className="space-y-4">
          <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BsGearFill className="w-4 h-4 text-primary" />
                Configuracion de Enriquecimiento
              </CardTitle>
              <CardDescription>Selecciona los modulos de enriquecimiento a aplicar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <HiOutlinePencil className="w-4 h-4 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">Descripciones</Label>
                      <p className="text-xs text-muted-foreground">Generar titulos, descripciones cortas y largas del producto</p>
                    </div>
                  </div>
                  <Switch checked={enrichmentConfig.descriptions} onCheckedChange={(v) => setEnrichmentConfig(prev => ({ ...prev, descriptions: v }))} />
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <HiOutlineTag className="w-4 h-4 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">Categorizacion</Label>
                      <p className="text-xs text-muted-foreground">Auto-categorizar con rutas de taxonomia y etiquetas</p>
                    </div>
                  </div>
                  <Switch checked={enrichmentConfig.categorization} onCheckedChange={(v) => setEnrichmentConfig(prev => ({ ...prev, categorization: v }))} />
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FiLayers className="w-4 h-4 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">Atributos</Label>
                      <p className="text-xs text-muted-foreground">Extraer atributos fisicos, tecnicos y variantes</p>
                    </div>
                  </div>
                  <Switch checked={enrichmentConfig.attributes} onCheckedChange={(v) => setEnrichmentConfig(prev => ({ ...prev, attributes: v }))} />
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FiTrendingUp className="w-4 h-4 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">SEO / AEO / GEO</Label>
                      <p className="text-xs text-muted-foreground">Meta tags, contenido FAQ, marcado estructurado</p>
                    </div>
                  </div>
                  <Switch checked={enrichmentConfig.seo} onCheckedChange={(v) => setEnrichmentConfig(prev => ({ ...prev, seo: v }))} />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Tono y Voz de Marca</Label>
                  <Textarea
                    placeholder="Ej: Profesional y convincente, con enfoque en calidad artesanal..."
                    className="mt-2 rounded-xl"
                    rows={3}
                    value={enrichmentConfig.brandTone}
                    onChange={(e) => setEnrichmentConfig(prev => ({ ...prev, brandTone: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Taxonomia de Categorias</Label>
                  <Select value={enrichmentConfig.taxonomyPreference} onValueChange={(v) => setEnrichmentConfig(prev => ({ ...prev, taxonomyPreference: v }))}>
                    <SelectTrigger className="mt-2 rounded-xl">
                      <SelectValue placeholder="Seleccionar taxonomia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detectar</SelectItem>
                      <SelectItem value="google">Taxonomia de Productos Google</SelectItem>
                      <SelectItem value="facebook">Taxonomia de Comercio Facebook</SelectItem>
                      <SelectItem value="custom">Taxonomia Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-3">
              <Button
                className="w-full gap-2 rounded-xl"
                size="lg"
                disabled={parsedProducts.length === 0 && !sampleDataOn}
                onClick={onStartEnrichment}
              >
                <FiCpu className="w-4 h-4" />
                Enriquecer Productos
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Processing Screen
// ============================================================
function ProcessingScreen({ progress, total, completed, currentProduct }: {
  progress: number
  total: number
  completed: number
  currentProduct: string
}) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-lg backdrop-blur-md bg-white/75 border-white/20 shadow-md">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <AiOutlineLoading3Quarters className="w-8 h-8 text-primary animate-spin" />
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight">Enriqueciendo Productos</h2>
            <p className="text-sm text-muted-foreground mt-1">Los agentes de IA estan procesando tu catalogo</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completed} de {total} productos</span>
              <span>~{Math.max(0, (total - completed) * 3)}s restante</span>
            </div>
          </div>

          {currentProduct && (
            <div className="p-3 bg-secondary/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Procesando actualmente</p>
              <p className="text-sm font-medium mt-0.5 truncate">{currentProduct}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            {['Descripcion', 'Categoria', 'Atributos', 'SEO'].map((agent) => (
              <div key={agent} className="p-2 bg-secondary/50 rounded-lg text-center">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1">
                  <BsCheckCircleFill className="w-3 h-3 text-primary" />
                </div>
                <p className="text-[10px] font-medium text-muted-foreground">{agent}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Product Detail Tabs (Expanded Row in Review)
// ============================================================
function ProductDetailTabs({ product, onEdit }: { product: EnrichedProduct; onEdit: (id: string, field: string, value: string) => void }) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue)
  }

  const saveEdit = (field: string) => {
    onEdit(product.id, field, editValue)
    setEditingField(null)
  }

  const cancelEdit = () => {
    setEditingField(null)
    setEditValue('')
  }

  function EditableField({ label, value, fieldKey }: { label: string; value: string; fieldKey: string }) {
    if (editingField === fieldKey) {
      return (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <div className="flex items-center gap-2">
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-sm rounded-lg" />
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => saveEdit(fieldKey)}>
              <HiOutlineCheck className="w-4 h-4 text-green-600" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
              <HiOutlineX className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      )
    }
    return (
      <div className="space-y-1 group">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-start gap-2">
          <p className="text-sm leading-relaxed flex-1">{value || '--'}</p>
          <button onClick={() => startEdit(fieldKey, value || '')} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary">
            <HiOutlinePencil className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-secondary/30 rounded-xl mt-2">
      <Tabs defaultValue="descriptions" className="w-full">
        <TabsList className="mb-4 bg-white/50">
          <TabsTrigger value="descriptions" className="text-xs">Descriptions</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs">Categories & Tags</TabsTrigger>
          <TabsTrigger value="attributes" className="text-xs">Attributes</TabsTrigger>
          <TabsTrigger value="seo" className="text-xs">SEO Meta</TabsTrigger>
          <TabsTrigger value="faq" className="text-xs">AEO FAQ</TabsTrigger>
          <TabsTrigger value="markup" className="text-xs">GEO Markup</TabsTrigger>
        </TabsList>

        <TabsContent value="descriptions" className="space-y-4">
          <EditableField label="Product Title" value={product.description_data?.product_title ?? ''} fieldKey="product_title" />
          <EditableField label="Short Description" value={product.description_data?.short_description ?? ''} fieldKey="short_description" />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Long Description</Label>
            <div className="text-sm leading-relaxed bg-white/50 p-3 rounded-lg">{renderMarkdown(product.description_data?.long_description ?? '')}</div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Selling Points</Label>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(product.description_data?.selling_points) && product.description_data.selling_points.map((point, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{point}</Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <EditableField label="Primary Category" value={product.categorization_data?.primary_category ?? ''} fieldKey="primary_category" />
          <EditableField label="Taxonomy Path" value={product.categorization_data?.taxonomy_path ?? ''} fieldKey="taxonomy_path" />
          <EditableField label="Product Type" value={product.categorization_data?.product_type ?? ''} fieldKey="product_type" />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Secondary Categories</Label>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(product.categorization_data?.secondary_categories) && product.categorization_data.secondary_categories.map((cat, i) => (
                <Badge key={i} variant="outline" className="text-xs">{cat}</Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(product.categorization_data?.tags) && product.categorization_data.tags.map((tag, i) => (
                <Badge key={i} className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">{tag}</Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attributes" className="space-y-4">
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-5 pr-3">
              {/* Original Data from Upload */}
              {product.originalData && Object.keys(product.originalData).length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Original Product Data</Label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Object.entries(product.originalData).map(([key, val]) => (
                      <div key={key} className="p-2.5 bg-muted/40 rounded-lg border border-border/50">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{key.replace(/_/g, ' ')}</p>
                        <p className="text-xs font-medium mt-0.5 break-words">{typeof val === 'string' ? val : JSON.stringify(val) || '--'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Physical Attributes */}
              {product.attribute_data?.physical_attributes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Physical Attributes</Label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(product.attribute_data.physical_attributes).map(([key, val]) => (
                      <div key={key} className="p-3 bg-white/60 rounded-lg border border-border/30 shadow-sm">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-medium mt-1 break-words">{typeof val === 'string' ? (val || '--') : JSON.stringify(val) || '--'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Specifications */}
              {Array.isArray(product.attribute_data?.technical_specs) && product.attribute_data.technical_specs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Technical Specifications</Label>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{product.attribute_data.technical_specs.length}</Badge>
                  </div>
                  <div className="bg-white/50 rounded-lg border border-border/30 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs font-semibold w-[40%]">Specification</TableHead>
                          <TableHead className="text-xs font-semibold">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {product.attribute_data.technical_specs.map((spec, i) => (
                          <TableRow key={i} className="hover:bg-white/30">
                            <TableCell className="text-xs font-medium py-2">{spec?.key ?? ''}</TableCell>
                            <TableCell className="text-xs py-2">{spec?.value ?? ''}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Variant Attributes */}
              {Array.isArray(product.attribute_data?.variant_attributes) && product.attribute_data.variant_attributes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Variant Attributes</Label>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{product.attribute_data.variant_attributes.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.attribute_data.variant_attributes.map((variant, i) => (
                      <div key={i} className="p-3 bg-white/60 rounded-lg border border-border/30 shadow-sm">
                        <p className="text-xs font-semibold mb-2 text-foreground">{variant?.attribute ?? `Variant ${i + 1}`}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(variant?.options) && variant.options.map((opt, j) => (
                            <Badge key={j} variant="outline" className="text-[11px] px-2 py-0.5 bg-white/50">{opt}</Badge>
                          ))}
                          {(!Array.isArray(variant?.options) || variant.options.length === 0) && (
                            <span className="text-xs text-muted-foreground">No options listed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Attributes */}
              {Array.isArray(product.attribute_data?.additional_attributes) && product.attribute_data.additional_attributes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Additional Attributes</Label>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{product.attribute_data.additional_attributes.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {product.attribute_data.additional_attributes.map((attr, i) => (
                      <div key={i} className="p-2.5 bg-white/60 rounded-lg border border-border/30 shadow-sm">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{attr?.key ?? ''}</p>
                        <p className="text-xs font-medium mt-1 break-words">{attr?.value ?? '--'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catch-all: render any extra keys in attribute_data not already shown */}
              {product.attribute_data && (() => {
                const knownKeys = new Set(['physical_attributes', 'technical_specs', 'variant_attributes', 'additional_attributes'])
                const extraKeys = Object.keys(product.attribute_data).filter(k => !knownKeys.has(k))
                if (extraKeys.length === 0) return null
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Other Attributes</Label>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{extraKeys.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {extraKeys.map((key) => {
                        const val = (product.attribute_data as any)[key]
                        return (
                          <div key={key} className="p-2.5 bg-white/60 rounded-lg border border-border/30 shadow-sm">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{key.replace(/_/g, ' ')}</p>
                            <p className="text-xs font-medium mt-1 break-words">
                              {typeof val === 'string' ? val : typeof val === 'number' ? String(val) : typeof val === 'boolean' ? (val ? 'Yes' : 'No') : Array.isArray(val) ? val.join(', ') : JSON.stringify(val)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Summary count */}
              {product.attribute_data && (
                <div className="pt-2 border-t border-border/30">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium">Total Attributes:</span>
                    {product.attribute_data.physical_attributes && (
                      <span>{Object.keys(product.attribute_data.physical_attributes).length} physical</span>
                    )}
                    {Array.isArray(product.attribute_data.technical_specs) && product.attribute_data.technical_specs.length > 0 && (
                      <span>{product.attribute_data.technical_specs.length} technical</span>
                    )}
                    {Array.isArray(product.attribute_data.variant_attributes) && product.attribute_data.variant_attributes.length > 0 && (
                      <span>{product.attribute_data.variant_attributes.length} variants</span>
                    )}
                    {Array.isArray(product.attribute_data.additional_attributes) && product.attribute_data.additional_attributes.length > 0 && (
                      <span>{product.attribute_data.additional_attributes.length} additional</span>
                    )}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!product.attribute_data && (
                <div className="text-center py-10">
                  <FiLayers className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No attributes extracted</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Attribute extraction may not have been enabled for this product</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <EditableField label="Meta Title" value={product.seo_data?.meta_title ?? ''} fieldKey="meta_title" />
          <EditableField label="Meta Description" value={product.seo_data?.meta_description ?? ''} fieldKey="meta_description" />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">SEO Score</Label>
            <div className="flex items-center gap-3">
              <div className={cn("px-3 py-1.5 rounded-lg text-sm font-bold border", getSeoScoreBg(product.seo_data?.seo_score ?? 0))}>
                {product.seo_data?.seo_score ?? 0}/100
              </div>
              <Progress value={product.seo_data?.seo_score ?? 0} className="h-2 flex-1" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Rich Snippet Content</Label>
            <p className="text-sm bg-white/50 p-3 rounded-lg">{product.seo_data?.rich_snippet_content ?? '--'}</p>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-3">
          {Array.isArray(product.seo_data?.faq_content) && product.seo_data.faq_content.length > 0 ? (
            product.seo_data.faq_content.map((faq, i) => (
              <Card key={i} className="bg-white/50">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold mb-2">{faq?.question ?? ''}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq?.answer ?? ''}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No FAQ content generated.</p>
          )}
        </TabsContent>

        <TabsContent value="markup" className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">JSON-LD Markup</Label>
            <ScrollArea className="h-40">
              <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto font-mono">
                {product.seo_data?.json_ld_markup ? (() => { try { return JSON.stringify(JSON.parse(product.seo_data.json_ld_markup), null, 2) } catch { return product.seo_data?.json_ld_markup ?? '' } })() : '--'}
              </pre>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// Review Screen
// ============================================================
function ReviewScreen({ enrichedProducts, setEnrichedProducts, selectedProducts, setSelectedProducts, expandedProduct, setExpandedProduct, onExport, exportLoading, activeAgentId }: {
  enrichedProducts: EnrichedProduct[]
  setEnrichedProducts: React.Dispatch<React.SetStateAction<EnrichedProduct[]>>
  selectedProducts: Set<string>
  setSelectedProducts: React.Dispatch<React.SetStateAction<Set<string>>>
  expandedProduct: string | null
  setExpandedProduct: (id: string | null) => void
  onExport: (format: 'csv' | 'json') => void
  exportLoading: boolean
  activeAgentId: string | null
}) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const allSelected = enrichedProducts.length > 0 && enrichedProducts.every(p => selectedProducts.has(p.id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(enrichedProducts.map(p => p.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const approveSelected = () => {
    setEnrichedProducts(prev => prev.map(p => selectedProducts.has(p.id) ? { ...p, status: 'approved' as const } : p))
  }

  const handleEdit = (productId: string, field: string, value: string) => {
    setEnrichedProducts(prev => prev.map(p => {
      if (p.id !== productId) return p
      const updated = { ...p, status: 'edited' as const }
      if (field === 'product_title' && updated.description_data) updated.description_data = { ...updated.description_data, product_title: value }
      if (field === 'short_description' && updated.description_data) updated.description_data = { ...updated.description_data, short_description: value }
      if (field === 'primary_category' && updated.categorization_data) updated.categorization_data = { ...updated.categorization_data, primary_category: value }
      if (field === 'taxonomy_path' && updated.categorization_data) updated.categorization_data = { ...updated.categorization_data, taxonomy_path: value }
      if (field === 'product_type' && updated.categorization_data) updated.categorization_data = { ...updated.categorization_data, product_type: value }
      if (field === 'meta_title' && updated.seo_data) updated.seo_data = { ...updated.seo_data, meta_title: value }
      if (field === 'meta_description' && updated.seo_data) updated.seo_data = { ...updated.seo_data, meta_description: value }
      return updated
    }))
  }

  const getAttributeCount = (p: EnrichedProduct): number => {
    let count = 0
    if (p.attribute_data?.physical_attributes) count += Object.values(p.attribute_data.physical_attributes).filter(v => v).length
    if (Array.isArray(p.attribute_data?.technical_specs)) count += p.attribute_data.technical_specs.length
    if (Array.isArray(p.attribute_data?.additional_attributes)) count += p.attribute_data.additional_attributes.length
    return count
  }

  if (enrichedProducts.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <FiDatabase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No enriched products to review</h3>
          <p className="text-sm text-muted-foreground">Run an enrichment job first to see results here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Review & Approve</h2>
          <p className="text-sm text-muted-foreground mt-1">{enrichedProducts.length} products enriched, {selectedProducts.size} selected</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 rounded-xl" onClick={approveSelected} disabled={selectedProducts.size === 0}>
            <HiOutlineCheck className="w-4 h-4" />
            Approve Selected
          </Button>
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl" disabled={enrichedProducts.filter(p => selectedProducts.has(p.id) || p.status === 'approved').length === 0}>
                <HiOutlineDownload className="w-4 h-4" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Enriched Products</DialogTitle>
                <DialogDescription>Choose your preferred format to download</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2 rounded-xl"
                  onClick={() => { onExport('csv'); setExportDialogOpen(false) }}
                  disabled={exportLoading}
                >
                  {exportLoading ? <AiOutlineLoading3Quarters className="w-6 h-6 animate-spin" /> : <HiOutlineDocumentText className="w-6 h-6" />}
                  <span className="text-sm font-medium">CSV</span>
                  <span className="text-xs text-muted-foreground">Spreadsheet format</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2 rounded-xl"
                  onClick={() => { onExport('json'); setExportDialogOpen(false) }}
                  disabled={exportLoading}
                >
                  {exportLoading ? <AiOutlineLoading3Quarters className="w-6 h-6 animate-spin" /> : <HiOutlineCode className="w-6 h-6" />}
                  <span className="text-sm font-medium">JSON</span>
                  <span className="text-xs text-muted-foreground">Structured data</span>
                </Button>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" className="rounded-xl">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[calc(100vh-14rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Attributes</TableHead>
                  <TableHead>SEO Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedProducts.map((product) => {
                  const productName = product.product_name || product.description_data?.product_title || Object.values(product.originalData)[0] || 'Unnamed'
                  const isExpanded = expandedProduct === product.id
                  return (
                    <React.Fragment key={product.id}>
                      <TableRow className={cn("cursor-pointer transition-colors", isExpanded && "bg-secondary/50")}>
                        <TableCell>
                          <Checkbox checked={selectedProducts.has(product.id)} onCheckedChange={() => toggleSelect(product.id)} />
                        </TableCell>
                        <TableCell>
                          <button onClick={() => setExpandedProduct(isExpanded ? null : product.id)} className="p-1 rounded hover:bg-secondary transition-colors">
                            {isExpanded ? <HiOutlineChevronDown className="w-4 h-4" /> : <HiOutlineChevronRight className="w-4 h-4" />}
                          </button>
                        </TableCell>
                        <TableCell className="font-medium text-sm" onClick={() => setExpandedProduct(isExpanded ? null : product.id)}>{productName}</TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{product.categorization_data?.primary_category ?? '--'}</TableCell>
                        <TableCell className="text-sm">{getAttributeCount(product)}</TableCell>
                        <TableCell>
                          {product.seo_data?.seo_score != null ? (
                            <span className={cn("text-sm font-semibold", getSeoScoreColor(product.seo_data.seo_score))}>
                              {product.seo_data.seo_score}
                            </span>
                          ) : '--'}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0 border-0">
                            <ProductDetailTabs product={product} onEdit={handleEdit} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Job History Screen
// ============================================================
function HistoryScreen({ jobs, setActiveScreen, setCurrentJob, setEnrichedProducts, sampleDataOn }: {
  jobs: Job[]
  setActiveScreen: (s: ScreenType) => void
  setCurrentJob: (j: Job) => void
  setEnrichedProducts: (p: EnrichedProduct[]) => void
  sampleDataOn: boolean
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const displayJobs = sampleDataOn && jobs.length === 0 ? generateSampleJobs() : jobs

  const filteredJobs = displayJobs.filter(job => {
    const matchesSearch = !searchQuery || job.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Job History</h2>
        <p className="text-sm text-muted-foreground mt-1">Search and manage past enrichment jobs</p>
      </div>

      <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                className="pl-9 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 rounded-xl">
                <HiOutlineFilter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md">
        <CardContent className="p-0">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <FiFileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No jobs found matching your criteria</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-sm">{job.name}</TableCell>
                    <TableCell className="text-sm">{job.productCount}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(job.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setCurrentJob(job)
                            setEnrichedProducts(job.products)
                            setActiveScreen('review')
                          }}
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <HiOutlineDownload className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Settings Screen
// ============================================================
function SettingsScreen() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure your enrichment platform preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Default Enrichment Options</CardTitle>
            <CardDescription>Set default enrichment modules for new jobs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Auto-generate descriptions</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Auto-categorize products</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Extract attributes</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Generate SEO content</Label>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Export Preferences</CardTitle>
            <CardDescription>Configure default export settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Default Export Format</Label>
              <Select defaultValue="csv">
                <SelectTrigger className="mt-2 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Default Brand Tone</Label>
              <Textarea placeholder="Professional and compelling..." className="mt-2 rounded-xl" rows={3} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Agent Status</CardTitle>
          <CardDescription>AI agents powering the enrichment platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'Enrichment Coordinator', purpose: 'Orchestrates all enrichment sub-agents', id: ENRICHMENT_COORDINATOR_ID },
              { name: 'Description Agent', purpose: 'Generates product titles & descriptions', id: 'sub-agent' },
              { name: 'Categorization Agent', purpose: 'Auto-categorizes with taxonomy paths', id: 'sub-agent' },
              { name: 'Attribute Agent', purpose: 'Extracts physical & technical attributes', id: 'sub-agent' },
              { name: 'SEO Agent', purpose: 'Creates meta tags, FAQ, structured markup', id: 'sub-agent' },
              { name: 'Export Agent', purpose: 'Formats data for CSV/JSON download', id: EXPORT_AGENT_ID },
            ].map((agent) => (
              <div key={agent.name} className="p-3 bg-secondary/50 rounded-xl flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Agent Status Footer
// ============================================================
function AgentStatusFooter({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: ENRICHMENT_COORDINATOR_ID, name: 'Enrichment Coordinator' },
    { id: EXPORT_AGENT_ID, name: 'Export Agent' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-white/80 backdrop-blur-sm border-t border-border/50 flex items-center px-4 gap-4 text-xs z-50">
      <span className="text-muted-foreground font-medium">Agents:</span>
      {agents.map((agent) => (
        <div key={agent.id} className="flex items-center gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full", activeAgentId === agent.id ? "bg-blue-500 animate-pulse" : "bg-green-500")} />
          <span className={cn("text-muted-foreground", activeAgentId === agent.id && "text-blue-600 font-medium")}>{agent.name}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Main Page Component
// ============================================================
export default function Page() {
  // Navigation
  const [activeScreen, setActiveScreen] = useState<ScreenType>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sampleDataOn, setSampleDataOn] = useState(false)

  // Jobs
  const [jobs, setJobs] = useState<Job[]>([])
  const [currentJob, setCurrentJob] = useState<Job | null>(null)

  // New Job
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedProducts, setParsedProducts] = useState<Record<string, string>[]>([])
  const [enrichmentConfig, setEnrichmentConfig] = useState({
    descriptions: true,
    categorization: true,
    attributes: true,
    seo: true,
    brandTone: '',
    taxonomyPreference: 'auto'
  })

  // Processing
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingCompleted, setProcessingCompleted] = useState(0)
  const [currentProcessingProduct, setCurrentProcessingProduct] = useState('')

  // Review
  const [enrichedProducts, setEnrichedProducts] = useState<EnrichedProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  // Export
  const [exportLoading, setExportLoading] = useState(false)

  // Agent tracking
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Status messages
  const [statusMessage, setStatusMessage] = useState('')

  // Screen title
  const screenTitle = useMemo(() => {
    switch (activeScreen) {
      case 'dashboard': return 'Dashboard'
      case 'new-job': return 'New Enrichment Job'
      case 'processing': return 'Processing'
      case 'review': return 'Review & Approve'
      case 'history': return 'Job History'
      case 'settings': return 'Settings'
      default: return 'Product Enrichment Platform'
    }
  }, [activeScreen])

  // ============================================================
  // Enrichment Flow
  // ============================================================
  const startEnrichment = useCallback(async () => {
    const productsToEnrich = parsedProducts.length > 0
      ? parsedProducts
      : (sampleDataOn ? [
          { name: 'Ergonomic Office Chair', sku: 'EOC-2024', price: '349.99', brand: 'ProComfort' },
          { name: 'Wireless Noise-Canceling Headphones', sku: 'WNC-500', price: '199.99', brand: 'SonicPure' },
          { name: 'Organic Green Tea Matcha', sku: 'OGT-100', price: '24.99', brand: 'ZenLeaf' },
        ] : [])

    if (productsToEnrich.length === 0) return

    setActiveScreen('processing')
    setProcessingProgress(0)
    setProcessingCompleted(0)
    setCurrentProcessingProduct('')
    setStatusMessage('')

    const jobId = Date.now().toString()
    const newJob: Job = {
      id: jobId,
      name: uploadedFile?.name || 'Sample Catalog',
      productCount: productsToEnrich.length,
      status: 'processing',
      date: new Date().toISOString(),
      products: []
    }
    setCurrentJob(newJob)

    const enriched: EnrichedProduct[] = []

    for (let i = 0; i < productsToEnrich.length; i++) {
      const product = productsToEnrich[i]
      const productName = product.name || product.product_name || Object.values(product)[0] || `Product ${i + 1}`
      setCurrentProcessingProduct(productName)
      setProcessingProgress(Math.round((i / productsToEnrich.length) * 100))
      setProcessingCompleted(i)

      const enabledTypes = Object.entries(enrichmentConfig)
        .filter(([k, v]) => v === true && ['descriptions', 'categorization', 'attributes', 'seo'].includes(k))
        .map(([k]) => k)

      const message = JSON.stringify({
        product_data: product,
        brand_tone: enrichmentConfig.brandTone || 'professional and compelling',
        enrichment_types: enabledTypes
      })

      try {
        setActiveAgentId(ENRICHMENT_COORDINATOR_ID)
        const result = await callAIAgent(message, ENRICHMENT_COORDINATOR_ID)

        if (result.success) {
          const data = result?.response?.result
          enriched.push({
            id: `product-${i}-${Date.now()}`,
            originalData: product,
            status: 'enriched',
            product_name: data?.product_name ?? productName,
            enrichment_status: data?.enrichment_status ?? 'complete',
            description_data: data?.description_data,
            categorization_data: data?.categorization_data,
            attribute_data: data?.attribute_data,
            seo_data: data?.seo_data
          })
        } else {
          enriched.push({
            id: `product-${i}-${Date.now()}`,
            originalData: product,
            status: 'failed'
          })
        }
      } catch {
        enriched.push({
          id: `product-${i}-${Date.now()}`,
          originalData: product,
          status: 'failed'
        })
      }
    }

    setActiveAgentId(null)
    setProcessingProgress(100)
    setProcessingCompleted(productsToEnrich.length)
    setCurrentProcessingProduct('')

    const completedJob: Job = {
      ...newJob,
      status: enriched.some(p => p.status === 'failed')
        ? (enriched.every(p => p.status === 'failed') ? 'failed' : 'partial')
        : 'completed',
      products: enriched
    }
    setCurrentJob(completedJob)
    setEnrichedProducts(enriched)
    setJobs(prev => [completedJob, ...prev])
    setStatusMessage(`Enrichment complete: ${enriched.filter(p => p.status === 'enriched').length} of ${enriched.length} products enriched successfully.`)

    setTimeout(() => {
      setActiveScreen('review')
      setStatusMessage('')
    }, 1500)
  }, [parsedProducts, sampleDataOn, uploadedFile, enrichmentConfig])

  // ============================================================
  // Export Flow
  // ============================================================
  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    const productsToExport = enrichedProducts.filter(p => selectedProducts.has(p.id) || p.status === 'approved')
    if (productsToExport.length === 0) return

    setExportLoading(true)
    setActiveAgentId(EXPORT_AGENT_ID)

    try {
      const exportMessage = JSON.stringify({
        approved_products: productsToExport.map(p => ({
          product_name: p.product_name || p.description_data?.product_title || Object.values(p.originalData)[0] || '',
          description_data: p.description_data,
          categorization_data: p.categorization_data,
          attribute_data: p.attribute_data,
          seo_data: p.seo_data
        }))
      })
      await callAIAgent(exportMessage, EXPORT_AGENT_ID)
    } catch {
      // Export agent call is best-effort; we still do the client-side export
    }

    setActiveAgentId(null)

    // Client-side export
    if (format === 'json') {
      const jsonData = productsToExport.map(p => ({
        original: p.originalData,
        enriched: {
          product_name: p.product_name,
          description: p.description_data,
          categorization: p.categorization_data,
          attributes: p.attribute_data,
          seo: p.seo_data
        }
      }))
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `enriched-products-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const headers = ['Product Name', 'Title', 'Short Description', 'Category', 'Tags', 'Color', 'Material', 'Meta Title', 'Meta Description', 'SEO Score']
      const rows = productsToExport.map(p => [
        p.product_name || p.description_data?.product_title || Object.values(p.originalData)[0] || '',
        p.description_data?.product_title || '',
        p.description_data?.short_description || '',
        p.categorization_data?.primary_category || '',
        Array.isArray(p.categorization_data?.tags) ? p.categorization_data.tags.join('; ') : '',
        p.attribute_data?.physical_attributes?.color || '',
        p.attribute_data?.physical_attributes?.material || '',
        p.seo_data?.meta_title || '',
        p.seo_data?.meta_description || '',
        p.seo_data?.seo_score?.toString() || ''
      ])
      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `enriched-products-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }

    setExportLoading(false)
    setStatusMessage(`Export complete! ${productsToExport.length} products exported as ${format.toUpperCase()}.`)
    setTimeout(() => setStatusMessage(''), 4000)
  }, [enrichedProducts, selectedProducts])

  // ============================================================
  // Render active screen
  // ============================================================
  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen jobs={jobs} setActiveScreen={setActiveScreen} setCurrentJob={setCurrentJob} setEnrichedProducts={setEnrichedProducts} sampleDataOn={sampleDataOn} />
      case 'new-job':
        return <NewJobScreen uploadedFile={uploadedFile} setUploadedFile={setUploadedFile} parsedProducts={parsedProducts} setParsedProducts={setParsedProducts} enrichmentConfig={enrichmentConfig} setEnrichmentConfig={setEnrichmentConfig} onStartEnrichment={startEnrichment} sampleDataOn={sampleDataOn} />
      case 'processing':
        return <ProcessingScreen progress={processingProgress} total={parsedProducts.length > 0 ? parsedProducts.length : 3} completed={processingCompleted} currentProduct={currentProcessingProduct} />
      case 'review':
        return <ReviewScreen enrichedProducts={sampleDataOn && enrichedProducts.length === 0 ? generateSampleProducts() : enrichedProducts} setEnrichedProducts={setEnrichedProducts} selectedProducts={selectedProducts} setSelectedProducts={setSelectedProducts} expandedProduct={expandedProduct} setExpandedProduct={setExpandedProduct} onExport={handleExport} exportLoading={exportLoading} activeAgentId={activeAgentId} />
      case 'history':
        return <HistoryScreen jobs={jobs} setActiveScreen={setActiveScreen} setCurrentJob={setCurrentJob} setEnrichedProducts={setEnrichedProducts} sampleDataOn={sampleDataOn} />
      case 'settings':
        return <SettingsScreen />
      default:
        return <DashboardScreen jobs={jobs} setActiveScreen={setActiveScreen} setCurrentJob={setCurrentJob} setEnrichedProducts={setEnrichedProducts} sampleDataOn={sampleDataOn} />
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[hsl(160,40%,94%)] via-[hsl(180,35%,93%)] to-[hsl(140,40%,94%)] text-foreground">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <AppHeader title={screenTitle} sampleDataOn={sampleDataOn} setSampleDataOn={setSampleDataOn} />

            <main className="flex-1 overflow-y-auto pb-10">
              {renderScreen()}
            </main>

            {/* Status Message Bar */}
            {statusMessage && (
              <div className="px-6 py-2 bg-primary/10 border-t border-primary/20">
                <div className="flex items-center gap-2">
                  <BsCheckCircleFill className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-sm text-foreground">{statusMessage}</p>
                  <button onClick={() => setStatusMessage('')} className="ml-auto p-1 rounded hover:bg-primary/10">
                    <HiOutlineX className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Agent Status Footer */}
        <AgentStatusFooter activeAgentId={activeAgentId} />
      </div>
    </ErrorBoundary>
  )
}
