import App from './App.vue';
import { Quasar, Notify } from 'quasar';
import { createApp } from 'vue';
const app = createApp(App);

app.use(Quasar, {
  plugins: { Notify },
});

app.mount('#app');
