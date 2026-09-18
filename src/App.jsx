import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  ShoppingCart,
  Package,
  ListOrdered,
  Menu,
  Plus,
  Minus,
  ChevronRight,
  ArrowLeft,
  Search,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  X,
  Camera,
} from "lucide-react";
import { supabase } from "./supabaseClient";
// ===========================================================================
// Compatibilidad de almacenamiento fuera de Claude.ai
// -----------------------------------------------------------------------
// Dentro de Claude.ai, `window.storage` lo provee la plataforma. Si esta app
// se despliega como sitio propio (Vercel, Netlify, etc.) esa función no
// existe, y sin este bloque la app cargaría pero no guardaría nada. Este
// shim implementa la misma interfaz (get/set/delete/list, todas async) pero
// guardando en localStorage del navegador — así el resto del código (que ya
// usa window.storage en todos lados) no necesita tocarse. Datos quedan
// guardados solo en ESE navegador/dispositivo, no se comparten entre
// dispositivos ni entre usuarios.
// ===========================================================================
if (typeof window !== "undefined" && !window.storage) {
  const LS_KEY = "almacen-app:storage-v1";
  const leerTodo = () => {
    try { return JSON.parse(window.localStorage.getItem(LS_KEY) || "{}"); }
    catch (e) { return {}; }
  };
  const escribirTodo = (obj) => {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch (e) {}
  };
  const clave = (key, shared) => (shared ? "shared:" : "user:") + key;

  window.storage = {
    async get(key, shared = false) {
      const todo = leerTodo();
      const k = clave(key, shared);
      if (!(k in todo)) throw new Error(`Clave no encontrada: ${key}`);
      return { key, value: todo[k], shared };
    },
    async set(key, value, shared = false) {
      const todo = leerTodo();
      todo[clave(key, shared)] = value;
      escribirTodo(todo);
      return { key, value, shared };
    },
    async delete(key, shared = false) {
      const todo = leerTodo();
      const k = clave(key, shared);
      const existia = k in todo;
      delete todo[k];
      escribirTodo(todo);
      return { key, deleted: existia, shared };
    },
    async list(prefix = "", shared = false) {
      const todo = leerTodo();
      const pfx = clave(prefix, shared);
      const base = shared ? "shared:" : "user:";
      const keys = Object.keys(todo)
        .filter((k) => k.startsWith(pfx))
        .map((k) => k.slice(base.length));
      return { keys, prefix, shared };
    },
  };
}

// ===========================================================================
// Constantes / configuración
// ===========================================================================
const COLORS = {
  principal: "#2E6B4F",
  fondo: "#FAF8F5",
  normal: "#2E6B4F",
  bajo: "#E0A526",
  agotado: "#C0392B",
};

const MOTIVOS_AJUSTE = ["Conteo físico", "Producto vencido/roto", "Error de carga", "Otro"];

let idCounter = 1000;
const nextId = () => idCounter++;

const fmtMoney = (n) => `$${Math.round(n).toLocaleString("es-UY")}`;
const fmtStock = (producto) =>
  producto.unidad === "kg"
    ? `${producto.stock.toLocaleString("es-UY")} kg`
    : `${producto.stock} un.`;

const estadoProducto = (p) => {
  if (p.stock <= 0) return "agotado";
  if (p.stock <= p.stockMinimo) return "bajo";
  return "normal";
};

const estadoColor = (estado) =>
  estado === "agotado" ? COLORS.agotado : estado === "bajo" ? COLORS.bajo : COLORS.normal;

const fmtFecha = (date) =>
  date.toLocaleDateString("es-UY", {
    timeZone: "America/Montevideo",
    day: "2-digit",
    month: "2-digit",
  }) +
  " " +
  date.toLocaleTimeString("es-UY", {
    timeZone: "America/Montevideo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

const esHoy = (date) => date.toDateString() === new Date().toDateString();

const claveFechaHoy = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// ===========================================================================
// Jornada de caja automática (America/Montevideo)
// ===========================================================================
const CAJA_STORAGE_KEY = "caja:jornada";

function ahoraUY(override) {
  // `override` permite simular fecha/hora para pruebas (ver PruebasCaja) sin
  // tocar el reloj real. Forma: { fecha: "YYYY-MM-DD", horaNumero: 8.5 }
  if (override) {
    const horaNumero = override.horaNumero;
    const hh = String(Math.floor(horaNumero)).padStart(2, "0");
    const mm = String(Math.round((horaNumero % 1) * 60)).padStart(2, "0");
    return { fecha: override.fecha, hora: `${hh}:${mm}`, horaNumero };
  }
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montevideo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (tipo) => partes.find((p) => p.type === tipo)?.value || "00";
  return {
    fecha: `${get("year")}-${get("month")}-${get("day")}`,
    hora: `${get("hour")}:${get("minute")}`,
    horaNumero: Number(get("hour")) + Number(get("minute")) / 60,
  };
}

function horaUYTexto() {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: "America/Montevideo", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).format(new Date());
}

async function sincronizarCaja(movimientos = [], opciones = {}) {
  // `opciones.override` simula la fecha/hora (para pruebas, ver PruebasCaja).
  // `opciones.storageKey` permite correr la sincronización sobre una caja
  // "sandbox" sin tocar la caja real (CAJA_STORAGE_KEY) ni sus cierres.
  const { override, storageKey = CAJA_STORAGE_KEY } = opciones;
  const claveCierre = (fecha) =>
    storageKey === CAJA_STORAGE_KEY ? `cierre:${fecha}` : `${storageKey}:cierre:${fecha}`;

  const ahora = ahoraUY(override);
  const abiertaPorHorario = ahora.horaNumero >= 8 && ahora.horaNumero < 22;
  let actual = null;

  try {
    const resultado = await window.storage.get(storageKey, false);
    if (resultado?.value) actual = JSON.parse(resultado.value);
  } catch (e) {}

  // Cerrar una jornada que quedó abierta cuando ya pasó la hora de cierre
  // (22:00) o cuando cambió el día sin que nadie la cerrara a tiempo.
  if (actual?.estado === "ABIERTA" && (!abiertaPorHorario || actual.fecha !== ahora.fecha)) {
    const ventasJornada = movimientos.filter((m) => m.tipo === "venta" && String(m.fecha instanceof Date ? (() => { const d=m.fecha; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })() : m.fecha) === actual.fecha);
    const cierre = {
      ...actual,
      estado: "CERRADA",
      horaCierre: "22:00",
      cerradoAutomaticamente: true,
    };
    const resumen = {
      fecha: actual.fecha,
      hora: "22:00",
      total: ventasJornada.reduce((a, v) => a + (Number(v.total) || 0), 0),
      cantidadVentas: ventasJornada.length,
      automatico: true,
    };
    try {
      await window.storage.set(storageKey, JSON.stringify(cierre), false);
      await window.storage.set(claveCierre(actual.fecha), JSON.stringify(resumen), false);
    } catch (e) {}
    actual = cierre;
  }

  // Abrir una única jornada para el día actual dentro del horario.
  // OJO: la condición NO vuelve a mirar el estado ("ABIERTA"/"CERRADA") de la
  // jornada de hoy, solo si YA EXISTE un registro para la fecha de hoy. Así,
  // una jornada cerrada manualmente antes de las 22:00 queda cerrada el
  // resto del día y no se reabre en la siguiente verificación (bug que
  // existía antes: reabría apenas el usuario cerraba caja manualmente).
  if (abiertaPorHorario && (!actual || actual.fecha !== ahora.fecha)) {
    const nueva = {
      id: `caja-${ahora.fecha}`,
      fecha: ahora.fecha,
      estado: "ABIERTA",
      horaApertura: ahora.hora,
      horaCierre: null,
      cerradoAutomaticamente: false,
    };
    try { await window.storage.set(storageKey, JSON.stringify(nueva), false); } catch (e) {}
    actual = nueva;
  }

  return actual;
}

// ===========================================================================
// Datos iniciales (mock) — en estado local de React, listos para reemplazarse
// por una fuente de datos real más adelante sin cambiar la interfaz.
// ===========================================================================
function productosIniciales() {
  return [];
}

function movimientosIniciales() {
  return [];
}

// ===========================================================================
// Barra de navegación inferior
// ===========================================================================
const NAV_ITEMS = [
  { key: "inicio", label: "Inicio", icon: Home },
  { key: "ventas", label: "Ventas", icon: ShoppingCart },
  { key: "stock", label: "Stock", icon: Package },
  { key: "movimientos", label: "Movimientos", icon: ListOrdered },
  { key: "mas", label: "Más", icon: Menu },
];

function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex justify-around items-center py-2 px-1 max-w-sm mx-auto">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            type="button"
            key={key}
            onClick={() => onChange(key)}
            className="flex flex-col items-center justify-center flex-1 py-1"
          >
            <div
              className="flex items-center justify-center rounded-full px-3 py-1 transition-colors"
              style={{ backgroundColor: isActive ? "#2E6B4F" : "transparent" }}
            >
              <Icon size={22} strokeWidth={2} color={isActive ? "#FFFFFF" : "#8A8478"} />
            </div>
            <span
              className={"text-xs mt-1 " + (isActive ? "font-semibold" : "")}
              style={{ color: isActive ? "#2E6B4F" : "#A8A29E" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ===========================================================================
// Componentes visuales reutilizables (sin estado propio)
// ===========================================================================
function Header({ title, onBack }) {
  return (
    <div className="px-5 pt-6 pb-4 flex items-center gap-3">
      {onBack && (
        <button type="button" onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft size={22} color="#57534E" />
        </button>
      )}
      <h1 className="text-2xl font-bold text-stone-800">{title}</h1>
    </div>
  );
}

function Row({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-4 shadow-sm text-left"
    >
      <span className="text-stone-700 font-medium">{label}</span>
      <ChevronRight size={20} color="#B8B2A5" />
    </button>
  );
}

function EstadoDot({ estado }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{ backgroundColor: estadoColor(estado) }}
    />
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm">
      <Search size={18} color="#B8B2A5" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Buscar..."}
        className="flex-1 bg-transparent outline-none text-stone-700 text-sm"
      />
    </div>
  );
}

function ProductoListRow({ producto, onClick }) {
  const estado = estadoProducto(producto);
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
    >
      <div className="flex items-center gap-3">
        <EstadoDot estado={estado} />
        <div>
          <p className="text-stone-800 font-medium text-sm">{producto.nombre}</p>
          <p className="text-stone-400 text-xs">{fmtMoney(producto.precio)}{producto.unidad === "kg" ? " / kg" : ""}</p>
        </div>
      </div>
      <span className="text-stone-600 text-sm font-medium">{fmtStock(producto)}</span>
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full appearance-none font-semibold rounded-2xl py-4 text-lg shadow-sm flex items-center justify-center gap-2"
      style={
        disabled
          ? { backgroundColor: "#E7E5E4", color: "#78716C", cursor: "not-allowed" }
          : { backgroundColor: "#2E6B4F", color: "#FFFFFF" }
      }
    >
      {children}
    </button>
  );
}

function EscanerCodigoBarras({ onClose, onCodigoDetectado, mensaje, items, total, pago, setPago, onConfirmar, enviando }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [estado, setEstado] = useState("solicitando"); // solicitando | activa | error
  const [mensajeError, setMensajeError] = useState("");
  const [codigoDetectado, setCodigoDetectado] = useState(null);
  const [deteccionSoportada, setDeteccionSoportada] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function iniciarCamara() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Este entorno no permite acceder a la cámara del dispositivo.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setEstado("activa");
        setDeteccionSoportada(typeof window !== "undefined" && "BarcodeDetector" in window);
      } catch (err) {
        if (!cancelado) {
          setMensajeError(err && err.message ? err.message : "No se pudo acceder a la cámara.");
          setEstado("error");
        }
      }
    }

    iniciarCamara();

    return () => {
      cancelado = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
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
      if (intento && intento.catch) intento.catch(() => {});
    }
  }, [estado]);

  useEffect(() => {
    if (estado !== "activa" || !deteccionSoportada) return;
    let activo = true;
    let temporizador = null;
    const detector = new window.BarcodeDetector();

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
          if (onCodigoDetectado) onCodigoDetectado(valor);
        }
      } catch (e) {
        // Se ignora un error puntual de detección y se sigue intentando
      }
      if (activo) temporizador = setTimeout(detectar, 550);
    };
    temporizador = setTimeout(detectar, 550);

    return () => {
      activo = false;
      if (temporizador) clearTimeout(temporizador);
    };
  }, [estado, deteccionSoportada, onCodigoDetectado]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col max-w-sm mx-auto" style={{ backgroundColor: "#000000" }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#FAF8F5" }}>
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
              Esto puede deberse a que el Artifact no tiene permiso de cámara habilitado en este dispositivo o
              navegador. La interfaz queda preparada para cuando el acceso a la cámara esté disponible.
            </p>
          </div>
        )}

        {estado === "activa" && (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
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
          {mensaje ? (
            <p className="text-sm font-medium" style={{ color: "#2E6B4F" }}>
              {mensaje}
            </p>
          ) : (
            <p className="text-stone-400 text-xs">
              Este código todavía no está asociado a ningún producto.
            </p>
          )}
        </div>
      )}

      {/* Lista de lo agregado + pago + confirmar, siempre abajo de todo, sin
          tener que cerrar el escáner para ver o confirmar la venta. */}
      {items && items.length > 0 && (
        <div
          className="px-5 pt-2 pb-4 space-y-2"
          style={{ backgroundColor: "#111111", maxHeight: "45vh", overflowY: "auto" }}
        >
          <p className="text-[10px] uppercase tracking-wide text-stone-400 pb-0.5">
            Agregado en esta venta
          </p>
          <div className="space-y-1">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-xs text-white">
                <span className="truncate pr-2">
                  {it.producto.nombre} × {it.cantidad}
                  {it.producto.unidad === "kg" ? "kg" : ""}
                </span>
                <span className="shrink-0">{fmtMoney(it.subtotal)}</span>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between text-sm font-semibold pt-2"
            style={{ color: "#FFFFFF", borderTop: "1px solid #FFFFFF33" }}
          >
            <span>Total</span>
            <span>{fmtMoney(total || 0)}</span>
          </div>

          <div className="flex gap-2 pt-1">
            {["Efectivo", "Débito"].map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setPago(m)}
                className="flex-1 rounded-xl py-2 text-sm font-semibold border"
                style={
                  pago === m
                    ? { backgroundColor: "#2E6B4F", color: "#FFFFFF", borderColor: "#2E6B4F" }
                    : { backgroundColor: "transparent", color: "#FFFFFF", borderColor: "#FFFFFF55" }
                }
              >
                {m}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={!pago || enviando}
            className="w-full appearance-none font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2"
            style={
              !pago || enviando
                ? { backgroundColor: "#3A3A3A", color: "#8A8A8A" }
                : { backgroundColor: "#2E6B4F", color: "#FFFFFF" }
            }
          >
            Confirmar venta
          </button>
        </div>
      )}
    </div>
  );
}

function EstadoCajaCard({ caja, totalHoy }) {
  const abierta = caja?.estado === "ABIERTA";
  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{abierta ? "🟢" : "🔴"}</span>
          <span className="text-sm font-semibold text-stone-800">
            {abierta ? "Caja abierta" : "Caja cerrada"}
          </span>
          {caja?.cerradoAutomaticamente && (
            <span className="text-[10px] text-stone-400">(cierre automático)</span>
          )}
        </div>
        <span className="text-xs font-medium" style={{ color: abierta ? COLORS.principal : COLORS.agotado }}>
          {abierta ? "Jornada actual" : "Jornada cerrada"}
        </span>
      </div>
      <div className="flex justify-between text-xs text-stone-500 border-t border-stone-100 pt-2">
        {abierta ? (
          <>
            <span>Apertura: <strong className="text-stone-700">{caja?.horaApertura || "—"}</strong></span>
            <span>Vendido hoy: <strong className="text-stone-700">{fmtMoney(totalHoy || 0)}</strong></span>
          </>
        ) : (
          <>
            <span>Cierre: <strong className="text-stone-700">{caja?.horaCierre || "—"}</strong></span>
            <span>Próxima apertura: <strong className="text-stone-700">08:00</strong></span>
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmationScreen({ icon, title, message, buttonLabel, onDone }) {
  return (
    <div className="px-5 pt-16 pb-4 flex flex-col items-center text-center">
      {icon}
      <h2 className="text-xl font-bold text-stone-800 mt-4">{title}</h2>
      <p className="text-stone-500 text-sm mt-2">{message}</p>
      <div className="w-full mt-8">
        <PrimaryButton onClick={onDone}>{buttonLabel}</PrimaryButton>
      </div>
    </div>
  );
}

// ===========================================================================
// INICIO — sin estado propio, recibe todo por props
// ===========================================================================
function PantallaInicio({
  totalHoy,
  efectivoHoy,
  debitoHoy,
  productosVendidosHoy,
  productosBajo,
  productosAgotados,
  goTabScreen,
  caja,
}) {
  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <div>
        <p className="text-stone-500 text-sm">Hoy</p>
        <h1 className="text-2xl font-bold text-stone-800">Resumen del día</h1>
      </div>

      <EstadoCajaCard caja={caja} totalHoy={totalHoy} />

      <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
        <p className="text-stone-500 text-sm mb-1">Ventas de hoy</p>
        <p className="text-4xl font-bold mb-4" style={{ color: "#2E6B4F" }}>{fmtMoney(totalHoy)}</p>
        <div className="flex justify-between text-sm text-stone-600 border-t border-stone-100 pt-3">
          <span>
            Efectivo: <strong className="text-stone-800">{fmtMoney(efectivoHoy)}</strong>
          </span>
          <span>
            Débito: <strong className="text-stone-800">{fmtMoney(debitoHoy)}</strong>
          </span>
        </div>
        <p className="text-sm text-stone-500 mt-2">{productosVendidosHoy} productos vendidos</p>
      </div>

      {(productosBajo.length > 0 || productosAgotados.length > 0) && (
        <div className="space-y-2">
          {productosAgotados.length > 0 && (
            <button
              type="button"
              onClick={() => goTabScreen("stock", "stockBajo")}
              className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-3 text-left"
            >
              <XCircle size={22} color={COLORS.agotado} />
              <span className="text-stone-700 text-sm">
                <strong style={{ color: COLORS.agotado }}>{productosAgotados.length}</strong> productos agotados
              </span>
            </button>
          )}
          {productosBajo.length > 0 && (
            <button
              type="button"
              onClick={() => goTabScreen("stock", "stockBajo")}
              className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-3 text-left"
            >
              <AlertTriangle size={22} color={COLORS.bajo} />
              <span className="text-stone-700 text-sm">
                <strong style={{ color: COLORS.bajo }}>{productosBajo.length}</strong> productos con stock bajo
              </span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => goTabScreen("ventas", "nuevaVenta")}
          className="w-full font-semibold rounded-2xl py-4 text-lg shadow-sm flex items-center justify-center gap-2"
          style={{ backgroundColor: "#2E6B4F", color: "#FFFFFF" }}
        >
          <Plus size={22} />
          Nueva venta
        </button>
        <button
          type="button"
          onClick={() => goTabScreen("stock", "agregarEntrada")}
          className="w-full font-semibold rounded-2xl py-3.5 text-base shadow-sm border flex items-center justify-center gap-2"
          style={{ backgroundColor: "#FFFFFF", color: "#2E6B4F", borderColor: "#2E6B4F33" }}
        >
          <Plus size={20} />
          Agregar entrada
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// VENTAS
// ===========================================================================
function VentasMain({ push, caja, totalHoy, abrirCajaManual }) {
  const [avisoFueraHorario, setAvisoFueraHorario] = useState(false);
  const [abriendo, setAbriendo] = useState(false);

  const tocarAbrir = async () => {
    setAbriendo(true);
    const resultado = await abrirCajaManual();
    setAbriendo(false);
    if (!resultado) {
      setAvisoFueraHorario(true);
      setTimeout(() => setAvisoFueraHorario(false), 3500);
    }
  };

  return (
    <div>
      <Header title="Ventas" />
      <div className="px-5 space-y-3">
        <EstadoCajaCard caja={caja} totalHoy={totalHoy} />
        {caja?.estado !== "ABIERTA" && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={tocarAbrir}
              disabled={abriendo}
              className="w-full font-semibold rounded-2xl py-3 text-sm shadow-sm border flex items-center justify-center gap-2"
              style={{ backgroundColor: "#FFFFFF", color: "#2E6B4F", borderColor: "#2E6B4F33" }}
            >
              Abrir caja ahora (manual)
            </button>
            {avisoFueraHorario && (
              <p className="text-xs text-center" style={{ color: COLORS.agotado }}>
                Solo se puede abrir manualmente entre 08:00 y 22:00.
              </p>
            )}
          </div>
        )}
        <Row label="Nueva venta" onClick={() => push("nuevaVenta")} />
        <Row label="Cierre del día" onClick={() => push("cierreDia")} />
        <Row label="Historial de cierres" onClick={() => push("historialCierres")} />
      </div>
    </div>
  );
}

function NuevaVenta({ productos, setProductos, registrarMovimiento, actualizarStock, pop, resetStack, caja }) {
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState([]); // [{id, cantidad}]
  const [pago, setPago] = useState(null);
  const [confirmada, setConfirmada] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [mensajeEscaneo, setMensajeEscaneo] = useState(null);
  const ultimoCodigoRef = useRef(null);
  const cooldownCodigoRef = useRef(null);

  const disponibles = productos
    .filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const cantidadEnCarrito = (id) => carrito.find((c) => c.id === id)?.cantidad || 0;

  const agregarProducto = (producto) => {
    const enCarrito = cantidadEnCarrito(producto.id);
    const incremento = producto.unidad === "kg" ? 0.5 : 1;
    if (enCarrito + incremento > producto.stock) return;
    if (enCarrito === 0) {
      setCarrito((c) => [...c, { id: producto.id, cantidad: incremento }]);
    } else {
      setCarrito((c) =>
        c.map((it) => (it.id === producto.id ? { ...it, cantidad: it.cantidad + incremento } : it))
      );
    }
  };

  const manejarCodigoDetectado = (codigo) => {
    const limpio = (codigo || "").trim();
    if (!limpio || limpio === ultimoCodigoRef.current) return;
    ultimoCodigoRef.current = limpio;
    // Después de un ratito se "olvida" el último código leído, para poder
    // escanear el MISMO producto de nuevo (por ejemplo, si el cliente lleva
    // 2 unidades). Sin esto, una vez leído un código quedaba bloqueado para
    // siempre en esta pantalla.
    if (cooldownCodigoRef.current) clearTimeout(cooldownCodigoRef.current);
    cooldownCodigoRef.current = setTimeout(() => {
      ultimoCodigoRef.current = null;
    }, 1500);

    const producto = productos.find((p) => p.codigoBarras && p.codigoBarras.trim() === limpio);
    if (producto) {
      agregarProducto(producto);
      setMensajeEscaneo(`Agregado: ${producto.nombre}`);
    } else {
      setMensajeEscaneo("Código no asociado a ningún producto todavía.");
    }
    setTimeout(() => setMensajeEscaneo(null), 2500);
  };

  const cambiarCantidad = (id, delta) => {
    const producto = productos.find((p) => p.id === id);
    const paso = producto.unidad === "kg" ? 0.5 : 1;
    setCarrito((c) =>
      c
        .map((it) => {
          if (it.id !== id) return it;
          const nueva = Math.round((it.cantidad + delta * paso) * 100) / 100;
          return { ...it, cantidad: nueva };
        })
        .filter((it) => it.cantidad > 0 && it.cantidad <= producto.stock)
    );
  };

  const quitarProducto = (id) => setCarrito((c) => c.filter((it) => it.id !== id));

  const items = carrito.map((it) => {
    const producto = productos.find((p) => p.id === it.id);
    return { ...it, producto, subtotal: producto.precio * it.cantidad };
  });
  const total = items.reduce((a, it) => a + it.subtotal, 0);

 const confirmarVenta = async () => {
  if (items.length === 0 || !pago || enviando || !caja || caja.estado !== "ABIERTA") return;

  setEnviando(true);

  try {
    const { data: venta, error: errorVenta } = await supabase
      .from("ventas")
      .insert({
        negocio_id: 1,
        jornada_id: null,
fecha: new Date().toISOString(),
        total: Number(total),
        pago,
      })
      .select("id")
      .single();

    if (errorVenta) throw errorVenta;

    const itemsVenta = items.map((it) => ({
      venta_id: venta.id,
      producto_id: it.producto.id,
      nombre: it.producto.nombre,
      cantidad: Number(it.cantidad),
      unidad: it.producto.unidad,
      precio_unitario: Number(it.producto.precio),
      subtotal: Number(it.subtotal),
    }));

    const { error: errorItems } = await supabase
      .from("venta_items")
      .insert(itemsVenta);

    if (errorItems) {
      await supabase.from("ventas").delete().eq("id", venta.id);
      throw errorItems;
    }

    for (const it of items) {
      const nuevoStock =
        Math.round((it.producto.stock - it.cantidad) * 100) / 100;

     const { error: errorStock } = await supabase
  .from("productos")
  .update({ stock: Number(nuevoStock) })
  .eq("id", it.producto.id)
  .eq("negocio_id", 1);

if (errorStock) {
  throw errorStock;
}
    }

    registrarMovimiento({
      tipo: "venta",
      items: items.map((it) => ({
        nombre: it.producto.nombre,
        cantidad: it.cantidad,
        unidad: it.producto.unidad,
      })),
      total,
      pago,
    });

    setConfirmada({ total, pago });
  } catch (error) {
    console.error("Error registrando venta:", error);
    alert("No se pudo registrar la venta.");
  } finally {
    setEnviando(false);
  }
};

  if (confirmada) {
    return (
      <ConfirmationScreen
        icon={<CheckCircle2 size={56} color={COLORS.principal} />}
        title="Venta registrada"
        message={`Total ${fmtMoney(confirmada.total)} · ${confirmada.pago}`}
        buttonLabel="Volver a Ventas"
        onDone={resetStack}
      />
    );
  }

  if (!caja || caja.estado !== "ABIERTA") {
    return (
      <div className="px-5 pt-6">
        <Header title="Nueva venta" onBack={pop} />
        <div className="bg-white rounded-2xl shadow-sm px-5 py-6 text-center space-y-2">
          <p className="text-lg font-bold text-stone-800">Caja cerrada</p>
          <p className="text-sm text-stone-500">No se pueden registrar ventas fuera del horario de caja.</p>
          <p className="text-sm font-medium" style={{ color: COLORS.principal }}>Próxima apertura: 08:00</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-72">
      <Header title="Nueva venta" onBack={pop} />
      <div className="px-5 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
          </div>
          <button
            type="button"
            onClick={() => setEscaneando(true)}
            className="shrink-0 rounded-2xl shadow-sm w-12 flex items-center justify-center"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4" }}
          >
            <Camera size={20} color="#2E6B4F" />
          </button>
        </div>
        <div className="space-y-2">
          {disponibles.length > 0 ? (
            disponibles.map((p) => (
              <ProductoListRow key={p.id} producto={p} onClick={() => agregarProducto(p)} />
            ))
          ) : (
            <p className="text-stone-400 text-xs text-center py-6">Ningún producto coincide con la búsqueda</p>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-stone-200 max-w-sm mx-auto flex flex-col">
          {/* Zona con scroll propio: SOLO la lista de productos del carrito */}
          <div className="px-5 pt-3 space-y-2 max-h-40 overflow-y-auto">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <p className="text-stone-800 font-medium">{it.producto.nombre}</p>
                  <p className="text-stone-400 text-xs">{fmtMoney(it.subtotal)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => cambiarCantidad(it.id, -1)} className="p-1 bg-stone-100 rounded-full">
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-stone-700">
                    {it.cantidad}
                    {it.producto.unidad === "kg" ? "kg" : ""}
                  </span>
                  <button type="button" onClick={() => cambiarCantidad(it.id, 1)} className="p-1 bg-stone-100 rounded-full">
                    <Plus size={14} />
                  </button>
                  <button type="button" onClick={() => quitarProducto(it.id)} className="p-1 text-stone-400">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Zona fija: Total, medio de pago y Confirmar venta — nunca dentro del scroll */}
          <div className="px-5 pt-2 pb-4 space-y-2 border-t border-stone-100 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-stone-500 text-sm">Total</span>
              <span className="text-xl font-bold" style={{ color: "#2E6B4F" }}>{fmtMoney(total)}</span>
            </div>

            <div className="flex gap-2">
              {["Efectivo", "Débito"].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPago(m)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold border"
                  style={
                    pago === m
                      ? { backgroundColor: "#2E6B4F", color: "#FFFFFF", borderColor: "#2E6B4F" }
                      : { backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }
                  }
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="pt-1">
              <PrimaryButton onClick={confirmarVenta} disabled={!pago || enviando}>
                Confirmar venta
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {escaneando && (
        <EscanerCodigoBarras
          onClose={() => setEscaneando(false)}
          onCodigoDetectado={manejarCodigoDetectado}
          mensaje={mensajeEscaneo}
          items={items}
          total={total}
          pago={pago}
          setPago={setPago}
          onConfirmar={confirmarVenta}
          enviando={enviando}
        />
      )}
    </div>
  );
}

function CierreDia({ totalHoy, efectivoHoy, debitoHoy, ventasHoy, pop, caja, actualizarCaja }) {
  const claveHoy = `cierre:${claveFechaHoy()}`;
  const [cargando, setCargando] = useState(true);
  const [cierre, setCierre] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const resultado = await window.storage.get(claveHoy, false);
        if (activo && resultado && resultado.value) {
          setCierre(JSON.parse(resultado.value));
        }
      } catch (e) {
        // Todavía no existe un cierre guardado para hoy: se mantiene cierre en null
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [claveHoy]);

  const confirmarCierre = async () => {
    if (guardando || cierre) return;
    setGuardando(true);
    setErrorGuardado(false);
    const registro = {
      fecha: claveFechaHoy(),
      hora: horaUYTexto(),
      total: totalHoy,
      cantidadVentas: ventasHoy.length,
    };
    try {
      const resultado = await window.storage.set(claveHoy, JSON.stringify(registro), false);
      if (resultado) {
        const cerrada = {
          ...(caja || {}),
          id: (caja && caja.id) || `caja-${claveFechaHoy()}`,
          fecha: claveFechaHoy(),
          estado: "CERRADA",
          horaCierre: registro.hora,
          cerradoAutomaticamente: false,
        };
        try { await window.storage.set(CAJA_STORAGE_KEY, JSON.stringify(cerrada), false); } catch (e) {}
        if (actualizarCaja) actualizarCaja(cerrada);
        setCierre(registro);
        setConfirmando(false);
      } else {
        setErrorGuardado(true);
      }
    } catch (e) {
      setErrorGuardado(true);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="px-5 space-y-3">
      <Header title="Cierre del día" onBack={pop} />
      <EstadoCajaCard caja={caja} totalHoy={totalHoy} />
      <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-3">
        <div className="flex justify-between">
          <span className="text-stone-500 text-sm">Total del día</span>
          <span className="text-xl font-bold" style={{ color: "#2E6B4F" }}>{fmtMoney(totalHoy)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Efectivo</span>
          <span className="text-stone-800 font-medium">{fmtMoney(efectivoHoy)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Débito</span>
          <span className="text-stone-800 font-medium">{fmtMoney(debitoHoy)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-stone-100 pt-3">
          <span className="text-stone-500">Cantidad de ventas</span>
          <span className="text-stone-800 font-medium">{ventasHoy.length}</span>
        </div>
      </div>

      {cargando ? (
        <p className="text-stone-400 text-sm text-center py-3">Verificando el estado del día...</p>
      ) : cierre ? (
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-2">
          <p className="text-sm font-semibold" style={{ color: "#2E6B4F" }}>
            Día cerrado
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Fecha</span>
            <span className="text-stone-800 font-medium">{cierre.fecha}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Hora de cierre</span>
            <span className="text-stone-800 font-medium">{cierre.hora}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Total cerrado</span>
            <span className="text-stone-800 font-medium">{fmtMoney(cierre.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Cantidad de ventas</span>
            <span className="text-stone-800 font-medium">{cierre.cantidadVentas}</span>
          </div>
        </div>
      ) : confirmando ? (
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-3">
          <p className="text-stone-700 text-sm text-center">
            ¿Confirmás el cierre del día? Esta acción no se puede deshacer.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-2xl py-3 text-sm font-semibold border"
              style={{ backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }}
            >
              Cancelar
            </button>
            <PrimaryButton onClick={confirmarCierre} disabled={guardando}>
              Confirmar cierre
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div>
          <PrimaryButton onClick={() => setConfirmando(true)}>Cerrar día</PrimaryButton>
          {errorGuardado && (
            <p className="text-xs text-center mt-2" style={{ color: "#C0392B" }}>
              No se pudo guardar el cierre. Intentá nuevamente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// STOCK
// ===========================================================================
function HistorialCierres({ pop }) {
  const [cargando, setCargando] = useState(true);
  const [cierres, setCierres] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        // Recorre todas las claves "cierre:YYYY-MM-DD" guardadas (una por
        // cada día cerrado, manual o automáticamente) y trae cada resumen.
        const listado = await window.storage.list("cierre:", false);
        const claves = (listado?.keys || []).slice().sort().reverse();
        const registros = [];
        for (const clave of claves) {
          try {
            const r = await window.storage.get(clave, false);
            if (r?.value) registros.push(JSON.parse(r.value));
          } catch (e) {}
        }
        if (activo) setCierres(registros);
      } catch (e) {
        if (activo) setError(true);
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => { activo = false; };
  }, []);

  return (
    <div className="px-5 space-y-3 pb-6">
      <Header title="Historial de cierres" onBack={pop} />
      {cargando ? (
        <p className="text-stone-400 text-sm text-center py-6">Cargando historial...</p>
      ) : error ? (
        <p className="text-stone-400 text-sm text-center py-6">No se pudo cargar el historial.</p>
      ) : cierres.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-6">Todavía no hay ningún día cerrado.</p>
      ) : (
        <div className="space-y-2">
          {cierres.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-stone-800">{c.fecha}</p>
                <span
                  className="text-xs font-medium"
                  style={{ color: c.automatico ? COLORS.bajo : COLORS.principal }}
                >
                  {c.automatico ? "Cierre automático" : "Cierre manual"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Hora de cierre</span>
                <span className="text-stone-800 font-medium">{c.hora}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total</span>
                <span className="text-stone-800 font-medium">{fmtMoney(c.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Cantidad de ventas</span>
                <span className="text-stone-800 font-medium">{c.cantidadVentas}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StockMain({ push }) {
  return (
    <div>
      <Header title="Stock" />
      <div className="px-5 space-y-3">
        <Row label="Ver productos" onClick={() => push("verProductos")} />
        <Row label="Stock bajo" onClick={() => push("stockBajo")} />
        <Row label="Agregar entrada" onClick={() => push("agregarEntrada")} />
        <Row label="Ajustar stock" onClick={() => push("ajustarStock")} />
      </div>
    </div>
  );
}

function ListaProductos({ productos, busqueda, onProductoClick }) {
  const disponibles = productos
    .filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div className="space-y-2">
      {disponibles.length > 0 ? (
        disponibles.map((p) => (
          <ProductoListRow key={p.id} producto={p} onClick={() => onProductoClick(p.id)} />
        ))
      ) : (
        <p className="text-stone-400 text-xs text-center py-6">Ningún producto coincide con la búsqueda</p>
      )}
    </div>
  );
}

function VerProductos({ productos, pop, onOpenDetalle }) {
  const [busqueda, setBusqueda] = useState("");

  return (
    <div>
      <Header title="Ver productos" onBack={pop} />
      <div className="px-5 space-y-3">
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
        <ListaProductos productos={productos} busqueda={busqueda} onProductoClick={onOpenDetalle} />
      </div>
    </div>
  );
}

function DetalleProducto({ productos, productoId, pop, goTabScreen }) {
  const p = productos.find((pr) => pr.id === productoId);
  if (!p) return null;
  const estado = estadoProducto(p);
  const etiqueta = estado === "agotado" ? "Agotado" : estado === "bajo" ? "Stock bajo" : "Normal";

  return (
    <div>
      <Header title={p.nombre} onBack={pop} />
      <div className="px-5 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Precio</span>
            <span className="text-stone-800 font-medium">{fmtMoney(p.precio)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Stock actual</span>
            <span className="text-stone-800 font-medium">{fmtStock(p)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Stock mínimo</span>
            <span className="text-stone-800 font-medium">
              {p.stockMinimo} {p.unidad === "kg" ? "kg" : "un."}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-stone-100 pt-3">
            <span className="text-stone-500">Estado</span>
            <span className="flex items-center gap-2 font-medium" style={{ color: estadoColor(estado) }}>
              <EstadoDot estado={estado} />
              {etiqueta}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => goTabScreen("stock", "agregarEntrada", { productoId: p.id })}
            className="font-semibold rounded-2xl py-3 text-sm shadow-sm border"
            style={{ backgroundColor: "#FFFFFF", color: "#2E6B4F", borderColor: "#2E6B4F33" }}
          >
            Agregar entrada
          </button>
          <button
            type="button"
            onClick={() => goTabScreen("stock", "ajustarStock", { productoId: p.id })}
            className="font-semibold rounded-2xl py-3 text-sm shadow-sm border"
            style={{ backgroundColor: "#FFFFFF", color: "#2E6B4F", borderColor: "#2E6B4F33" }}
          >
            Ajustar stock
          </button>
        </div>
      </div>
    </div>
  );
}

function StockBajo({ productosAgotados, productosBajo, pop, onOpenDetalle }) {
  const lista = [...productosAgotados, ...productosBajo];
  return (
    <div>
      <Header title="Stock bajo" onBack={pop} />
      <div className="px-5 space-y-2">
        {lista.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-6">No hay productos para revisar</p>
        )}
        {lista.map((p) => {
          const estado = estadoProducto(p);
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onOpenDetalle(p.id)}
              className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
            >
              <div className="flex items-center gap-3">
                <EstadoDot estado={estado} />
                <div>
                  <p className="text-stone-800 font-medium text-sm">{p.nombre}</p>
                  <p className="text-stone-400 text-xs">
                    Actual: {fmtStock(p)} · Mínimo: {p.stockMinimo} {p.unidad === "kg" ? "kg" : "un."}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} color="#B8B2A5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AgregarEntrada({ productos, productoIdInicial, actualizarStock, registrarMovimiento, pop, resetStack }) {
  const [productoId, setProductoId] = useState(productoIdInicial || null);
  const [busqueda, setBusqueda] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [confirmada, setConfirmada] = useState(null);

  const producto = productos.find((p) => p.id === productoId);
  const disponibles = productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const confirmar = () => {
    const cant = parseFloat(cantidad);
    if (!producto || !cant || cant <= 0) return;
    const nuevoStock = Math.round((producto.stock + cant) * 100) / 100;
    actualizarStock(producto.id, nuevoStock);
    registrarMovimiento({ tipo: "entrada", producto: producto.nombre, cantidad: cant, unidad: producto.unidad });
    setConfirmada({ nombre: producto.nombre, cantidad: cant, unidad: producto.unidad });
  };

  if (confirmada) {
    return (
      <ConfirmationScreen
        icon={<CheckCircle2 size={56} color={COLORS.principal} />}
        title="Entrada registrada"
        message={`+${confirmada.cantidad}${confirmada.unidad === "kg" ? "kg" : " un."} de ${confirmada.nombre}`}
        buttonLabel="Volver a Stock"
        onDone={resetStack}
      />
    );
  }

  return (
    <div>
      <Header title="Agregar entrada" onBack={pop} />
      <div className="px-5 space-y-3">
        {!producto ? (
          <>
            <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
            <div className="space-y-2">
              {disponibles.map((p) => (
                <ProductoListRow key={p.id} producto={p} onClick={() => setProductoId(p.id)} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-stone-800 font-medium text-sm">{producto.nombre}</p>
                <p className="text-stone-400 text-xs">Stock actual: {fmtStock(producto)}</p>
              </div>
              <button type="button" onClick={() => setProductoId(null)} className="text-sm font-medium" style={{ color: "#2E6B4F" }}>
                Cambiar
              </button>
            </div>
            <div>
              <label className="text-stone-500 text-sm">
                Cantidad a ingresar {producto.unidad === "kg" ? "(kg)" : "(unidades)"}
              </label>
              <input
                type="number"
                step={producto.unidad === "kg" ? "0.001" : "1"}
                min="0"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder={producto.unidad === "kg" ? "0,500" : "0"}
                className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
              />
            </div>
            <PrimaryButton onClick={confirmar} disabled={!cantidad || parseFloat(cantidad) <= 0}>
              Registrar entrada
            </PrimaryButton>
          </>
        )}
      </div>
    </div>
  );
}

function AjustarStock({ productos, productoIdInicial, actualizarStock, registrarMovimiento, pop, resetStack }) {
  const [productoId, setProductoId] = useState(productoIdInicial || null);
  const [busqueda, setBusqueda] = useState("");
  const [stockReal, setStockReal] = useState("");
  const [motivo, setMotivo] = useState(null);
  const [confirmada, setConfirmada] = useState(null);

  const producto = productos.find((p) => p.id === productoId);
  const disponibles = productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const confirmar = () => {
    const real = parseFloat(stockReal);
    if (!producto || isNaN(real) || real < 0 || !motivo) return;
    const diferencia = Math.round((real - producto.stock) * 100) / 100;
    actualizarStock(producto.id, real);
    registrarMovimiento({ tipo: "ajuste", producto: producto.nombre, diferencia, motivo });
    setConfirmada({ nombre: producto.nombre, diferencia });
  };

  if (confirmada) {
    return (
      <ConfirmationScreen
        icon={<CheckCircle2 size={56} color={COLORS.principal} />}
        title="Ajuste registrado"
        message={`${confirmada.nombre}: diferencia ${confirmada.diferencia > 0 ? "+" : ""}${confirmada.diferencia}`}
        buttonLabel="Volver a Stock"
        onDone={resetStack}
      />
    );
  }

  return (
    <div>
      <Header title="Ajustar stock" onBack={pop} />
      <div className="px-5 space-y-3">
        {!producto ? (
          <>
            <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
            <div className="space-y-2">
              {disponibles.map((p) => (
                <ProductoListRow key={p.id} producto={p} onClick={() => setProductoId(p.id)} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-stone-800 font-medium text-sm">{producto.nombre}</p>
                <p className="text-stone-400 text-xs">Stock registrado: {fmtStock(producto)}</p>
              </div>
              <button type="button" onClick={() => setProductoId(null)} className="text-sm font-medium" style={{ color: "#2E6B4F" }}>
                Cambiar
              </button>
            </div>
            <div>
              <label className="text-stone-500 text-sm">Stock real contado</label>
              <input
                type="number"
                step={producto.unidad === "kg" ? "0.001" : "1"}
                min="0"
                value={stockReal}
                onChange={(e) => setStockReal(e.target.value)}
                className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
              />
            </div>
            <div>
              <label className="text-stone-500 text-sm mb-2 block">Motivo del ajuste</label>
              <div className="grid grid-cols-2 gap-2">
                {MOTIVOS_AJUSTE.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMotivo(m)}
                    className="rounded-xl py-2.5 text-sm font-medium border"
                    style={
                      motivo === m
                        ? { backgroundColor: "#2E6B4F", color: "#FFFFFF", borderColor: "#2E6B4F" }
                        : { backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }
                    }
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <PrimaryButton onClick={confirmar} disabled={stockReal === "" || !motivo}>
              Confirmar ajuste
            </PrimaryButton>
          </>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// MOVIMIENTOS
// ===========================================================================
function Movimientos({ movimientos, onOpenDetalle }) {
  const [filtro, setFiltro] = useState("Todos");
  const filtros = ["Todos", "Ventas", "Entradas", "Ajustes"];
  const tipoDeFiltro = { Ventas: "venta", Entradas: "entrada", Ajustes: "ajuste" };

  const lista = movimientos.filter((m) => filtro === "Todos" || m.tipo === tipoDeFiltro[filtro]);

  const resumenMovimiento = (m) => {
    if (m.tipo === "venta") return `Venta · ${fmtMoney(m.total)}`;
    if (m.tipo === "entrada") return `Entrada · ${m.producto}`;
    return `Ajuste · ${m.producto}`;
  };
  const colorTipo = (tipo) =>
    tipo === "venta" ? COLORS.principal : tipo === "entrada" ? "#5B7DB1" : COLORS.bajo;

  return (
    <div>
      <Header title="Movimientos" />
      <div className="px-5 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          {filtros.map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFiltro(f)}
              className="whitespace-nowrap text-sm rounded-full px-3.5 py-1.5 border"
              style={
                filtro === f
                  ? { backgroundColor: "#2E6B4F", color: "#FFFFFF", borderColor: "#2E6B4F" }
                  : { backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }
              }
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {lista.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm px-4 py-6 text-center text-stone-400 text-sm">
              Todavía no hay movimientos registrados
            </div>
          )}
          {lista.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => onOpenDetalle(m.id)}
              className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colorTipo(m.tipo) }}
                />
                <div>
                  <p className="text-stone-800 font-medium text-sm">{resumenMovimiento(m)}</p>
                  <p className="text-stone-400 text-xs">{fmtFecha(m.fecha)}</p>
                </div>
              </div>
              <ChevronRight size={18} color="#B8B2A5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetalleMovimiento({ movimientos, movimientoId, pop }) {
  const m = movimientos.find((mv) => mv.id === movimientoId);
  if (!m) return null;

  return (
    <div>
      <Header title="Detalle del movimiento" onBack={pop} />
      <div className="px-5">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Fecha</span>
            <span className="text-stone-800 font-medium">{fmtFecha(m.fecha)}</span>
          </div>

          {m.tipo === "venta" && (
            <>
              <div className="border-t border-stone-100 pt-3 space-y-1">
                {m.items.map((it, i) => (
                  <div key={it.nombre + i} className="flex justify-between text-sm">
                    <span className="text-stone-600">
                      {it.nombre} × {it.cantidad}
                      {it.unidad === "kg" ? "kg" : ""}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm border-t border-stone-100 pt-3">
                <span className="text-stone-500">Total</span>
                <span className="text-stone-800 font-bold">{fmtMoney(m.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Medio de pago</span>
                <span className="text-stone-800 font-medium">{m.pago}</span>
              </div>
            </>
          )}

          {m.tipo === "entrada" && (
            <>
              <div className="flex justify-between text-sm border-t border-stone-100 pt-3">
                <span className="text-stone-500">Producto</span>
                <span className="text-stone-800 font-medium">{m.producto}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Cantidad</span>
                <span className="text-stone-800 font-medium">
                  +{m.cantidad}
                  {m.unidad === "kg" ? "kg" : " un."}
                </span>
              </div>
            </>
          )}

          {m.tipo === "ajuste" && (
            <>
              <div className="flex justify-between text-sm border-t border-stone-100 pt-3">
                <span className="text-stone-500">Producto</span>
                <span className="text-stone-800 font-medium">{m.producto}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Diferencia</span>
                <span className="text-stone-800 font-medium">
                  {m.diferencia > 0 ? "+" : ""}
                  {m.diferencia}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Motivo</span>
                <span className="text-stone-800 font-medium">{m.motivo}</span>
              </div>
            </>
          )}
        </div>
        <p className="text-stone-400 text-xs text-center mt-4">
          Los movimientos son de solo lectura y no pueden editarse ni borrarse.
        </p>
      </div>
    </div>
  );
}

// ===========================================================================
// MÁS
// ===========================================================================
function MasMain({ push }) {
  return (
    <div>
      <Header title="Más" />
      <div className="px-5 space-y-3">
        <Row label="Productos" onClick={() => push("productos")} />
        <Row label="Información del negocio" onClick={() => push("infoNegocio")} />
        <Row label="Configuración" onClick={() => push("configuracion")} />
      </div>
    </div>
  );
}

function ProductosMain({ productos, pop, onOpenDetalle, onNuevo }) {
  const [busqueda, setBusqueda] = useState("");

  return (
    <div>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={pop} className="p-1 -ml-1">
            <ArrowLeft size={22} color="#57534E" />
          </button>
          <h1 className="text-2xl font-bold text-stone-800">Productos</h1>
        </div>
        <button type="button" onClick={onNuevo} className="rounded-full p-2" style={{ backgroundColor: "#2E6B4F" }}>
          <Plus size={20} color="white" />
        </button>
      </div>
      <div className="px-5 space-y-3">
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
        <ListaProductos productos={productos} busqueda={busqueda} onProductoClick={onOpenDetalle} />
      </div>
    </div>
  );
}

function FormularioProducto({ productos, productoId, guardarProducto, pop }) {
  const existente = productos.find((p) => p.id === productoId);
  const esNuevo = !existente;
  const [nombre, setNombre] = useState(existente?.nombre || "");
  const [precio, setPrecio] = useState(existente ? String(existente.precio) : "");
  const [unidad, setUnidad] = useState(existente?.unidad || "unidad");
  const [stock, setStock] = useState(existente ? String(existente.stock) : "");
  const [stockMinimo, setStockMinimo] = useState(existente ? String(existente.stockMinimo) : "");
  const [codigoBarras, setCodigoBarras] = useState(existente?.codigoBarras || "");
  const [escaneandoCodigo, setEscaneandoCodigo] = useState(false);

  const puedeGuardar = nombre && precio && stock !== "" && stockMinimo !== "";

  const guardar = () => {
    if (!puedeGuardar) return;
    guardarProducto({
      id: existente ? existente.id : nextId(),
      nombre,
      precio: parseFloat(precio),
      unidad,
      stock: parseFloat(stock),
      stockMinimo: parseFloat(stockMinimo),
      codigoBarras: codigoBarras.trim() ? codigoBarras.trim() : null,
    });
    pop();
  };

  return (
    <div>
      <Header title={esNuevo ? "Nuevo producto" : "Editar producto"} onBack={pop} />
      <div className="px-5 space-y-3 pb-6">
        <div>
          <label className="text-stone-500 text-sm">Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
          />
        </div>

        <div>
          <label className="text-stone-500 text-sm">Código de barras (opcional)</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              placeholder="7791234567890"
              className="flex-1 bg-white rounded-2xl shadow-sm px-4 py-3 outline-none text-stone-800"
            />
            <button
              type="button"
              onClick={() => setEscaneandoCodigo(true)}
              className="shrink-0 rounded-2xl shadow-sm w-12 flex items-center justify-center"
              style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4" }}
            >
              <Camera size={20} color="#2E6B4F" />
            </button>
          </div>
          <p className="text-stone-400 text-xs mt-1">
            Mejor escanealo con la cámara que tipearlo: así queda idéntico al código que la caja va a leer
            después, sin errores de tipeo.
          </p>
        </div>

        <div>
          <label className="text-stone-500 text-sm">Precio de venta</label>
          <input
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
          />
        </div>

        <div>
          <label className="text-stone-500 text-sm mb-2 block">Unidad de medida</label>
          <div className="flex gap-2">
            {["unidad", "kg"].map((u) => (
              <button
                type="button"
                key={u}
                disabled={!esNuevo}
                onClick={() => setUnidad(u)}
                className={"flex-1 rounded-xl py-2.5 text-sm font-medium border" + (!esNuevo ? " opacity-50" : "")}
                style={
                  unidad === u
                    ? { backgroundColor: "#2E6B4F", color: "#FFFFFF", borderColor: "#2E6B4F" }
                    : { backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }
                }
              >
                {u === "unidad" ? "Por unidad" : "Por peso (kg)"}
              </button>
            ))}
          </div>
          {!esNuevo && (
            <p className="text-stone-400 text-xs mt-1">La unidad de medida no se puede cambiar luego de creado.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-stone-500 text-sm">Stock {esNuevo ? "inicial" : "actual"}</label>
            <input
              type="number"
              step={unidad === "kg" ? "0.001" : "1"}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
            />
          </div>
          <div>
            <label className="text-stone-500 text-sm">Stock mínimo</label>
            <input
              type="number"
              step={unidad === "kg" ? "0.001" : "1"}
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
            />
          </div>
        </div>

        <div className="pt-2">
          <PrimaryButton onClick={guardar} disabled={!puedeGuardar}>
            Guardar producto
          </PrimaryButton>
        </div>
      </div>

      {escaneandoCodigo && (
        <EscanerCodigoBarras
          onClose={() => setEscaneandoCodigo(false)}
          onCodigoDetectado={(codigo) => {
            setCodigoBarras((codigo || "").trim());
            setEscaneandoCodigo(false);
          }}
          mensaje="Código capturado, revisalo abajo y guardá el producto"
        />
      )}
    </div>
  );
}

function InfoNegocio({ infoNegocio, guardarInfoNegocio, pop }) {
  const [nombre, setNombre] = useState(infoNegocio.nombre);
  const [contacto, setContacto] = useState(infoNegocio.contacto);

  const guardar = () => {
    if (!nombre) return;
    guardarInfoNegocio({ nombre, contacto });
    pop();
  };

  return (
    <div>
      <Header title="Información del negocio" onBack={pop} />
      <div className="px-5 space-y-3">
        <div>
          <label className="text-stone-500 text-sm">Nombre del almacén</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
          />
        </div>
        <div>
          <label className="text-stone-500 text-sm">Teléfono / WhatsApp de contacto</label>
          <input
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
          />
        </div>
        <div className="pt-1">
          <PrimaryButton onClick={guardar} disabled={!nombre}>
            Guardar cambios
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Panel de pruebas de caja automática (punto 14 del pedido) — corre la
// sincronización sobre una caja "sandbox" (storageKey separado) para poder
// simular horarios sin esperar al reloj real ni tocar la caja de producción.
// ===========================================================================
const TEST_STORAGE_KEY = "caja:jornada:test";
const DIA_1 = "2026-09-14";
const DIA_2 = "2026-09-15";

const ESCENARIOS_PRUEBA = [
  { label: "07:59 · antes de apertura", fecha: DIA_1, horaNumero: 7 + 59 / 60, esperado: "CERRADA" },
  { label: "08:00 · apertura", fecha: DIA_1, horaNumero: 8, esperado: "ABIERTA" },
  { label: "12:00 · mediodía", fecha: DIA_1, horaNumero: 12, esperado: "ABIERTA" },
  { label: "21:59 · antes del cierre", fecha: DIA_1, horaNumero: 21 + 59 / 60, esperado: "ABIERTA" },
  { label: "22:00 · cierre automático", fecha: DIA_1, horaNumero: 22, esperado: "CERRADA" },
  { label: "23:00 · después del cierre", fecha: DIA_1, horaNumero: 23, esperado: "CERRADA" },
  { label: "08:00 día siguiente · nueva jornada", fecha: DIA_2, horaNumero: 8, esperado: "ABIERTA" },
];

function PruebasCaja() {
  const [testCaja, setTestCaja] = useState(null);
  const [log, setLog] = useState([]);
  const [corriendo, setCorriendo] = useState(false);

  const agregarLog = (texto, ok) =>
    setLog((l) => [{ id: nextId(), texto, ok, hora: new Date().toLocaleTimeString("es-UY") }, ...l]);

  const correr = async (escenario) => {
    setCorriendo(true);
    const resultado = await sincronizarCaja([], {
      override: { fecha: escenario.fecha, horaNumero: escenario.horaNumero },
      storageKey: TEST_STORAGE_KEY,
    });
    setTestCaja(resultado);
    const estadoObtenido = resultado?.estado || "SIN DATOS";
    const ok = estadoObtenido === escenario.esperado;
    agregarLog(
      `${escenario.label} → esperado ${escenario.esperado}, obtenido ${estadoObtenido}`,
      ok
    );
    setCorriendo(false);
  };

  const correrIdempotencia = async () => {
    setCorriendo(true);
    const escenario = { fecha: DIA_1, horaNumero: 12 };
    const resultados = [];
    for (let i = 0; i < 3; i++) {
      const r = await sincronizarCaja([], {
        override: escenario,
        storageKey: TEST_STORAGE_KEY,
      });
      resultados.push(JSON.stringify(r));
    }
    setTestCaja(JSON.parse(resultados[2]));
    const estable = resultados[0] === resultados[1] && resultados[1] === resultados[2];
    agregarLog(
      estable
        ? "Ejecutada 3 veces seguidas a las 12:00 → mismo resultado, sin duplicar (OK)"
        : "Ejecutada 3 veces seguidas → los resultados difieren (revisar)",
      estable
    );
    setCorriendo(false);
  };

  const intentarVentaConCajaCerrada = () => {
    const bloqueada = !testCaja || testCaja.estado !== "ABIERTA";
    agregarLog(
      bloqueada
        ? "Intento de venta con caja cerrada → bloqueada correctamente (OK)"
        : "Intento de venta con caja cerrada → NO se bloqueó (revisar)",
      bloqueada
    );
  };

  const reiniciarSandbox = async () => {
    setCorriendo(true);
    try {
      await window.storage.delete(TEST_STORAGE_KEY, false);
    } catch (e) {}
    setTestCaja(null);
    setLog([]);
    setCorriendo(false);
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl shadow-sm px-5 py-4 space-y-1">
        <p className="text-sm font-semibold text-stone-800">Estado sandbox actual</p>
        {testCaja ? (
          <EstadoCajaCard caja={testCaja} totalHoy={0} />
        ) : (
          <p className="text-xs text-stone-400">Todavía no corriste ningún escenario.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
        <p className="text-xs font-semibold text-stone-500 px-1">Escenarios de horario</p>
        {ESCENARIOS_PRUEBA.map((e, i) => (
          <button
            key={i}
            type="button"
            disabled={corriendo}
            onClick={() => correr(e)}
            className="w-full text-left text-sm rounded-xl px-3 py-2.5 border"
            style={{ backgroundColor: "#FFFFFF", color: "#44403C", borderColor: "#E7E5E4" }}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
        <p className="text-xs font-semibold text-stone-500 px-1">Otras verificaciones</p>
        <button
          type="button"
          disabled={corriendo}
          onClick={correrIdempotencia}
          className="w-full text-left text-sm rounded-xl px-3 py-2.5 border"
          style={{ backgroundColor: "#FFFFFF", color: "#44403C", borderColor: "#E7E5E4" }}
        >
          Ejecutar 3 veces seguidas a las 12:00 (idempotencia)
        </button>
        <button
          type="button"
          disabled={corriendo}
          onClick={intentarVentaConCajaCerrada}
          className="w-full text-left text-sm rounded-xl px-3 py-2.5 border"
          style={{ backgroundColor: "#FFFFFF", color: "#44403C", borderColor: "#E7E5E4" }}
        >
          Simular intento de venta con la caja del sandbox cerrada
        </button>
        <button
          type="button"
          disabled={corriendo}
          onClick={reiniciarSandbox}
          className="w-full text-left text-sm rounded-xl px-3 py-2.5 border"
          style={{ backgroundColor: "#FAF8F5", color: "#C0392B", borderColor: "#E7E5E4" }}
        >
          Reiniciar sandbox de pruebas
        </button>
      </div>

      {log.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-stone-500 px-1">Resultados</p>
          {log.map((l) => (
            <div key={l.id} className="flex items-start gap-2 text-xs px-1">
              <span>{l.ok ? "✅" : "⚠️"}</span>
              <span className="text-stone-600 flex-1">{l.texto}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BorrarDatos() {
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const borrarTodo = async () => {
    setBorrando(true);
    try { await window.storage.delete("datos:productos", false); } catch (e) {}
    try { await window.storage.delete("datos:movimientos", false); } catch (e) {}
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
      <p className="text-xs font-semibold text-stone-500 px-1">Empezar de cero</p>
      <p className="text-xs text-stone-500 px-1">
        Borra todos los productos y todo el historial de ventas de este dispositivo. La caja (abierta/cerrada)
        no se toca. No se puede deshacer.
      </p>
      {!confirmando ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="w-full text-sm rounded-xl px-3 py-2.5 border"
          style={{ backgroundColor: "#FFFFFF", color: "#C0392B", borderColor: "#E7E5E4" }}
        >
          Borrar todos los productos y ventas
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold px-1" style={{ color: COLORS.agotado }}>
            ¿Seguro? Esto borra todo y no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="flex-1 text-sm rounded-xl px-3 py-2.5 border"
              style={{ backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={borrarTodo}
              disabled={borrando}
              className="flex-1 text-sm rounded-xl px-3 py-2.5"
              style={{ backgroundColor: "#C0392B", color: "#FFFFFF" }}
            >
              {borrando ? "Borrando..." : "Sí, borrar todo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Configuracion({ pop }) {
  return (
    <div>
      <Header title="Configuración" onBack={pop} />
      <div className="px-5 space-y-4 pb-6">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-8 text-center">
          <p className="text-stone-600 font-medium">Configuración</p>
          <p className="text-stone-400 text-sm mt-2">Esta sección estará disponible en una etapa futura.</p>
        </div>
        <BorrarDatos />
        <div>
          <p className="text-xs font-semibold text-stone-500 px-1 mb-2">
            Pruebas · caja automática
          </p>
          <PruebasCaja />
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// App principal — SOLO estado global y orquestación. Ningún componente con
// hooks propios se define aquí adentro: todos viven arriba, a nivel de
// módulo, y reciben lo que necesitan por props.
// ===========================================================================
export default function App() {
  const [productos, setProductos] = useState(productosIniciales);
  const [movimientos, setMovimientos] = useState(movimientosIniciales);
  const [infoNegocio, setInfoNegocio] = useState({
    nombre: "Almacén de la familia",
    contacto: "099 123 456",
  });
  const [cargado, setCargado] = useState(false);

  // Carga inicial: si hay datos guardados de una sesión anterior, los usamos
  // en vez de los datos de ejemplo (productosIniciales/movimientosIniciales).
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
       const { data, error } = await supabase
  .from("productos")
  .select("*")
  .eq("negocio_id", 1);

if (error) throw error;

// Si Supabase ya tiene productos, los cargamos normalmente.
if (data && data.length > 0) {
  if (activo) {
    setProductos(
      data.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        unidad: p.unidad,
        stock: Number(p.stock),
        stockMinimo: Number(p.stock_minimo),
        codigoBarras: p.codigo_barras,
      }))
    );
  }
}
} catch (e) {
  console.error("Error cargando productos:", e);
}
      try {
        const r = await window.storage.get("datos:movimientos", false);
        if (activo && r?.value) {
          const lista = JSON.parse(r.value).map((m) => ({ ...m, fecha: new Date(m.fecha) }));
          setMovimientos(lista);
        }
      } catch (e) {}
      try {
        const r = await window.storage.get("datos:infoNegocio", false);
        if (activo && r?.value) setInfoNegocio(JSON.parse(r.value));
      } catch (e) {}
      if (activo) setCargado(true);
    })();
    return () => { activo = false; };
  }, []);
useEffect(() => {
  const canal = supabase
    .channel("productos-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "productos",
        filter: "negocio_id=eq.1",
      },
      (payload) => {
        const producto = payload.new;

        if (payload.eventType === "DELETE") {
          setProductos((prev) =>
            prev.filter((p) => p.id !== payload.old.id)
          );
          return;
        }

        if (producto) {
          const productoFormateado = {
            id: producto.id,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            unidad: producto.unidad,
            stock: Number(producto.stock),
            stockMinimo: Number(producto.stock_minimo),
            codigoBarras: producto.codigo_barras || "",
          };

          setProductos((prev) => {
            const existe = prev.some(
              (p) => p.id === productoFormateado.id
            );

            return existe
              ? prev.map((p) =>
                  p.id === productoFormateado.id
                    ? productoFormateado
                    : p
                )
              : [...prev, productoFormateado];
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}, []);
  // Guardado: recién después de terminar la carga inicial, para no pisar
  // datos guardados con los datos de ejemplo del primer render.
 
  useEffect(() => {
    if (!cargado) return;
    window.storage.set("datos:movimientos", JSON.stringify(movimientos), false).catch(() => {});
  }, [cargado, movimientos]);

  useEffect(() => {
    if (!cargado) return;
    window.storage.set("datos:infoNegocio", JSON.stringify(infoNegocio), false).catch(() => {});
  }, [cargado, infoNegocio]);

  const [tab, setTab] = useState("inicio");
  const [stack, setStack] = useState([]); // [{screen, params}]
  const [caja, setCaja] = useState(null);

  useEffect(() => {
    let activo = true;
    const verificarCaja = async () => {
      const estado = await sincronizarCaja(movimientos);
      if (activo) setCaja(estado);
    };
    verificarCaja();
    const intervalo = setInterval(verificarCaja, 30000);
    return () => { activo = false; clearInterval(intervalo); };
  }, [movimientos]);

  // Apertura manual: solo tiene sentido dentro del horario habilitado
  // (08:00–22:00). Además de abrir la jornada, borra el registro de cierre
  // guardado para hoy — si no se borra, un cierre manual anterior ese mismo
  // día deja "cierre:<fecha>" guardado, y CierreDia lo lee al montar y
  // piensa que el día ya está cerrado, bloqueando un cierre posterior. El
  // cierre y la apertura automáticos (sincronizarCaja) siguen funcionando
  // igual después de esto: si llega a las 22:00 con la caja reabierta, la
  // cierra sola; al otro día a las 08:00 abre una jornada nueva.
  const abrirCajaManual = async () => {
    const ahora = ahoraUY();
    if (ahora.horaNumero < 8 || ahora.horaNumero >= 22) return null;
    const nueva = {
      id: `caja-${ahora.fecha}`,
      fecha: ahora.fecha,
      estado: "ABIERTA",
      horaApertura: ahora.hora,
      horaCierre: null,
      cerradoAutomaticamente: false,
    };
    try { await window.storage.set(CAJA_STORAGE_KEY, JSON.stringify(nueva), false); } catch (e) {}
    try { await window.storage.delete(`cierre:${ahora.fecha}`, false); } catch (e) {}
    setCaja(nueva);
    return nueva;
  };

  const current = stack.length ? stack[stack.length - 1] : { screen: "main", params: {} };

  const goTab = (newTab) => {
    setTab(newTab);
    setStack([]);
  };
  const goTabScreen = (newTab, screen, params = {}) => {
    setTab(newTab);
    setStack([{ screen, params }]);
  };
  const push = (screen, params = {}) => setStack((s) => [...s, { screen, params }]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const resetStack = () => setStack([]);

  const registrarMovimiento = (mov) => {
    setMovimientos((m) => [{ id: nextId(), fecha: new Date(), ...mov }, ...m]);
  };

const actualizarStock = async (id, nuevoStock) => {
  const { error } = await supabase
    .from("productos")
    .update({ stock: Number(nuevoStock) })
    .eq("id", id)
    .eq("negocio_id", 1);

  if (error) {
    console.error("Error actualizando stock en Supabase:", error);
    alert("No se pudo actualizar el stock.");
    return false;
  }

  setProductos((prev) =>
    prev.map((p) => (p.id === id ? { ...p, stock: nuevoStock } : p))
  );

  return true;
};

 const guardarProducto = async (producto) => {
  const productoSupabase = {
    id: producto.id,
    negocio_id: 1,
    nombre: producto.nombre,
    precio: Number(producto.precio),
    unidad: producto.unidad,
    stock: Number(producto.stock),
    stock_minimo: Number(producto.stockMinimo),
    codigo_barras: producto.codigoBarras || null,
  };

  const { error } = await supabase
    .from("productos")
    .upsert(productoSupabase, { onConflict: "id" });

  if (error) {
    console.error("Error guardando producto en Supabase:", error);
    alert("No se pudo guardar el producto.");
    return;
  }

  setProductos((prev) => {
    const existe = prev.some((p) => p.id === producto.id);

    return existe
      ? prev.map((p) => (p.id === producto.id ? producto : p))
      : [...prev, producto];
  });
};

  const guardarInfoNegocio = (datos) => {
    setInfoNegocio(datos);
  };

  const ventasHoy = movimientos.filter((m) => m.tipo === "venta" && esHoy(m.fecha));
  const totalHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0);
  const efectivoHoy = ventasHoy.filter((v) => v.pago === "Efectivo").reduce((a, v) => a + v.total, 0);
  const debitoHoy = ventasHoy.filter((v) => v.pago === "Débito").reduce((a, v) => a + v.total, 0);
  const productosVendidosHoy = ventasHoy.reduce(
    (acc, v) => acc + v.items.reduce((a, it) => a + it.cantidad, 0),
    0
  );

  const productosBajo = productos.filter((p) => estadoProducto(p) === "bajo");
  const productosAgotados = productos.filter((p) => estadoProducto(p) === "agotado");
const ventasSemana = Array.from({ length: 7 }, (_, i) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - (6 - i));

  const fechaUY = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montevideo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);

  const total = movimientos
    .filter((m) => {
      if (m.tipo !== "venta") return false;

      const fechaVenta = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Montevideo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(m.fecha));

      return fechaVenta === fechaUY;
    })
    .reduce((acc, m) => acc + Number(m.total || 0), 0);

  const dia = new Intl.DateTimeFormat("es-UY", {
    timeZone: "America/Montevideo",
    weekday: "short",
  }).format(fecha);

  return {
    fecha: fechaUY,
    dia: dia.replace(".", ""),
    total,
  };
});
  function renderTab() {
    if (tab === "inicio") {
      return (
        <PantallaInicio
          totalHoy={totalHoy}
          efectivoHoy={efectivoHoy}
          debitoHoy={debitoHoy}
          productosVendidosHoy={productosVendidosHoy}
          productosBajo={productosBajo}
          productosAgotados={productosAgotados}
          goTabScreen={goTabScreen}
          caja={caja}
        />
      );
    }

    if (tab === "ventas") {
      if (current.screen === "nuevaVenta")
        return (
       <NuevaVenta
  productos={productos}
  setProductos={setProductos}
  registrarMovimiento={registrarMovimiento}
  actualizarStock={actualizarStock}
  pop={pop}
  resetStack={resetStack}
  caja={caja}
/>
        );
      if (current.screen === "cierreDia")
        return (
          <CierreDia
            totalHoy={totalHoy}
            efectivoHoy={efectivoHoy}
            debitoHoy={debitoHoy}
            ventasHoy={ventasHoy}
            pop={pop}
            caja={caja}
            actualizarCaja={setCaja}
          />
        );
      if (current.screen === "historialCierres") return <HistorialCierres pop={pop} />;
      return <VentasMain push={push} caja={caja} totalHoy={totalHoy} abrirCajaManual={abrirCajaManual} />;
    }

    if (tab === "stock") {
      if (current.screen === "verProductos")
        return (
          <VerProductos
            productos={productos}
            pop={pop}
            onOpenDetalle={(id) => push("detalleProducto", { productoId: id })}
          />
        );
      if (current.screen === "detalleProducto")
        return (
          <DetalleProducto
            productos={productos}
            productoId={current.params.productoId}
            pop={pop}
            goTabScreen={goTabScreen}
          />
        );
      if (current.screen === "stockBajo")
        return (
          <StockBajo
            productosAgotados={productosAgotados}
            productosBajo={productosBajo}
            pop={pop}
            onOpenDetalle={(id) => push("detalleProducto", { productoId: id })}
          />
        );
      if (current.screen === "agregarEntrada")
        return (
          <AgregarEntrada
            productos={productos}
            productoIdInicial={current.params.productoId}
            actualizarStock={actualizarStock}
            registrarMovimiento={registrarMovimiento}
            pop={pop}
            resetStack={resetStack}
          />
        );
      if (current.screen === "ajustarStock")
        return (
          <AjustarStock
            productos={productos}
            productoIdInicial={current.params.productoId}
            actualizarStock={actualizarStock}
            registrarMovimiento={registrarMovimiento}
            pop={pop}
            resetStack={resetStack}
          />
        );
      return <StockMain push={push} />;
    }

    if (tab === "movimientos") {
      if (current.screen === "detalleMovimiento")
        return <DetalleMovimiento movimientos={movimientos} movimientoId={current.params.movimientoId} pop={pop} />;
      return (
        <Movimientos
          movimientos={movimientos}
          onOpenDetalle={(id) => push("detalleMovimiento", { movimientoId: id })}
        />
      );
    }

    if (tab === "mas") {
      if (current.screen === "productos")
        return (
          <ProductosMain
            productos={productos}
            pop={pop}
            onOpenDetalle={(id) => push("formularioProducto", { productoId: id })}
            onNuevo={() => push("formularioProducto", { productoId: null })}
          />
        );
      if (current.screen === "formularioProducto")
        return (
          <FormularioProducto
            productos={productos}
            productoId={current.params.productoId}
            guardarProducto={guardarProducto}
            pop={pop}
          />
        );
      if (current.screen === "infoNegocio")
        return <InfoNegocio infoNegocio={infoNegocio} guardarInfoNegocio={guardarInfoNegocio} pop={pop} />;
      if (current.screen === "configuracion") return <Configuracion pop={pop} />;
      return <MasMain push={push} />;
    }

    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#FAF8F5" }}>
      <style>{`
        button { -webkit-tap-highlight-color: transparent; }
        button:focus { outline: none; }
        button:focus-visible { outline: 2px solid #2E6B4F; outline-offset: 2px; }
      `}</style>
      <div className="w-full max-w-sm min-h-screen relative pb-24" style={{ backgroundColor: "#FAF8F5" }}>
        {renderTab()}
        <BottomNav active={tab} onChange={goTab} />
      </div>
    </div>
  );
}
