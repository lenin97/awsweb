// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://resumegenai.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  exclude: ['/server-sitemap.xml'],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://resumegenai.com/server-sitemap.xml'
    ]
  }
}
