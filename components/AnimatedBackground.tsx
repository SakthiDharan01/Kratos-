"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"

export default function AnimatedBackground() {
  const mountRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const frameRef = useRef<number>()
  const animationRef = useRef<NodeJS.Timeout>()
  const [isMobile, setIsMobile] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Intersection Observer for performance
  const observerRef = useRef<IntersectionObserver>()

  const handleVisibilityChange = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    setIsVisible(entry.isIntersecting)
  }, [])

  useEffect(() => {
    // Detect mobile device
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile, { passive: true })

    // Set up intersection observer
    observerRef.current = new IntersectionObserver(handleVisibilityChange, {
      threshold: 0.1,
    })

    if (mountRef.current) {
      observerRef.current.observe(mountRef.current)
    }

    // Setup Matrix rain canvas
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Setting the width and height of the canvas
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Setting up the letters
    const lettersString = 'ABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZ'
    const letters = lettersString.split('')

    // Setting up the columns
    const fontSize = isMobile ? 12 : 50
    const columns = canvas.width / fontSize

    // Setting up the drops
    const drops: number[] = []
    for (let i = 0; i < columns; i++) {
      drops[i] = 1
    }

    // Setting up the draw function
    const draw = () => {
      if (!isVisible) return

      ctx.fillStyle = 'rgba(0, 0, 0, .1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
             for (let i = 0; i < drops.length; i++) {
         const text = letters[Math.floor(Math.random() * letters.length)]
         ctx.fillStyle ='rgb(39, 0, 0)'
         ctx.font = `${fontSize}px monospace`
         ctx.fillText(text, i * fontSize, drops[i] * fontSize)
        drops[i]++
        if (drops[i] * fontSize > canvas.height && Math.random() > .95) {
          drops[i] = 0
        }
      }
    }

    // Start the Matrix rain animation
    const startMatrixRain = () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
      animationRef.current = setInterval(draw, 33)
    }

    startMatrixRain()

    // Handle resize for canvas
    const handleCanvasResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      // Recalculate columns and drops for new size
      const newColumns = canvas.width / fontSize
      const newDrops: number[] = []
      for (let i = 0; i < newColumns; i++) {
        newDrops[i] = 1
      }
      drops.length = 0
      drops.push(...newDrops)
    }

    window.addEventListener("resize", handleCanvasResize, { passive: true })

    if (!mountRef.current) return

    // Scene setup with optimizations
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: isMobile ? "low-power" : "high-performance",
      stencil: false,
      depth: true,
    })
    rendererRef.current = renderer

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2))

    // Enable proper depth testing and disable sorting for cleaner wireframes
    renderer.sortObjects = false

    mountRef.current.appendChild(renderer.domElement)

    // Create a single torus knot with smoother curves
    const torusKnotGeometry = new THREE.TorusKnotGeometry(60, 10, 64, 10, 3, 4)
    const torusKnotMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000, // Bright red
      wireframe: true,
      transparent: true,
      opacity: isMobile ? 0.2 : 0.09,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    
    const torusKnotMesh = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial)
    
    // Position the torus knot in the center
    torusKnotMesh.position.set(0, 0, -20)
    scene.add(torusKnotMesh)
    
    // Store references for animation
    const allMeshes = [torusKnotMesh]

    camera.position.z = isMobile ? 30 : 35

    // Optimized animation loop
    let lastTime = 0
    const targetFPS = isMobile ? 30 : 60
    const frameInterval = 500 / targetFPS

    const animate = (currentTime: number) => {
      frameRef.current = requestAnimationFrame(animate)

      // Throttle animation based on visibility and FPS
      if (!isVisible || currentTime - lastTime < frameInterval) {
        return
      }

      lastTime = currentTime

            // Animate all meshes
      allMeshes.forEach((mesh, index) => {
        if (!mesh) return
        const rotationSpeed = isMobile ? 0.002 : 0.003
        mesh.rotation.x += rotationSpeed + index * 0.0005
        mesh.rotation.y += rotationSpeed + 0.001 + index * 0.0008
        mesh.rotation.z += rotationSpeed - 0.0005 + index * 0.0003

        // Enhanced floating motion
        if (!isMobile) {
          mesh.position.y += Math.sin(currentTime * 0.0008 + index) * 0.003
          mesh.position.x += Math.cos(currentTime * 0.0006 + index) * 0.002
        }
      })

      renderer.render(scene, camera)
    }
    animate(0)

    // Optimized resize handler
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        if (!camera || !renderer) return

        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2))
      }, 100)
    }

    window.addEventListener("resize", handleResize, { passive: true })

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("resize", handleCanvasResize)
      window.removeEventListener("resize", checkIfMobile)
      clearTimeout(resizeTimeout)

      // Proper cleanup
      renderer.dispose()
      allMeshes.forEach((mesh) => {
        if (!mesh) return
        mesh.geometry.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose())
        } else {
          mesh.material.dispose()
        }
      })
    }
  }, [isMobile, isVisible, handleVisibilityChange])

  return (
    <div ref={mountRef} className="fixed inset-0 pointer-events-none z-0">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: -1, filter: 'blur(0.5px)' }}
      />
    </div>
  )
}