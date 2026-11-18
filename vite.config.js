// PL: Importuj funkcję konfiguracji Vite. | ES-CO: Importa la función de configuración de Vite.
import { defineConfig } from 'vite';

// PL: Eksportuj konfigurację dla strony projektu GitHub Pages. | ES-CO: Exporta la configuración para GitHub Pages del repositorio.
export default defineConfig({
  // PL: Ustaw prefiks repozytorium jako adres bazowy publikowanych zasobów GitHub Pages. | ES-CO: Define el prefijo del repositorio como ruta base de los recursos de GitHub Pages.
  base: '/Dziennik-Wydatkow-Podroznych/',
});