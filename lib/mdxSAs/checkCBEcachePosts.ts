import {validateCBE} from "@/lib/mdxSAs/validateCBE"
import {cachePosts} from "@/lib/mdxSAs/cachePosts"//dynamoDBClient
import {dynamoDBClient} from "@/lib/mdxSAs/dynamoDBClient"
//import type { MDXRemoteSerializeResult } from 'next-mdx-remote';



export async function checkCBEcachePosts() {
  // Await the async cache loader
  const ddb = await dynamoDBClient()

  const {messagemdx,slugs} = await validateCBE(ddb)

  console.log("validateCBE ret ::", { messagemdx, slugs });

  if(messagemdx==="cmidfe"){
      await cachePosts(ddb,slugs)
  }else{
    console.log("Nothing to cache by now")
  }

  //return null
}