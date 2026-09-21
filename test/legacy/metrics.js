// Snapshot verbatim de las expresiones de métricas de src/App.jsx (líneas 2782-2829)
// Utilizado como oráculo inmutable para pruebas de caracterización (D8).
// NO EDITAR este archivo.

export function computeLegacyMetrics(
  movimientos,
  productos,
  esHoy,
  estadoProducto,
  referenciaFecha = new Date(),
) {
  const ventasHoy = movimientos.filter((m) => m.tipo === "venta" && esHoy(m.fecha));
  const totalHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0);
  const efectivoHoy = ventasHoy
    .filter((v) => v.pago === "Efectivo")
    .reduce((a, v) => a + v.total, 0);
  const debitoHoy = ventasHoy.filter((v) => v.pago === "Débito").reduce((a, v) => a + v.total, 0);
  const productosVendidosHoy = ventasHoy.reduce(
    (acc, v) => acc + v.items.reduce((a, it) => a + it.cantidad, 0),
    0,
  );

  const productosBajo = productos.filter((p) => estadoProducto(p) === "bajo");
  const productosAgotados = productos.filter((p) => estadoProducto(p) === "agotado");

  const ventasSemana = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(referenciaFecha);
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

  return {
    ventasHoy,
    totalHoy,
    efectivoHoy,
    debitoHoy,
    productosVendidosHoy,
    productosBajo,
    productosAgotados,
    ventasSemana,
  };
}
