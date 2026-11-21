const express = require("express");
const Epayco = require("epayco-sdk-node");

const router = express.Router();

// Inicialización del SDK con credenciales desde .env y modo sandbox (test: true)
const epayco = new Epayco({
  apiKey: process.env.PUBLIC_KEY || "c40acc8a877f180bf312c79aae0503f7",
  privateKey: process.env.PRIVATE_KEY,
  lang: "ES",
  test: true,
});

const PUBLIC_URL = (
  process.env.PUBLIC_URL ||
  "https://recalcitrantly-sunbonneted-carmon.ngrok-free.dev"
).replace(/\/$/, "");

// 1. Consultar bancos disponibles para PSE
router.get("/pse/bancos", async (req, res) => {
  try {
    const banks = await epayco.bank.getBanks();
    return res.status(200).json({ ok: true, banks });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || error });
  }
});

// 2. Medio de pago 1: Crear transacción PSE
router.post("/pse/pagar", async (req, res) => {
  try {
    const {
      bank = "1022", // Banco de prueba (ej. Banco Unión Colombiano / código devuelto por getBanks)
      invoice = `FAC-PSE-${Date.now()}`,
      description = "Plan Cloud Básico - Pago PSE SDK",
      value = "59500",
      tax = "9500",
      tax_base = "50000",
      type_person = "0",
      doc_type = "CC",
      doc_number = "1035851980",
      name = "Sebastián",
      last_name = "Urrego",
      email = "urregosebastian462@gmail.com",
      cell_phone = "3023228386",
      ip = "181.50.100.10",
      url_response = "http://localhost:5500/response.html",
    } = req.body || {};

    const psePayload = {
      bank: String(bank),
      invoice: String(invoice),
      description,
      value: String(value),
      tax: String(tax),
      tax_base: String(tax_base),
      currency: "COP",
      type_person: String(type_person),
      doc_type,
      doc_number: String(doc_number),
      name,
      last_name,
      email,
      country: "CO",
      cell_phone: String(cell_phone),
      ip,
      url_response,
      url_confirmation: `${PUBLIC_URL}/api/confirmation`,
      method_confirmation: "POST",
    };

    const result = await epayco.bank.create(psePayload);
    return res.status(200).json({ ok: true, medio: "PSE", result });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, medio: "PSE", error: error.message || error });
  }
});

// 3. Medio de pago 2: Crear orden de pago en Efectivo (ej. efecty)
router.post("/efectivo/pagar", async (req, res) => {
  try {
    const {
      cash_type = "efecty", // Opciones habituales: efecty, baloto, gana, redservi, puntored
      invoice = `FAC-CASH-${Date.now()}`,
      description = "Plan Cloud Básico - Pago Efectivo SDK",
      value = "59500",
      tax = "9500",
      tax_base = "50000",
      type_person = "0",
      doc_type = "CC",
      doc_number = "1035851980",
      name = "Sebastián",
      last_name = "Urrego",
      email = "urregosebastian462@gmail.com",
      cell_phone = "3023228386",
      end_date = "2026-12-31",
      ip = "181.50.100.10",
      url_response = "http://localhost:5500/response.html",
    } = req.body || {};

    const cashPayload = {
      invoice: String(invoice),
      description,
      value: String(value),
      tax: String(tax),
      tax_base: String(tax_base),
      currency: "COP",
      type_person: String(type_person),
      doc_type,
      doc_number: String(doc_number),
      name,
      last_name,
      email,
      cell_phone: String(cell_phone),
      end_date,
      ip,
      url_response,
      url_confirmation: `${PUBLIC_URL}/api/confirmation`,
      method_confirmation: "POST",
    };

    const result = await epayco.cash.create(cash_type, cashPayload);
    return res
      .status(200)
      .json({ ok: true, medio: "EFECTIVO", red: cash_type, result });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, medio: "EFECTIVO", error: error.message || error });
  }
});

module.exports = router;
