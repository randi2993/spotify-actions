# 🎵 Spotify Actions para Stream Deck

[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/randi2993/spotify-actions/blob/main/LICENSE)
[![Platform](https://img.shields.io/badge/platform-Stream%20Deck-blue?style=flat-square)](https://www.elgato.com/es/stream-deck)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Elgato SDK](https://img.shields.io/badge/Stream_Deck_SDK-0078D4?style=flat-square)](https://docs.elgato.com/)

Plugin para controlar **Spotify** directamente desde tu **Elgato Stream Deck**.  
Permite gestionar reproducción, autenticación y configuración sin salir de tu flujo de trabajo.

---

## 📸 Interfaz del Plugin

Vista de configuración para vincular tu cuenta de Spotify:

![Interfaz de Configuración](https://github.com/user-attachments/assets/0961d2b3-c446-437b-89d2-286d8cd998bf)

---

## ✨ Funcionalidades

- 🔐 **Autenticación OAuth integrada** mediante botón *Authorize*
- 🎛 **Control de reproducción**
- 🧾 **Gestión de Client ID y Client Secret**
- 🚀 **Apertura automática de Spotify si está cerrado**
- 🧹 **Limpieza rápida de credenciales (Clean All)**

---

# ⚙️ Configuración en Spotify Developer Dashboard

Para que el plugin funcione, debes registrar una aplicación en Spotify:

### 1️⃣ Crear o acceder a una aplicación

Ir a:  
👉 https://developer.spotify.com/dashboard

Si no tienes una aplicación creada:
- Haz clic en **Create App**
- Nombre sugerido: `Spotify`
- Descripción sugerida: `Spotify para Elgato Stream Deck`

### 2️⃣ Configurar Redirect URI

En la configuración de la aplicación agrega: `http://127.0.0.1:4399/callback`

Guarda los cambios.

### 3️⃣ Obtener credenciales

En el dashboard verás:

- **Client ID**
- **Client Secret**

<img width="400" alt="Spotify Dashboard" src="https://github.com/user-attachments/assets/1353b494-936b-4023-972d-202a2f0d4308" />

Introduce esos valores dentro del plugin en Stream Deck.

### 4️⃣ Autorizar

Dentro del software de Stream Deck:

- Introduce `Client ID`
- Introduce `Client Secret`
- Haz clic en **Authorize (Spotify Login)**

---

# 📥 Instalación

## 🔹 Opción A — Desde Releases (Recomendado)

1. Ir a la sección **Releases** del repositorio.
2. Descargar el archivo `.streamDeckPlugin`.
3. Hacer doble clic para instalarlo.

El archivo `.streamDeckPlugin` funciona como instalador oficial para Stream Deck.

---

## 🔹 Opción B — Compilar desde el repositorio

### Requisitos

- Stream Deck instalado
- Node.js
- Stream Deck CLI (`streamdeck`)

---

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/randi2993/spotify-actions.git
cd spotify-actions
```

### 2️⃣ Instalar dependencias
```bash
npm ci
# o
npm install
```

### 3️⃣ Compilar el plugin
```bash
npm run build
```
Esto generará el bundle del plugin dentro de: com.gilgamesh.spotify-actions.sdPlugin

### 4️⃣ Validar el plugin
```bash
streamdeck validate com.gilgamesh.spotify-actions.sdPlugin
```

### 5️⃣ Empaquetar
```bash
streamdeck pack com.gilgamesh.spotify-actions.sdPlugin
```
Esto generará el archivo: com.gilgamesh.spotify-actions.streamDeckPlugin

### 6️⃣ Instalar

Haz doble clic en el archivo generado y confirma la instalación en Stream Deck.

🛠 Desarrollo

Para desarrollo con recarga automática:

```bash
npm run dev
# o
npm run watch
```
