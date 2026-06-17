"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { EyeOff, ImagePlus, Plus, Save, Search, Trash2, X } from "lucide-react";
import type { WatchListing } from "@/types";

const emptyListing: WatchListing = {
  id: "",
  slug: "",
  title: "",
  brand: "",
  year: "",
  price: 0,
  quantity: 1,
  status: "available",
  hideWhenSold: false,
  featured: false,
  images: [],
  specs: {},
  description: "",
  strap: "",
  createdAt: "",
  updatedAt: ""
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [listings, setListings] = useState<WatchListing[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const selected = listings.find((watch) => watch.id === selectedId) ?? listings[0] ?? emptyListing;

  const filtered = useMemo(() => {
    return listings.filter((watch) => watch.title.toLowerCase().includes(query.toLowerCase()));
  }, [listings, query]);

  useEffect(() => {
    const storedSecret = window.sessionStorage.getItem("adminSecret") ?? "";
    setSecret(storedSecret);
    fetchListings(storedSecret);
  }, []);

  async function fetchListings(adminSecret = secret) {
    setLoading(true);
    const response = await fetch("/api/admin/listings", {
      headers: adminSecret ? { "x-admin-secret": adminSecret } : {}
    });
    if (!response.ok) {
      setMessage("Enter the admin password to load inventory.");
      setLoading(false);
      return;
    }
    const data = await response.json();
    setListings(data.listings);
    setSelectedId(data.listings[0]?.id ?? "");
    setMessage("");
    setLoading(false);
  }

  function updateSelected(next: WatchListing) {
    setListings((current) => current.map((watch) => (watch.id === next.id ? next : watch)));
  }

  function addListing() {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const next = {
      ...emptyListing,
      id,
      slug: `new-watch-${id.slice(0, 8)}`,
      title: "New watch listing",
      createdAt: now,
      updatedAt: now
    };
    setListings((current) => [next, ...current]);
    setSelectedId(id);
  }

  function duplicateSelected() {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const next = {
      ...selected,
      id,
      title: `${selected.title} copy`,
      slug: `${selected.slug}-copy-${id.slice(0, 4)}`,
      createdAt: now,
      updatedAt: now
    };
    setListings((current) => [next, ...current]);
    setSelectedId(id);
  }

  function removeSelected() {
    setListings((current) => current.filter((watch) => watch.id !== selected.id));
    setSelectedId(listings.find((watch) => watch.id !== selected.id)?.id ?? "");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    window.sessionStorage.setItem("adminSecret", secret);
    const response = await fetch("/api/admin/listings", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        ...(secret ? { "x-admin-secret": secret } : {})
      },
      body: JSON.stringify({ listings })
    });
    if (!response.ok) {
      setMessage("Save failed. Check the admin password and Vercel GitHub env vars.");
      return;
    }
    const data = await response.json();
    setListings(data.listings);
    setMessage(`Saved to ${data.storage}.`);
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length || !selected.id) return;

    setUploading(true);
    setMessage("");

    try {
      const uploadedPaths: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("slug", selected.slug || selected.id);

        const response = await fetch("/api/admin/uploads", {
          method: "POST",
          headers: secret ? { "x-admin-secret": secret } : {},
          body: formData
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(data.error ?? "Upload failed");
        }

        const data = await response.json();
        uploadedPaths.push(data.path);
      }

      updateSelected({ ...selected, images: [...selected.images, ...uploadedPaths] });
      setMessage(`${uploadedPaths.length} image${uploadedPaths.length === 1 ? "" : "s"} uploaded. Save changes to update the listing.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(imagePath: string) {
    updateSelected({ ...selected, images: selected.images.filter((image) => image !== imagePath) });
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="kicker">Backend</p>
          <h1>Inventory admin</h1>
        </div>
        <form className="admin-secret" onSubmit={(event) => { event.preventDefault(); fetchListings(secret); }}>
          <input value={secret} onChange={(event) => setSecret(event.target.value)} type="password" placeholder="Admin password" />
          <button className="icon-button" aria-label="Load inventory" title="Load inventory">
            <Search size={18} />
          </button>
        </form>
      </section>

      <form className="admin-layout" onSubmit={save}>
        <aside className="admin-list">
          <div className="admin-tools">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search listings" />
            <button type="button" className="icon-button" onClick={addListing} aria-label="Create listing" title="Create listing">
              <Plus size={18} />
            </button>
          </div>
          {loading ? <p className="muted">Loading inventory...</p> : null}
          {filtered.map((watch) => (
            <button
              type="button"
              className={watch.id === selected.id ? "admin-row active" : "admin-row"}
              key={watch.id}
              onClick={() => setSelectedId(watch.id)}
            >
              <span>{watch.title}</span>
              <em>{watch.quantity <= 0 || watch.status === "sold" ? "Sold" : `${watch.quantity} available`}</em>
            </button>
          ))}
        </aside>

        <section className="editor">
          <div className="editor-actions">
            <button type="button" className="button ghost" onClick={duplicateSelected}>Duplicate</button>
            <button type="button" className="icon-button danger" onClick={removeSelected} aria-label="Delete listing" title="Delete listing">
              <Trash2 size={18} />
            </button>
            <button className="button primary">
              <Save size={17} /> Save changes
            </button>
          </div>
          {message ? <p className="admin-message">{message}</p> : null}

          <div className="form-grid">
            <label>
              Title
              <input value={selected.title} onChange={(event) => updateSelected({ ...selected, title: event.target.value })} />
            </label>
            <label>
              Slug
              <input value={selected.slug} onChange={(event) => updateSelected({ ...selected, slug: slugify(event.target.value) })} />
            </label>
            <label>
              Brand
              <input value={selected.brand} onChange={(event) => updateSelected({ ...selected, brand: event.target.value })} />
            </label>
            <label>
              Year
              <input value={selected.year} onChange={(event) => updateSelected({ ...selected, year: event.target.value })} />
            </label>
            <label>
              Price
              <input type="number" value={selected.price} onChange={(event) => updateSelected({ ...selected, price: Number(event.target.value) })} />
            </label>
            <label>
              Qty
              <input type="number" value={selected.quantity} onChange={(event) => updateSelected({ ...selected, quantity: Number(event.target.value), status: Number(event.target.value) <= 0 ? "sold" : "available" })} />
            </label>
          </div>

          <div className="toggle-row">
            <label>
              <input type="checkbox" checked={selected.featured} onChange={(event) => updateSelected({ ...selected, featured: event.target.checked })} />
              Featured
            </label>
            <label>
              <input type="checkbox" checked={selected.status === "sold"} onChange={(event) => updateSelected({ ...selected, status: event.target.checked ? "sold" : "available", quantity: event.target.checked ? 0 : Math.max(selected.quantity, 1) })} />
              Sold out
            </label>
            <label>
              <input type="checkbox" checked={selected.hideWhenSold} onChange={(event) => updateSelected({ ...selected, hideWhenSold: event.target.checked })} />
              <EyeOff size={16} /> Hide if sold
            </label>
          </div>

          <label>
            Description
            <textarea rows={7} value={selected.description} onChange={(event) => updateSelected({ ...selected, description: event.target.value })} />
          </label>
          <section className="image-editor" aria-label="Listing images">
            <div className="image-editor-head">
              <div>
                <span>Images</span>
                <p>Upload JPG, PNG, or WebP files.</p>
              </div>
              <label className="upload-button">
                <ImagePlus size={18} />
                {uploading ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={uploading}
                  onChange={(event) => {
                    uploadImages(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            {selected.images.length ? (
              <div className="image-admin-grid">
                {selected.images.map((image) => (
                  <div className="image-admin-card" key={image}>
                    <img src={image} alt="" />
                    <button type="button" className="icon-button danger" onClick={() => removeImage(image)} aria-label="Remove image" title="Remove image">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No images uploaded.</p>
            )}
          </section>

          <div className="form-grid">
            {[
              ["reference", "Reference"],
              ["movement", "Movement"],
              ["caseSize", "Case size"],
              ["lugWidth", "Lug width"],
              ["lugToLug", "Lug-to-lug"],
              ["thickness", "Thickness"],
              ["service", "Service"],
              ["boxPapers", "Box / papers"]
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  value={selected.specs[key as keyof WatchListing["specs"]] ?? ""}
                  onChange={(event) => updateSelected({ ...selected, specs: { ...selected.specs, [key]: event.target.value } })}
                />
              </label>
            ))}
          </div>
          <label>
            Strap
            <input value={selected.strap ?? ""} onChange={(event) => updateSelected({ ...selected, strap: event.target.value })} />
          </label>
        </section>
      </form>
    </main>
  );
}
