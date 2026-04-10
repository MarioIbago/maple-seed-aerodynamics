import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ScatterChart, Scatter, BarChart, Bar, ResponsiveContainer 
} from 'recharts';
import { Wind, Ruler, Weight, Maximize, Play, RotateCcw, Download, FastForward, TableProperties, BarChart3, ScatterChart as ScatterIcon, Beaker, Activity, Share2 } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

const SamaraIcon = ({ className, width = 100, height = 100, x = 0, y = 0 }: any) => (
  <svg width={width} height={height} x={x} y={y} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.g
      initial={{ rotate: 0 }}
      animate={{ rotate: [0, 5, 0, -5, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
    >
      <path d="M50 50 C 50 20, 85 10, 100 30 C 105 40, 90 55, 65 55 C 55 55, 50 50, 50 50 Z" fill="#d97706" opacity="0.9"/>
      <path d="M55 48 Q 75 30 95 35" stroke="#b45309" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M60 52 Q 80 45 95 45" stroke="#b45309" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M57 42 Q 75 20 90 25" stroke="#b45309" strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="50" r="8" fill="#78350f" />
    </motion.g>
  </svg>
);

const ControlSlider = ({ label, icon: Icon, value, min, max, step, onChange, unit }: any) => (
  <div className="mb-6 group">
    <div className="flex justify-between items-center mb-2">
      <label className="flex items-center text-xs font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-colors">
        <Icon className="w-3.5 h-3.5 mr-2" />
        {label}
      </label>
      <span className="text-sm font-bold text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
        {value.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)}<span className="text-[10px] ml-0.5 opacity-70">{unit}</span>
      </span>
    </div>
    <div className="relative flex items-center">
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:bg-slate-300 transition-colors"
      />
    </div>
  </div>
);

export default function App() {
  // Estados de las variables manipulables
  const [height, setHeight] = useState(2);
  const [wind, setWind] = useState(2);
  const [mass, setMass] = useState(0.13);
  const [wing, setWing] = useState(4.3);
  const [attemptsCount, setAttemptsCount] = useState(10);
  
  // Estado de resultados y UI
  const [results, setResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('table');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [animProps, setAnimProps] = useState({ distance: 0, duration: 0 });

  // Lógica matemática de la simulación basada en datos experimentales
  const calculateSimulation = (h: number, v: number, m: number, a: number) => {
    const terminalVelocityBase = 13 * Math.sqrt(m) / a;
    const factor_aleatorio = 0.9 + Math.random() * 0.2;
    const terminalVelocity = terminalVelocityBase * factor_aleatorio;
    const tiempo_de_vuelo = h / terminalVelocity;
    const distancia = v * tiempo_de_vuelo;
    
    return {
      tiempo_de_vuelo,
      distancia: Number(distancia.toFixed(2))
    };
  };

  const triggerAnimation = (d: number, t: number) => {
    const visualDuration = Math.min(t, 4); // Limitar duración visual
    setAnimProps({ distance: d, duration: visualDuration });
    setAnimKey(prev => prev + 1);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), visualDuration * 1000);
  };

  const handleSimulateOne = () => {
    const { tiempo_de_vuelo, distancia } = calculateSimulation(height, wind, mass, wing);
    const newResult = { id: results.length + 1, height, wind, mass, wing, distance: distancia };
    setResults([...results, newResult]);
    triggerAnimation(distancia, tiempo_de_vuelo);
  };

  const handleSimulateMultiple = () => {
    const newResults = [];
    let lastDist = 0;
    let lastTime = 0;
    for (let i = 0; i < attemptsCount; i++) {
      const { tiempo_de_vuelo, distancia } = calculateSimulation(height, wind, mass, wing);
      newResults.push({ id: results.length + i + 1, height, wind, mass, wing, distance: distancia });
      lastDist = distancia;
      lastTime = tiempo_de_vuelo;
    }
    setResults([...results, ...newResults]);
    triggerAnimation(lastDist, lastTime);
  };

  const handleReset = () => {
    setResults([]);
    setAnimProps({ distance: 0, duration: 0 });
  };

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = ['Intento', 'Altura (m)', 'Viento (m/s)', 'Masa (g)', 'Ala (cm)', 'Distancia (m)'];
    const rows = results.map(r => [r.id, r.height, r.wind, r.mass, r.wing, r.distance]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "resultados_dispersion_semillas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preparar datos para gráficas
  const histogramData = useMemo(() => {
    if (results.length === 0) return [];
    const distances = results.map(r => r.distance);
    const min = Math.floor(Math.min(...distances));
    const max = Math.ceil(Math.max(...distances));
    const binSize = Math.max((max - min) / 8, 0.5);
    const bins: Record<string, number> = {};
    for (let i = 0; i < 8; i++) {
      const binStart = min + i * binSize;
      const binEnd = binStart + binSize;
      bins[`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`] = 0;
    }
    results.forEach(r => {
      const binIndex = Math.min(Math.floor((r.distance - min) / binSize), 7);
      const binStart = min + binIndex * binSize;
      const binEnd = binStart + binSize;
      bins[`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`]++;
    });
    return Object.keys(bins).map(key => ({ range: key, count: bins[key] }));
  }, [results]);

  const scatterHeightData = results.map(r => ({ x: r.height, y: r.distance }));

  // Coordenadas del Canvas SVG
  const maxX = Math.max(15, Math.ceil(Math.max(...results.map(r => r.distance), 0) / 5) * 5 + 5);
  const maxY = 5.5;
  const mapX = (x: number) => 80 + (x / maxX) * 880;
  const mapY = (y: number) => 400 - (y / maxY) * 350;
  const xTicks = Array.from({ length: Math.floor(maxX / 5) + 1 }, (_, i) => i * 5);
  const yTicks = Array.from({ length: 6 }, (_, i) => i);

  // Partículas de viento
  const windParticles = useMemo(() => Array.from({ length: Math.floor(wind * 4) }, (_, i) => ({
    id: i,
    y: Math.random() * 5,
    delay: Math.random() * 2,
    duration: 2 / Math.max(wind, 0.1)
  })), [wind]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 antialiased">
      {/* Header - Technical & Clean */}
      <header className="bg-white border-b-4 border-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">Simulador de Sámaras</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Lab. Dispersión</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">v2.0 Beta</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('¡Enlace copiado al portapapeles!');
              }}
              className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(99,102,241,1)] hover:translate-y-[-1px] hover:translate-x-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(99,102,241,1)] transition-all active:translate-y-[1px] active:translate-x-[1px] active:shadow-none"
            >
              <Share2 className="w-3 h-3 mr-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">Compartir</span>
            </button>
            <div className="flex items-center px-4 py-2 bg-slate-100 rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hidden sm:flex">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-3" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Motor de Física Activo</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Panel Izquierdo: Controles (Brutalist Modern) */}
          <div className="lg:col-span-3 space-y-4">
            <section className="bg-white p-5 rounded-none border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
              <h2 className="text-xs font-black text-slate-900 mb-6 uppercase tracking-[0.3em] flex items-center justify-between">
                <span>Variables</span>
                <Activity className="w-3 h-3 text-indigo-500" />
              </h2>
              
              <div className="space-y-1">
                <ControlSlider label="Altura" icon={Ruler} value={height} min={0.5} max={5} step={0.1} unit="m" onChange={setHeight} />
                <ControlSlider label="Viento" icon={Wind} value={wind} min={0} max={5} step={0.1} unit="m/s" onChange={setWind} />
                <ControlSlider label="Masa" icon={Weight} value={mass} min={0.01} max={0.40} step={0.01} unit="g" onChange={setMass} />
                <ControlSlider label="Ala" icon={Maximize} value={wing} min={2.0} max={7.0} step={0.1} unit="cm" onChange={setWing} />
              </div>

              <div className="mt-6 pt-6 border-t-2 border-slate-100">
                <ControlSlider label="Intentos" icon={FastForward} value={attemptsCount} min={1} max={30} step={1} unit="" onChange={setAttemptsCount} />
              </div>

              <div className="mt-6 space-y-3">
                <button 
                  onClick={handleSimulateOne}
                  disabled={isAnimating}
                  className="group w-full py-3 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 border-4 border-slate-900 font-black uppercase tracking-widest text-xs rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center"
                >
                  <Play className="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" /> Ejecutar Intento
                </button>
                <button 
                  onClick={handleSimulateMultiple}
                  disabled={isAnimating}
                  className="group w-full py-3 bg-sky-400 hover:bg-sky-300 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 border-4 border-slate-900 font-black uppercase tracking-widest text-xs rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center"
                >
                  <FastForward className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" /> Simular Lote
                </button>
                
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button 
                    onClick={handleReset}
                    className="py-2 bg-white hover:bg-rose-50 text-rose-600 border-2 border-slate-900 font-black uppercase tracking-widest text-[10px] rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-y-[1px] active:translate-x-[1px] active:shadow-none flex items-center justify-center"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                  </button>
                  <button 
                    onClick={exportCSV}
                    disabled={results.length === 0}
                    className="py-2 bg-white hover:bg-emerald-50 text-emerald-600 border-2 border-slate-900 disabled:opacity-50 font-black uppercase tracking-widest text-[10px] rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-y-[1px] active:translate-x-[1px] active:shadow-none flex items-center justify-center"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Exportar
                  </button>
                </div>
              </div>
            </section>
            
            <section className="bg-slate-900 p-5 rounded-none text-white border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(99,102,241,0.4)]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-indigo-400">Estadísticas Rápidas</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Semillas</span>
                  <span className="text-2xl font-black font-mono leading-none">{results.length}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Dist. Máxima</span>
                  <span className="text-lg font-black font-mono leading-none">
                    {results.length > 0 ? Math.max(...results.map(r => r.distance)).toFixed(1) : '0.0'}m
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Panel Central: Animación SVG (Technical & Realistic) */}
          <div className="lg:col-span-9 space-y-6">
            <div className="bg-white rounded-none border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-hidden flex flex-col">
              <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b-4 border-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Cámara de Simulación</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Wind className="w-3 h-3 text-sky-400" />
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Vector: {wind.toFixed(1)} m/s</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full h-[380px] bg-slate-50 relative overflow-hidden">
                <svg viewBox="0 0 1000 500" className="w-full h-full">
                  <defs>
                    <pattern id="grid-tech" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    </pattern>
                    <linearGradient id="ground-tech" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>
                  
                  <rect width="1000" height="500" fill="url(#grid-tech)" />
                  
                  {/* Grid Labels */}
                  {xTicks.map(x => (
                    <g key={`lx-${x}`}>
                      <line x1={mapX(x)} y1={mapY(0)} x2={mapX(x)} y2={mapY(0)+8} stroke="#94a3b8" strokeWidth="2" />
                      <text x={mapX(x)} y={mapY(0) + 24} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="900" className="font-mono">{x}m</text>
                    </g>
                  ))}
                  {yTicks.map(y => (
                    <g key={`ly-${y}`}>
                      <line x1={mapX(0)} y1={mapY(y)} x2={mapX(0)-8} y2={mapY(y)} stroke="#94a3b8" strokeWidth="2" />
                      <text x={mapX(0) - 16} y={mapY(y) + 4} textAnchor="end" fill="#64748b" fontSize="10" fontWeight="900" className="font-mono">{y}m</text>
                    </g>
                  ))}

                  {/* Ground (Brutalist Style) */}
                  <rect x="0" y={mapY(0)} width="1000" height={500 - mapY(0)} fill="url(#ground-tech)" />
                  <line x1="0" y1={mapY(0)} x2="1000" y2={mapY(0)} stroke="#0f172a" strokeWidth="4" />

                  {/* Wind Particles (Technical) */}
                  {wind > 0 && windParticles.map(p => (
                    <motion.line
                      key={`w-${p.id}`}
                      x1={mapX(0)} y1={mapY(p.y)} x2={mapX(1.2)} y2={mapY(p.y)}
                      stroke="#38bdf8" strokeWidth="2" strokeLinecap="square" opacity="0.4"
                      initial={{ x: -200 }}
                      animate={{ x: 1200 }}
                      transition={{ repeat: Infinity, duration: p.duration, delay: p.delay, ease: "linear" }}
                    />
                  ))}

                  {/* Tree (Brutalist & Realistic) */}
                  <g>
                    {/* Trunk */}
                    <rect x={mapX(-0.6)} y={mapY(5.5)} width="24" height={mapY(0) - mapY(5.5)} fill="#451a03" stroke="#000" strokeWidth="3" />
                    {/* Foliage */}
                    <circle cx={mapX(-0.5)} cy={mapY(5.5)} r="80" fill="#064e3b" stroke="#000" strokeWidth="3" />
                    <circle cx={mapX(-0.2)} cy={mapY(5.2)} r="60" fill="#065f46" stroke="#000" strokeWidth="2" />
                    <circle cx={mapX(-0.8)} cy={mapY(4.8)} r="65" fill="#047857" stroke="#000" strokeWidth="2" />
                    {/* Branch */}
                    <path d={`M ${mapX(-0.4)} ${mapY(height)} L ${mapX(0.5)} ${mapY(height)}`} stroke="#451a03" strokeWidth="6" strokeLinecap="round" />
                    <path d={`M ${mapX(-0.4)} ${mapY(height)} L ${mapX(0.5)} ${mapY(height)}`} stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </g>

                  {/* Fallen Seeds */}
                  {results.map((r, i) => (
                    <g key={`fallen-${r.id}`} transform={`translate(${mapX(r.distance)}, ${mapY(0)}) rotate(${r.id * 55})`}>
                      <SamaraIcon width={28} height={28} x={-14} y={-14} className="opacity-40 grayscale brightness-50" />
                    </g>
                  ))}

                  {/* Animated Seed */}
                  <motion.g
                    key={animKey}
                    initial={{ x: mapX(0.5), y: mapY(height), rotate: 0 }}
                    animate={
                      animProps.duration > 0 
                        ? { x: mapX(animProps.distance), y: mapY(0), rotate: 360 * animProps.duration * 4 } 
                        : { x: mapX(0.5), y: mapY(height), rotate: 0 }
                    }
                    transition={{ duration: animProps.duration, ease: "linear" }}
                  >
                    <SamaraIcon width={42} height={42} x={-21} y={-21} className="drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" />
                  </motion.g>
                </svg>
              </div>
            </div>

            {/* Panel Inferior: Resultados (Technical Grid) */}
            <div className="bg-white rounded-none border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-hidden flex flex-col min-h-[300px]">
              <div className="flex border-b-4 border-slate-900 bg-slate-50 p-1.5 gap-1.5">
                <button 
                  onClick={() => setActiveTab('table')}
                  className={`flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center rounded-none transition-all border-2 ${activeTab === 'table' ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(99,102,241,1)]' : 'text-slate-400 border-transparent hover:bg-slate-200 hover:text-slate-600'}`}
                >
                  <TableProperties className="w-4 h-4 mr-2" /> Registro de Datos
                </button>
                <button 
                  onClick={() => setActiveTab('charts')}
                  className={`flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center rounded-none transition-all border-2 ${activeTab === 'charts' ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(99,102,241,1)]' : 'text-slate-400 border-transparent hover:bg-slate-200 hover:text-slate-600'}`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" /> Análisis de Dispersión
                </button>
              </div>

              <div className="p-4 flex-grow">
                {activeTab === 'table' ? (
                  <div className="overflow-x-auto h-[250px] custom-scrollbar">
                    {results.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <TableProperties className="w-16 h-16 mb-6 opacity-20" />
                        <p className="text-xs font-black uppercase tracking-[0.4em]">Esperando Datos de Simulación</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-slate-900 text-white">
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest border-r border-slate-700">ID</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest border-r border-slate-700">Altura</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest border-r border-slate-700">Viento</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest border-r border-slate-700">Masa</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest border-r border-slate-700">Ala</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-indigo-400">Distancia</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono text-xs">
                          {results.slice().reverse().map((r) => (
                            <tr key={r.id} className="border-b-2 border-slate-100 hover:bg-indigo-50 transition-colors group">
                              <td className="py-4 px-6 text-slate-400 font-bold border-r border-slate-100">#{r.id.toString().padStart(3, '0')}</td>
                              <td className="py-4 px-6 font-bold border-r border-slate-100">{r.height.toFixed(1)}m</td>
                              <td className="py-4 px-6 border-r border-slate-100">{r.wind.toFixed(1)}m/s</td>
                              <td className="py-4 px-6 border-r border-slate-100">{r.mass.toFixed(2)}g</td>
                              <td className="py-4 px-6 border-r border-slate-100">{r.wing.toFixed(1)}cm</td>
                              <td className="py-4 px-6 text-indigo-600 font-black text-sm">{r.distance.toFixed(2)}m</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[250px]">
                    <div className="flex flex-col">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center">
                        <div className="w-3 h-3 bg-indigo-500 mr-3 rounded-sm" />
                        Histograma de Frecuencia
                      </h3>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={histogramData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="range" fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <RechartsTooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '0px', border: '4px solid #0f172a', padding: '12px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                            />
                            <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center">
                        <div className="w-3 h-3 bg-sky-400 mr-3 rounded-sm" />
                        Correlación de Variables
                      </h3>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" dataKey="x" name="Altura" unit="m" fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis type="number" dataKey="y" name="Distancia" unit="m" fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <RechartsTooltip 
                              contentStyle={{ borderRadius: '0px', border: '4px solid #0f172a', padding: '12px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                            />
                            <Scatter name="Resultados" data={scatterHeightData} fill="#0ea5e9" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sección Educativa y Botánica Combinada (Brutalist High-Contrast) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-indigo-600 text-white p-6 md:p-8 rounded-none border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col">
            <div className="flex items-center gap-4 mb-8 border-b-4 border-indigo-700 pb-6">
              <div className="w-12 h-12 bg-white text-indigo-600 rounded-none flex items-center justify-center border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                <Beaker className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic font-serif">Fundamentos</h2>
                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">Física de Sámaras</p>
              </div>
            </div>
            
            <div className="space-y-6 flex-grow">
              <div className="bg-indigo-700/50 p-5 rounded-none border-2 border-indigo-400/30">
                <h3 className="text-[10px] font-black text-indigo-300 mb-4 uppercase tracking-[0.3em]">Diseño Experimental</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-1 h-auto bg-sky-400 rounded-none" />
                    <div>
                      <p className="text-[10px] font-black text-sky-300 uppercase tracking-widest mb-1">Variable Independiente</p>
                      <p className="text-xs font-bold leading-relaxed font-serif">Altura de liberación (<InlineMath math="h" />). Es el factor que manipulamos directamente.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1 h-auto bg-emerald-400 rounded-none" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">Variable Dependiente</p>
                      <p className="text-xs font-bold leading-relaxed font-serif">Distancia horizontal (<InlineMath math="d" />). El resultado medido tras la caída.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900 p-6 rounded-none border-4 border-slate-800 shadow-xl flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity className="w-24 h-24" />
                </div>
                <h3 className="text-[10px] font-black text-indigo-400 mb-4 uppercase tracking-[0.3em]">Modelo Matemático</h3>
                <p className="text-slate-300 mb-4 text-xs font-medium leading-relaxed relative z-10 font-serif">
                  La velocidad terminal (<InlineMath math="V_t" />) determina el tiempo de vuelo. Semillas con alas más largas generan mayor sustentación, reduciendo <InlineMath math="V_t" /> y permitiendo mayor dispersión.
                </p>
                <div className="bg-slate-800 p-4 rounded-none border-2 border-slate-700 text-center text-sky-400 shadow-inner relative z-10">
                  <BlockMath math="V_t \approx \frac{13 \times \sqrt{m}}{L_{ala}}" />
                </div>
                <p className="text-[9px] text-slate-500 mt-4 font-bold uppercase tracking-widest text-center">
                  Basado en datos de autorrotación de <a href="https://github.com/jakeholden/MapleSeed/tree/master" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Jake Holden (MapleSeed)</a>
                </p>
              </div>
            </div>
          </section>

          {/* Contexto Botánico (Brutalist Quadratic Block) */}
          <section className="bg-white p-6 md:p-8 rounded-none border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 flex items-center gap-4 font-serif">
              <div className="w-8 h-8 bg-emerald-500 border-2 border-slate-900" />
              ¿Qué es una Sámara?
            </h2>
            <div className="space-y-4 text-sm font-bold leading-relaxed text-slate-700 font-serif mb-6">
              <p>
                La <span className="text-indigo-600">sámara</span> es un tipo de fruto seco indehiscente (que no se abre al madurar) provisto de un ala membranosa. Esta estructura es una adaptación evolutiva para la <span className="text-emerald-600">anemocoria</span>: la dispersión a través del viento.
              </p>
              <p>
                A diferencia de una caída libre, el ala de la sámara genera un par de fuerzas que induce una <span className="text-amber-600">autorrotación estable</span>. Este efecto de "helicóptero" reduce drásticamente la velocidad terminal, permitiendo que incluso brisas ligeras transporten la semilla lejos del árbol progenitor.
              </p>
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-4">
              <div className="bg-slate-100 p-4 rounded-none border-2 border-slate-900 flex items-center justify-center">
                <img src="https://th.bing.com/th/id/OIP.YkgOnqJRdj3AbSrYHIidDAHaFk?w=235&h=180&c=7&r=0&o=7&pid=1.7&rm=3" alt="Semilla de Arce" className="w-full h-auto object-cover border-2 border-slate-900 grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
              </div>
              <div className="bg-amber-400 p-4 rounded-none border-2 border-slate-900 flex flex-col items-center justify-center text-center group">
                <div className="mb-4 transform group-hover:rotate-12 transition-transform duration-500">
                  <SamaraIcon width={80} height={80} className="drop-shadow-[4px_4px_0px_rgba(0,0,0,0.2)]" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">Morfología</h3>
                <p className="mt-1 text-[9px] font-black uppercase text-slate-800 opacity-60 italic font-serif">Acer saccharum</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer - Attribution */}
      <footer className="bg-white border-t-4 border-slate-900 mt-20 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-8 mb-10">
            <div className="w-16 h-[2px] bg-slate-200" />
            <div className="p-2 bg-slate-100 rounded-lg border-2 border-slate-900">
              <Beaker className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="w-16 h-[2px] bg-slate-200" />
          </div>
          
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-6">
            Proyecto Educativo de Biología
          </h4>
          
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm font-bold text-slate-600 max-w-md mx-auto leading-relaxed">
              Simulador interactivo diseñado para visualizar los patrones de dispersión anemócora en semillas de arce.
            </p>
            
            <a 
              href="https://github.com/MarioIbago" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[6px_6px_0px_0px_rgba(99,102,241,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(99,102,241,1)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
            >
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span>GitHub / MarioIbago</span>
            </a>
          </div>
          
          <div className="mt-16 text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">
            © 2026 • Todos los derechos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
