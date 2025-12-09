import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface FileUploadProps {
  image: string | null;
  setImage: (image: string | null) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ image, setImage, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {!image ? (
        <div 
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`group relative border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:border-blue-500/50 hover:bg-white/5 bg-white/5 backdrop-blur-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="bg-blue-600/20 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-900/30">
            <Upload className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Upload Question Image</h3>
          <p className="text-gray-400 text-center text-sm max-w-xs leading-relaxed">
            Drag & drop or click to browse. <br/>Supports JPG, PNG, WEBP.
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden"
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl backdrop-blur-md">
          <img 
            src={image} 
            alt="Uploaded Question" 
            className="w-full max-h-80 object-contain bg-black/20" 
          />
          <button 
            onClick={clearImage}
            disabled={disabled}
            className="absolute top-4 right-4 bg-black/60 hover:bg-red-500/80 p-2 rounded-full backdrop-blur-md text-white border border-white/20 transition-all shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 bg-black/60 text-blue-400 border border-white/10 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-md shadow-lg">
             <ImageIcon className="w-4 h-4" /> Image Ready
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;