'use client'

import React, { useState, useCallback, useRef, useMemo } from 'react'
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
  description_data?: {
    product_title: string
    short_description: string
    long_description: string
    selling_points: string[]
  }
  categorization_data?: {
    primary_category: string
    taxonomy_path: string
    secondary_categories: string[]
    tags: string[]
    product_type: string
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
  }
  seo_data?: {
    meta_title: string
    meta_description: string
    faq_content: { question: string; answer: string }[]
    json_ld_markup: string
    rich_snippet_content: string
    seo_score: number
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
      originalData: { name: 'Ergonomic Office Chair', sku: 'EOC-2024', price: '349.99' },
      status: 'enriched',
      product_name: 'Ergonomic Office Chair',
      enrichment_status: 'complete',
      description_data: {
        product_title: 'ProComfort Ergonomic Office Chair with Lumbar Support',
        short_description: 'Premium ergonomic chair with adjustable lumbar support, breathable mesh back, and 4D armrests for all-day comfort.',
        long_description: 'The ProComfort Ergonomic Office Chair is engineered for professionals who demand comfort during long work sessions. Featuring a contoured mesh backrest that promotes airflow, adjustable lumbar support that conforms to your spine, and 4D armrests that adapt to your preferred position. The chair includes a synchronized tilt mechanism with tension control and a waterfall seat edge to reduce pressure on your thighs.',
        selling_points: ['Adjustable lumbar support system', 'Breathable mesh back design', '4D adjustable armrests', 'Synchronized tilt mechanism', '5-year warranty included']
      },
      categorization_data: {
        primary_category: 'Office Furniture',
        taxonomy_path: 'Home & Garden > Furniture > Office Furniture > Office Chairs',
        secondary_categories: ['Ergonomic Chairs', 'Desk Chairs'],
        tags: ['ergonomic', 'office chair', 'lumbar support', 'mesh chair', 'adjustable', 'work from home'],
        product_type: 'Task Chair'
      },
      attribute_data: {
        physical_attributes: { dimensions: '27.5" W x 27" D x 44-48" H', weight: '42 lbs', size: 'Standard', color: 'Matte Black', material: 'Mesh & Nylon' },
        technical_specs: [{ key: 'Weight Capacity', value: '300 lbs' }, { key: 'Seat Height Range', value: '17" - 21"' }, { key: 'Tilt Range', value: '90-120 degrees' }],
        variant_attributes: [{ attribute: 'Color', options: ['Matte Black', 'Graphite Gray', 'Navy Blue'] }, { attribute: 'Headrest', options: ['With Headrest', 'Without Headrest'] }],
        additional_attributes: [{ key: 'Assembly Required', value: 'Yes' }, { key: 'Caster Type', value: 'Dual-wheel carpet casters' }]
      },
      seo_data: {
        meta_title: 'Ergonomic Office Chair with Lumbar Support | ProComfort',
        meta_description: 'Shop the ProComfort Ergonomic Office Chair featuring adjustable lumbar support, breathable mesh, and 4D armrests. Free shipping on orders over $299.',
        faq_content: [{ question: 'What is the weight capacity?', answer: 'The ProComfort chair supports up to 300 lbs.' }, { question: 'Is assembly required?', answer: 'Yes, assembly typically takes 20-30 minutes with included tools.' }],
        json_ld_markup: '{"@context":"https://schema.org","@type":"Product","name":"ProComfort Ergonomic Office Chair"}',
        rich_snippet_content: 'ProComfort Ergonomic Office Chair - 4.7 stars, 1,249 reviews, $349.99',
        seo_score: 87
      }
    },
    {
      id: 'sample-2',
      originalData: { name: 'Wireless Noise-Canceling Headphones', sku: 'WNC-500', price: '199.99' },
      status: 'enriched',
      product_name: 'Wireless Noise-Canceling Headphones',
      enrichment_status: 'complete',
      description_data: {
        product_title: 'SonicPure ANC 500 Wireless Noise-Canceling Headphones',
        short_description: 'Premium wireless headphones with adaptive noise cancellation, 40-hour battery life, and Hi-Res Audio certification.',
        long_description: 'Experience immersive audio with the SonicPure ANC 500. These premium wireless headphones feature adaptive noise cancellation that adjusts to your environment, delivering crystal-clear sound whether you are in a busy office or on a plane. With 40 hours of battery life, multipoint Bluetooth 5.3 connectivity, and Hi-Res Audio support, these headphones set a new standard for wireless listening.',
        selling_points: ['Adaptive noise cancellation', '40-hour battery life', 'Hi-Res Audio certified', 'Multipoint Bluetooth 5.3', 'Foldable design with carry case']
      },
      categorization_data: {
        primary_category: 'Electronics',
        taxonomy_path: 'Electronics > Audio > Headphones > Over-Ear Headphones',
        secondary_categories: ['Noise-Canceling Headphones', 'Wireless Headphones'],
        tags: ['headphones', 'noise canceling', 'wireless', 'bluetooth', 'audio', 'ANC'],
        product_type: 'Over-Ear Headphones'
      },
      attribute_data: {
        physical_attributes: { dimensions: '7.5" x 6.5" x 3.2"', weight: '8.8 oz', size: 'One Size', color: 'Midnight Black', material: 'Premium Protein Leather & Aluminum' },
        technical_specs: [{ key: 'Driver Size', value: '40mm' }, { key: 'Frequency Response', value: '4Hz - 40kHz' }, { key: 'Bluetooth Version', value: '5.3' }],
        variant_attributes: [{ attribute: 'Color', options: ['Midnight Black', 'Silver Frost', 'Rose Gold'] }],
        additional_attributes: [{ key: 'Charging', value: 'USB-C, 5-min charge = 3 hours playback' }, { key: 'Codec Support', value: 'LDAC, AAC, SBC' }]
      },
      seo_data: {
        meta_title: 'SonicPure ANC 500 Wireless Noise-Canceling Headphones',
        meta_description: 'SonicPure ANC 500 - Premium wireless headphones with adaptive noise cancellation and 40-hour battery. Hi-Res Audio certified. Shop now.',
        faq_content: [{ question: 'How long does the battery last?', answer: 'Up to 40 hours with ANC on, 60 hours with ANC off.' }],
        json_ld_markup: '{"@context":"https://schema.org","@type":"Product","name":"SonicPure ANC 500"}',
        rich_snippet_content: 'SonicPure ANC 500 - 4.8 stars, 2,103 reviews, $199.99',
        seo_score: 92
      }
    },
    {
      id: 'sample-3',
      originalData: { name: 'Organic Green Tea Matcha', sku: 'OGT-100', price: '24.99' },
      status: 'enriched',
      product_name: 'Organic Green Tea Matcha',
      enrichment_status: 'complete',
      description_data: {
        product_title: 'Ceremonial Grade Organic Matcha Green Tea Powder',
        short_description: 'Premium Japanese ceremonial grade matcha, stone-ground from shade-grown leaves for a smooth, umami-rich flavor.',
        long_description: 'Sourced from the renowned Uji region of Kyoto, Japan, our Ceremonial Grade Matcha is stone-ground from first-harvest shade-grown tea leaves. The result is a vibrant emerald green powder with a naturally sweet, umami-rich flavor and creamy texture. Perfect for traditional tea ceremonies, lattes, and smoothies. USDA Certified Organic and tested for purity.',
        selling_points: ['Ceremonial grade from Uji, Kyoto', 'Stone-ground for fine texture', 'USDA Certified Organic', 'Rich in L-theanine and antioxidants', '30 servings per tin']
      },
      categorization_data: {
        primary_category: 'Food & Beverages',
        taxonomy_path: 'Food & Beverages > Tea > Green Tea > Matcha',
        secondary_categories: ['Organic Tea', 'Superfood Powders'],
        tags: ['matcha', 'green tea', 'organic', 'ceremonial grade', 'Japanese tea', 'superfood'],
        product_type: 'Tea Powder'
      },
      attribute_data: {
        physical_attributes: { dimensions: '3" x 3" x 4"', weight: '100g (3.5 oz)', size: '100g Tin', color: 'Emerald Green', material: 'N/A' },
        technical_specs: [{ key: 'Origin', value: 'Uji, Kyoto, Japan' }, { key: 'Caffeine', value: '~70mg per serving' }],
        variant_attributes: [{ attribute: 'Size', options: ['30g Starter', '100g Tin', '250g Bulk'] }],
        additional_attributes: [{ key: 'Certifications', value: 'USDA Organic, Non-GMO, Vegan' }, { key: 'Shelf Life', value: '12 months from production' }]
      },
      seo_data: {
        meta_title: 'Ceremonial Grade Organic Matcha - Premium Japanese Green Tea',
        meta_description: 'Premium ceremonial grade matcha from Uji, Kyoto. Stone-ground, USDA organic, rich umami flavor. Perfect for lattes and traditional tea. Free shipping.',
        faq_content: [{ question: 'What makes ceremonial grade different?', answer: 'Ceremonial grade matcha uses only the youngest, most tender tea leaves from the first harvest, resulting in a sweeter, more vibrant flavor.' }],
        json_ld_markup: '{"@context":"https://schema.org","@type":"Product","name":"Ceremonial Grade Organic Matcha"}',
        rich_snippet_content: 'Organic Matcha - 4.9 stars, 856 reviews, $24.99',
        seo_score: 78
      }
    }
  ]
}

function generateSampleJobs(): Job[] {
  return [
    {
      id: 'job-sample-1',
      name: 'electronics_catalog.csv',
      productCount: 45,
      status: 'completed',
      date: '2026-02-18T14:30:00Z',
      products: generateSampleProducts()
    },
    {
      id: 'job-sample-2',
      name: 'spring_collection.json',
      productCount: 120,
      status: 'completed',
      date: '2026-02-15T09:15:00Z',
      products: []
    },
    {
      id: 'job-sample-3',
      name: 'kitchen_appliances.csv',
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
      return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Completed</Badge>
    case 'processing':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Processing</Badge>
    case 'failed':
      return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Failed</Badge>
    case 'partial':
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Partial</Badge>
    case 'enriched':
      return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Enriched</Badge>
    case 'edited':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Edited</Badge>
    case 'approved':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Approved</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
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
    { id: 'dashboard', label: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
    { id: 'new-job', label: 'New Job', icon: <HiOutlinePlus className="w-5 h-5" /> },
    { id: 'history', label: 'Job History', icon: <FiFileText className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <FiSettings className="w-5 h-5" /> },
  ]

  return (
    <div className={cn("h-screen flex flex-col border-r border-border/50 backdrop-blur-md bg-white/75 transition-all duration-300", collapsed ? "w-16" : "w-60")}>
      <div className="p-4 flex items-center gap-3 border-b border-border/50">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <FiBox className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight text-foreground truncate">Product Enrichment</span>
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
          <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Sample Data</Label>
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
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Overview of your product enrichment activity</p>
        </div>
        <Button onClick={() => setActiveScreen('new-job')} className="gap-2 rounded-xl">
          <HiOutlinePlus className="w-4 h-4" />
          New Enrichment Job
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<FiPackage className="w-5 h-5" />} label="Total Products" value={totalProducts} subtext="Across all jobs" />
        <MetricCard icon={<BsArrowRepeat className="w-5 h-5" />} label="Active Jobs" value={activeJobs} subtext="Currently processing" />
        <MetricCard icon={<FiTrendingUp className="w-5 h-5" />} label="Completion Rate" value={`${completionRate}%`} subtext={`${completedJobs} of ${displayJobs.length} jobs`} />
        <MetricCard icon={<HiOutlineClock className="w-5 h-5" />} label="Avg Processing" value={displayJobs.length > 0 ? '~2.3s/product' : '--'} subtext="Per product" />
      </div>

      <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Jobs</CardTitle>
          <CardDescription>Your latest enrichment runs</CardDescription>
        </CardHeader>
        <CardContent>
          {displayJobs.length === 0 ? (
            <div className="text-center py-16">
              <FiDatabase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No enrichment jobs yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">Upload your first product catalog to get started with AI-powered product enrichment.</p>
              <Button onClick={() => setActiveScreen('new-job')} className="gap-2 rounded-xl">
                <HiOutlineUpload className="w-4 h-4" />
                Upload Catalog
              </Button>
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
                {displayJobs.map((job) => (
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
        { name: 'Ergonomic Office Chair', sku: 'EOC-2024', price: '349.99', brand: 'ProComfort' },
        { name: 'Wireless Noise-Canceling Headphones', sku: 'WNC-500', price: '199.99', brand: 'SonicPure' },
        { name: 'Organic Green Tea Matcha', sku: 'OGT-100', price: '24.99', brand: 'ZenLeaf' },
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
        <h2 className="text-2xl font-bold tracking-tight">New Enrichment Job</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload your product catalog and configure enrichment options</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload */}
        <div className="space-y-4">
          <Card className="backdrop-blur-md bg-white/75 border-white/20 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HiOutlineUpload className="w-4 h-4 text-primary" />
                Upload Catalog
              </CardTitle>
              <CardDescription>Drag and drop a CSV or JSON file</CardDescription>
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
                  {uploadedFile ? uploadedFile.name : 'Drop your file here or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground">Supports CSV and JSON files</p>
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
                  File Preview
                </CardTitle>
                <CardDescription>{displayProducts.length} products detected across {columns.length} columns</CardDescription>
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
                Enrichment Configuration
              </CardTitle>
              <CardDescription>Select which enrichment modules to apply</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <HiOutlinePencil className="w-4 h-4 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">Descriptions</Label>
                      <p className="text-xs text-muted-foreground">Generate product titles, short & long descriptions</p>
                    </div>
                  </div>
                  <Switch checked={enrichmentConfig.descriptions} onCheckedChange={(v) => setEnrichmentConfig(prev => ({ ...prev, descriptions: v }))} />
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <HiOutlineTag className="w-4 h-4 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">Categorization</Label>
                      <p className="text-xs text-muted-foreground">Auto-categorize with taxonomy paths & tags</p>
                    </div>
                  </div>
                  <Switch checked={enrichmentConfig.categorization} onCheckedChange={(v) => setEnrichmentConfig(prev => ({ ...prev, categorization: v }))} />
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FiLayers className="w-4 h-4 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">Attributes</Label>
                      <p className="text-xs text-muted-foreground">Extract physical, technical & variant attributes</p>
                    </div>
                  </div>
                  <Switch checked={enrichmentConfig.attributes} onCheckedChange={(v) => setEnrichmentConfig(prev => ({ ...prev, attributes: v }))} />
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FiTrendingUp className="w-4 h-4 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">SEO / AEO / GEO</Label>
                      <p className="text-xs text-muted-foreground">Meta tags, FAQ content, structured markup</p>
                    </div>
                  </div>
                  <Switch checked={enrichmentConfig.seo} onCheckedChange={(v) => setEnrichmentConfig(prev => ({ ...prev, seo: v }))} />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Brand Tone & Voice</Label>
                  <Textarea
                    placeholder="e.g., Professional and compelling, with a focus on quality craftsmanship..."
                    className="mt-2 rounded-xl"
                    rows={3}
                    value={enrichmentConfig.brandTone}
                    onChange={(e) => setEnrichmentConfig(prev => ({ ...prev, brandTone: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Category Taxonomy</Label>
                  <Select value={enrichmentConfig.taxonomyPreference} onValueChange={(v) => setEnrichmentConfig(prev => ({ ...prev, taxonomyPreference: v }))}>
                    <SelectTrigger className="mt-2 rounded-xl">
                      <SelectValue placeholder="Select taxonomy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="google">Google Product Taxonomy</SelectItem>
                      <SelectItem value="facebook">Facebook Commerce Taxonomy</SelectItem>
                      <SelectItem value="custom">Custom Taxonomy</SelectItem>
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
                Enrich Products
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
            <h2 className="text-xl font-bold tracking-tight">Enriching Products</h2>
            <p className="text-sm text-muted-foreground mt-1">AI agents are processing your catalog</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completed} of {total} products</span>
              <span>~{Math.max(0, (total - completed) * 3)}s remaining</span>
            </div>
          </div>

          {currentProduct && (
            <div className="p-3 bg-secondary/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Currently processing</p>
              <p className="text-sm font-medium mt-0.5 truncate">{currentProduct}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            {['Description', 'Category', 'Attributes', 'SEO'].map((agent) => (
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
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground font-semibold">Physical Attributes</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {product.attribute_data?.physical_attributes && Object.entries(product.attribute_data.physical_attributes).map(([key, val]) => (
                <div key={key} className="p-3 bg-white/50 rounded-lg">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{key}</p>
                  <p className="text-sm font-medium mt-0.5">{val || '--'}</p>
                </div>
              ))}
            </div>
          </div>
          {Array.isArray(product.attribute_data?.technical_specs) && product.attribute_data.technical_specs.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground font-semibold">Technical Specs</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Spec</TableHead>
                    <TableHead className="text-xs">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.attribute_data.technical_specs.map((spec, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium">{spec?.key ?? ''}</TableCell>
                      <TableCell className="text-xs">{spec?.value ?? ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {Array.isArray(product.attribute_data?.variant_attributes) && product.attribute_data.variant_attributes.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground font-semibold">Variant Attributes</Label>
              <div className="space-y-2">
                {product.attribute_data.variant_attributes.map((variant, i) => (
                  <div key={i} className="p-3 bg-white/50 rounded-lg">
                    <p className="text-xs font-medium mb-1">{variant?.attribute ?? ''}</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(variant?.options) && variant.options.map((opt, j) => (
                        <Badge key={j} variant="outline" className="text-[10px]">{opt}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(product.attribute_data?.additional_attributes) && product.attribute_data.additional_attributes.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground font-semibold">Additional Attributes</Label>
              <div className="grid grid-cols-2 gap-2">
                {product.attribute_data.additional_attributes.map((attr, i) => (
                  <div key={i} className="p-2 bg-white/50 rounded-lg">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{attr?.key ?? ''}</p>
                    <p className="text-xs font-medium mt-0.5">{attr?.value ?? ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
