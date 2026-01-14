import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, PenTool, ArrowBigLeft } from 'lucide-react';

// Import signature_pad library - NPM version
import SignaturePad from 'signature_pad';

interface DigitalSignaturePadProps {
  onSignatureChange: (signature: string | null) => void;
  title?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function DigitalSignaturePad({
  onSignatureChange,
  title = "Tanda Tangan Digital",
  width = 580,
  height = 220,
  className = ""
}: DigitalSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size with proper device pixel ratio
    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
    };

    // Initial resize
    resizeCanvas();

    // Initialize signature pad with optimal settings
    signaturePadRef.current = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1.5,
      maxWidth: 3.5,
      throttle: 16,
      minDistance: 5,
      velocityFilterWeight: 0.7,
      dotSize: 2.5
    });

    // Set up event listeners
    const handleBeginStroke = () => {
      // Optional: Handle stroke begin
    };

    const handleEndStroke = () => {
      const isEmpty = signaturePadRef.current?.isEmpty();
      setHasSignature(!isEmpty);
      
      if (!isEmpty && signaturePadRef.current) {
        const signatureData = signaturePadRef.current.toDataURL('image/png', 1.0);
        onSignatureChange(signatureData);
      } else {
        onSignatureChange(null);
      }
    };

    signaturePadRef.current.addEventListener('beginStroke', handleBeginStroke);
    signaturePadRef.current.addEventListener('endStroke', handleEndStroke);

    // Handle window resize
    const handleResize = () => {
      if (signaturePadRef.current) {
        const data = signaturePadRef.current.toData();
        resizeCanvas();
        signaturePadRef.current.clear();
        signaturePadRef.current.fromData(data);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (signaturePadRef.current) {
        signaturePadRef.current.removeEventListener('beginStroke', handleBeginStroke);
        signaturePadRef.current.removeEventListener('endStroke', handleEndStroke);
        signaturePadRef.current.off();
      }
    };
  }, [onSignatureChange]);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setHasSignature(false);
      onSignatureChange(null);
    }
  };

  const downloadSignature = () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a new canvas with white background for better PNG export
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    if (!exportCtx) return;

    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    // Fill with white background
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw the signature on top
    exportCtx.drawImage(canvas, 0, 0);

    // Download the image
    const link = document.createElement('a');
    link.download = `signature-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const undoStroke = () => {
    if (signaturePadRef.current) {
      const data = signaturePadRef.current.toData();
      if (data.length > 0) {
        data.pop(); // Remove the last stroke
        signaturePadRef.current.fromData(data);
        setHasSignature(data.length > 0);
        
        if (data.length > 0) {
          const signatureData = signaturePadRef.current.toDataURL('image/png', 1.0);
          onSignatureChange(signatureData);
        } else {
          onSignatureChange(null);
        }
      }
    }
  };



  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
            {title}
          </CardTitle>
          {hasSignature && (
            <Badge variant="secondary" className="text-xs">
              Tersimpan
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas Container */}
        <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-2 bg-muted/5">
          <canvas
            ref={canvasRef}
            className="w-full h-[180px] sm:h-[220px] border border-input rounded cursor-crosshair touch-none bg-white"
            style={{
              maxWidth: '100%',
              height: 'auto',
              minHeight: '180px'
            }}
          />
        </div>

        {/* Instructions */}
        <div className="text-xs sm:text-sm text-muted-foreground text-center px-2">
          {hasSignature 
            ? "✓ Tanda tangan berhasil dibuat dengan kualitas tinggi. Gunakan tombol di bawah untuk mengelola tanda tangan."
            : "Gambar tanda tangan Anda di area di atas."
          }
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row sm:flex-row justify-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={undoStroke}
            className="flex items-center justify-center gap-2 text-xs sm:text-sm"
            disabled={!hasSignature}
          >
            <ArrowBigLeft/>
            Undo
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearSignature}
            className="flex items-center justify-center gap-2 text-xs sm:text-sm"
            disabled={!hasSignature}
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            Hapus Semua
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadSignature}
            className="flex items-center justify-center gap-2 text-xs sm:text-sm"
            disabled={!hasSignature}
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
