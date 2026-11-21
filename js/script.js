// Catálogo de productos con nombre, descripción, valor base, IVA (19%) y total
const PRODUCTOS = [
  {
    categoria: "Suscripción",
    nombre: "Plan Cloud Básico",
    descripcion:
      "Alojamiento en la nube con respaldos diarios y soporte técnico continuo.",
    base: 50000,
    iva: 9500,
    total: 59500,
  },
  {
    categoria: "Licenciamiento",
    nombre: "Licencia Software Empresarial",
    descripcion:
      "Acceso anual a plataforma de gestión operativa y reportes analíticos.",
    base: 120000,
    iva: 22800,
    total: 142800,
  },
  {
    categoria: "Servicios TI",
    nombre: "Consultoría Técnica Especializada",
    descripcion:
      "Sesión de diagnóstico, integración de APIs y optimización de procesos.",
    base: 250000,
    iva: 47500,
    total: 297500,
  },
];

// Llave pública de prueba indicada en la prueba técnica
const EPAYCO_PUBLIC_KEY = "c40acc8a877f180bf312c79aae0503f7";

// URL pública del servicio Webhook (Node.js en puerto 3001 expuesto por ngrok)
const WEBHOOK_CONFIRMATION_URL =
  "https://recalcitrantly-sunbonneted-carmon.ngrok-free.dev/api/confirmation";

// Configuración del Checkout de ePayco en modo pruebas
const handler = ePayco.checkout.configure({
  key: EPAYCO_PUBLIC_KEY,
  test: true,
});

// Formateador de moneda para Colombia
function formatearCOP(valor) {
  return Number(valor).toLocaleString("es-CO");
}

// Actualiza la vista con el producto seleccionado
function renderizarProductoSeleccionado() {
  const selectEl = document.getElementById("productoSelect");
  const indice = Number(selectEl.value);
  const producto = PRODUCTOS[indice] || PRODUCTOS[0];

  document.getElementById("prodCategoria").textContent = producto.categoria;
  document.getElementById("prodNombre").textContent = producto.nombre;
  document.getElementById("prodDescripcion").textContent = producto.descripcion;
  document.getElementById("prodBase").textContent = formatearCOP(producto.base);
  document.getElementById("prodIva").textContent = formatearCOP(producto.iva);
  document.getElementById("prodTotal").textContent = formatearCOP(
    producto.total,
  );
}

// Obtiene la URL base actual sin el archivo html
function obtenerUrlBase() {
  const rutaSinArchivo = window.location.pathname.replace(/[^/]*$/, "");
  return `${window.location.origin}${rutaSinArchivo}`;
}

// Abre el checkout de ePayco con los datos del producto y del cliente
function abrirCheckoutEpayco() {
  const selectEl = document.getElementById("productoSelect");
  const indice = Number(selectEl.value);
  const producto = PRODUCTOS[indice] || PRODUCTOS[0];

  const nombreCliente = document.getElementById("clienteNombre").value.trim();
  const emailCliente = document.getElementById("clienteEmail").value.trim();
  const tipoDocCliente = document.getElementById("clienteTipoDoc").value;
  const docCliente = document.getElementById("clienteDoc").value.trim();
  const telefonoCliente = document
    .getElementById("clienteTelefono")
    .value.trim();

  if (!nombreCliente || !emailCliente || !docCliente || !telefonoCliente) {
    alert("Por favor completa todos los datos del pagador antes de continuar.");
    return;
  }

  const referenciaFactura = `FAC-${Date.now()}`;
  const urlBase = obtenerUrlBase();

  const paymentData = {
    // Información del producto y valores
    name: producto.nombre,
    description: producto.descripcion,
    invoice: referenciaFactura,
    currency: "cop",
    amount: String(producto.total),
    tax_base: String(producto.base),
    tax: String(producto.iva),
    tax_ico: "0",
    country: "co",
    lang: "es",

    // "false" = Checkout Onpage (modal); "true" = redirección externa
    external: "false",

    // URL de respuesta (Punto 2) y confirmación / webhook (Punto 3)
    response: `${urlBase}response.html`,
    confirmation: WEBHOOK_CONFIRMATION_URL,

    // Información del pagador
    name_billing: nombreCliente,
    address_billing: "Medellín, Antioquia, Colombia",
    type_doc_billing: tipoDocCliente,
    mobilephone_billing: telefonoCliente,
    number_doc_billing: docCliente,
    email_billing: emailCliente,
  };

  handler.open(paymentData);
}

// Inicialización de eventos cuando carga el DOM
document.addEventListener("DOMContentLoaded", () => {
  renderizarProductoSeleccionado();

  const selectProducto = document.getElementById("productoSelect");
  const btnPagar = document.getElementById("btnPagarEpayco");

  selectProducto.addEventListener("change", renderizarProductoSeleccionado);
  btnPagar.addEventListener("click", abrirCheckoutEpayco);
});
