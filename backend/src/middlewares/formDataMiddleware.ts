const formData = require('express-form-data');
const os = require('os');

const options = {
  uploadDir: os.tmpdir(),
  autoClean: true,
};

export const formDataMiddleware = [
  formData.parse(options),
  formData.format(),
  formData.union(),
];
