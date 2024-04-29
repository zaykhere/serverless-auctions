import AWS from "aws-sdk";
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpEventNormalizer from "@middy/http-event-normalizer";
import httpErrorHandler from "@middy/http-error-handler";
import createError from "http-errors";
import { getAuctionById } from "./getAuction";
import schema from "../lib/schemas/placeBidSchema";
import cors from "@middy/http-cors";
const Ajv = require('ajv');
const ajv = new Ajv();

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const validate = ajv.compile(schema);
  const isValid = validate(event.body);
  if (!isValid) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  const {id} = event.pathParameters;
  const {amount} = event.body;
  const {email} = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  if(auction.status !== 'OPEN') {
    throw new createError.Forbidden("You can't bid on a closed auction");
  }

  if(email === auction.seller) {
    throw new createError.Forbidden("You can't bid on your own auction");
  }

  if(email === auction.highestBid.bidder) {
    throw new createError.Forbidden("You are already the highest bidder");
  }

  if(amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}`);
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: {id},
    UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
    ExpressionAttributeValues: {
      ':amount': amount,
      ':bidder': email
    },
    ReturnValues: 'ALL_NEW'
  };

  let updatedAuction;
  
  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = middy(placeBid)
  .use(httpJsonBodyParser())
  .use(httpEventNormalizer())
  .use(httpErrorHandler())
  .use(cors())


