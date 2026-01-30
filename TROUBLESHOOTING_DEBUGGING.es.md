# Guía de Solución de Problemas y Depuración

Este documento proporciona orientación sobre la solución de problemas comunes y la depuración de la aplicación RAG.

## 1. Errores Comunes y Soluciones

### 1.1. React no reconoce la prop `isDragActive` en un elemento DOM.

**Mensaje de Error:**
```
React does not recognize the `isDragActive` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `isdragactive` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
```

**Causa:**
Este error ocurre cuando una prop destinada a un componente de React (como `isDragActive` de `react-dropzone`) se pasa a un elemento HTML nativo (por ejemplo, un `div`) que no lo reconoce como un atributo HTML estándar. En componentes estilizados, esto a menudo sucede cuando las props personalizadas utilizadas para el estilo no se evitan explícitamente de ser reenviadas al elemento DOM subyacente.

**Solución:**
Para resolver esto, debe configurar el componente estilizado para que filtre estas props personalizadas antes de que se pasen al DOM. Para la utilidad `styled` de Material-UI, puede usar la opción `shouldForwardProp`.

**Ejemplo de Solución (en `FileDropzone.tsx`):**

```typescript
const DropzoneContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragActive' && prop !== 'isUploading',
})(({ theme, isDragActive, isUploading }) => ({
  // ... lógica de estilo usando isDragActive e isUploading
}));
```

Esto asegura que `isDragActive` e `isUploading` se utilicen para el estilo dentro de `DropzoneContainer` pero no se añadan como atributos al elemento `div` renderizado.

### 1.2. Errores de Puntos Finales de API (por ejemplo, 404, 500)

**Causa:**
- **404 No Encontrado:** La URL del punto final de la API es incorrecta, o la ruta del lado del servidor no está definida correctamente.
- **500 Error Interno del Servidor:** Ocurrió un error no manejado en el servidor durante el procesamiento. Esto podría deberse a problemas con las conexiones de la base de datos, llamadas a API externas o lógica de negocio.

**Solución:**
- **Pestaña de Red:** Abra las herramientas de desarrollador de su navegador e inspeccione la pestaña "Red". Busque la solicitud de API fallida para ver la URL exacta, la carga útil de la solicitud y la respuesta del servidor (incluyendo cualquier mensaje de error).
- **Registros del Servidor:** Examine los registros del lado del servidor para su aplicación Next.js (o cualquier backend que esté utilizando). Estos registros a menudo proporcionarán trazas de pila detalladas y mensajes de error que señalan la causa exacta de un error 500.
- **Verificar Rutas API:** Vuelva a verificar sus rutas `src/app/api` para asegurarse de que coincidan con las solicitudes de obtención del lado del cliente y manejen todos los escenarios esperados.

### 1.3. Problemas con Variables de Entorno

**Causa:**
Las variables de entorno faltantes o configuradas incorrectamente pueden dar lugar a varios problemas, especialmente con claves API, conexiones a bases de datos o integraciones de servicios externos.

**Solución:**
- **`.env.local`:** Asegúrese de que todas las variables de entorno necesarias estén definidas en su archivo `.env.local` (o `.env` para desarrollo).
- **Prefijo de Next.js:** Recuerde que las variables de entorno del lado del cliente en Next.js deben tener el prefijo `NEXT_PUBLIC_`.
- **Reiniciar Servidor:** Después de modificar las variables de entorno, siempre reinicie su servidor de desarrollo para asegurarse de que los cambios se apliquen.

### 1.4. Error de Componente Cliente (useEffect/useState en Componente Servidor)

**Mensaje de Error:**
```
You're importing a component that needs `useEffect`. This React Hook only works in a Client Component. To fix, mark the file (or its parent) with the `"use client"` directive.
```

**Causa:**
En Next.js App Router, los componentes son Componentes de Servidor por defecto. Los Hooks de React como `useState`, `useEffect`, `useRef`, etc., solo se pueden usar en Componentes de Cliente. Si intenta usar estos hooks en un Componente de Servidor sin marcarlo explícitamente como Componente de Cliente, encontrará este error.

**Solución:**
Para resolver esto, agregue la directiva `"use client";` en la parte superior del archivo donde está utilizando React Hooks. Esto le dice a Next.js que renderice este componente y sus hijos como Componentes de Cliente.

**Ejemplo de Solución (en `src/app/page.tsx`):**
```typescript
'use client';
import { useState, useEffect } from 'react';
// ... el resto de tu componente
```

Esto asegura que el componente se renderice en el lado del cliente, permitiendo el uso de React Hooks.

### 1.5. Discrepancia de Versión del Worker de PDF.js

**Mensaje de Error:**
```
Warning: UnknownErrorException: The API version "X.Y.Z" does not match the Worker version "A.B.C".
Error loading document: – "The API version \"X.Y.Z\" does not match the Worker version \"A.B.C\"."
```

**Causa:**
Este error ocurre cuando la versión de la librería PDF.js utilizada en su aplicación (versión de API) no coincide con la versión del archivo `pdf.worker.min.mjs` (versión de Worker). Esto puede suceder debido a:
1.  Ruta `workerSrc` configurada incorrectamente, lo que lleva al navegador a cargar un worker diferente o predeterminado.
2.  Archivo `pdf.worker.min.mjs` obsoleto o no coincidente en su directorio `public` en comparación con la versión de la librería `react-pdf` (o similar).
3.  Nombre de archivo o extensión incorrectos para el archivo worker en el directorio `public` (por ejemplo, `pdf.worker.min.js` en lugar de `pdf.worker.min.mjs`).

**Solución:**
Para asegurar que la versión del worker de PDF.js siempre coincida con la versión de la API utilizada por `react-pdf`, se recomienda cargar dinámicamente el worker desde un CDN que proporcione la versión correcta.

**Ejemplo de Solución (en `src/app/components/FilePreview.tsx`):**
```typescript
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

Este enfoque utiliza `unpkg.com` para obtener el archivo worker que corresponde a la `pdfjs.version` que está utilizando actualmente `react-pdf`, resolviendo eficazmente los problemas de discrepancia de versiones. Esto también elimina la necesidad de gestionar manualmente el archivo `pdf.worker.min.mjs` en su directorio `public`.

### 1.6. Incompatibilidad de Tipo para la Interfaz AppFile

**Mensaje de Error:**
```
Type error: Type 'import("/var/www/rag1/src/app/page").AppFile[]' is not assignable to type 'import("/var/www/rag1/src/app/components/FileList").AppFile[]'.
  Type 'import("/var/www/rag1/src/app/page").AppFile' is not assignable to type 'import("/var/www/rag1/src/app/components/FileList").AppFile'.
    Types of property 'type' are incompatible.
      Type '"pdf" | "txt" | "docx" | "jpg" | "png" | "unknown"' is not assignable to type '"pdf" | "txt" | "docx" | "jpg" | "png"'.
        Type '"unknown"' is not assignable to type '"pdf" | "txt" | "docx" | "jpg" | "png"'.
```

**Causa:**
Este error ocurre cuando la interfaz `AppFile` se define de forma inconsistente en diferentes archivos. Específicamente, la propiedad `type` de la interfaz `AppFile` en un archivo (por ejemplo, `src/app/page.tsx`) incluye un tipo (por ejemplo, `"unknown"`) que no está presente en la propiedad `type` de la interfaz `AppFile` en otro archivo (por ejemplo, `src/app/components/FileList.tsx`). La comprobación estricta de tipos de TypeScript lo señala como una incompatibilidad.

**Solución:**
Asegúrese de que la interfaz `AppFile` esté definida de forma consistente en todos los archivos que la utilizan. Si se introduce un nuevo tipo en una definición, debe añadirse a todas las demás definiciones de `AppFile` donde pueda utilizarse.

**Ejemplo de Solución (en `src/app/components/FileList.tsx`):**
```typescript
export interface AppFile {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'jpg' | 'png' | 'unknown'; // Añadir el tipo 'unknown'
}
```

Esto asegura que la interfaz `AppFile` tenga una definición unificada, resolviendo el error de incompatibilidad de tipos.

### 1.7. Proceso PM2 No Encontrado

**Mensaje de Error:**
```
[PM2][ERROR] Process or Namespace rag-app not found
```

**Causa:**
Este error ocurre cuando se le indica a PM2 que `reinicie` una aplicación con un nombre específico (por ejemplo, `rag-app`), pero no puede encontrar un proceso activo o una aplicación definida con ese nombre en su registro. Esto suele ocurrir si:
1.  La aplicación nunca se inició con PM2 bajo ese nombre exacto.
2.  El estado o la configuración interna de PM2 se ha restablecido o borrado.
3.  El nombre de la aplicación en el comando `pm2 restart` no coincide con el nombre utilizado cuando la aplicación se inició originalmente (por ejemplo, en un archivo de ecosistema de PM2).

**Solución:**
1.  **Verificar el Estado de PM2:** Ejecute `pm2 list` para ver todos los procesos gestionados actualmente y sus nombres. Verifique si `rag-app` aparece en la lista.
2.  **Iniciar si no está en ejecución:** Si `rag-app` no aparece en la lista, debe iniciarlo primero. Use `pm2 start <su-archivo-de-entrada-de-la-aplicación> --name rag-app` (por ejemplo, `pm2 start npm --name rag-app -- run start` para una aplicación Next.js). Si tiene un archivo de ecosistema de PM2 (por ejemplo, `ecosystem.config.js`), use `pm2 start ecosystem.config.js`.
3.  **Nombre Correcto:** Asegúrese de que el nombre en su comando `pm2 restart` coincida exactamente con el nombre utilizado al iniciar la aplicación.
4.  **Guardar el Estado de PM2:** Después de iniciar su aplicación, ejecute `pm2 save` para conservar la lista de procesos después de los reinicios.

### 1.8. Caducidad del Refresh Token de Google (7 días)

**Síntoma:**
La conexión con Google Drive o los servicios de Google falla sistemáticamente cada 7 días, requiriendo generar un nuevo token.

**Causa:**
Esto ocurre si su proyecto en Google Cloud Platform tiene el "Estado de publicación" (Publishing status) configurado como **"Testing"** (Prueba). En este modo, Google limita la vida útil de los refresh tokens a 7 días por seguridad.

**Solución:**
Para obtener un token que no caduque (o que dure indefinidamente hasta que sea revocado):
1.  Vaya a la Consola de Google Cloud > **APIs & Services** > **OAuth consent screen**.
2.  Haga clic en el botón **"PUBLISH APP"** (Publicar aplicación) para cambiar el estado a **"Production"**.
3.  No es necesario completar el proceso de verificación de la aplicación si es para uso personal, pero el cambio de estado eliminará la restricción de 7 días.
4.  Genere un nuevo `GOOGLE_REFRESH_TOKEN` y actualice su archivo `.env.local`. Este nuevo token será persistente.

### 1.9. Error 403: Billing Disabled (aiplatform.googleapis.com)

**Mensaje de Error:**
```json
{
  "error": {
    "code": 403,
    "message": "This API method requires billing to be enabled...",
    "reason": "BILLING_DISABLED"
  }
}
```

**Causa:**
Estás intentando utilizar un servicio de Google Cloud (como Vertex AI o Gemini API a través de `aiplatform.googleapis.com`) que requiere que el proyecto tenga una cuenta de facturación asociada para funcionar, incluso si el uso está dentro de la capa gratuita.

**Solución:**
1.  Vaya a la URL proporcionada en el mensaje de error (generalmente `https://console.developers.google.com/billing/enable?project=TU_PROJECT_ID`).
2.  Asocie una cuenta de facturación (tarjeta de crédito o cuenta bancaria) a su proyecto de Google Cloud.
3.  Espere unos minutos a que el cambio se propague en los sistemas de Google antes de reintentar la operación.

### 1.10. El Chatbot responde con información de archivos eliminados o no seleccionados

**Síntoma:**
El chatbot utiliza contexto de archivos que ya no existen en la carpeta o mezcla información de varios archivos cuando solo debería responder sobre el que se está previsualizando.

**Causa:**
Lo que está sucediendo es que tu Base de Datos Vectorial (donde n8n guarda la información "leída" de los archivos) sigue teniendo guardados los fragmentos (chunks) de los archivos antiguos, y cuando haces una pregunta, el chatbot busca en todo lo que tiene guardado, sin distinguir si el archivo sigue en Drive o cuál estás mirando.

**Solución:**
Tu suposición de "correr el flujo nuevamente" es una solución posible pero muy ineficiente y lenta (tardarías mucho cada vez que haces clic en un archivo).

La solución correcta y profesional es implementar **Filtros de Metadatos (Metadata Filtering)**.

**Pasos para solucionar esto:**
1.  **No re-proceses el archivo:** El archivo se debe procesar (chunking) una sola vez al subirlo. Al hacerlo, asegúrate de que n8n guarde el `fileName` o `fileId` como metadato en cada vector.
2.  **Modifica el Frontend:** Cuando el usuario selecciona un archivo para previsualizar, tu chat debe enviar ese `fileName` específico a n8n junto con la pregunta.
3.  **Modifica el Flujo de n8n (Retrieval):** En el nodo que busca la información (generalmente "Vector Store Retriever" o similar), debes agregar una opción de Metadata Filter.
    *   Le dirás: "Busca información relevante para esta pregunta, PERO solo dentro de los vectores donde `fileName` sea igual al archivo que estoy viendo ahora".

## 2. Técnicas de Depuración

### 2.1. Herramientas de Desarrollador del Navegador

- **Consola:** Use `console.log()` para mostrar valores de variables, rastrear ciclos de vida de componentes y depurar la ejecución de JavaScript.
- **Pestaña Fuentes:** Establezca puntos de interrupción en sus componentes de React y rutas API para recorrer la ejecución del código, inspeccionar variables y comprender el flujo.
- **Pestaña Red:** Monitoree las solicitudes y respuestas de la API, verifique los códigos de estado e inspeccione las cargas útiles.
- **Pestaña Componentes (React DevTools):** Inspeccione su árbol de componentes de React, vea las props y el estado, e identifique las re-renderizaciones.

### 2.2. Depuración del Lado del Servidor

- **`console.log()` en el Servidor:** Al igual que en el navegador, `console.log()` se puede usar en sus rutas API de Next.js o en la lógica del lado del servidor para mostrar información en su terminal.
- **Depurador (Node.js):** Use el depurador incorporado de Node.js o integre con los depuradores de IDE (por ejemplo, VS Code) para establecer puntos de interrupción y recorrer el código del lado del servidor.

### 2.3. Control de Versiones (Git)

- **`git blame`:** Identifique quién realizó cambios específicos en una línea de código, lo que puede ser útil para comprender el contexto.
- **`git bisect`:** Use `git bisect` para encontrar eficientemente el commit que introdujo un error realizando una búsqueda binaria a través de su historial de commits.
- **Revertir Cambios:** Si un cambio reciente introdujo un error, considere revertir a un commit estable anterior.

## 3. Solicitar Ayuda

Al buscar ayuda de otros (por ejemplo, compañeros de equipo, comunidades en línea), proporcione tantos detalles como sea posible:

- **Descripción Clara:** Explique qué estaba tratando de hacer, qué sucedió y qué esperaba que sucediera.
- **Mensajes de Error:** Incluya el mensaje de error completo y la traza de pila.
- **Código Relevante:** Comparta los fragmentos de código relevantes (por ejemplo, componente, ruta API, función de utilidad).
- **Pasos para Reproducir:** Proporcione pasos claros que permitan a otros reproducir el problema.
- **Detalles del Entorno:** Mencione su sistema operativo, versión de Node.js, versión de Next.js y cualquier otra dependencia relevante.
