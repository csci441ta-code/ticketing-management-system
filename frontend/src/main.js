import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/test.css' 
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router'

import { defineRule, configure } from 'vee-validate'
import * as rules from '@vee-validate/rules'
import { localize } from '@vee-validate/i18n'
import en from '@vee-validate/i18n/dist/locale/en.json'

// Register all valid rules safely
Object.entries(rules).forEach(([ruleName, ruleFn]) => {
  if (typeof ruleFn === 'function') {
    defineRule(ruleName, ruleFn)
  }
})

configure({
  generateMessage: localize({ en }),
  validateOnInput: true,
})



const app = createApp(App)
const pinia = createPinia()


app.use(pinia)
app.use(router)
app.mount('#app')