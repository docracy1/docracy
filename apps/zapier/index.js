const authentication = require("./authentication");
const templateListTrigger = require("./triggers/templateList");
const documentCreatedTrigger = require("./triggers/documentCreated");
const signerSignedTrigger = require("./triggers/signerSigned");
const documentCompletedTrigger = require("./triggers/documentCompleted");
const sendDocumentFromTemplateCreate = require("./creates/sendDocumentFromTemplate");

// Custom auth (see authentication.js) doesn't inject the key into requests on its own — every
// outgoing call needs this added by hand, once, here.
const includeApiKey = (request, z, bundle) => {
  if (bundle.authData && bundle.authData.apiKey) {
    request.headers = Object.assign({}, request.headers, { Authorization: `Bearer ${bundle.authData.apiKey}` });
  }
  return request;
};

module.exports = {
  version: require("./package.json").version,
  platformVersion: require("zapier-platform-core").version,

  authentication,

  beforeRequest: [includeApiKey],

  triggers: {
    [templateListTrigger.key]: templateListTrigger,
    [documentCreatedTrigger.key]: documentCreatedTrigger,
    [signerSignedTrigger.key]: signerSignedTrigger,
    [documentCompletedTrigger.key]: documentCompletedTrigger,
  },

  creates: {
    [sendDocumentFromTemplateCreate.key]: sendDocumentFromTemplateCreate,
  },

  resources: {},
  searches: {},
};
