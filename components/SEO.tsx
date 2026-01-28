import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogImage?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  schema?: string;
}

const SEO = ({
  title = 'CubeGen AI: Free AI Architecture & Diagram Generator | Text to Diagram',
  description = 'Realise your vision with CubeGen AI. The best free AI diagram generator and AI Architecture generator. Create professional diagrams, neural networks, and cloud architecture from text instantly. DiagramGPT alternative.',
  keywords = 'AI diagram generator, AI Architecture generator, AI Architecture Diagram Generator, AI neuron generator, DiagramGPT, Free AI diagram generator, Free AI Architecture generator, AI diagram generator online, AI Architecture generator online, text to diagram tool, CubeGen AI, diagram from text, cloud architecture, AWS, GCP, Azure, microservices, software architecture, free architecture tool',
  canonical = 'https://cubegenai.com/',
  ogTitle = 'CubeGen AI — Free AI Architecture & Diagram Generator',
  ogDescription = 'Realise your vision with CubeGen AI. Create professional software architecture diagrams and neural networks instantly from text. Free AI diagram generator.',
  ogType = 'website',
  ogImage = 'https://cubegenai.com/social-preview.svg',
  twitterCard = 'summary_large_image',
  twitterTitle = 'CubeGen AI — Free AI Architecture & Diagram Generator',
  twitterDescription = 'Realise your vision with CubeGen AI. Create professional software architecture diagrams and neural networks instantly from text. Free AI diagram generator.',
  twitterImage = 'https://cubegenai.com/social-preview.svg',
  schema,
}: SEOProps) => {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create description meta tag
    let descriptionMeta = document.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.setAttribute('name', 'description');
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute('content', description);

    // Update or create keywords meta tag
    let keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (!keywordsMeta) {
      keywordsMeta = document.createElement('meta');
      keywordsMeta.setAttribute('name', 'keywords');
      document.head.appendChild(keywordsMeta);
    }
    keywordsMeta.setAttribute('content', keywords);

    // Update or create canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);

    // Update or create Open Graph meta tags
    const ogTags = [
      { property: 'og:title', content: ogTitle },
      { property: 'og:description', content: ogDescription },
      { property: 'og:type', content: ogType },
      { property: 'og:image', content: ogImage },
      { property: 'og:url', content: canonical },
    ];

    ogTags.forEach(tag => {
      let ogMeta = document.querySelector(`meta[property="${tag.property}"]`);
      if (!ogMeta) {
        ogMeta = document.createElement('meta');
        ogMeta.setAttribute('property', tag.property);
        document.head.appendChild(ogMeta);
      }
      ogMeta.setAttribute('content', tag.content);
    });

    // Update or create Twitter Card meta tags
    const twitterTags = [
      { property: 'twitter:card', content: twitterCard },
      { property: 'twitter:title', content: twitterTitle },
      { property: 'twitter:description', content: twitterDescription },
      { property: 'twitter:image', content: twitterImage },
    ];

    twitterTags.forEach(tag => {
      let twitterMeta = document.querySelector(`meta[property="${tag.property}"]`);
      if (!twitterMeta) {
        twitterMeta = document.createElement('meta');
        twitterMeta.setAttribute('property', tag.property);
        document.head.appendChild(twitterMeta);
      }
      twitterMeta.setAttribute('content', tag.content);
    });

    // Update JSON-LD schema if needed
    updateSchema(canonical, title, description, schema);
  }, [title, description, keywords, canonical, ogTitle, ogDescription, ogType, ogImage, twitterCard, twitterTitle, twitterDescription, twitterImage, schema]);

  return null;
};

const updateSchema = (url: string, title: string, description: string, customSchema?: string) => {
  // Remove existing schema script if it exists
  const existingSchema = document.querySelector('script[type="application/ld+json"][data-schema="dynamic"]');
  if (existingSchema) {
    existingSchema.remove();
  }

  // Create new schema script
  const schemaScript = document.createElement('script');
  schemaScript.type = 'application/ld+json';
  schemaScript.setAttribute('data-schema', 'dynamic');

  if (customSchema) {
    schemaScript.textContent = customSchema;
  } else {
    schemaScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "url": url,
      "name": title,
      "description": description,
      "publisher": {
        "@type": "Organization",
        "name": "CubeGen AI",
        "url": "https://cubegenai.com/"
      }
    });
  }

  document.head.appendChild(schemaScript);
};

export default SEO;
