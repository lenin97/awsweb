// amplify/custom-resources/ddb/documents-table.ts
/**
 * Function name describes the action
✔ createDocumentsTable()

CDK ID describes the resource
✔ "DocumentsTable"

tableName is the AWS name
✔ "Documents"
*/
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType
} from "aws-cdk-lib/aws-dynamodb";
import { Stack } from "aws-cdk-lib";

export function createPDFsTable(stack: Stack) {
  const table = new Table(stack, "DynamoPDFsTable", {
    tableName: "tcv-ddb-pdfs",
    billingMode: BillingMode.PAY_PER_REQUEST,

    partitionKey: {
      name: "doc_id",
      type: AttributeType.STRING,
    },

    sortKey: {
      name: "sk",
      type: AttributeType.STRING,
    },

    timeToLiveAttribute: "expires_at",

    stream: StreamViewType.NEW_AND_OLD_IMAGES,
  });

  return table;
}
