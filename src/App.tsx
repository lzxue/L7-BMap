import "./styles.css";
import BMapService from "./maps/bmaps";
import { LineLayer, Scene, Scale, Zoom } from "@antv/l7";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    const zoomControl = new Zoom({ position: "topright" });
    const scaleControl = new Scale({ position: "bottomright" });
    const scene = new Scene({
      id: "map",
      map: new BMapService({ mapInstance: new BMapGL.Map("map") })
    });
    scene.addControl(zoomControl);
    scene.addControl(scaleControl);
    scene.on("loaded", () => {
      const layer = new LineLayer()
        .source([{ lng: 120, lat: 30, lng1: 121.472644, lat1: 31.231706 }], {
          parser: {
            type: "json",
            x: "lng",
            y: "lat",
            x1: "lng1",
            y1: "lat1"
          }
        })
        .shape("line")
        .size(10)
        .color("red");

      scene.addLayer(layer);
    });
  }, []);
  return (
    <div className="App">
      <div id="map" style={{ height: "100vh" }} />
    </div>
  );
}
