import DefaultTheme from "vitepress/theme";
import CodeRunner from "../../components/CodeRunner.vue";
import XmlApiDemo from "../../components/XmlApiDemo.vue";

export default {
  extends: DefaultTheme,
  // biome-ignore lint/suspicious/noExplicitAny: VitePress app type is not strictly typed here
  enhanceApp({ app }: { app: any }) {
    app.component("XmlApiDemo", XmlApiDemo);
    app.component("CodeRunner", CodeRunner);
  },
};
