import React from 'react'

export interface RadarDataset {
  data: {
    vit: number
    tir: number
    pas: number
    dri: number
    def: number
    phy: number
  }
  color: string
  label: string
}

interface RadarChartProps {
  data?: RadarDataset['data'] // Backward compatibility
  color?: string // Backward compatibility
  datasets?: RadarDataset[]
  size?: number
}

const RadarChart: React.FC<RadarChartProps> = ({ 
  data, 
  color = '#10b981', 
  datasets, 
  size = 180 
}) => {
  const center = size / 2
  const radius = (size / 2) * 0.8
  
  const labels = ['VIT', 'TIR', 'PAS', 'DRI', 'DEF', 'PHY']
  
  // Normalize datasets
  const activeDatasets: RadarDataset[] = datasets ?? (data ? [{ data, color, label: 'Default' }] : [])
  
  const renderPolygon = (dataset: RadarDataset, i: number) => {
    const points: { x: number; y: number }[] = []
    const d = dataset.data
    const stats = [d.vit, d.tir, d.pas, d.dri, d.def, d.phy]
    
    stats.forEach((val, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
      const r = (val / 100) * radius
      points.push({
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      })
    })
    
    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')
    return (
      <g key={i}>
        <polygon 
          points={polygonPoints} 
          fill={dataset.color} 
          fillOpacity="0.25" 
          stroke={dataset.color} 
          strokeWidth="2.5" 
          strokeLinejoin="round"
          className="transition-all duration-700 ease-out"
        />
        {/* Glowing dots at vertices */}
        {points.map((p, j) => (
           <circle key={j} cx={p.x} cy={p.y} r="3" fill={dataset.color} className="shadow-lg" />
        ))}
      </g>
    )
  }
  
  // Generate background rings (Spider web)
  const rings = [0.2, 0.4, 0.6, 0.8, 1].map(scale => {
    const r = radius * scale
    const rPoints: string[] = []
    for(let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
        rPoints.push(`${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`)
    }
    return rPoints.join(' ')
  })
  
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible drop-shadow-2xl">
        {/* Background rings */}
        {rings.map((r, i) => (
          <polygon key={i} points={r} fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />
        ))}
        
        {/* Axis lines */}
        {labels.map((_, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
          return (
            <line 
                key={i} 
                x1={center} y1={center} 
                x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)} 
                stroke="white" strokeWidth="0.5" strokeOpacity="0.1" 
            />
          )
        })}
        
        {/* Render each dataset */}
        {activeDatasets.map((ds, i) => renderPolygon(ds, i))}
        
        {/* Labels */}
        {labels.map((label, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
          const labelR = radius + 22
          const lx = center + labelR * Math.cos(angle)
          const ly = center + labelR * Math.sin(angle)
          return (
            <text 
                key={label} 
                x={lx} y={ly} 
                fontSize="11" fontWeight="900" fill="#9ca3af" 
                textAnchor="middle" alignmentBaseline="middle"
                className="uppercase tracking-tighter filter drop-shadow-md"
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export default RadarChart
