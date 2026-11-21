# Prueba Técnica ePayco (`prueba-epayco`)

Proyecto de integración de pagos electrónicos con **ePayco** en modo de pruebas (`test: true`), compuesto por un catálogo web con cálculo automático de IVA del 19 %, una vista de retorno de transacción y un servidor **Node.js / Express** en el puerto `3001` para la recepción, validación de firma **SHA-256** con `crypto.timingSafeEqual` y registro secuencial de confirmaciones (webhook).

---

## 📁 Estructura del Proyecto

```text
prueba-epayco/
├── Css/
│   └── style.css              # Estilos visuales del catálogo, formulario y vista de respuesta
├── js/
│   ├── script.js              # Catálogo (IVA 19 %), configuración de ePayco.checkout.configure, response y confirmation
│   └── response.js            # Captura de ref_payco, consulta del detalle y renderizado del estado del pago
├── webhook-epayco/
│   ├── .env                   # Credenciales, llaves y puerto (3001) — excluido de Git
│   ├── confirmaciones.txt     # Bitácora secuencial de confirmaciones recibidas en el webhook
│   ├── package.json           # Metadatos y dependencias (express, dotenv) gestionadas por npm
│   ├── package-lock.json      # Árbol exacto de versiones instaladas por npm
│   ├── sdkRoutes.js           # Rutas complementarias asociadas al SDK
│   └── server.js              # Servidor Express (puerto 3001), validación SHA-256 y /api/confirmation (POST/GET)
├── .gitignore                 # Exclusión de archivos sensibles (.env, node_modules, etc.)
├── index.html                 # Interfaz principal con catálogo, desglose de IVA y formulario del pagador
└── response.html              # Vista de retorno al finalizar el checkout
```

---

## Detalle de Componentes

- **`index.html` y `Css/style.css`:** Interfaz del catálogo de productos y servicios, desglose de impuestos, formulario del pagador y estilos visuales de la aplicación.

- **`js/script.js`:** Define el catálogo con **IVA del 19 %** en pesos colombianos (COP), configura `ePayco.checkout.configure` con `test: true` y envía las URLs/parámetros de `response` y `confirmation`.

- **`response.html` y `js/response.js`:** Recibe el parámetro `ref_payco` tras el retorno del checkout, consulta el detalle de la transacción y renderiza el estado final para el usuario.

- **`webhook-epayco/server.js`:** Servidor **Node.js / Express** en el **puerto `3001`** que procesa peticiones `POST` y `GET` en `/api/confirmation`, verifica los campos obligatorios, calcula y valida la firma **SHA-256** con `crypto.timingSafeEqual`, escribe en `confirmaciones.txt` y devuelve **HTTP `200`**.

- **`webhook-epayco/sdkRoutes.js`:** Agrupa las rutas y operaciones auxiliares vinculadas al manejo del SDK desde el backend.

- **`webhook-epayco/.env`, `confirmaciones.txt`, `package.json` y `package-lock.json`:** Credenciales y puerto en `.env`, bitácora secuencial en `confirmaciones.txt`, y dependencias `express` y `dotenv` gestionadas por `npm`.

---

## Catálogo de Productos y Desglose (IVA 19 %)

Definido en `js/script.js` en pesos colombianos (**COP**):

| Producto / Servicio                   |   Valor Base |  IVA (19 %) |    Total a Pagar |
| ------------------------------------- | -----------: | ----------: | ---------------: |
| **Plan Cloud Básico**                 |  $50.000 COP |  $9.500 COP |  **$59.500 COP** |
| **Licencia Software Empresarial**     | $120.000 COP | $22.800 COP | **$142.800 COP** |
| **Consultoría Técnica Especializada** | $250.000 COP | $47.500 COP | **$297.500 COP** |

---

## Flujo End-to-End de la Transacción

1. **Selección y captura (`index.html` + `js/script.js`):** El pagador selecciona un producto del catálogo, revisa el desglose con IVA del 19 % y completa los datos del formulario del pagador.

2. **Apertura del checkout (`js/script.js`):** Se ejecuta `ePayco.checkout.configure` con `test: true` y se envían los datos de la transacción junto con las URLs de `response` y `confirmation`.

3. **Notificación asíncrona / Webhook (`webhook-epayco/server.js`):**
   - Al generarse el evento de pago, se recibe la petición (`POST` o `GET`) en `/api/confirmation` (puerto `3001`).
   - Verifica la presencia de los campos obligatorios.
   - Calcula el hash **SHA-256** y valida la firma mediante `crypto.timingSafeEqual`.
   - Registra el evento secuencialmente en `confirmaciones.txt` y responde con **HTTP `200`**.

4. **Retorno del usuario (`response.html` + `js/response.js`):** Al regresar del checkout se captura `ref_payco` desde la URL, se consulta el detalle de la transacción y se renderiza el estado en pantalla.

---

## Instalación y Ejecución en Otro Equipo

### 1. Requisitos previos

- **Node.js** y **npm** instalados en el sistema.
- Un servidor HTTP local para el frontend (por ejemplo, **Live Server** en VS Code, `npx serve .`).
- Una herramienta de túnel HTTPS (como **ngrok**) si se desea recibir confirmaciones reales desde ePayco hacia el entorno local.

### 2. Clonar el proyecto y configurar variables de entorno

Crea el archivo `webhook-epayco/.env` (excluido por `.gitignore`) con el puerto y las credenciales de tu cuenta de pruebas de ePayco:

```env
PORT=3001
P_CUST_ID_CLIENTE=93006
P_KEY=be65b2dab4530e82c9979b5c9eac317e5cd4d197
PUBLIC_KEY=c40acc8a877f180bf312c79aae0503f7
PRIVATE_KEY=b13e95ea247b7cbe1f41724a1cb86d91
```

### 3. Instalar dependencias y arrancar el servidor Webhook

Ejecuta los siguientes comandos en la terminal:

```bash
cd webhook-epayco
npm install
node server.js
```

El servidor quedará activo escuchando en `http://localhost:3001` en la ruta `/api/confirmation`.

### 4. Exponer el puerto `3001` para el webhook (opcional para pruebas reales con ePayco)

En una segunda terminal, abre el túnel hacia el puerto `3001`:

```bash
ngrok http 3001
```

Copia la URL pública HTTPS generada y actualiza el parámetro `confirmation` en `js/script.js` apuntando a:

### 5. Levantar el Frontend

Sirve `index.html` y `response.html` desde un servidor HTTP local (evitando abrirlos directamente con `file://`) y verifica que las rutas de `response` y `confirmation` en `js/script.js` estén correctamente configuradas.

---

## Datos de Prueba (`test: true`)

Campos visualizados en el modal de checkout (`MODO PRUEBA` — ejemplo con **Plan Cloud Básico** por `$59.500,00 COP`):

- **Correo electrónico:** `jua****@ejemplo.com`
- **Nombre y Apellidos:** `Juan Pérez`
- **Número de tarjeta:** `4575620000000001`
- **Fecha de expiración:** `12/29`
- **CVV:** `123`
- **Cuotas:** `1`

Tarjetas de prueba de referencia para simular distintos resultados en modo prueba:

| Escenario                 | Franquicia | Número de Tarjeta  | Fecha Expiración       | CVV   | Cuotas |
| ------------------------- | ---------- | ------------------ | ---------------------- | ----- | -----: |
| **Transacción Aprobada**  | Visa       | `4575620000000001` | Fecha futura (`MM/AA`) | `123` |    `1` |
| **Transacción Aprobada**  | Mastercard | `5454545454545454` | Fecha futura (`MM/AA`) | `123` |    `1` |
| **Transacción Rechazada** | Visa       | `4575620000000002` | Fecha futura (`MM/AA`) | `123` |    `1` |

---

**Proyecto:** `prueba-epayco`  
**Tecnologías:** HTML5, CSS3, JavaScript, Node.js, Express y ePayco.  
**Ambiente:** Pruebas (`test: true`).  
**Puerto del Webhook:** `3001`.
