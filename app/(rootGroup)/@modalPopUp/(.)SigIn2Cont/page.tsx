import ModalWrapper from '@/app/(rootGroup)/@modalPopUp/(.)SigIn2Cont/ModalWrapper'
import { Suspense } from 'react';

export default function Page() {

  console.log("Rendering app/@signin2cont Page************+++++++++++++Page++++++++++++++********");

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ModalWrapper />
    </Suspense>
  );
}
