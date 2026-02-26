# 🎵 Spotify Actions para Stream Deck

[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/randi2993/spotify-actions/blob/main/LICENSE)
[![Platform](https://img.shields.io/badge/platform-Stream%20Deck-blue?style=flat-square)](https://www.elgato.com/es/stream-deck)

Plugin para el control total de Spotify desde tu **Elgato Stream Deck**. Permite gestionar la reproducción y autenticación de forma integrada sin salir de tu flujo de trabajo.

## 📸 Configuración del Plugin

La siguiente imagen muestra la interfaz de configuración requerida para vincular tu cuenta de Spotify con el dispositivo:

![Interfaz de Configuración de Spotify Actions](https://github.com/user-attachments/assets/0961d2b3-c446-437b-89d2-286d8cd998bf)

## ✨ Funcionalidades

* **Autenticación Directa:** Incluye un flujo de OAuth mediante el botón "Authorize" para simplificar la obtención del token de acceso.
* **Gestión de Credenciales:** Campos configurables para `Client ID` y `Client Secret` obtenidos desde el Dashboard de Spotify.
* **Control de Estado:** El plugin detecta si Spotify está cerrado y ofrece abrirlo automáticamente antes de ejecutar una acción.
* **Limpieza de Datos:** Botón "Clean All" para eliminar rápidamente las credenciales almacenadas.

## ⚙️ Configuración Requerida

Para que el plugin funcione, debes configurar tu aplicación en el **Spotify Developer Dashboard** con los siguientes datos:

1. **Redirect URI:** `http://127.0.0.1:4399/callback`
2. **Credenciales:** Introduce tu `Client ID` y `Client Secret` en la interfaz del plugin dentro del software de Stream Deck.
3. **Autorización:** Haz clic en el botón verde **Authorize (Spotify Login)** para completar la vinculación.
