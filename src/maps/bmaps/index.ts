import { BaseMapWrapper } from "@antv/l7";
import BMapService from "./BMapService";

export default class BMapWrapper extends BaseMapWrapper<BMapGL.Map> {
  protected getServiceConstructor() {
    return BMapService;
  }
}
