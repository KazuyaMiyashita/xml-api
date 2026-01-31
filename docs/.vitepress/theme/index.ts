import DefaultTheme from 'vitepress/theme'
import XmlApiDemo from '../../components/XmlApiDemo.vue'
import CodeRunner from '../../components/CodeRunner.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('XmlApiDemo', XmlApiDemo)
    app.component('CodeRunner', CodeRunner)
  }
}