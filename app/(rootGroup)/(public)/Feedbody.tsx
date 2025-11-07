// app/posts/[slug]/page.tsx
import React from 'react';
//import { cookies } from 'next/headers';
import ShowFeedUI  from './ShowFeedUI';
import ProcessFeedHidden  from './ProcessFeedHidden';
//import {TriggerUpdateFeed} from "./TriggerUpdateFeed"

//export const dynamic = 'force-dynamic';

export default async function Feedbody() {

  return (
    <>
    {false && <ProcessFeedHidden />}
    <ShowFeedUI/>     
    </>
  );
}