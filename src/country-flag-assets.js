// PL: Załaduj pliki flag jako adresy URL podczas kompilacji Vite. | ES-CO: Carga las banderas como URL durante la compilación de Vite.
const flagFiles = import.meta.glob('./assets/flags/*.svg', {
  // PL: Dołącz każdy znaleziony plik od razu do modułu. | ES-CO: Incluye de inmediato cada archivo encontrado en el módulo.
  eager: true,
  // PL: Pobierz domyślną wartość eksportowaną przez moduł zasobu. | ES-CO: Obtiene el valor predeterminado exportado por el módulo del recurso.
  import: 'default',
  // PL: Zwróć ścieżkę zasobu zamiast jego treści SVG. | ES-CO: Devuelve la ruta del recurso en lugar del contenido SVG.
  query: '?url',
});

// PL: Zamień ścieżki plików na mapę kodów krajów i adresów flag. | ES-CO: Convierte las rutas en un mapa de códigos de país y URL de banderas.
const countryFlagAssets = Object.fromEntries(
  // PL: Wyodrębnij kod kraju z nazwy pliku i zachowaj odpowiadający mu adres URL. | ES-CO: Extrae el código del país del nombre y conserva su URL correspondiente.
  Object.entries(flagFiles).map(([path, url]) => [path.split('/').pop().replace(/\.svg$/, ''), url]),
);

// PL: Udostępnij mapę flag pozostałym modułom aplikacji. | ES-CO: Expone el mapa de banderas a los demás módulos de la aplicación.
export default countryFlagAssets;