// Snapshot verbatim de las funciones puras de src/App.jsx (líneas 79-162)
// Utilizado como oráculo inmutable para pruebas de caracterización (D8).
// NO EDITAR este archivo.

export const COLORS = {
  principal: "#2E6B4F",
  fondo: "#FAF8F5",
  normal: "#2E6B4F",
  bajo: "#E0A526",
  agotado: "#C0392B",
};

export const MOTIVOS_AJUSTE = ["Conteo físico", "Producto vencido/roto", "Error de carga", "Otro"];

let idCounter = 1000;
export const nextId = () => idCounter++;

export const fmtMoney = (n) => `$${Math.round(n).toLocaleString("es-UY")}`;
export const fmtStock = (producto) =>
  producto.unidad === "kg"
    ? `${producto.stock.toLocaleString("es-UY")} kg`
    : `${producto.stock} un.`;

export const estadoProducto = (p) => {
  if (p.stock <= 0) return "agotado";
  if (p.stock <= p.stockMinimo) return "bajo";
  return "normal";
};

export const estadoColor = (estado) =>
  estado === "agotado" ? COLORS.agotado : estado === "bajo" ? COLORS.bajo : COLORS.normal;

export const fmtFecha = (date) =>
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

export const esHoy = (date) => date.toDateString() === new Date().toDateString();

export const claveFechaHoy = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export const CAJA_STORAGE_KEY = "caja:jornada";

export function ahoraUY(override) {
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
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (tipo) => partes.find((p) => p.type === tipo)?.value || "00";
  return {
    fecha: `${get("year")}-${get("month")}-${get("day")}`,
    hora: `${get("hour")}:${get("minute")}`,
    horaNumero: Number(get("hour")) + Number(get("minute")) / 60,
  };
}

export function horaUYTexto() {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: "America/Montevideo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}
