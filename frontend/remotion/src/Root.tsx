import { Composition } from "remotion";
import { DeepRockDemo } from "./Video";

export const RemotionRoot = () => {
  return (
    <Composition
      id="DeepRockDemo"
      component={DeepRockDemo}
      durationInFrames={4500}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
