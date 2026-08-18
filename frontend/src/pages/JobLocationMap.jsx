function JobLocationMap() {
  return (
    <main className="map-page" aria-label="Job Location Map">
      <iframe
        className="map-embed"
        title="Job Location Map"
        src="https://www.google.com/maps/d/embed?mid=1YnckZ2k4jyCu6Agxg4VX0EyWK49puuo&ll=28.284392717060463%2C-82.04171770869505&z=9"
        allowFullScreen
      />
    </main>
  );
}

export default JobLocationMap;
