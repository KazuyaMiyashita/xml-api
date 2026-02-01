import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import path from 'path'

export default withMermaid(defineConfig({
  title: "XML API",
  description: "A foundational XML parser and manipulation API for WYSIWYG editors and IDEs.",
  vite: {
    optimizeDeps: {
      include: ['mermaid', 'vitepress-plugin-mermaid', 'dayjs']
    },
    ssr: {
      noExternal: ['mermaid', 'vitepress-plugin-mermaid']
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../../src')
      }
    }
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'API', link: '/api/reference/README' },
      { text: 'Examples', link: '/examples/interactive-demo' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
            { text: 'Full Fidelity', link: '/guide/fidelity' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'Decision', link: '/architecture/decision' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/reference/README' },
            {
              text: 'Classes',
              collapsed: false,
              items: [
                { text: 'XMLAPI', link: '/api/reference/classes/XMLAPI' },
                { text: 'AST', link: '/api/reference/classes/AST' },
                { text: 'XMLBinder', link: '/api/reference/classes/XMLBinder' },
                { text: 'Formatter', link: '/api/reference/classes/Formatter' },
                { text: 'Document', link: '/api/reference/classes/Document' },
                { text: 'Element', link: '/api/reference/classes/Element' }
              ]
            }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Interactive Demo', link: '/examples/interactive-demo' },
            { text: 'Usage Guide', link: '/examples/programmatic-usage' }
          ]
        }
      ]
    },
    socialLinks: []
  }
}))
