const flagFiles = import.meta.glob('./assets/flags/*.svg', {
  eager: true,
  import: 'default',
  query: '?url',
});

const countryFlagAssets = Object.fromEntries(
  Object.entries(flagFiles).map(([path, url]) => [path.split('/').pop().replace(/\.svg$/, ''), url]),
);

export default countryFlagAssets;