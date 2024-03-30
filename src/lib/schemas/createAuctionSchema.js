const schema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 3 }
  },
  required: ['title']
};

export default schema;