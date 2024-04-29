import {v4 as uuid} from "uuid";
import AWS from "aws-sdk";
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpEventNormalizer from "@middy/http-event-normalizer";
import httpErrorHandler from "@middy/http-error-handler";
import createError from "http-errors";
import cors from "@middy/http-cors";
import schema from "../lib/schemas/createAuctionSchema";
const Ajv = require('ajv');
const ajv = new Ajv();

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
  const validate = ajv.compile(schema);
  const isValid = validate(event.body);
  if (!isValid) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  const {title} = event.body;
  const {email} = event.requestContext.authorizer;

  console.log(email);
  console.log(event.requestContext);

  const now = new Date();
  const endDate = new Date();

  endDate.setHours(now.getHours() + 1);

  const auction = {
    id: uuid(),
    title,
    status: 'OPEN',
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0
    },
    seller: email
  };

  try {
    await dynamodb.put({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Item: auction
    }).promise()
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }
  

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
}

export const handler = middy(createAuction)
  .use(httpJsonBodyParser())
  .use(httpEventNormalizer())
  .use(httpErrorHandler())
  .use(cors())


