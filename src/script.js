document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('meta[name="page"]').content;

    if (page === "urlInput") {
        const submitButton = document.getElementById('submitButton');
        const urlInput = document.getElementById('urlInput');

        if (submitButton && urlInput) {
            submitButton.addEventListener('click', () => {
                const url = urlInput.value;

                if (url) {
                    console.log("URL Submitted:", url);


                    if (url.endsWith('.m3u8')) {
                        console.log("HLS Stream URL Detected:", url);
                    }

                    window.electron.sendStreamUrl(url);
                    window.close();
                } else {
                    alert("Please enter a valid URL.");
                }
            });
        }
    } else if (page === "mediaPlayer") {
        const videoPlayer = document.getElementById('videoPlayer');

        if (videoPlayer) {

            window.electron.onFileSelected((filePath) => {
                console.log("File Selected:", filePath);
                videoPlayer.src = `file://${filePath}`;
                videoPlayer.play();
            });

            window.electron.onSubtitleSelected((vttContent) => {
                console.log('Subtitle Loaded:', vttContent);

                const track = document.createElement('track');
                track.kind = 'subtitles';
                track.label = 'Custom Subtitles';
                track.default = true;
                track.src = 'data:text/vtt;charset=utf-8,' + encodeURIComponent(vttContent);
                videoPlayer.appendChild(track);

                videoPlayer.textTracks[0].mode = 'showing';
            });

            window.electron.onSubtitleError((message) => {
                alert(message);
            });



            window.electron.onPlayStream((url) => {
                console.log("Stream URL:", url);


                if (Hls.isSupported() && url.endsWith('.m3u8')) {
                    const hls = new Hls({
                        liveSyncDurationCount: 3,
                        liveMaxLatencyDurationCount: 5,
                    });
                    hls.loadSource(url);
                    hls.attachMedia(videoPlayer);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        console.log("HLS stream loaded successfully.");
                        videoPlayer.play();
                    });


                } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {

                    videoPlayer.src = url;
                    videoPlayer.play();
                } else {

                    videoPlayer.src = url;
                    videoPlayer.play();
                }
            });
        }


    }
});




/*document.addEventListener('DOMContentLoaded', () => {
  const page = document.querySelector('meta[name="page"]').content;

  if (page === "urlInput") {
      const submitButton = document.getElementById('submitButton');
      const urlInput = document.getElementById('urlInput');

      if (submitButton && urlInput) {
          submitButton.addEventListener('click', () => {
              const url = urlInput.value;
              console.log("URL Submitted:", url);
              window.electron.sendStreamUrl(url);
              window.close();
          });
      }
  } else if (page === "mediaPlayer") {
      const videoPlayer = document.getElementById('videoPlayer');
      if (videoPlayer) {
          window.electron.onFileSelected((filePath) => {
              console.log("File Selected:", filePath);
              videoPlayer.src = `file://${filePath}`;
              videoPlayer.play();
          });

          window.electron.onPlayStream((url) => {
              console.log("Stream URL:", url);
              videoPlayer.src = url;
              videoPlayer.play();
          });
      }
  }
});;*/


