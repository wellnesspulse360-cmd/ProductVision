
export interface GeneratedImage {
  ratio: "16:9" | "1:1" | "9:16";
  type: "hero" | "ad" | "pinterest";
  url: string; // Base64 data URL
  loading: boolean;
}

export interface SocialPosts {
  youtube: { title: string; description: string };
  facebook: string;
  instagram: string;
  tiktok: string;
  pinterest: { title: string; description: string };
  threads: string;
}

export interface ProductAnalysis {
  productName: string;
  visualDescription: string;
  pinterestHook: string;
  soraVideoScript: string;
  veoVideoPrompt: string;
  socialPosts: SocialPosts;
  // Added support for grounding URLs required when using googleSearch tool
  groundingUrls?: { title: string; url: string }[];
}

export interface CampaignItem {
  id: string;
  url: string;
  affiliateLink: string;
  articleUrl: string;
  instructions: string;
  status: string;
  rowIndex: number;
}

export enum AppState {
  IDLE,
  FETCHING_CAMPAIGNS,
  ANALYZING,
  GENERATING_IMAGES,
  COMPLETE,
  ERROR
}
