// PL: Importuj funkcję konfiguracji Vite. | ES-CO: Importa la función de configuración de Vite.
import { defineConfig } from 'vite';

// PL: Eksportuj konfigurację dla strony projektu GitHub Pages. | ES-CO: Exporta la configuración para GitHub Pages del repositorio.
export default defineConfig({
  // PL: Dodaj prefiks repozytorium do assetów publikowanej strony. | ES-CO: Agrega el prefijo del repositorio a los recursos publicados.
  base: '/Dziennik-Wydatkow-Podroznych/',
});