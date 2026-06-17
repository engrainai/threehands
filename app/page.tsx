import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatPrice, getVisibleListings, isSoldOut, primaryImage } from "@/lib/catalog";

export default async function Home() {
  const listings = await getVisibleListings();
  const featured = listings.find((watch) => watch.featured) ?? listings[0];
  const preview = listings.slice(0, 8);

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker">Vintage mechanical watches</p>
          <h1>Three Hands Vintage</h1>
          <p>
            Curated Swiss-made watches from the 1930s through the 1970s.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/products">
              Shop watches <ArrowUpRight size={17} />
            </Link>
            <a className="button ghost" href="mailto:hello@threehandsvintage.com">
              Contact
            </a>
          </div>
        </div>
        {featured ? (
          <Link className="hero-watch" href={`/watch/${featured.slug}`}>
            <img src={primaryImage(featured)} alt={featured.title} />
            <div>
              <span>{isSoldOut(featured) ? "Sold archive" : "Featured watch"}</span>
              <strong>{featured.title}</strong>
              <em>{isSoldOut(featured) ? "Sold out" : formatPrice(featured.price)}</em>
            </div>
          </Link>
        ) : null}
      </section>

      <section className="inventory-section" id="inventory">
        <div className="section-heading">
          <div>
            <p className="kicker">Current collection</p>
            <h2>Shop</h2>
          </div>
          <Link className="text-link" href="/products">View all</Link>
        </div>
        <div className="watch-grid">
          {preview.map((watch) => {
            const soldOut = isSoldOut(watch);
            return (
              <Link className={`watch-card ${soldOut ? "is-sold" : ""}`} href={`/watch/${watch.slug}`} key={watch.id}>
                <span className="image-wrap">
                  <img src={primaryImage(watch)} alt={watch.title} loading="lazy" />
                  {soldOut ? <span className="sold-ribbon">Sold out</span> : null}
                </span>
                <span className="watch-meta">
                  <span>{watch.brand}</span>
                  <span>{watch.year}</span>
                </span>
                <strong>{watch.title}</strong>
                <em>{soldOut ? "Sold out" : formatPrice(watch.price)}</em>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="showcase">
        {featured ? <img src={featured.images[1] ?? primaryImage(featured)} alt={featured.title} /> : null}
        <div>
          <p className="kicker">Tucson, Arizona</p>
          <h2>Honest vintage watches.</h2>
          <p>Each watch is photographed closely, assessed carefully, and presented plainly.</p>
          <Link className="button ghost light" href="/about">About the shop</Link>
        </div>
      </section>
    </main>
  );
}
