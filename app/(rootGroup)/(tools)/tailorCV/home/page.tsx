//import UploadFormDyn from '@/app/(rootGroup)/(tools)/tailorCV/home/UploadFormDyn';//StructuredDataTool
//import StructuredDataTool from '@/app/(rootGroup)/(tools)/tailorCV/@content/home/head';
import { getAuthServerCmpns } from '@/lib/serverAuth4Cmpns';
import InputFormDyn  from './InputFormDyn';
import ScriptTailorCV from './ScriptTailorCV'

//import { getCurrentUser } from 'aws-amplify/auth';

////////////////---------------------------------------------------------------server cmp inside app
export const dynamic = 'force-dynamic'

export default async function UploadFormPage() {
  
  //const showAdvanced = true; // this could be dynamic server-side
  //call a server component which return the fields prop
  console.log("🔥 UPDATED UploadFormPage IS BEING USED***************tailorCV/content/home")
  const client = await getAuthServerCmpns();
  //await getCurrentUser();
  const { data: fields = [] } = await client.models.InputForm00.list({authMode: 'apiKey'});
 // const { data: fields = [] } = await getInternalInputForms();
 console.log("📦 Retrieved fields:", JSON.stringify(fields, null, 2));

 
  return (
    <>
    <ScriptTailorCV/>
    <InputFormDyn fields={fields}/>
    </>
  )
} 