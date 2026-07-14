# Evaluación Teórica para Conductores Particular 🚗💨

Aplicación web profesional responsiva diseñada con enfoque **Mobile-First** para la realización de exámenes teóricos a conductores de vehículos particulares de forma ágil, segura y moderna.

Los resultados del examen se calculan automáticamente y se guardan de forma instantánea en **Google Sheets** a través de un proxy seguro de Node.js/Express que se conecta con una Web App de **Google Apps Script**, evitando la exposición de credenciales o URLs privadas en el navegador del cliente.

---

## 🛠️ Arquitectura y Tecnologías
- **Frontend**: React (Vite) con TypeScript y animaciones fluidas utilizando `motion` (Framer Motion).
- **Backend/Proxy**: Node.js + Express para proteger las solicitudes a Google Script y mitigar bloqueos de CORS en el cliente.
- **Base de Datos**: Google Sheets (Resultados de evaluaciones).
- **Banco de Preguntas**: Google Docs (Lectura automática de preguntas en 4 módulos) o local/fallback automático.
- **Diseño**: Tailwind CSS (Azul corporativo, Amarillo vial, Blanco, Gris claro) que brinda un aspecto de aplicación móvil nativa.

---

## 📋 Requisitos Previos

1. **Una cuenta de Google** (para acceder a Google Drive, Google Docs y Google Sheets).
2. **El Documento de Google Docs con el Banco de Preguntas**:
   El documento proporcionado debe tener el siguiente formato (que ya procesa nuestro Apps Script automáticamente):
   - Encabezados indicando el módulo: `MÓDULO 1: Aspectos Generales...`
   - Preguntas enumeradas: `1. ¿Qué indica una señal de tránsito reglamentaria con fondo blanco...?`
   - Opciones con letras:
     - `A) Permitido girar en esa dirección.`
     - `B) Prohibición absoluta de realizar la maniobra.`
     - `C) ...`
   - Línea indicando la respuesta: `Respuesta correcta: B` o `Respuesta: B`.

---

## 🚀 Paso 1: Configuración de Google Sheets y Google Apps Script

Siga estos sencillos pasos para crear la base de datos de resultados en su Google Drive:

1. Cree una nueva **Hoja de cálculo** en Google Sheets y póngale el nombre que prefiera.
2. En la barra superior, vaya a **Extensiones** > **Apps Script**.
3. En el editor de código que se abre, borre todo el contenido existente y pegue el código completo del archivo local `google-apps-script.js`.
4. Si lo desea, configure el valor de la variable `GOOGLE_DOC_ID` al inicio del script con el ID de su documento de Google Docs (el ID es la cadena de caracteres larga que aparece en la URL del documento entre `/d/` y `/edit`).
5. Haga clic en **Guardar** (icono de disquete).
6. Haga clic en el botón superior derecho **Implementar** (Deploy) y elija **Nueva implementación** (New deployment).
7. Seleccione el icono de engranaje al lado de "Seleccionar tipo" y elija **Aplicación web** (Web app).
8. Configure los parámetros:
   - **Descripción**: API de Evaluación de Conductores
   - **Ejecutar como**: **Yo** (su cuenta de Google).
   - **Quién tiene acceso**: **Cualquiera** (Anyone) — *No se preocupe, no requiere autenticación en el cliente y su URL es segura*.
9. Haga clic en **Implementar**.
10. La primera vez, Google le pedirá que otorgue permisos ("Autorizar acceso"). Siga los pasos, haga clic en "Avanzado" e "Ir a API de Evaluación (no seguro)" para aprobar las conexiones de lectura y escritura.
11. **Copie la URL de la aplicación web generada** (termina en `/exec`). La necesitará para configurar la aplicación web.

---

## ⚙️ Paso 2: Configuración de Variables de Entorno

Cree un archivo `.env` en la raíz del proyecto (o configure estas variables en el panel de control de Vercel) con los siguientes valores:

```env
# URL de la Web App de Google Apps Script generada en el Paso 1
GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/AKfycbzuqVTGjTG2tvzbHI7M4xGRF_7ELBpeDajLriPyftlo_oDpu4RclDDZrbwjFDl5Qi3CxQ/exec"
```

*Nota: Si la variable de entorno no está configurada o el servidor no tiene acceso a internet, la aplicación funcionará de manera autónoma en **Modo Demostración / Fallback**, cargando un banco local de 60 preguntas de alta calidad vial colombiana y notificando al participante que los resultados se simularon correctamente.*

---

## 📦 Paso 3: Despliegue en Vercel (Producción)

Esta aplicación viene lista con un servidor proxy Express optimizado para compilarse y ejecutarse en entornos en la nube como Vercel o Cloud Run:

1. Suba este repositorio a su cuenta de **GitHub**.
2. Inicie sesión en [Vercel](https://vercel.com) e importe el proyecto.
3. En la sección **Environment Variables**, agregue:
   - **Key**: `GOOGLE_SCRIPT_URL`
   - **Value**: *(Su URL del Web App de Apps Script terminada en `/exec`)*
4. En **Build & Development Settings**, Vercel detectará el comando de compilación automáticamente. Asegúrese de que esté utilizando `npm run build` y que compile tanto el cliente estático como el bundle Express.
5. Haga clic en **Deploy**. ¡Listo!

---

## 📱 Compartir Mediante Código QR

Una vez que Vercel termine el despliegue, le asignará una URL pública (ejemplo: `https://evaluacion-conductores.vercel.app`).

1. Copie esa URL.
2. El sistema genera **automáticamente** un código QR elegante en la pantalla final de resultados de cada participante bajo el sello de **"TP-Carro Particular"** usando la URL de origen actual, facilitando que otros usuarios puedan escanearlo y abrir el examen directamente en sus teléfonos sin instalar absolutamente nada.
3. Puede descargar esta imagen de QR o imprimirla para colocarla en su aula de capacitación vial o vehículo.

---

## 📁 Estructura del Código Fuente
- `/src/types.ts`: Tipos estrictos para TypeScript.
- `/src/questionsData.ts`: Banco interno local con 60 preguntas realistas estructuradas por módulos para garantizar funcionamiento inmediato.
- `/src/components/Header.tsx`: Encabezado corporativo del examen con diseño premium.
- `/src/components/RegistrationForm.tsx`: Formulario de registro (con force UPPERCASE, validación de campos obligatorios y edad).
- `/src/components/ExamScreen.tsx`: Controlador de preguntas con temporizador interactivo, barra de progreso, retroalimentación inmediata (Verde/Naranja) y scroll-to-top suave.
- `/src/components/ResultsScreen.tsx`: Pantalla de resultados con puntuación sobre 100, desglose del estado de aprobación de los 4 módulos de manera individual y generación automática de QR.
- `/server.ts`: Servidor Node.js Express de producción que actúa de proxy e integra las dependencias de Vite.
