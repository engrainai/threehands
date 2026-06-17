import Link from "next/link";
import { formatPrice, getVisibleListings, isSoldOut, primaryImage } from "@/lib/catalog";

export const metadata = {
  title: "Shop | Three Hands Vintage"
};

export default async function ProductsPage() {
  const listings = await getVisibleListings();

  return (
    <main className="collection-page">
      <section className="page-hero">
        <p className="kicker">Current collection</p>
        <h1>Shop</h1>
      </section>
      <section className="inventory-section flush">
        <div className="watch-grid">
          {listings.map((watch) => {
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
    </main>
  );
}
