// Endpoint público oficial de consulta de transacción por ref_payco en ePayco
const EPAYCO_VALIDATION_URL =
  "https://secure.epayco.co/validation/v1/reference/";

// Lee el parámetro ref_payco enviado en la query string de la URL
function obtenerRefPaycoDesdeUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref_payco");
}

// voy a Configurae el estilo visual según el estado devuelto por ePayco
function aplicarEstiloEstado(estado) {
  const banner = document.getElementById("bannerEstado");
  const icono = document.getElementById("iconoEstado");
  const titulo = document.getElementById("tituloEstado");
  const descripcion = document.getElementById("descripcionEstado");

  banner.className = "alert d-flex align-items-center gap-3 mb-4";

  const estadoNormalizado = (estado || "").toUpperCase();

  if (estadoNormalizado === "ACEPTADA" || estadoNormalizado === "APROBADA") {
    banner.classList.add("alert-success");
    icono.className = "fa-solid fa-circle-check fs-3 text-success";
    titulo.textContent = "Transacción aprobada";
    descripcion.textContent =
      "El pago fue procesado exitosamente por la pasarela.";
  } else if (estadoNormalizado === "PENDIENTE") {
    banner.classList.add("alert-warning");
    icono.className = "fa-solid fa-clock fs-3 text-warning";
    titulo.textContent = "Transacción pendiente";
    descripcion.textContent =
      "El pago está en proceso de confirmación por parte de la entidad.";
  } else {
    banner.classList.add("alert-danger");
    icono.className = "fa-solid fa-circle-xmark fs-3 text-danger";
    titulo.textContent = "Transacción rechazada o fallida";
    descripcion.textContent = "No fue posible completar el pago.";
  }
}

// Muestro un mensaje de error en pantalla y oculta el spinner
function mostrarError(mensaje) {
  document.getElementById("estadoCarga").classList.add("d-none");
  const alertaError = document.getElementById("mensajeError");
  document.getElementById("textoError").textContent = mensaje;
  alertaError.classList.remove("d-none");
}

// me Pinta en pantalla los campos de la transacción en el DOM
function renderizarDatosTransaccion(refPayco, data) {
  const valorFormateado = data.x_amount
    ? `$${Number(data.x_amount).toLocaleString("es-CO")} ${data.x_currency_code || "COP"}`
    : "-";

  document.getElementById("txRefPayco").textContent = refPayco;
  document.getElementById("txFactura").textContent = data.x_id_invoice || "-";
  document.getElementById("txEstado").textContent =
    data.x_transaction_state || "-";
  document.getElementById("txRespuesta").textContent =
    data.x_response_reason_text || data.x_response || "-";
  document.getElementById("txValor").textContent = valorFormateado;
  document.getElementById("txBanco").textContent =
    `${data.x_bank_name || "-"} (${data.x_type_payment || "-"})`;
  document.getElementById("txRecibo").textContent =
    data.x_approval_code || data.x_transaction_id || "-";
  document.getElementById("txFecha").textContent =
    data.x_fecha_transaccion || "-";

  aplicarEstiloEstado(data.x_transaction_state);

  document.getElementById("estadoCarga").classList.add("d-none");
  document.getElementById("detalleTransaccion").classList.remove("d-none");
}

// Consulto la API de validación de ePayco usando ref_payco
async function consultarTransaccion(refPayco) {
  try {
    const url = `${EPAYCO_VALIDATION_URL}${encodeURIComponent(refPayco)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Error HTTP ${response.status} al consultar la transacción.`,
      );
    }

    const json = await response.json();

    if (!json.success || !json.data) {
      throw new Error(
        "No se encontraron datos válidos para la referencia consultada.",
      );
    }

    renderizarDatosTransaccion(refPayco, json.data);
  } catch (error) {
    mostrarError(
      error.message ||
        "Ocurrió un error al obtener el estado de la transacción.",
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const refPayco = obtenerRefPaycoDesdeUrl();

  if (!refPayco) {
    mostrarError(
      "No se recibió el parámetro 'ref_payco' en la URL. Completa un pago desde el checkout para visualizar la respuesta.",
    );
    return;
  }

  consultarTransaccion(refPayco);
});
