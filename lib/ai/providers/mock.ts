import { BaseAIProvider } from './base';
import { GenerateTemplateRequest, GenerateTemplateResponse } from '../types';

export class MockProvider extends BaseAIProvider {
  async generateTemplate(request: GenerateTemplateRequest): Promise<GenerateTemplateResponse> {
    const prompt = request.prompt.toLowerCase();
    const existingJson = request.existingJson;

    // If updating existing template
    if (existingJson && existingJson.children) {
      const baseChildren = [...existingJson.children];
      
      if (prompt.includes('add') || prompt.includes('include')) {
        if (prompt.includes('confidential')) {
          baseChildren.push({
            type: 'text',
            content: 'CONFIDENTIALITY: This document contains confidential information and must not be shared with third parties.'
          });
        } else if (prompt.includes('signature')) {
          baseChildren.push(
            { type: 'text', content: 'Signature: _____________________' },
            { type: 'text', content: 'Date: ${SIGNATURE_DATE}' }
          );
        } else {
          baseChildren.push({
            type: 'text',
            content: 'Additional content based on your request'
          });
        }
      }
      
      return this.validateResponse({
        type: 'document',
        children: baseChildren
      });
    }

    // Generate new templates based on keywords
    let template;
    
    if (prompt.includes('employment') || prompt.includes('contract')) {
      template = {
        type: 'document',
        children: [
          { type: 'text', content: 'EMPLOYMENT CONTRACT' },
          { type: 'text', content: 'This Employment Agreement is entered into as of ${START_DATE}' },
          { type: 'text', content: 'Between: ${COMPANY_NAME} ("Employer")' },
          { type: 'text', content: 'And: ${EMPLOYEE_NAME} ("Employee")' },
          { type: 'text', content: 'Position: ${POSITION}' },
          { type: 'text', content: 'Start Date: ${START_DATE}' },
          { type: 'text', content: 'Salary: ${SALARY} per annum' },
          { type: 'text', content: 'Working Hours: ${WORKING_HOURS}' },
          { type: 'text', content: 'Benefits: ${BENEFITS}' }
        ]
      };
    } else if (prompt.includes('invoice')) {
      template = {
        type: 'document',
        children: [
          { type: 'text', content: 'INVOICE #${INVOICE_NUMBER}' },
          { type: 'text', content: 'Date: ${INVOICE_DATE}' },
          { type: 'text', content: 'From: ${VENDOR_NAME}' },
          { type: 'text', content: 'To: ${CLIENT_NAME}' },
          { type: 'text', content: 'Description: ${SERVICE_DESCRIPTION}' },
          { type: 'text', content: 'Amount: ${AMOUNT}' },
          { type: 'text', content: 'Due Date: ${DUE_DATE}' },
          { type: 'text', content: 'Payment Terms: ${PAYMENT_TERMS}' }
        ]
      };
    } else if (prompt.includes('letter')) {
      template = {
        type: 'document',
        children: [
          { type: 'text', content: '${SENDER_NAME}' },
          { type: 'text', content: '${SENDER_ADDRESS}' },
          { type: 'text', content: '${DATE}' },
          { type: 'text', content: 'Dear ${RECIPIENT_NAME},' },
          { type: 'text', content: '${LETTER_BODY}' },
          { type: 'text', content: 'Sincerely,' },
          { type: 'text', content: '${SENDER_NAME}' }
        ]
      };
    } else {
      // Default template
      template = {
        type: 'document',
        children: [
          { type: 'text', content: 'Document Title: ${TITLE}' },
          { type: 'text', content: 'Date: ${DATE}' },
          { type: 'text', content: 'Content: ${CONTENT}' }
        ]
      };
    }

    return this.validateResponse(template);
  }
}