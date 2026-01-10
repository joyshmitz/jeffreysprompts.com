/**
 * JSON-LD Structured Data for SEO
 *
 * Provides rich snippets for search engines with schema.org vocabulary
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Website structured data
export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Jeffrey's Prompts",
  alternateName: "JeffreysPrompts.com",
  url: "https://jeffreysprompts.com",
  description: "A curated collection of battle-tested prompts for AI coding agents",
  author: {
    "@type": "Person",
    name: "Jeffrey Emanuel",
    url: "https://jeffreyemanuel.com",
    sameAs: [
      "https://twitter.com/doodlestein",
      "https://github.com/Dicklesworthstone",
    ],
  },
  publisher: {
    "@type": "Person",
    name: "Jeffrey Emanuel",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://jeffreysprompts.com/?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

// Software application structured data
export const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Jeffrey's Prompts CLI",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux, Windows",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description: "Command-line tool for browsing and installing AI coding prompts",
  downloadUrl: "https://jeffreysprompts.com/install.sh",
  author: {
    "@type": "Person",
    name: "Jeffrey Emanuel",
  },
};

// Breadcrumb generator for pages
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
