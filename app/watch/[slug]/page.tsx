import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { formatPrice, getListingBySlug, getVisibleListings, isSoldOut } from "@/lib/catalog";

export async function generateStaticParams() {
  const listings = await getVisibleListings(true);
  return listings.map((watch) => ({ slug: watch.slug }));
}

export default async function WatchPage({ params }: { params: { slug: string } }) {
  const watch = await getListingBySlug(params.slug);
  if (!watch) notFound();

  const soldOut = isSoldOut(watch);
  const specRows = [
    ["Reference", watch.specs.reference],
    ["Movement", watch.specs.movement],
    ["Case", watch.specs.caseSize],
    ["Lug width", watch.specs.lugWidth],
    ["Lug-to-lug", watch.specs.lugToLug],
    ["Thickness", watch.specs.thickness],
    ["Service", watch.specs.service],
    ["Box / papers", watch.specs.boxPapers]
  ].filter(([, value]) => value);

  return (
    <main className="product-page">
      <Link className="back-link" href="/#inventory">
        <ArrowLeft size={16} /> Inventory
      </Link>
      <section className="product-shell">
        <div className="gallery">
          {watch.images.map((image, index) => (
            <img key={image} src={image} alt={`${watch.title} image ${index + 1}`} />
          ))}
        </div>
        <aside className="product-info">
          <p className="kicker">{watch.year} · {watch.brand}</p>
          <h1>{watch.title}</h1>
          <div className="price-row">
            <strong>{soldOut ? "Sold out" : formatPrice(watch.price)}</strong>
            <span>{watch.quantity} in stock</span>
          </div>
          <p>{watch.description}</p>
          {watch.strap ? <p className="strap">Paired with {watch.strap}.</p> : null}
          <dl className="spec-list">
            {specRows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <a className={`button ${soldOut ? "ghost" : "primary"}`} href={`mailto:hello@threehandsvintage.com?subject=${encodeURIComponent(watch.title)}`}>
            <Mail size={17} /> {soldOut ? "Ask about similar watches" : "Inquire to purchase"}
          </a>
        </aside>
      </section>
    </main>
  );
}
