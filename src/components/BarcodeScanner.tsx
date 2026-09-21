import { Camera, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

export interface BarcodeScannerProps {
  onClose: () => void;
  onCodeDetected?: (code: string) => void;
  /** Alias legacy en español para compatibilidad */
  onCodigoDetectado?: (code: string) => void;
  message?: string | null;
  /** Alias legacy en español para compatibilidad */
  mensaje?: string | null;
  children?: ReactNode;
}

export function BarcodeScanner({
  onClose,
  onCodeDetected,
  onCodigoDetectado,
  message,
  mensaje,
  children,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [estado, setEstado] = useState<"solicitando" | "activa" | "error">("solicitando");
  const [mensajeError, setMensajeError] = useState("");
  const [codigoDetectado, setCodigoDetectado] = useState<string | null>(null);
  const [deteccionSoportada, setDeteccionSoportada] = useState(false);
  const lastCodeRef = useRef<string | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDetected = onCodeDetected || onCodigoDetectado;
  const displayMessage = message ?? mensaje;

  useEffect(() => {
    let cancelado = false;

    async function iniciarCamara() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Este entorno no permite acceder a la cámara del dispositivo.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelado) {
          for (const track of stream.getTracks()) {
            track.stop();
          }
          return;
        }
        streamRef.current = stream;
        setEstado("activa");
        setDeteccionSoportada(typeof window !== "undefined" && "BarcodeDetector" in window);
      } catch (err) {
        if (!cancelado) {
          setMensajeError(
            err instanceof Error && err.message ? err.message : "No se pudo acceder a la cámara.",
          );
          setEstado("error");
        }
      }
    }

    iniciarCamara();

    return () => {
      cancelado = true;
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  // El <video> recién existe en el DOM cuando estado === "activa" (se monta
  // condicionalmente más abajo). Por eso la conexión de la cámara al video
  // tiene que hacerse en un efecto aparte, disparado cuando ese elemento ya
  // está montado — si se intenta en el mismo paso en que se pide la cámara
  // (como estaba antes), videoRef.current todavía es null y la asignación
  // se pierde: el navegador pide permiso, pero no se ve nada.
  useEffect(() => {
    if (estado === "activa" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      const intento = videoRef.current.play();
      if (intento?.catch) {
        intento.catch(() => {});
      }
    }
  }, [estado]);

  useEffect(() => {
    if (estado !== "activa" || !deteccionSoportada) return;
    let activo = true;
    let temporizador: ReturnType<typeof setTimeout> | null = null;
    const detector = window.BarcodeDetector ? new window.BarcodeDetector() : null;
    if (!detector) return;

    // Antes intentaba detectar en CADA frame de la cámara (hasta 60 veces
    // por segundo), lo que hacía que leyera de más y a veces mal. Ahora
    // espera un ratito entre lectura y lectura — sigue siendo rápido para
    // escanear en el mostrador, pero le da tiempo a la cámara a enfocar.
    const detectar = async () => {
      if (!activo || !videoRef.current) return;
      try {
        const codigos = await detector.detect(videoRef.current);
        if (codigos.length > 0) {
          const valor = codigos[0].rawValue;
          setCodigoDetectado(valor);
          if (handleDetected && valor !== lastCodeRef.current) {
            lastCodeRef.current = valor;
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
            cooldownTimerRef.current = setTimeout(() => {
              lastCodeRef.current = null;
            }, 1500);
            handleDetected(valor);
          }
        }
      } catch (_e) {
        // Se ignora un error puntual de detección y se sigue intentando
      }
      if (activo) temporizador = setTimeout(detectar, 550);
    };
    temporizador = setTimeout(detectar, 550);

    return () => {
      activo = false;
      if (temporizador) clearTimeout(temporizador);
    };
  }, [estado, deteccionSoportada, handleDetected]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col max-w-sm mx-auto"
      style={{ backgroundColor: "#000000" }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ backgroundColor: "#FAF8F5" }}
      >
        <h2 className="text-lg font-bold text-stone-800">Escanear código</h2>
        <button type="button" onClick={onClose} className="p-1">
          <X size={22} color="#57534E" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {estado === "solicitando" && (
          <p className="text-white text-sm text-center px-8">Solicitando acceso a la cámara...</p>
        )}

        {estado === "error" && (
          <div className="text-center px-8 space-y-3">
            <Camera size={40} color="#A8A29E" className="mx-auto" />
            <p className="text-white text-sm">
              No se pudo activar el escáner de código de barras en este entorno.
            </p>
            <p className="text-stone-400 text-xs">{mensajeError}</p>
            <p className="text-stone-400 text-xs">
              Esto puede deberse a que el Artifact no tiene permiso de cámara habilitado en este
              dispositivo o navegador. La interfaz queda preparada para cuando el acceso a la cámara
              esté disponible.
            </p>
          </div>
        )}

        {estado === "activa" && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-40 border-2 rounded-2xl" style={{ borderColor: "#2E6B4F" }} />
            </div>
            {!deteccionSoportada && (
              <div className="absolute bottom-5 left-5 right-5 bg-black/60 rounded-2xl px-4 py-3">
                <p className="text-white text-xs text-center">
                  Cámara activa. Este navegador no soporta detección automática de códigos de barra
                  (BarcodeDetector no disponible).
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {codigoDetectado && (
        <div className="px-5 py-3 space-y-1" style={{ backgroundColor: "#FAF8F5" }}>
          <p className="text-stone-500 text-xs">Código detectado</p>
          <p className="text-stone-800 font-bold text-base break-all">{codigoDetectado}</p>
          {displayMessage ? (
            <p className="text-sm font-medium" style={{ color: "#2E6B4F" }}>
              {displayMessage}
            </p>
          ) : (
            <p className="text-stone-400 text-xs">
              Este código todavía no está asociado a ningún producto.
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
