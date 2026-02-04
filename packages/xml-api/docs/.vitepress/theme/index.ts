import DefaultTheme from "vitepress/theme";
import CodeRunner from "../../components/CodeRunner.vue";
import XmlApiDemo from "../../components/XmlApiDemo.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component("XmlApiDemo", XmlApiDemo);
    app.component("CodeRunner", CodeRunner);
  },
};
