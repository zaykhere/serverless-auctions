const Ajv = require('ajv');

// Define your query parameter schema
const schema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['OPEN', 'CLOSED'], default: 'OPEN' }
  }
};

export default schema;