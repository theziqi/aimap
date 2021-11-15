<template>
  <div id="components-layout-demo-basic">
    <a-layout>
      <a-layout-sider v-model="collapsed" collapsible collapsedWidth="40">
        <div style="display: flex">
          <div class="side-side">目标提取</div>
          <vue-scroll :ops="ops" style="width: 100%; height: 90vh">
            <div class="side-content" v-show="!collapsed">
              <a-button
                :class="{
                  'side-button': whichButton !== 1,
                  'side-button-focus': whichButton === 1
                }"
                @click="buttonNum(1)"
              >
                裸地提取
              </a-button>
              <a-button
                :class="{
                  'side-button': whichButton !== 2,
                  'side-button-focus': whichButton === 2
                }"
                @click="buttonNum(2)"
              >
                苫盖提取
              </a-button>
              <a-button
                :class="{
                  'side-button': whichButton !== 3,
                  'side-button-focus': whichButton === 3
                }"
                @click="buttonNum(3)"
              >
                水体提取
              </a-button>
              <a-button
                :class="{
                  'side-button': whichButton !== 4,
                  'side-button-focus': whichButton === 4
                }"
                @click="buttonNum(4)"
              >
                建筑提取
              </a-button>
              <a-button
                :class="{
                  'side-button': whichButton !== 5,
                  'side-button-focus': whichButton === 5
                }"
                @click="buttonNum(5)"
              >
                道路提取
              </a-button>
              <a-button
                :class="{
                  'side-button': whichButton !== 6,
                  'side-button-focus': whichButton === 6
                }"
                @click="buttonNum(6)"
              >
                植被提取
              </a-button>
              <a-button
                :class="{
                  'side-button': whichButton !== 7,
                  'side-button-focus': whichButton === 7
                }"
                @click="buttonNum(7)"
              >
                农田提取
              </a-button>
              <a-button
                :class="{
                  'side-button': whichButton !== 8,
                  'side-button-focus': whichButton === 8
                }"
                @click="buttonNum(8)"
              >
                工厂提取
              </a-button>
            </div>
          </vue-scroll>
        </div>
      </a-layout-sider>
      <a-layout-content>
        <div style="width: 100%">
          <div @click="interaction()" class="area" title="框选识别">
            <a-icon type="form" />
          </div>
          <div
            class="echarts-pie"
            id="main"
            style="width: 300px; height: 310px"
            v-if="showPie"
          ></div>
          <div id="map" class="map"></div>
          <div class="popup" ref="popup" v-show="contentData !== ''">
            <div class="title">
              <div style="font-weight: bold">地物分类占比</div>
              <div class="icon-close" @click="closePopup">
                <a-icon type="close" />
              </div>
            </div>
            <div>
              <span v-if="whichButton === 1"
                >裸地面积占比：{{ contentData }}%</span
              >
              <span v-if="whichButton === 2"
                >苫盖面积占比：{{ contentData }}%</span
              >
              <span v-if="whichButton === 3"
                >水体面积占比：{{ contentData }}%</span
              >
              <span v-if="whichButton === 4"
                >建筑面积占比：{{ contentData }}%</span
              >
              <span v-if="whichButton === 5"
                >道路面积占比：{{ contentData }}%</span
              >
              <span v-if="whichButton === 6"
                >植被面积占比：{{ contentData }}%</span
              >
              <span v-if="whichButton === 7"
                >农田面积占比：{{ contentData }}%</span
              >
              <span v-if="whichButton === 8"
                >工厂面积占比：{{ contentData }}%</span
              >
            </div>
          </div>
        </div>
      </a-layout-content>
    </a-layout>
  </div>
</template>
<script>
/* eslint-disable */
import "ol/ol.css";
import ImageLayer from "ol/layer/Image";
import Map from "ol/Map";
import Projection from "ol/proj/Projection";
import Static from "ol/source/ImageStatic";
import View from "ol/View";
import { getCenter } from "ol/extent";
import Draw from "ol/interaction/Draw";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { createBox } from "ol/interaction/Draw";
import Tile from "ol/layer/Tile";
import Overlay from "ol/Overlay";
import { crop, analysis } from "../api/api";
import { compose } from "ol/transform";
import * as echarts from "echarts";
export default {
  data() {
    return {
      collapsed: false,
      whichButton: 1,
      map: {},
      imageLayer: {},
      draw: {},
      source: {},
      vectorLayer: {},
      ops: {
        vuescroll: {},
        scrollPanel: {},
        rail: {
          keepShow: true
        },
        bar: {
          hoverStyle: true,
          onlyShowBarOnScroll: false, //是否只有滚动的时候才显示滚动条
          background: "#F5F5F5", //滚动条颜色
          opacity: 0.5, //滚动条透明度
          "overflow-x": "hidden"
        }
      },
      overlay: null,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      allContent: [],
      contentData: "",
      showPie: false,
      city: "nanjing",
      projection: {},
      extent: []
    };
  },
  mounted() {
    if (["nanjing", "luoyang"].indexOf(this.$route.params.city) !== -1) {
      this.city = this.$route.params.city;
    }
    if (this.city === "nanjing") {
      this.extent = [0, 0, 8192, 8192];
    } else if (this.city === "luoyang") {
      this.extent = [0, 0, 8192, 8192];
    }
    this.projection = new Projection({
      code: "xkcd-image",
      units: "pixels",
      extent: this.extent
    });
    this.initMap();
  },
  methods: {
    buttonNum(num) {
      this.whichButton = num;
      if (
        !(
          this.top === 0 &&
          this.bottom === 0 &&
          this.right === 0 &&
          this.left === 0
        )
      ) {
        this.map.removeLayer(this.imageLayer);
        this.overlay.setPosition(undefined);
        this.contentData = "";
        crop({
          city: this.city,
          category: this.whichButton.toString(),
          x1: this.left,
          x2: this.right,
          y1: this.bottom,
          y2: this.top
        })
          .then(res => {
            // console.log(res);
            (this.imageLayer = new ImageLayer({
              source: new Static({
                attributions:
                  '© <a href="http://xkcd.com/license.html">xkcd</a>',
                url: "/api" + res,
                projection: this.projection,
                imageExtent: [this.left, this.bottom, this.right, this.top]
              })
            })),
              this.map.addLayer(this.imageLayer);

            this.contentData = this.allContent[this.whichButton];
            this.currentCoordinate = [this.right, this.top];
            setTimeout(() => {
              // 设置弹窗位置
              // 这里要设置定时器，不然弹窗首次出现，底图会跑偏
              this.overlay.setPosition(this.currentCoordinate);
            }, 0);
          })
          .catch(err => {
            console.error("获取步骤信息出错: " + err);
          });
      }
    },
    initMap() {
      this.source = new VectorSource({ wrapX: false });
      this.vectorLayer = new VectorLayer({
        source: this.source
      });
      this.overlay = new Overlay({
        element: this.$refs.popup, // 弹窗标签，在html里
        autoPan: true, // 如果弹窗在底图边缘时，底图会移动
        autoPanAnimation: {
          // 底图移动动画
          duration: 250
        }
      });
      // console.log(require("../assets/luoyang.png"));
      this.map = new Map({
        layers: [
          new ImageLayer({
            source: new Static({
              attributions: '© <a href="http://xkcd.com/license.html">xkcd</a>',
              url: require("../assets/" + this.city + ".png"),
              projection: this.projection,
              imageExtent: this.extent
            })
          }),
          this.vectorLayer
        ],
        overlays: [this.overlay],
        target: "map",
        view: new View({
          projection: this.projection,
          center: getCenter(this.extent),
          zoom: 3,
          maxZoom: 20,
          minZoom: 1
        })
      });
    },
    interaction() {
      this.top = 0;
      this.bottom = 0;
      this.left = 0;
      this.right = 0;
      this.source.clear();
      this.map.removeLayer(this.imageLayer);
      this.overlay.setPosition(undefined);
      this.contentData = "";
      this.allContent = [];
      this.showPie = false;
      let that = this;
      this.draw = new Draw({
        source: this.source,
        type: "Circle",
        geometryFunction: createBox()
      });
      this.map.addInteraction(this.draw);
      this.draw.on("drawend", function(evt) {
        that.drawEnd(evt);
      });
    },
    drawEnd(evt) {
      const geo = evt.feature.getGeometry();
      const points = geo.getCoordinates();
      // console.warn(points, "绘制结束，点坐标");
      this.map.removeInteraction(this.draw); // 移除绘制

      this.top = points[0][0][1];
      this.bottom = points[0][0][1];
      this.left = points[0][0][0];
      this.right = points[0][0][0];
      for (let i = 0; i < points[0].length; i++) {
        if (points[0][i][0] < this.left) {
          this.left = points[0][i][0];
        }
        if (points[0][i][0] > this.right) {
          this.right = points[0][i][0];
        }
        if (points[0][i][1] > this.top) {
          this.top = points[0][i][1];
        }
        if (points[0][i][1] < this.bottom) {
          this.bottom = points[0][i][1];
        }
      }

      let tem_crop = crop({
        city: this.city,
        category: this.whichButton.toString(),
        x1: this.left,
        x2: this.right,
        y1: this.bottom,
        y2: this.top
      });
      let tem_analysis = analysis({
        city: this.city,
        x1: this.left,
        x2: this.right,
        y1: this.bottom,
        y2: this.top
      });
      let that = this;
      Promise.all([tem_crop, tem_analysis])
        .then(function([cropValue, analysisValue]) {
          if (that.allContent.length === 0) {
            that.allContent = analysisValue;
          }

          that.showPie = true;
          that.$nextTick(function() {
            that.getPie();
          });

          (that.imageLayer = new ImageLayer({
            source: new Static({
              attributions: '© <a href="http://xkcd.com/license.html">xkcd</a>',
              url: "/api" + cropValue,
              projection: that.projection,
              imageExtent: [that.left, that.bottom, that.right, that.top]
            })
          })),
            that.map.addLayer(that.imageLayer);

          that.contentData = that.allContent[that.whichButton];
          let currentCoordinate = [that.right, that.top];
          setTimeout(() => {
            // 设置弹窗位置
            // 这里要设置定时器，不然弹窗首次出现，底图会跑偏
            that.overlay.setPosition(currentCoordinate);
          }, 0);
        })
        .catch(err => {
          console.error("获取步骤信息出错: " + err);
        });
    },
    // 关闭弹窗
    closePopup() {
      // 把弹窗位置设置为undefined，并清空坐标数据
      this.overlay.setPosition(undefined);
      this.contentData = "";
      this.source.clear();
      this.map.removeLayer(this.imageLayer);
    },
    getPie() {
      // 绘制图表
      var myChart = echarts.init(document.getElementById("main"));
      // 指定图表的配置项和数据
      var option = {
        //标题
        title: {
          text: "该区域各分类占比统计图",
          x: "left", //标题位置
          top: 10,
          left: 10,
          textStyle: {
            //标题内容的样式
            color: "#fff",
            fontStyle: "normal",
            fontWeight: "bold",
            fontSize: 14 //主题文字字体大小，默认为18px
          }
        },
        // stillShowZeroSum: true,
        //鼠标划过时饼状图上显示的数据
        tooltip: {
          trigger: "item",
          formatter: "{b}:{d}%"
        },
        //图例
        legend: {
          //图例  标注各种颜色代表的模块
          // orient: 'vertical',//图例的显示方式  默认横向显示
          bottom: 10, //控制图例出现的距离  默认左上角
          left: "center", //控制图例的位置
          // itemWidth: 16,//图例颜色块的宽度和高度
          // itemHeight: 12,
          textStyle: {
            //图例中文字的样式
            color: "#fff",
            fontSize: 12
          },
          data: ["裸地", "苫盖", "水体", "建筑", "道路", "植被", "农田", "工厂"] //图例上显示的饼图各模块上的名字
        },
        //饼图中各模块的颜色
        color: [
          "rgb(255, 20, 147)",
          "rgb(205, 92, 92)",
          "rgb(0, 191, 255)",
          "rgb(178, 34, 34)",
          "rgb(72, 61, 139)",
          "rgb(0, 255, 0)",
          "rgb(255, 215, 0)",
          "rgb(50, 0, 150)"
        ],
        // 饼图数据
        series: {
          // name: 'bug分布',
          type: "pie", //echarts图的类型   pie代表饼图
          radius: "50%", //饼图中饼状部分的大小所占整个父元素的百分比
          center: ["50%", "45%"], //整个饼图在整个父元素中的位置
          // data:''               //饼图数据
          data: [
            //每个模块的名字和值
            { name: "裸地", value: this.allContent[1] },
            { name: "苫盖", value: this.allContent[2] },
            { name: "水体", value: this.allContent[3] },
            { name: "建筑", value: this.allContent[4] },
            { name: "道路", value: this.allContent[5] },
            { name: "植被", value: this.allContent[6] },
            { name: "农田", value: this.allContent[7] },
            { name: "工厂", value: this.allContent[8] }
          ],
          itemStyle: {
            normal: {
              label: {
                show: true, //饼图上是否出现标注文字 标注各模块代表什么  默认是true
                // position: 'inner',//控制饼图上标注文字相对于饼图的位置  默认位置在饼图外
                textStyle: {
                  //图例中文字的样式
                  color: "#fff",
                  fontSize: 12
                }
              },
              labelLine: {
                show: true //官网demo里外部标注上的小细线的显示隐藏    默认显示
              }
            }
          }
        }
      };
      // 使用刚指定的配置项和数据显示图表。
      myChart.setOption(option);
    }
  }
};
</script>

<style lang="scss">
#components-layout-demo-basic .ant-layout-sider {
  background: #0c0b09;
  color: #fff;
  min-height: 100vh;
  overflow: auto;
}
#components-layout-demo-basic .ant-layout-content {
  background: #000000;
  color: #fff;
  min-height: 100vh;
}
.side-side {
  width: 30px;
  font-weight: 600;
  font-size: 16px;
  color: #fff;
  padding-top: 20px;
  padding-left: 10px;
}
.side-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.side-button {
  height: 40px;
  width: 100px;
  background-color: #221a36;
  border-color: #221a36;
  opacity: 0.8;
  color: #fff;
  margin-top: 20px;
}
.side-button:hover {
  opacity: 1;
  font-weight: 600;
  color: #fff;
  background-color: #221a36;
  border-color: #221a36;
}
.ant-btn:focus {
  opacity: 1 !important;
  font-weight: 600 !important;
  color: #fff !important;
  background-color: #066aff !important;
  border-color: #066aff !important;
}
.side-button-focus {
  margin-top: 20px;
  height: 40px;
  width: 100px;
  opacity: 1;
  font-weight: 600;
  color: #fff;
  background-color: #066aff !important;
  border-color: #066aff !important;
}
.map {
  width: 100vw;
  height: 100vh;
}
/deep/.__bar-is-vertical {
  right: -1px !important;
}
// 隐藏横向滚动条
/deep/.__bar-is-horizontal {
  display: none !important;
}
.area {
  position: absolute;
  top: 60px;
  margin-left: 8px;
  z-index: 30;
  width: 23px;
  height: 23px;
  background-color: #335177;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
}
.echarts-pie {
  position: absolute;
  // top: 100px;
  bottom: 0;
  z-index: 30;
  background: black;
  opacity: 0.8;
}
.area:hover {
  background-color: #486fa1;
}
.popup {
  min-width: 280px;
  position: relative;
  background: black;
  color: #fff;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  transform: translate(-50%, calc(-100% - 12px));
  opacity: 0.8;

  /* 弹窗下方的小三角形 */
  &::after {
    display: block;
    content: "";
    width: 0;
    height: 0;
    position: absolute;
    border: 12px solid transparent;
    border-top-color: black;
    bottom: -23px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0.8;
  }
}
.title {
  display: flex;
  justify-content: space-between;
}
/* 关闭弹窗按钮 */
.icon-close {
  cursor: pointer;
  margin-bottom: 10px;
}
</style>
