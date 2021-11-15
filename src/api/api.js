/* eslint-disable */
import axios from "axios";
const http = axios.create({
  withCredentials: true,
  baseURL: "/api"
});

export const crop = params => {
  return http({
    method: "GET",
    url: `/crop?city=${params.city}&category=${params.category}&x1=${params.x1}&x2=${params.x2}&y1=${params.y1}&y2=${params.y2}`
  }).then(res => res.data);
};

export const analysis = params => {
  return http({
    method: "GET",
    url: `/analysis?city=${params.city}&x1=${params.x1}&x2=${params.x2}&y1=${params.y1}&y2=${params.y2}`
  }).then(res => res.data);
};
