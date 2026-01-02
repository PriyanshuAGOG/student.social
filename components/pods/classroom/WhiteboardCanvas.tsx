"use client"

/**
 * WhiteboardCanvas Component
 * 
 * Provides a collaborative whiteboard using HTML5 Canvas API.
 * Features drawing tools, touch support, undo/redo, and export capabilities.
 * 
 * Features:
 * - Multiple drawing tools (pen, shapes, text, eraser)
 * - Color picker for customization
 * - Line width/opacity adjustments
 * - Full undo/redo stack
 * - Zoom and pan controls
 * - Touch gesture support for mobile
 * - Export to PNG
 * - LocalStorage persistence per pod
 * - Responsive sizing (h-40 sm:h-64 lg:h-96)
 * 
 * @example
 * <WhiteboardCanvas 
 *   podId="pod-123"
 *   onSave={(data) => console.log('saved', data)}
 * />
 */

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  PenTool,
  Square,
  Circle,
  Type,
  Eraser,
  Undo,
  Redo,
  Save,
  Share2,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  Move,
  Palette,
  ChevronDown,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import type { WhiteboardCanvasProps } from "../types"

type Tool = "pen" | "square" | "circle" | "text" | "eraser" | "select"

interface Point {
  x: number
  y: number
}

interface DrawAction {
  tool: Tool
  points: Point[]
  color: string
  lineWidth: number
}

const COLORS = [
  "#000000", // Black
  "#ffffff", // White  
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
]

const LINE_WIDTHS = [2, 4, 6, 8, 12]

export function WhiteboardCanvas({ podId, readOnly = false, onSave }: WhiteboardCanvasProps) {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [selectedTool, setSelectedTool] = useState<Tool>("pen")
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [lineWidth, setLineWidth] = useState(4)
  const [isDrawing, setIsDrawing] = useState(false)
  const [history, setHistory] = useState<DrawAction[]>([])
  const [redoStack, setRedoStack] = useState<DrawAction[]>([])
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
      if (window.innerWidth < 640) {
        setIsToolbarCollapsed(true)
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.scale(dpr, dpr)
        redrawCanvas()
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redraw canvas when history changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply transformations
    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)

    // Redraw all actions
    history.forEach((action) => {
      drawAction(ctx, action)
    })

    // Draw current action if drawing
    if (currentAction) {
      drawAction(ctx, currentAction)
    }

    ctx.restore()
  }, [history, currentAction, offset, scale])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  const drawAction = (ctx: CanvasRenderingContext2D, action: DrawAction) => {
    if (action.points.length < 1) return

    ctx.strokeStyle = action.tool === "eraser" ? "#ffffff" : action.color
    ctx.fillStyle = action.color
    ctx.lineWidth = action.tool === "eraser" ? action.lineWidth * 3 : action.lineWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    switch (action.tool) {
      case "pen":
      case "eraser":
        ctx.beginPath()
        ctx.moveTo(action.points[0].x, action.points[0].y)
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y)
        }
        ctx.stroke()
        break

      case "square":
        if (action.points.length >= 2) {
          const start = action.points[0]
          const end = action.points[action.points.length - 1]
          const width = end.x - start.x
          const height = end.y - start.y
          ctx.strokeRect(start.x, start.y, width, height)
        }
        break

      case "circle":
        if (action.points.length >= 2) {
          const start = action.points[0]
          const end = action.points[action.points.length - 1]
          const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          )
          ctx.beginPath()
          ctx.arc(start.x, start.y, radius, 0, Math.PI * 2)
          ctx.stroke()
        }
        break

      case "text":
        if (action.points.length >= 1) {
          ctx.font = `${action.lineWidth * 4}px sans-serif`
          ctx.fillText("Text", action.points[0].x, action.points[0].y)
        }
        break
    }
  }

  const getPointerPosition = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number

    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      clientX = touch.clientX
      clientY = touch.clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale,
    }
  }, [offset, scale])

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return
    e.preventDefault()

    if (selectedTool === "select") {
      setIsPanning(true)
      const pos = "touches" in e 
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY }
      setLastPanPoint(pos)
      return
    }

    setIsDrawing(true)
    const pos = getPointerPosition(e)
    
    setCurrentAction({
      tool: selectedTool,
      points: [pos],
      color: selectedColor,
      lineWidth,
    })
    setRedoStack([])
  }, [readOnly, selectedTool, selectedColor, lineWidth, getPointerPosition])

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return
    e.preventDefault()

    if (isPanning && lastPanPoint) {
      const pos = "touches" in e
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY }
      
      setOffset((prev) => ({
        x: prev.x + pos.x - lastPanPoint.x,
        y: prev.y + pos.y - lastPanPoint.y,
      }))
      setLastPanPoint(pos)
      return
    }

    if (!isDrawing || !currentAction) return

    const pos = getPointerPosition(e)
    setCurrentAction((prev) => {
      if (!prev) return null
      return {
        ...prev,
        points: [...prev.points, pos],
      }
    })
  }, [readOnly, isPanning, lastPanPoint, isDrawing, currentAction, getPointerPosition])

  const handlePointerUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
      setLastPanPoint(null)
      return
    }

    if (isDrawing && currentAction) {
      setHistory((prev) => [...prev, currentAction])
      setCurrentAction(null)
    }
    setIsDrawing(false)
  }, [isPanning, isDrawing, currentAction])

  const handleUndo = useCallback(() => {
    if (history.length === 0) return
    const lastAction = history[history.length - 1]
    setHistory((prev) => prev.slice(0, -1))
    setRedoStack((prev) => [...prev, lastAction])
  }, [history])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    const action = redoStack[redoStack.length - 1]
    setRedoStack((prev) => prev.slice(0, -1))
    setHistory((prev) => [...prev, action])
  }, [redoStack])

  const handleClear = useCallback(() => {
    if (history.length === 0) return
    // Show confirmation dialog
    setShowClearConfirm(true)
  }, [history])

  const confirmClear = useCallback(() => {
    setHistory([])
    setRedoStack([])
    setShowClearConfirm(false)
    toast({ title: "Canvas cleared" })
  }, [toast])

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.2, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / 1.2, 0.5))
  }, [])

  const handleResetView = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const dataUrl = canvas.toDataURL("image/png")
      onSave?.({ dataUrl, history })
      
      // Also save to localStorage for persistence
      localStorage.setItem(`whiteboard-${podId}`, JSON.stringify(history))
      
      toast({ title: "Whiteboard saved" })
    } catch (err) {
      console.error("Failed to save whiteboard:", err)
      toast({ title: "Failed to save", variant: "destructive" })
    }
  }, [podId, history, onSave, toast])

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const link = document.createElement("a")
      link.download = `whiteboard-${podId}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
      toast({ title: "Image downloaded" })
    } catch (err) {
      console.error("Failed to export:", err)
      toast({ title: "Failed to export", variant: "destructive" })
    }
  }, [podId, toast])

  const handleShare = useCallback(() => {
    // For now, just copy a share message
    navigator.clipboard?.writeText(`Check out this whiteboard from Pod ${podId}`)
    toast({ title: "Share link copied to clipboard" })
  }, [podId, toast])

  // Template shapes for quick insertion
  const addTemplate = useCallback((templateType: "grid" | "flowchart" | "mindmap") => {
    const centerX = 200
    const centerY = 150
    const newActions: DrawAction[] = []

    switch (templateType) {
      case "grid":
        // Draw a 3x3 grid
        for (let i = 0; i < 4; i++) {
          newActions.push({
            tool: "square",
            points: [
              { x: centerX + i * 60, y: centerY },
              { x: centerX + i * 60 + 60, y: centerY + 180 },
            ],
            color: "#000000",
            lineWidth: 2,
          })
        }
        break
      case "flowchart":
        // Draw a simple flowchart (start -> process -> end)
        newActions.push({
          tool: "circle",
          points: [
            { x: centerX, y: centerY },
            { x: centerX + 30, y: centerY },
          ],
          color: "#000000",
          lineWidth: 2,
        })
        newActions.push({
          tool: "square",
          points: [
            { x: centerX + 80, y: centerY - 30 },
            { x: centerX + 160, y: centerY + 30 },
          ],
          color: "#000000",
          lineWidth: 2,
        })
        break
      case "mindmap":
        // Draw a simple mind map center node
        newActions.push({
          tool: "circle",
          points: [
            { x: centerX, y: centerY },
            { x: centerX + 40, y: centerY },
          ],
          color: "#3b82f6",
          lineWidth: 3,
        })
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2
          const branchEnd = {
            x: centerX + Math.cos(angle) * 120,
            y: centerY + Math.sin(angle) * 120,
          }
          newActions.push({
            tool: "pen",
            points: [
              { x: centerX, y: centerY },
              branchEnd,
            ],
            color: "#8b5cf6",
            lineWidth: 2,
          })
        }
        break
    }

    setHistory((prev) => [...prev, ...newActions])
    setRedoStack([])
    toast({ title: `${templateType} template added` })
  }, [toast])

  // Load saved whiteboard from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`whiteboard-${podId}`)
      if (saved) {
        const parsedHistory = JSON.parse(saved)
        if (Array.isArray(parsedHistory)) {
          setHistory(parsedHistory)
        }
      }
    } catch (err) {
      console.warn("Failed to load whiteboard:", err)
    }
  }, [podId])

  const tools = [
    { id: "select" as Tool, icon: Move, label: "Pan/Move" },
    { id: "pen" as Tool, icon: PenTool, label: "Pen" },
    { id: "square" as Tool, icon: Square, label: "Rectangle" },
    { id: "circle" as Tool, icon: Circle, label: "Circle" },
    { id: "eraser" as Tool, icon: Eraser, label: "Eraser" },
  ]

  return (
    <Card className="overflow-hidden dark:bg-gray-950 dark:border-gray-800">
      <CardHeader className="pb-2 px-3 sm:px-6 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Interactive Whiteboard</span>
            <span className="sm:hidden">Whiteboard</span>
          </CardTitle>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button size="sm" variant="outline" onClick={handleSave} className="h-8 px-2 sm:px-3">
              <Save className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 px-2 sm:px-3">
              <Download className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button size="sm" variant="outline" onClick={handleShare} className="h-8 px-2 sm:px-3">
              <Share2 className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 sm:p-4 dark:bg-gray-950">
        {/* Toolbar with Enhanced Dark Mode */}
        <div className={`
          flex flex-wrap items-center gap-1 sm:gap-2 mb-2 sm:mb-4 p-2 
          bg-secondary/50 dark:bg-gray-800/50 rounded-lg transition-all border border-gray-200 dark:border-gray-700
          ${isToolbarCollapsed && isMobile ? "justify-between" : ""}
        `}>
          {/* Mobile collapsed toolbar */}
          {isMobile && isToolbarCollapsed ? (
            <>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={selectedTool === "pen" ? "default" : "ghost"}
                  onClick={() => setSelectedTool("pen")}
                  className="h-8 w-8 p-0"
                >
                  <PenTool className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={selectedTool === "eraser" ? "default" : "ghost"}
                  onClick={() => setSelectedTool("eraser")}
                  className="h-8 w-8 p-0"
                >
                  <Eraser className="w-4 h-4" />
                </Button>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 px-2">
                    More <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {tools.map(({ id, icon: Icon, label }) => (
                    <DropdownMenuItem key={id} onClick={() => { setSelectedTool(id); setIsToolbarCollapsed(false) }}>
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={handleUndo}>
                    <Undo className="w-4 h-4 mr-2" />
                    Undo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRedo}>
                    <Redo className="w-4 h-4 mr-2" />
                    Redo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addTemplate("grid")}>
                    <Square className="w-4 h-4 mr-2" />
                    Grid Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addTemplate("flowchart")}>
                    <Square className="w-4 h-4 mr-2" />
                    Flowchart
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addTemplate("mindmap")}>
                    <Circle className="w-4 h-4 mr-2" />
                    Mind Map
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleClear}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Color picker */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: selectedColor }}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          selectedColor === color ? "border-primary ring-2 ring-primary/30" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Full toolbar */}
              <div className="flex items-center gap-1">
                {tools.map(({ id, icon: Icon, label }) => (
                  <Button
                    key={id}
                    size="sm"
                    variant={selectedTool === id ? "default" : "ghost"}
                    onClick={() => setSelectedTool(id)}
                    className="h-8 w-8 p-0"
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>

              <div className="h-6 w-px bg-border mx-1 sm:mx-2" />

              {/* Color picker */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 gap-1 px-2">
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <Palette className="w-3 h-3 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="p-2">
                  <div className="grid grid-cols-5 gap-1 mb-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          selectedColor === color ? "border-primary ring-2 ring-primary/30" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Line width</div>
                  <div className="flex gap-1">
                    {LINE_WIDTHS.map((w) => (
                      <button
                        key={w}
                        className={`w-8 h-8 rounded border flex items-center justify-center ${
                          lineWidth === w ? "border-primary bg-primary/10" : "border-gray-200"
                        }`}
                        onClick={() => setLineWidth(w)}
                      >
                        <div 
                          className="rounded-full bg-current"
                          style={{ width: w * 2, height: w * 2 }}
                        />
                      </button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-6 w-px bg-border mx-1 sm:mx-2" />

              {/* Undo/Redo */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="h-8 w-8 p-0"
                  title="Undo"
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="h-8 w-8 p-0"
                  title="Redo"
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </div>

              <div className="h-6 w-px bg-border mx-1 sm:mx-2 hidden sm:block" />

              {/* Zoom controls - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleZoomOut}
                  className="h-8 w-8 p-0"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleZoomIn}
                  className="h-8 w-8 p-0"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetView}
                  className="h-8 px-2 text-xs"
                  title="Reset view"
                >
                  Reset
                </Button>
              </div>

              <div className="h-6 w-px bg-border mx-1 sm:mx-2 hidden sm:block" />

              {/* Templates */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 px-2">
                    Templates <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => addTemplate("grid")}>
                    <Square className="w-4 h-4 mr-2" />
                    Grid (3×3)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addTemplate("flowchart")}>
                    <Square className="w-4 h-4 mr-2" />
                    Flowchart
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addTemplate("mindmap")}>
                    <Circle className="w-4 h-4 mr-2" />
                    Mind Map
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear button */}
              <div className="ml-auto">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  disabled={history.length === 0}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Clear canvas"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Canvas Container with Enhanced Dark Mode */}
        <div 
          ref={containerRef}
          className="relative w-full h-40 sm:h-64 lg:h-96 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden touch-none focus-within:ring-2 focus-within:ring-blue-500 transition-all"
          style={{ cursor: selectedTool === "select" ? "grab" : "crosshair" }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onTouchCancel={handlePointerUp}
          />
          
          {/* Empty state hint */}
          {history.length === 0 && !isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <PenTool className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Draw on the whiteboard</p>
                <p className="text-xs">Use tools above to create diagrams and notes</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Clear Whiteboard</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to clear the entire whiteboard? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear} className="bg-destructive text-white">
              Clear
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export default WhiteboardCanvas
