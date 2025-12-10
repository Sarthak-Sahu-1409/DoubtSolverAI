
import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Pen, Download, Trash2, X } from 'lucide-react';

interface WhiteboardProps {
  onClose: () => void;
  onExport: (dataUrl: string) => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ onClose, onExport }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(3);
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth * 0.8;
      canvas.height = window.innerHeight * 0.7;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#000000'; // Black background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = mode === 'erase' ? '#000000' : color;
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        offsetX: (e as React.MouseEvent).nativeEvent.offsetX,
        offsetY: (e as React.MouseEvent).nativeEvent.offsetY
      };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleExport = () => {
    if (canvasRef.current) {
      onExport(canvasRef.current.toDataURL('image/png'));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
          <div className="flex gap-4 items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Pen className="w-4 h-4" /> Whiteboard
            </h3>
            <div className="h-6 w-px bg-white/20"></div>
            <button 
              onClick={() => setMode('draw')} 
              className={`p-2 rounded ${mode === 'draw' ? 'bg-blue-600' : 'hover:bg-white/10'}`}
              title="Draw"
            >
              <Pen className="w-4 h-4 text-white" />
            </button>
            <button 
              onClick={() => setMode('erase')} 
              className={`p-2 rounded ${mode === 'erase' ? 'bg-red-600' : 'hover:bg-white/10'}`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4 text-white" />
            </button>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
            />
            <button onClick={clearCanvas} className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-red-400" title="Clear">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
             <button onClick={handleExport} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
               <Download className="w-4 h-4" /> Use as Input
             </button>
             <button onClick={onClose} className="p-2 rounded hover:bg-white/10">
               <X className="w-5 h-5 text-white" />
             </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-black overflow-hidden cursor-crosshair touch-none">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
