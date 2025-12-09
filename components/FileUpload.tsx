import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Camera, RefreshCw } from 'lucide-react';

interface FileUploadProps {
  image: string | null;
  setImage: (image: string | null) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ image, setImage, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {!image ? (
        <div className="space-y-4">
          {isCameraOpen ? (
             <div className="relative rounded-3xl overflow-hidden border-2 border-white/20 bg-black shadow-2xl">
               <video 
                 ref={videoRef} 
                 autoPlay 
                 playsInline 
                 className="w-full h-80 object-cover"
               />
               <canvas ref={canvasRef} className="hidden" />
               
               <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                 <button 
                   onClick={capturePhoto}
                   className="bg-white text-black rounded-full p-4 shadow-lg hover:scale-110 transition-transform"
                 >
                   <div className="w-4 h-4 rounded-full bg-black border-2 border-white"></div>
                 </button>
                 <button 
                   onClick={stopCamera}
                   className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full backdrop-blur-md"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => !disabled && fileInputRef.current?.click()}
                className={`group relative border-2 border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:border-blue-500/50 hover:bg-white/5 bg-white/5 backdrop-blur-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="bg-blue-600/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-900/30">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Upload File</h3>
                <p className="text-gray-400 text-center text-xs">JPG, PNG, WEBP</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden"
                  disabled={disabled}
                />
              </div>

              <div 
                onClick={() => !disabled && startCamera()}
                className={`group relative border-2 border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:border-purple-500/50 hover:bg-white/5 bg-white/5 backdrop-blur-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="bg-purple-600/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-900/30">
                  <Camera className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Use Camera</h3>
                <p className="text-gray-400 text-center text-xs">Capture directly</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl backdrop-blur-md">
          <img 
            src={image} 
            alt="Uploaded Question" 
            className="w-full max-h-80 object-contain bg-black/20" 
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
               onClick={clearImage}
               disabled={disabled}
               className="bg-black/60 hover:bg-red-500/80 p-2 rounded-full backdrop-blur-md text-white border border-white/20 transition-all shadow-lg"
             >
               <RefreshCw className="w-5 h-5" />
             </button>
          </div>
          <div className="absolute bottom-4 left-4 bg-black/60 text-blue-400 border border-white/10 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-md shadow-lg">
             <ImageIcon className="w-4 h-4" /> Image Ready
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;