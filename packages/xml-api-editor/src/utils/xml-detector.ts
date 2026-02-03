// @ts-ignore
import { XMLAPI } from '@miy2/xml-api';
// @ts-ignore
import { ModelElement } from '@miy2/xml-api/model/xml-api-model';

export enum DocumentType {
  XHTML = 'XHTML',
  MEI = 'MEI', // Music Encoding Initiative
  UNKNOWN = 'UNKNOWN'
}

export interface DocumentInfo {
  type: DocumentType;
  rootTag: string;
  namespace?: string;
}

/**
 * Detects the document type based on the root element and namespace.
 * @param api The XMLAPI instance.
 */
export function detectDocumentType(api: XMLAPI): DocumentInfo {
  const model = api.model;
  if (!model || !(model instanceof ModelElement)) {
    return { type: DocumentType.UNKNOWN, rootTag: '' };
  }

  const rootTag = model.tagName;
  let namespace = model.attributes.get('xmlns');
  
  // Basic detection logic
  if (rootTag === 'html') {
    if (namespace === 'http://www.w3.org/1999/xhtml' || !namespace) {
      return { type: DocumentType.XHTML, rootTag, namespace };
    }
  }

  if (rootTag === 'mei' || rootTag === 'mei:mei') {
    if (namespace && namespace.includes('music-encoding.org')) {
      return { type: DocumentType.MEI, rootTag, namespace };
    }
    // Assume MEI if tag is mei
    return { type: DocumentType.MEI, rootTag, namespace };
  }

  return { type: DocumentType.UNKNOWN, rootTag, namespace };
}
