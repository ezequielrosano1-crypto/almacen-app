// Snapshot verbatim de sincronizarCaja en src/App.jsx (líneas 164-300).
// Utilizado como oráculo inmutable para pruebas de caracterización (D8).
// NO EDITAR este archivo.

import { supabase } from "../../src/data/supabaseClient";
import { ahoraUY } from "./helpers.js";

const CAJA_STORAGE_KEY = "caja:jornada";

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
    if (storageKey === CAJA_STORAGE_KEY) {
      const { data, error } = await supabase
        .from("jornada")
        .select("*")
        .eq("negocio_id", 1)
        .eq("fecha", ahora.fecha)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        actual = {
          id: data.id,
          fecha: data.fecha,
          estado: data.estado,
          horaApertura: data.hora_apertura,
          horaCierre: data.hora_cierre,
          cerradoAutomaticamente: data.cerrado_automatico,
          total: Number(data.total || 0),
          cantidadVentas: Number(data.cantidad_ventas || 0),
        };
      }
    } else {
      const resultado = await window.storage.get(storageKey, false);
      if (resultado?.value) actual = JSON.parse(resultado.value);
    }
  } catch (e) {
    console.error("Error cargando jornada:", e);
  }

  // Cerrar una jornada que quedó abierta cuando ya pasó la hora de cierre
  // (22:00) o cuando cambió el día sin que nadie la cerrara a tiempo.
  if (actual?.estado === "ABIERTA" && (!abiertaPorHorario || actual.fecha !== ahora.fecha)) {
    const ventasJornada = movimientos.filter(
      (m) =>
        m.tipo === "venta" &&
        String(
          m.fecha instanceof Date
            ? (() => {
                const d = m.fecha;
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              })()
            : m.fecha,
        ) === actual.fecha,
    );
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
      if (storageKey === CAJA_STORAGE_KEY) {
        const { error } = await supabase
          .from("jornada")
          .update({
            estado: cierre.estado,
            hora_cierre: cierre.horaCierre,
            cerrado_automatico: cierre.cerradoAutomaticamente,
            total: resumen.total,
            cantidad_ventas: resumen.cantidadVentas,
            updated_at: new Date().toISOString(),
          })
          .eq("id", actual.id)
          .eq("negocio_id", 1);

        if (error) throw error;
      } else {
        await window.storage.set(storageKey, JSON.stringify(cierre), false);
        await window.storage.set(claveCierre(actual.fecha), JSON.stringify(resumen), false);
      }
    } catch (e) {
      console.error("Error guardando cierre de jornada:", e);
    }
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
    try {
      if (storageKey === CAJA_STORAGE_KEY) {
        const { data, error } = await supabase
          .from("jornada")
          .insert({
            id: nueva.id,
            negocio_id: 1,
            fecha: nueva.fecha,
            estado: nueva.estado,
            hora_apertura: nueva.horaApertura,
            hora_cierre: nueva.horaCierre,
            cerrado_automatico: nueva.cerradoAutomaticamente,
            total: 0,
            cantidad_ventas: 0,
          })
          .select()
          .single();

        if (error) throw error;

        nueva.id = data.id;
      } else {
        await window.storage.set(storageKey, JSON.stringify(nueva), false);
      }
    } catch (e) {
      console.error("Error guardando jornada:", e);
    }
    actual = nueva;
  }

  return actual;
}

export { sincronizarCaja };
