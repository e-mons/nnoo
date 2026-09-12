import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/app/', '/auth/', '/invite/'],
    },
    sitemap: 'https://nnoo.app/sitemap.xml',
  };
}
