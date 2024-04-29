import AWS from "aws-sdk";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpEventNormalizer from "@middy/http-event-normalizer";
import httpErrorHandler from "@middy/http-error-handler";
import createError from "http-errors";
import schema from "../lib/schemas/getAuctionsSchema";
const Ajv = require('ajv');
const ajv = new Ajv();


const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
  const queryParams = event.queryStringParameters || {};

  const validate = ajv.compile(schema);

    // Validate the query parameters against the schema
    const isValid = validate(queryParams);
    if (!isValid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid query parameters' })
      };
    };


  let auctions;

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndDate',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeValues: {
      ':status': queryParams.status
    },
    ExpressionAttributeNames: {
      '#status': 'status'
    }
  };
  
  try {
    const result = await dynamodb.query(params).promise();

    auctions = result.Items;

  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

export const handler = middy(getAuctions)
  .use(httpEventNormalizer())
  .use(httpErrorHandler())
  .use(cors())


