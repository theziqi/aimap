// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
/* eslint-disable */
import Vue from 'vue'
import Antd from 'ant-design-vue'
import App from './App'
import 'ant-design-vue/dist/antd.css'
import vuescroll from "vuescroll"
import "vuescroll/dist/vuescroll.css"
import router from './router'


Vue.config.productionTip = false

Vue.use(Antd)
Vue.use(vuescroll)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
