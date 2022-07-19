import App from './App.vue';
import { Quasar, Notify } from 'quasar';
import { createApp } from 'vue';
const app = createApp(App);

app.use(Quasar, {
  plugins: { Notify },
});
if (import.meta.env.DEV) {
  app.config.errorHandler = (err, instance, info) => {
    console.error('Vue error', err, info);
  };
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn('vue warn', msg, trace);
  };
}
app.mount('#app');
