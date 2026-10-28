import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// WebGL (Three.js) needs a GPU-capable renderer in headless Chrome.
Config.setChromiumOpenGlRenderer("angle");
Config.setCodec("h264");
