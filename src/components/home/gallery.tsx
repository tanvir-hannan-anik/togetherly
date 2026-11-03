import EventImage from "@/components/EventImage";

const photos = [
  { src: "/image/gallery/gallery-1.jpg", caption: "Riverside cleanup" },
  { src: "/image/gallery/gallery-2.jpg", caption: "Tree plantation day" },
  { src: "/image/gallery/gallery-3.jpg", caption: "Winter clothes drive" },
  { src: "/image/gallery/gallery-4.jpg", caption: "Community food bank" },
  { src: "/image/gallery/gallery-5.jpg", caption: "School supplies donation" },
  { src: "/image/gallery/gallery-6.jpg", caption: "Park restoration" },
];

export default function Gallery() {
  return (
    <section
      className="container section-space"
      aria-labelledby="gallery-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Moments that matter</p>
          <h2 id="gallery-heading">Community in action</h2>
          <p className="muted">Snapshots from the people who showed up.</p>
        </div>
      </div>
      <ul className="gallery-grid">
        {photos.map(({ src, caption }) => (
          <li key={src}>
            <figure>
              <EventImage src={src} alt={caption} className="gallery-image" />
              <figcaption>{caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
