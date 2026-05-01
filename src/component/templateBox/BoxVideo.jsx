import VideoToFramesPlayer from '../VideoToFramesPlayer';

const Index = ({VideoPortrait,VideoLandscape}) => {
  const configBox = {
    portrait: {
      width: 102,
      height: 102,
      anchor: 'middle',
      x: 50,
      y: 50,
    },
    landscape: {
      width: 102,
      height: 102,
      anchor: 'middle',
      x: 50,
      y: 50,
    },

         portraitSrc:VideoPortrait,
         landscapeSrc:VideoLandscape
  };

  return (
    <>
       <VideoToFramesPlayer
         {...configBox}
       />
    </>
  );
};

export default Index;
