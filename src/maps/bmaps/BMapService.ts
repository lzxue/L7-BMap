import {
  BaseMapService,
  Bounds,
  ICameraOptions,
  ILngLat,
  IMercator,
  IPoint,
  IStatusOptions,
  IViewport,
  MapServiceEvent,
  MapStyleConfig,
  Point,
  Viewport
} from "@antv/l7";
import { DOM } from "@antv/l7-utils";
import { mat4, vec3 } from "gl-matrix";

const EventMap: {
  [key: string]: any;
} = {
  mapmove: "moving",
  camerachange: "resize",
  zoomchange: "zoomend",
  dragging: "dragging"
};

export default class AMapService extends BaseMapService<BMapGL.Map> {
  protected viewport: IViewport = null;

  getMap() {
    return this.map as BMapGL.Map;
  }

  handleCameraChanged = (e?: any) => {
    // Tip: 统一触发地图变化事件
    this.emit("mapchange");
    // resync
    const map = this.getMap();
    const target = e.target;
    const cameraPosition = target.getCameraPosition();
    const { lng, lat } = map.getCenter();
    const option = {
      center: [lng, lat],
      viewportHeight: map.getContainer().clientHeight,
      viewportWidth: map.getContainer().clientWidth,
      bearing: 0,
      pitch: target.getTilt(),
      zoom: target.getZoom() - 1,
      cameraHeight: 0,
      cameraPosition
    };
    this.viewport.syncWithMapCamera(option as any);
    this.updateCoordinateSystemService();
    this.cameraChangedCallback(this.viewport);
  };

  setBgColor(color: string): void {
    throw new Error("Method not implemented.");
  }

  async init(): Promise<void> {
    console.log("enter");
    this.viewport = new Viewport();
    this.map = this.config.mapInstance as any;
    // this.mapType = this.config.mapType;
    this.simpleMapCoord.setSize(10000);
    this.$mapContainer = this.map.getContainer();

    const point = new BMapGL.Point(121.30654632240122, 31.25744185633306);
    this.map.centerAndZoom(point, 12);
    this.map.enableScrollWheelZoom();

    this.map.onload = this.handleCameraChanged;

    this.map.onmoving = this.handleCameraChanged;

    this.map.onresize = this.handleCameraChanged;
  }

  destroy(): void {
    this.getMap().getContainer().remove();
  }

  onCameraChanged(callback: (viewport: IViewport) => void): void {
    this.cameraChangedCallback = callback;
  }

  // init map
  public addMarkerContainer(): void {
    const container = this.getMarkerContainer();
    this.markerContainer = DOM.create("div", "l7-marker-container", container);
    this.markerContainer.setAttribute("tabindex", "-1");
  }
  getMarkerContainer(): HTMLElement {
    return this.markerContainer;
  }

  // MapEvent // 定义事件类型
  public on(type: string, handle: (...args: any[]) => void): void {
    if (MapServiceEvent.indexOf(type) !== -1) {
      this.eventEmitter.on(type, handle);
    } else {
      // 统一事件名称
      this.map.on(EventMap[type] || type, handle);
    }
  }
  public off(type: string, handle: (...args: any[]) => void): void {
    this.map.off(EventMap[type] || type, handle);
    this.eventEmitter.off(type, handle);
  }
  once(type: string, handler: (...args: any[]) => void): void {
    throw new Error("Method not implemented.");
  }

  // get dom
  getContainer(): HTMLElement | null {
    return this.getMap().getContainer();
  }
  getSize(): [number, number] {
    const size = this.getMap().getSize();
    return [size.width, size.height];
  }

  // get map status method
  getMinZoom(): number {
    return 5;
    // return this.mapType.getMinZoom();
  }
  getMaxZoom(): number {
    return 20;
    // return this.mapType.getMaxZoom();
  }

  // get map params
  getType() {
    return "bd09";
  }
  getZoom(): number {
    return this.getMap().getZoom();
  }
  getCenter(): ILngLat {
    const { lng, lat } = this.getMap().getCenter();
    return {
      lng,
      lat
    };
  }
  getPitch(): number {
    throw new Error("Method not implemented.");
  }
  getRotation(): number {
    throw new Error("Method not implemented.");
  }
  getBounds(): Bounds {
    const { getNorthEast, getSouthWest } = this.getMap().getBounds();
    const ne = getNorthEast();
    const sw = getSouthWest();
    return [
      [ne.lng, ne.lat],
      [sw.lng, sw.lat]
    ];
  }
  getMapContainer(): HTMLElement {
    return this.getMap().getContainer();
  }
  getMapCanvasContainer(): HTMLElement {
    return this.getMap().getContainer()?.getElementsByTagName("canvas")[0];
  }
  getMapStyleConfig(): MapStyleConfig {
    // return this.getMap()
    throw new Error("Method not implemented.");
  }

  // control with raw map
  setRotation(rotation: number): void {
    throw new Error("Method not implemented.");
  }
  zoomIn(): void {
    this.getMap().zoomIn();
  }
  zoomOut(option?: any, eventData?: any): void {
    this.getMap().zoomOut();
  }
  panTo(p: Point): void {
    this.getMap().panTo(new BMapGL.Point(p[0], p[1]));
  }
  panBy(x: number, y: number): void {
    this.getMap().panBy(x, y);
  }
  fitBounds(bound: Bounds, fitBoundsOptions?: unknown): void {
    throw new Error("Method not implemented.");
  }
  setZoomAndCenter(zoom: number, [lng, lat]: Point): void {
    this.getMap().centerAndZoom(new BMapGL.Point(lng, lat), zoom);
  }
  setCenter([lng, lat]: [number, number], option?: ICameraOptions): void {
    this.getMap().setCenter(new BMapGL.Point(lng, lat));
  }
  setPitch(pitch: number): any {
    this.getMap().setTilt(pitch);
  }
  setZoom(zoom: number): any {
    this.getMap().setZoom(zoom);
  }
  setMapStatus(option: Partial<IStatusOptions>): void {
    throw new Error("Method not implemented.");
  }

  // coordinates methods
  meterToCoord(center: [number, number], outer: [number, number]) {
    const metreDistance = this.getMap().getDistance(
      new BMapGL.Point(...center),
      new BMapGL.Point(...outer)
    );

    const [x1, y1] = this.lngLatToCoord(center);
    const [x2, y2] = this.lngLatToCoord(outer);
    const coordDistance = Math.sqrt(
      Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)
    );

    return coordDistance / metreDistance;
  }
  pixelToLngLat([x, y]: Point): ILngLat {
    const lngLat = this.getMap().pixelToPoint(new BMapGL.Pixel(x, y));
    return { lng: lngLat.lng, lat: lngLat.lat };
  }
  lngLatToPixel([lng, lat]: Point): IPoint {
    const pixel = this.getMap().pointToPixel(new BMapGL.Point(lng, lat));
    return {
      x: pixel.x,
      y: pixel.y
    };
  }
  containerToLngLat([x, y]: [number, number]): ILngLat {
    const point = this.getMap().overlayPixelToPoint(new BMapGL.Pixel(x, y));
    return {
      lng: point.lng,
      lat: point.lat
    };
  }
  lngLatToContainer([lng, lat]: [number, number]): IPoint {
    const overlayPixel = this.getMap().pointToOverlayPixel(
      new BMapGL.Point(lng, lat)
    );
    return {
      x: overlayPixel.x,
      y: overlayPixel.y
    };
  }
  lngLatToCoord?([lng, lat]: [number, number]): [number, number] {
    const { x, y } = this.getMap().pointToPixel(new BMapGL.Point(lng, lat));
    return [x, -y];
  }
  lngLatToCoords?(list: number[][] | number[][][]): any {
    return list.map((item) =>
      Array.isArray(item[0])
        ? this.lngLatToCoords(item as [number, number][])
        : this.lngLatToCoord(item as [number, number])
    );
  }
  lngLatToMercator([lng, lat]: [number, number], altitude: number): IMercator {
    const [McLng, McLat] = (this.getMap() as any).lnglatToMercator(lng, lat);
    return {
      x: McLat,
      y: McLng,
      z: altitude
    };
  }
  getModelMatrix(
    lnglat: [number, number],
    altitude: number,
    rotate: [number, number, number],
    scale: [number, number, number] = [1, 1, 1]
  ): number[] {
    const flat = this.viewport.projectFlat(lnglat);
    // @ts-ignore
    const modelMatrix = mat4.create();

    mat4.translate(
      modelMatrix,
      modelMatrix,
      vec3.fromValues(flat[0], flat[1], altitude)
    );
    mat4.scale(
      modelMatrix,
      modelMatrix,
      vec3.fromValues(scale[0], scale[1], scale[2])
    );

    mat4.rotateX(modelMatrix, modelMatrix, rotate[0]);
    mat4.rotateY(modelMatrix, modelMatrix, rotate[1]);
    mat4.rotateZ(modelMatrix, modelMatrix, rotate[2]);

    return (modelMatrix as unknown) as number[];
  }
  getCustomCoordCenter?(): [number, number] {
    throw new Error("Method not implemented.");
  }
  exportMap(type: "jpg" | "png"): string {
    throw new Error("Method not implemented.");
  }

  // 地球模式下的地图方法/属性
  rotateY?(option: { force?: boolean; reg?: number }): void {
    throw new Error("Method not implemented.");
  }
}
