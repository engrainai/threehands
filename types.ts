export type WatchStatus = "available" | "sold";

export type WatchListing = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  year: string;
  price: number;
  quantity: number;
  status: WatchStatus;
  hideWhenSold: boolean;
  featured: boolean;
  images: string[];
  specs: {
    reference?: string;
    movement?: string;
    caseSize?: string;
    lugWidth?: string;
    lugToLug?: string;
    thickness?: string;
    service?: string;
    boxPapers?: string;
  };
  description: string;
  strap?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
};
