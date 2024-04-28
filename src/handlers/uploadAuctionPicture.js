import { getAuctionById } from "./getAuction";
import { uploadPictureToS3 } from "../lib/uploadPictureToS3";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import createError from "http-errors";

export async function uploadAuctionPicture(event) {
  const { id } = event.pathParameters;

  const auction = await getAuctionById(id);
  const base64 = event.body;

  const format = base64.substring(base64.indexOf('data:')+5, base64.indexOf(';base64'));
  const base64String = base64.replace(/^data:image\/\w+;base64,/, "").trim()

  const buffer = Buffer.from(base64String,'base64');

  try {
    const uploadToS3Result = await uploadPictureToS3(auction.id + '.jpg', buffer, format);
    console.log(uploadToS3Result);
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
  

  return {
    statusCode: 200,
    body: JSON.stringify({})
  }
}

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHandler())