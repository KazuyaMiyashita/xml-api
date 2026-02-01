import { defineConfig } from 'vitepress'
import path from 'path'

export default defineConfig({
  title: "XML API",
  description: "A foundational XML parser and manipulation API for WYSIWYG editors and IDEs.",
  vite: {
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
      { text: 'API', link: '/api/xml-api' },
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
            { text: 'Decision', link: '/architecture/decision' },
            { text: 'Comparison', link: '/architecture/comparison' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'XMLAPI', link: '/api/xml-api' },
            { text: 'DOM Interface', link: '/api/dom-interface' },
            { text: 'Binding & Events', link: '/api/binding-events' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Interactive Demo', link: '/examples/interactive-demo' },
            { text: 'Programmatic Usage', link: '/examples/programmatic-usage' },
            { text: 'Basic Usage', link: '/examples/basic-usage' },
            { text: 'Demo Walkthrough', link: '/examples/demo-walkthrough' }
          ]
        }
      ]
    },
    socialLinks: []
  }
})
