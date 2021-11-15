/* eslint-disable */
import Vue from "vue";
import Router from "vue-router";
import Recognition from "@/views/recognition";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/:city",
      name: "Recognition",
      component: Recognition
    },
    {
      path: "/",
      name: "Recognition",
      component: Recognition
    }
  ]
});
