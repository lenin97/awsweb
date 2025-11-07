import { defineStorage, defineFunction } from '@aws-amplify/backend';
//import {saveTailoredCV} from "../data/resource"
import {saveTailoredCV } from "../tasksResolvers/resource"//mdx2htmlEventHandler
import {mdx2htmlEventHandler,seoEventHandler,tailorCVEvent,modelParamEventHandler } from "../ampfuncs/resource"

export const firstBucket  = defineStorage({
  name: 'mainBucket',
  isDefault: true,
  triggers: {/*
    onUpload: defineFunction({
      entry: './on-upload-handler.ts'
    }),*/
    /*
    onDelete: defineFunction({
      entry: './on-delete-handler.ts'
    })*/
  },
  /*
  access: (allow) => ({
    //'*': allow.admins().to(['read', 'write']),
    'uploads/*': [allow.authenticated.to(['read', 'write'])],
  }),*/
  access: (allow) => ({//logs/
    'tools/tailorcv/*': [
      //allow.entity('identity').to(['read', 'write', 'delete']),
      allow.guest.to(['read', 'write']),
      //allow.authenticated.to(['read']),
      allow.resource(saveTailoredCV).to(['write']),//tailorCVEvent
      allow.resource(tailorCVEvent).to(['read'])
    ],
    'mediaApp/public/*': [
      allow.guest.to(['read']),
      //allow.authenticated.to(['read']),
      allow.resource(mdx2htmlEventHandler).to(['read', 'write', 'delete']),
      allow.resource(seoEventHandler).to(['read', 'write', 'delete']),
      allow.resource(modelParamEventHandler).to(['read', 'write', 'delete'])
    ]
    /*    
    'tools/tailorcv/{entity_id}/logs/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      //allow.guest.to(['read']),
      allow.authenticated.to(['delete'])
    ]*/
  })
});