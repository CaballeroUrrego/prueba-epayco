require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sdkRoutes = require("./sdkRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

const P_CUST_ID_CLIENTE = process.env.P_CUST_ID_CLIENTE || "93006";
const P_KEY = process.env.P_KEY || "be65b2dab4530e82c9979b5c9eac317e5cd4d197";

// Soporta tanto application/x-www-form-urlencoded como application/json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rutas del SDK oficial de ePayco (PSE y Efectivo)
app.use("/api/sdk", sdkRoutes);

/**
- Calcula la firma SHA-256 oficial de ePayco / Davipay:
- p_cust_id_cliente^p_key^x_ref_payco^x_transaction_id^x_amount^x_currency_code
 */
function calcularFirmaEpayco(payload) {
  const refPayco = String(payload.x_ref_payco ?? "").trim();
  const transactionId = String(payload.x_transaction_id ?? "").trim();
  const amount = String(payload.x_amount ?? "").trim();
  const currencyCode = String(payload.x_currency_code ?? "").trim();

  const cadena = `${P_CUST_ID_CLIENTE}^${P_KEY}^${refPayco}^${transactionId}^${amount}^${currencyCode}`;
  return crypto.createHash("sha256").update(cadena, "utf8").digest("hex");
}

function validarFirmaSegura(firmaCalculada, firmaRecibida) {
  const normalizada = String(firmaRecibida || "")
    .trim()
    .toLowerCase();
  if (!normalizada || firmaCalculada.length !== normalizada.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(firmaCalculada, "utf8"),
    Buffer.from(normalizada, "utf8"),
  );
}

function manejarConfirmacion(req, res) {
  const payload = { ...req.query, ...req.body };

  const refPayco = payload.x_ref_payco || "";
  const factura = payload.x_id_invoice || "";
  const transactionId = payload.x_transaction_id || "";
  const amount = payload.x_amount || "";
  const currencyCode = payload.x_currency_code || "";
  const estado = payload.x_transaction_state || "";
  const respuesta = payload.x_response || "";
  const motivo = payload.x_response_reason_text || "";
  const banco = payload.x_bank_name || "";
  const medioPago = payload.x_type_payment || "";
  const recibo = payload.x_approval_code || "";
  const fecha = payload.x_fecha_transaccion || "";
  const firmaRecibida = payload.x_signature || "";

  const firmaCalculada = calcularFirmaEpayco(payload);
  const firmaValida = validarFirmaSegura(firmaCalculada, firmaRecibida);
  const datosCompletos = Boolean(refPayco && amount && estado);

  // Aquí puedes conectar lógica adicional: inserción en BD, envío de correos o webhooks externos
  const lineaLog = [
    `[${new Date().toISOString()}]`,
    `metodo=${req.method}`,
    `ref_payco=${refPayco || "N/A"}`,
    `factura=${factura || "N/A"}`,
    `estado=${estado || "N/A"}`,
    `respuesta=${respuesta || "N/A"}`,
    `motivo=${motivo || "N/A"}`,
    `monto=${amount || "N/A"} ${currencyCode || ""}`.trim(),
    `medio=${medioPago || "N/A"} (${banco || "N/A"})`,
    `recibo=${recibo || "N/A"}`,
    `fecha_tx=${fecha || "N/A"}`,
    `firma_valida=${firmaValida ? "SI" : "NO"}`,
    `datos_completos=${datosCompletos ? "SI" : "NO"}`,
  ].join(" | ");

  const rutaLog = path.join(__dirname, "confirmaciones.txt");
  fs.appendFileSync(rutaLog, lineaRegistroSeguro(lineaLog) + "\n", "utf8");

  console.log("=== CONFIRMACION RECIBIDA ===");
  console.log(lineaLog);

  // Responde HTTP 200 para confirmar recepción a la pasarela
  return res.status(200).json({
    ok: true,
    recibido: true,
    ref_payco: refPayco,
    factura,
    estado,
    firma_valida: firmaValida,
    datos_completos: datosCompletos,
  });
}

function lineaRegistroSeguro(linea) {
  return String(linea).replace(/[\r\n]+/g, " ");
}

app.post("/api/confirmation", manejarConfirmacion);
app.get("/api/confirmation", manejarConfirmacion);

app.listen(PORT, () => {
  console.log(
    `Servidor Webhook escuchando en http://localhost:${PORT}/api/confirmation`,
  );
});
