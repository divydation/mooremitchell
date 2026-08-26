// This worker exists purely to move LZString compression off the main
// thread, since compressing the (potentially large) save JSON string is what
// was causing the visible lag spike every autosave.
//
// IMPORTANT: replace the URL below with whatever path/CDN you already use to
// load lz-string in your main HTML, so both copies stay the same version.
// e.g. if your HTML has:
//   <script src="https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js"></script>
// use that exact same URL here.
importScripts("https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js");

self.onmessage = function (e) {
    const jsonString = e.data;
    try {
        const compressed = LZString.compressToUTF16(jsonString);
        self.postMessage({ success: true, data: compressed });
    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
};
