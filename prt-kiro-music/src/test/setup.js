import '@testing-library/jest-dom';

// Define MediaError constants missing from jsdom
if (typeof MediaError === 'undefined') {
  global.MediaError = {
    MEDIA_ERR_ABORTED: 1,
    MEDIA_ERR_NETWORK: 2,
    MEDIA_ERR_DECODE: 3,
    MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
  };
}
